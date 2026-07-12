-- ac_units: tighten SELECT
DROP POLICY IF EXISTS "read ac" ON public.ac_units;
CREATE POLICY "read ac units by role" ON public.ac_units
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
  );

-- ac_maintenance_logs: tighten SELECT
DROP POLICY IF EXISTS "read ac logs" ON public.ac_maintenance_logs;
CREATE POLICY "read ac logs by role" ON public.ac_maintenance_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
  );

-- camera_maintenance_logs: tighten SELECT
DROP POLICY IF EXISTS "read camera_maintenance_logs" ON public.camera_maintenance_logs;
CREATE POLICY "read camera_maintenance_logs by role" ON public.camera_maintenance_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'security_supervisor')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
  );

-- companies: tighten SELECT (property_scope_restrict RESTRICTIVE still applies)
DROP POLICY IF EXISTS "read companies" ON public.companies;
CREATE POLICY "read companies by role" ON public.companies
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'accountant')
    OR public.has_role(auth.uid(), 'receptionist')
  );

-- employee_assignments: tighten SELECT
DROP POLICY IF EXISTS "emp_assign_read_authenticated" ON public.employee_assignments;
CREATE POLICY "emp_assign_read_by_role" ON public.employee_assignments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
    OR public.has_role(auth.uid(), 'security_supervisor')
  );
