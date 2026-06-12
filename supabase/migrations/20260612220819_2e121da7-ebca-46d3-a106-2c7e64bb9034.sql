
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1) Subscribers
CREATE TABLE IF NOT EXISTS public.telegram_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL UNIQUE,
  tg_username TEXT,
  tg_first_name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours BOOLEAN NOT NULL DEFAULT false,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_subscribers TO authenticated;
GRANT ALL ON public.telegram_subscribers TO service_role;
ALTER TABLE public.telegram_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own subscription"
  ON public.telegram_subscribers FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER trg_telegram_subscribers_updated
  BEFORE UPDATE ON public.telegram_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Link codes
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_link_codes TO authenticated;
GRANT ALL ON public.telegram_link_codes TO service_role;
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own link codes"
  ON public.telegram_link_codes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) RPC: generate link code
CREATE OR REPLACE FUNCTION public.create_telegram_link_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  INSERT INTO public.telegram_link_codes(code, user_id) VALUES (v_code, auth.uid());
  RETURN v_code;
END $$;

GRANT EXECUTE ON FUNCTION public.create_telegram_link_code() TO authenticated;

-- 4) Notify webhook: trigger on notifications insert -> call our edge endpoint
CREATE OR REPLACE FUNCTION public.dispatch_telegram_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://project--81d54015-7ffe-4d01-a715-bc0ff4065839-dev.lovable.app/api/public/telegram/notify',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_ttPNB5c5coXfw0PrTqs--A_h3N68-Dn"}'::jsonb,
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notifications_telegram ON public.notifications;
CREATE TRIGGER trg_notifications_telegram
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_telegram_notification();

-- 5) Cron: daily report at 20:00 Riyadh (17:00 UTC) for super_admin
SELECT cron.unschedule('telegram-daily-report') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='telegram-daily-report');

SELECT cron.schedule(
  'telegram-daily-report',
  '0 17 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--81d54015-7ffe-4d01-a715-bc0ff4065839-dev.lovable.app/api/public/telegram/daily-report',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_ttPNB5c5coXfw0PrTqs--A_h3N68-Dn"}'::jsonb,
    body := '{}'::jsonb
  );
  $cron$
);

-- 6) Cron: daily notification generator at 7am Riyadh (4 UTC)
SELECT cron.unschedule('daily-notifications') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='daily-notifications');
SELECT cron.schedule('daily-notifications','0 4 * * *', $cron$ SELECT public.generate_daily_notifications(); $cron$);
