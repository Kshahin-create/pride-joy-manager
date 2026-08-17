-- Unified permission-driven RLS across all operational tables
CREATE OR REPLACE FUNCTION public.can(_uid uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(_uid,'super_admin') OR public.has_permission(_uid, _key) $$;

CREATE OR REPLACE FUNCTION public._module_for_table(_t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$
  SELECT CASE _t
    WHEN 'assets' THEN 'assets' WHEN 'asset_types' THEN 'assets' WHEN 'asset_attachments' THEN 'assets'
    WHEN 'building_log' THEN 'building_log'
    WHEN 'cameras' THEN 'cameras' WHEN 'camera_maintenance_logs' THEN 'cameras'
    WHEN 'cleaning_plans' THEN 'cleaning' WHEN 'cleaning_logs' THEN 'cleaning'
    WHEN 'cleaning_contracts' THEN 'cleaning' WHEN 'cleaning_contract_attachments' THEN 'cleaning'
    WHEN 'ac_contracts' THEN 'service_contracts' WHEN 'ac_contract_attachments' THEN 'service_contracts'
    WHEN 'ac_maintenance_logs' THEN 'service_contracts'
    WHEN 'elevator_contracts' THEN 'service_contracts' WHEN 'elevator_contract_attachments' THEN 'service_contracts'
    WHEN 'fire_contracts' THEN 'service_contracts' WHEN 'fire_contract_attachments' THEN 'service_contracts'
    WHEN 'supply_contracts' THEN 'service_contracts' WHEN 'supply_contract_attachments' THEN 'service_contracts'
    WHEN 'vendor_contracts' THEN 'service_contracts'
    WHEN 'companies' THEN 'tenants' WHEN 'company_attachments' THEN 'tenants'
    WHEN 'contact_persons' THEN 'tenants' WHEN 'client_interactions' THEN 'tenants' WHEN 'client_unit_views' THEN 'tenants'
    WHEN 'contracts' THEN 'contracts' WHEN 'contract_attachments' THEN 'contracts'
    WHEN 'contract_delegates' THEN 'contracts' WHEN 'contract_deposit_deductions' THEN 'contracts'
    WHEN 'contract_offices' THEN 'contracts' WHEN 'contract_parking_spots' THEN 'contracts'
    WHEN 'contract_payment_schedule' THEN 'contracts'
    WHEN 'documents' THEN 'documents'
    WHEN 'electricity_meters' THEN 'electricity' WHEN 'electricity_readings' THEN 'electricity'
    WHEN 'employees' THEN 'employees' WHEN 'employee_assignments' THEN 'employees'
    WHEN 'employee_departments' THEN 'employees' WHEN 'employee_employers' THEN 'employees'
    WHEN 'expenses' THEN 'expenses' WHEN 'expense_attachments' THEN 'expenses'
    WHEN 'guards' THEN 'guards' WHEN 'guard_attendance' THEN 'guards' WHEN 'guard_evaluations' THEN 'guards'
    WHEN 'guard_leaves' THEN 'guards' WHEN 'guard_penalties_rewards' THEN 'guards' WHEN 'guard_trainings' THEN 'guards'
    WHEN 'inspections' THEN 'inspections' WHEN 'inspection_results' THEN 'inspections' WHEN 'inspection_templates' THEN 'inspections'
    WHEN 'invoices' THEN 'invoices'
    WHEN 'maintenance_requests' THEN 'maintenance' WHEN 'maintenance_request_attachments' THEN 'maintenance'
    WHEN 'network_points' THEN 'network_points' WHEN 'ac_units' THEN 'ac_units'
    WHEN 'offices' THEN 'offices' WHEN 'office_files' THEN 'offices'
    WHEN 'parking_spots' THEN 'parking' WHEN 'parking_violations' THEN 'parking'
    WHEN 'parking_cleaning_logs' THEN 'parking' WHEN 'parking_maintenance_checks' THEN 'parking'
    WHEN 'patrols' THEN 'patrols' WHEN 'patrol_checkpoints' THEN 'patrols'
    WHEN 'payments' THEN 'payments' WHEN 'pm_plans' THEN 'pm_plans'
    WHEN 'security_incidents' THEN 'incidents' WHEN 'spaces' THEN 'spaces' WHEN 'tickets' THEN 'tickets'
    WHEN 'vendors' THEN 'vendors' WHEN 'vendor_evaluations' THEN 'vendors' WHEN 'vendor_payments' THEN 'vendor_payments'
    WHEN 'visitors' THEN 'visitors' WHEN 'building_identity' THEN 'identity'
    ELSE NULL
  END
$$;

DO $do$
DECLARE
  r record; pol record; scope text; has_prop boolean; ins_expr text; sel_expr text; upd_expr text; del_expr text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('assets','assets',false),('asset_types','assets',false),('asset_attachments','assets',true),
      ('building_log','building_log',false),
      ('cameras','cameras',false),('camera_maintenance_logs','cameras',false),
      ('cleaning_plans','cleaning',false),('cleaning_logs','cleaning',false),
      ('cleaning_contracts','cleaning',false),('cleaning_contract_attachments','cleaning',true),
      ('ac_contracts','service_contracts',false),('ac_contract_attachments','service_contracts',true),
      ('ac_maintenance_logs','service_contracts',false),
      ('elevator_contracts','service_contracts',false),('elevator_contract_attachments','service_contracts',true),
      ('fire_contracts','service_contracts',false),('fire_contract_attachments','service_contracts',true),
      ('supply_contracts','service_contracts',false),('supply_contract_attachments','service_contracts',true),
      ('vendor_contracts','service_contracts',false),
      ('companies','tenants',false),('company_attachments','tenants',true),('contact_persons','tenants',false),
      ('client_interactions','tenants',false),('client_unit_views','tenants',false),
      ('contracts','contracts',false),('contract_attachments','contracts',true),('contract_delegates','contracts',false),
      ('contract_deposit_deductions','contracts',false),('contract_offices','contracts',false),
      ('contract_parking_spots','contracts',false),('contract_payment_schedule','contracts',false),
      ('documents','documents',false),
      ('electricity_meters','electricity',false),('electricity_readings','electricity',false),
      ('employees','employees',false),('employee_assignments','employees',false),
      ('employee_departments','employees',false),('employee_employers','employees',false),
      ('expenses','expenses',false),('expense_attachments','expenses',true),
      ('guards','guards',false),('guard_attendance','guards',false),('guard_evaluations','guards',false),
      ('guard_leaves','guards',false),('guard_penalties_rewards','guards',false),('guard_trainings','guards',false),
      ('inspections','inspections',false),('inspection_results','inspections',false),('inspection_templates','inspections',false),
      ('invoices','invoices',false),
      ('maintenance_requests','maintenance',false),('maintenance_request_attachments','maintenance',true),
      ('network_points','network_points',false),('ac_units','ac_units',false),
      ('offices','offices',false),('office_files','offices',true),
      ('parking_spots','parking',false),('parking_violations','parking',false),
      ('parking_cleaning_logs','parking',false),('parking_maintenance_checks','parking',false),
      ('patrols','patrols',false),('patrol_checkpoints','patrols',false),
      ('payments','payments',false),('pm_plans','pm_plans',false),
      ('security_incidents','incidents',false),('spaces','spaces',false),('tickets','tickets',false),
      ('vendors','vendors',false),('vendor_evaluations','vendors',false),('vendor_payments','vendor_payments',false),
      ('visitors','visitors',false)
    ) AS t(tbl, moduleq, is_att)
  LOOP
    SELECT EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = format('public.%I', r.tbl)::regclass AND a.attname='property_id' AND a.attnum>0) INTO has_prop;
    scope := CASE WHEN has_prop THEN ' AND (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))' ELSE '' END;

    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=r.tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, r.tbl);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tbl);

    sel_expr := format('public.can_view_module(auth.uid(), %L)%s', r.moduleq, scope);
    IF r.is_att THEN
      ins_expr := format('public.can_upload_module(auth.uid(), %L)%s', r.moduleq, scope);
      upd_expr := format('public.can_upload_module(auth.uid(), %L)%s', r.moduleq, scope);
      del_expr := format('public.can_delete_files(auth.uid(), %L)%s', r.moduleq, scope);
    ELSE
      ins_expr := format('public.can(auth.uid(), %L)%s', r.moduleq || '.create', scope);
      upd_expr := format('(public.can(auth.uid(), %L) OR public.can(auth.uid(), %L))%s', r.moduleq || '.edit', r.moduleq || '.create', scope);
      del_expr := format('public.can(auth.uid(), %L)%s', r.moduleq || '.delete', scope);
    END IF;

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)', r.tbl||'_perm_select', r.tbl, sel_expr);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', r.tbl||'_perm_insert', r.tbl, ins_expr);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', r.tbl||'_perm_update', r.tbl, upd_expr, upd_expr);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', r.tbl||'_perm_delete', r.tbl, del_expr);
  END LOOP;
END $do$;

-- building_identity: view/edit only
DO $do$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='building_identity' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.building_identity', pol.policyname);
  END LOOP;
END $do$;
CREATE POLICY building_identity_perm_select ON public.building_identity FOR SELECT TO authenticated
  USING (public.can(auth.uid(),'identity.view') OR public.can(auth.uid(),'identity.manage'));
CREATE POLICY building_identity_perm_insert ON public.building_identity FOR INSERT TO authenticated
  WITH CHECK (public.can(auth.uid(),'identity.manage'));
CREATE POLICY building_identity_perm_update ON public.building_identity FOR UPDATE TO authenticated
  USING (public.can(auth.uid(),'identity.manage')) WITH CHECK (public.can(auth.uid(),'identity.manage'));
CREATE POLICY building_identity_perm_delete ON public.building_identity FOR DELETE TO authenticated
  USING (public.can(auth.uid(),'identity.manage'));