
-- 1) Table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

-- 2) Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

-- 3) RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own api keys"
  ON public.api_keys FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- 4) updated_at trigger
CREATE TRIGGER trg_api_keys_updated
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Verify function (called from server route with service role)
CREATE OR REPLACE FUNCTION public.verify_api_key(_key text)
RETURNS TABLE(user_id uuid, key_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash TEXT;
  v_user UUID;
  v_id UUID;
BEGIN
  IF _key IS NULL OR length(_key) < 20 THEN
    RETURN;
  END IF;
  v_hash := encode(extensions.digest(_key, 'sha256'), 'hex');

  SELECT k.user_id, k.id INTO v_user, v_id
  FROM public.api_keys k
  WHERE k.key_hash = v_hash
    AND k.revoked_at IS NULL
    AND (k.expires_at IS NULL OR k.expires_at > now())
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.api_keys SET last_used_at = now() WHERE id = v_id;
  RETURN QUERY SELECT v_user, v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_api_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_api_key(text) TO service_role;

-- 6) Helper to get all roles for a user (used in API authorization)
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated, service_role;

-- ensure pgcrypto for digest
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
