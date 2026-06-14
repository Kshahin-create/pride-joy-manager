
-- 1) Trigger function: default property_id from user's default when null
CREATE OR REPLACE FUNCTION public.set_default_property_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.property_id IS NULL THEN
    NEW.property_id := public.get_user_default_property(auth.uid());
    IF NEW.property_id IS NULL THEN
      SELECT id INTO NEW.property_id FROM public.properties WHERE code = 'DEFAULT' LIMIT 1;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- 2) Apply default trigger + property scope policy on each table
DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY[
    'offices','contracts','assets','maintenance_requests','invoices','tickets',
    'expenses','cleaning_contracts','payments','visitors','security_incidents',
    'patrols','inspections','pm_plans','cameras','ac_units','parking_spots',
    'electricity_meters','network_points','spaces','companies','documents',
    'vendor_payments','building_log','cleaning_plans','vendor_contracts',
    'inspection_templates','patrol_checkpoints','guards'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    -- default trigger
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_default_property_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_set_default_property_%I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_default_property_id()', t, t);

    -- property scope policy (additive — works with existing role policies via AND not OR; PostgreSQL combines policies with OR for permissive — so we use RESTRICTIVE)
    EXECUTE format('DROP POLICY IF EXISTS "property_scope_restrict" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "property_scope_restrict" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (property_id IS NULL OR public.user_has_property(auth.uid(), property_id)) WITH CHECK (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))',
      t
    );
  END LOOP;
END $$;
