
CREATE OR REPLACE FUNCTION public.restrict_notification_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_read boolean;
  v_read_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;

  -- Preserve everything except the read-status fields.
  v_is_read := NEW.is_read;
  v_read_at := NEW.read_at;
  NEW := OLD;
  NEW.is_read := v_is_read;
  NEW.read_at := v_read_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_notification_updates ON public.notifications;
CREATE TRIGGER trg_restrict_notification_updates
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.restrict_notification_updates();
