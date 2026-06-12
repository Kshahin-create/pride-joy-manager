
-- Building identity (singleton)
CREATE TABLE public.building_identity (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  building_name TEXT NOT NULL DEFAULT 'برج Pride & Joy',
  legal_name TEXT,
  owner_name TEXT,
  cr_number TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'المملكة العربية السعودية',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  total_floors INT,
  total_offices INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.building_identity TO authenticated;
GRANT ALL ON public.building_identity TO service_role;

ALTER TABLE public.building_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read building identity"
  ON public.building_identity FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin and owner can update building identity"
  ON public.building_identity FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "Super admin can insert building identity"
  ON public.building_identity FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner'));

CREATE TRIGGER trg_building_identity_updated_at
  BEFORE UPDATE ON public.building_identity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed singleton
INSERT INTO public.building_identity (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- Daily report aggregation function
CREATE OR REPLACE FUNCTION public.get_daily_report(_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    'patrols',  (SELECT COUNT(*) FROM public.patrols WHERE patrol_date = _date),
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
END $$;
