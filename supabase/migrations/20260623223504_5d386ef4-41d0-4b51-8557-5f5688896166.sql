CREATE OR REPLACE FUNCTION public.get_daily_report(_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v JSONB;
BEGIN
  SELECT jsonb_build_object(
    'date', _date,
    'visitors_in',  (SELECT COUNT(*) FROM public.visitors WHERE check_in_at::date = _date),
    'visitors_out', (SELECT COUNT(*) FROM public.visitors WHERE check_out_at::date = _date),
    'visitors_still_inside', (SELECT COUNT(*) FROM public.visitors WHERE status='داخل'),
    'wo_new',   (SELECT COUNT(*) FROM public.maintenance_requests WHERE created_at::date = _date),
    'wo_closed',(SELECT COUNT(*) FROM public.maintenance_requests WHERE closed_at::date = _date),
    'wo_overdue_open', (SELECT COUNT(*) FROM public.maintenance_requests WHERE status<>'مغلق' AND is_overdue=true),
    'tickets_new',   (SELECT COUNT(*) FROM public.tickets WHERE created_at::date = _date),
    'tickets_closed',(SELECT COUNT(*) FROM public.tickets WHERE closed_at::date = _date),
    'incidents_new', (SELECT COUNT(*) FROM public.security_incidents WHERE created_at::date = _date),
    'patrols',  (SELECT COUNT(*) FROM public.patrols WHERE start_time::date = _date),
    'payments_received', (SELECT COALESCE(SUM(amount_paid),0) FROM public.payments WHERE payment_date = _date),
    'expenses_new',      (SELECT COALESCE(SUM(amount),0) FROM public.expenses WHERE created_at::date = _date),
    'expenses_paid',     (SELECT COALESCE(SUM(amount),0) FROM public.expenses WHERE paid_at::date = _date),
    'events', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'event_type', event_type, 'module', module,
        'description', description, 'created_at', created_at, 'location', location
      ) ORDER BY created_at DESC), '[]'::jsonb)
      FROM public.building_log WHERE created_at::date = _date
    )
  ) INTO v;
  RETURN v;
END $function$;