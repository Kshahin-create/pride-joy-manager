
ALTER TABLE public.employee_departments
  ADD COLUMN IF NOT EXISTS employer_id uuid REFERENCES public.employee_employers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employee_departments_employer_id ON public.employee_departments(employer_id);

-- Broaden write policies to accept employees.create/edit permission holders too
DROP POLICY IF EXISTS employers_write_managers ON public.employee_employers;
CREATE POLICY employers_write_managers ON public.employee_employers
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
    OR has_role(auth.uid(), 'security_supervisor'::app_role)
    OR has_permission(auth.uid(), 'employees.create')
    OR has_permission(auth.uid(), 'employees.edit')
    OR has_permission(auth.uid(), 'users.edit')
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
    OR has_role(auth.uid(), 'security_supervisor'::app_role)
    OR has_permission(auth.uid(), 'employees.create')
    OR has_permission(auth.uid(), 'employees.edit')
    OR has_permission(auth.uid(), 'users.edit')
  );

DROP POLICY IF EXISTS departments_write_managers ON public.employee_departments;
CREATE POLICY departments_write_managers ON public.employee_departments
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
    OR has_role(auth.uid(), 'security_supervisor'::app_role)
    OR has_permission(auth.uid(), 'employees.create')
    OR has_permission(auth.uid(), 'employees.edit')
    OR has_permission(auth.uid(), 'users.edit')
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
    OR has_role(auth.uid(), 'security_supervisor'::app_role)
    OR has_permission(auth.uid(), 'employees.create')
    OR has_permission(auth.uid(), 'employees.edit')
    OR has_permission(auth.uid(), 'users.edit')
  );
