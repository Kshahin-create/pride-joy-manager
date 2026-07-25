DROP POLICY IF EXISTS employees_insert_managers ON public.employees;
CREATE POLICY employees_insert_managers ON public.employees
FOR INSERT TO authenticated
WITH CHECK (
  (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
    OR has_role(auth.uid(), 'security_supervisor'::app_role)
    OR has_role(auth.uid(), 'accountant'::app_role)
  )
  AND (created_by = auth.uid() OR created_by IS NULL)
);