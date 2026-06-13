
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated, service_role;

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  f text;
  trigger_fns text[] := ARRAY[
    'log_space_event','log_visitor_event','log_expense_event',
    'log_vendor_payment_event','dispatch_telegram_notification',
    'stamp_wo_transitions','stamp_expense_approval','stamp_visitor_checkout',
    'set_vendor_payment_number','set_expense_number','set_visitor_number',
    'guard_wo_reopen'
  ];
  rpc_fns text[] := ARRAY[
    'generate_due_pm_work_orders','recompute_wo_overdue',
    'get_user_roles','get_my_permissions','has_permission',
    'create_telegram_link_code'
  ];
BEGIN
  FOREACH f IN ARRAY trigger_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I FROM PUBLIC, anon, authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY rpc_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO authenticated', f);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Authenticated can read avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');
