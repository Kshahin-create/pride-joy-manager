
DROP POLICY IF EXISTS departments_read_authenticated ON public.employee_departments;
DROP POLICY IF EXISTS employers_read_authenticated ON public.employee_employers;

CREATE POLICY employee_departments_read_scoped ON public.employee_departments
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_permission(auth.uid(),'employees.view')
  OR public.has_permission(auth.uid(),'employees.create')
  OR public.has_permission(auth.uid(),'employees.edit')
  OR public.has_permission(auth.uid(),'users.edit')
);

CREATE POLICY employee_employers_read_scoped ON public.employee_employers
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_permission(auth.uid(),'employees.view')
  OR public.has_permission(auth.uid(),'employees.create')
  OR public.has_permission(auth.uid(),'employees.edit')
  OR public.has_permission(auth.uid(),'users.edit')
);
