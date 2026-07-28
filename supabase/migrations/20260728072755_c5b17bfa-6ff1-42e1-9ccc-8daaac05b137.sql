
-- ==== internal shared secret table (used by DB trigger + TSS endpoints) ====
CREATE TABLE IF NOT EXISTS public.internal_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.internal_secrets TO service_role;
-- no anon/authenticated grants: readable only by service_role/SECURITY DEFINER
ALTER TABLE public.internal_secrets ENABLE ROW LEVEL SECURITY;
-- no policies = no access for anon/authenticated (RLS default deny)

INSERT INTO public.internal_secrets(name, value)
VALUES ('telegram_dispatch', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

-- Update the trigger to send the shared secret header
CREATE OR REPLACE FUNCTION public.dispatch_telegram_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_secret text;
BEGIN
  SELECT value INTO v_secret FROM public.internal_secrets WHERE name='telegram_dispatch';
  PERFORM net.http_post(
    url := 'https://project--81d54015-7ffe-4d01-a715-bc0ff4065839-dev.lovable.app/api/public/telegram/notify',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','sb_publishable_ttPNB5c5coXfw0PrTqs--A_h3N68-Dn',
      'x-internal-secret', COALESCE(v_secret,'')
    ),
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
END $function$;

-- ==== Restrict role/permission catalog reads to super_admin ====
DROP POLICY IF EXISTS "authenticated can read permissions" ON public.app_permissions;
DROP POLICY IF EXISTS "authenticated can read roles" ON public.app_roles;
DROP POLICY IF EXISTS "authenticated can read role_permissions" ON public.role_permissions;
CREATE POLICY app_permissions_read_admin ON public.app_permissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY app_roles_read_admin ON public.app_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY role_permissions_read_admin ON public.role_permissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));

-- ==== assets / asset_attachments / asset_types ====
DROP POLICY IF EXISTS asset_attachments_read_auth ON public.asset_attachments;
CREATE POLICY asset_attachments_read_scoped ON public.asset_attachments
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(),'assets.view')
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'owner')
  );

DROP POLICY IF EXISTS asset_types_read ON public.asset_types;
CREATE POLICY asset_types_read_scoped ON public.asset_types
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(),'assets.view')
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'owner')
  );

-- ==== cameras (security-only) ====
DROP POLICY IF EXISTS "read cameras" ON public.cameras;
CREATE POLICY cameras_read_scoped ON public.cameras
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'security_supervisor')
    OR public.has_role(auth.uid(),'owner')
  );

-- ==== documents ====
DROP POLICY IF EXISTS documents_read_auth ON public.documents;
CREATE POLICY documents_read_scoped ON public.documents
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
  );

-- ==== inspections / inspection_results / inspection_templates ====
DROP POLICY IF EXISTS insp_read ON public.inspections;
CREATE POLICY inspections_read_scoped ON public.inspections
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  );
DROP POLICY IF EXISTS ir_read ON public.inspection_results;
CREATE POLICY ir_read_scoped ON public.inspection_results
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  );
DROP POLICY IF EXISTS tpl_read ON public.inspection_templates;
CREATE POLICY tpl_read_scoped ON public.inspection_templates
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  );

-- ==== maintenance_request_attachments ====
DROP POLICY IF EXISTS mra_read_authenticated ON public.maintenance_request_attachments;
CREATE POLICY mra_read_scoped ON public.maintenance_request_attachments
  FOR SELECT TO authenticated USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
  );

-- ==== network_points ====
DROP POLICY IF EXISTS "read net" ON public.network_points;
CREATE POLICY network_points_read_scoped ON public.network_points
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
  );

-- ==== parking_* (security scope) ====
DROP POLICY IF EXISTS ps_read ON public.parking_spots;
DROP POLICY IF EXISTS pv_read ON public.parking_violations;
DROP POLICY IF EXISTS pmc_read ON public.parking_maintenance_checks;
DROP POLICY IF EXISTS pcl_read ON public.parking_cleaning_logs;
CREATE POLICY ps_read_scoped ON public.parking_spots FOR SELECT TO authenticated
  USING (public.can_manage_security(auth.uid()) OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'receptionist'));
CREATE POLICY pv_read_scoped ON public.parking_violations FOR SELECT TO authenticated
  USING (public.can_manage_security(auth.uid()) OR public.has_role(auth.uid(),'owner'));
CREATE POLICY pmc_read_scoped ON public.parking_maintenance_checks FOR SELECT TO authenticated
  USING (public.can_manage_security(auth.uid()) OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE POLICY pcl_read_scoped ON public.parking_cleaning_logs FOR SELECT TO authenticated
  USING (public.can_manage_security(auth.uid()) OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'maintenance_supervisor'));

-- ==== spaces / pm_plans / cleaning_plans / cleaning_logs / client_* / electricity_* / company_attachments ====
DROP POLICY IF EXISTS spaces_read ON public.spaces;
CREATE POLICY spaces_read_scoped ON public.spaces FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
    OR public.has_role(auth.uid(),'receptionist')
    OR public.has_role(auth.uid(),'accountant')
  );

DROP POLICY IF EXISTS pm_plans_read ON public.pm_plans;
CREATE POLICY pm_plans_read_scoped ON public.pm_plans FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'maintenance_supervisor'));

DROP POLICY IF EXISTS "read cleaning_plans" ON public.cleaning_plans;
CREATE POLICY cleaning_plans_read_scoped ON public.cleaning_plans FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'maintenance_supervisor'));

DROP POLICY IF EXISTS "read cleaning_logs" ON public.cleaning_logs;
CREATE POLICY cleaning_logs_read_scoped ON public.cleaning_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'maintenance_supervisor'));

DROP POLICY IF EXISTS "read interactions" ON public.client_interactions;
CREATE POLICY client_interactions_read_scoped ON public.client_interactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'receptionist') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "read unit views" ON public.client_unit_views;
CREATE POLICY client_unit_views_read_scoped ON public.client_unit_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'receptionist') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "read meters" ON public.electricity_meters;
CREATE POLICY electricity_meters_read_scoped ON public.electricity_meters FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'maintenance_supervisor') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "read readings" ON public.electricity_readings;
CREATE POLICY electricity_readings_read_scoped ON public.electricity_readings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'maintenance_supervisor') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "read company attachments" ON public.company_attachments;
CREATE POLICY company_attachments_read_scoped ON public.company_attachments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'receptionist'));

-- ==== guards: strip SELECT out of the manage-ALL policy so security_supervisor can't read PII ====
DROP POLICY IF EXISTS "manage guards" ON public.guards;
CREATE POLICY guards_insert_manage ON public.guards FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE POLICY guards_update_manage ON public.guards FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE POLICY guards_delete_manage ON public.guards FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
-- 'read guards' policy (super_admin/owner only) is kept as-is.
