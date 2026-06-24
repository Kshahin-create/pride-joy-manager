
-- employees: require manager/admin role on INSERT
DROP POLICY IF EXISTS employees_insert_authenticated ON public.employees;
CREATE POLICY employees_insert_managers ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'maintenance_supervisor') OR has_role(auth.uid(),'security_supervisor'))
    AND (created_by = auth.uid() OR created_by IS NULL)
  );

-- employee_assignments: require manager/admin role on INSERT
DROP POLICY IF EXISTS emp_assign_insert_authenticated ON public.employee_assignments;
CREATE POLICY emp_assign_insert_managers ON public.employee_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'maintenance_supervisor') OR has_role(auth.uid(),'security_supervisor'))
    AND (assigned_by = auth.uid() OR assigned_by IS NULL)
  );

-- fire_contract_attachments: add role check consistent with fire_contracts
DROP POLICY IF EXISTS "manage fire attachments" ON public.fire_contract_attachments;
DROP POLICY IF EXISTS "view fire attachments" ON public.fire_contract_attachments;

CREATE POLICY "view fire attachments" ON public.fire_contract_attachments
  FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'maintenance_supervisor') OR has_role(auth.uid(),'owner'))
    AND EXISTS (
      SELECT 1 FROM public.fire_contracts c
      WHERE c.id = fire_contract_attachments.contract_id
        AND user_has_property(auth.uid(), c.property_id)
    )
  );

CREATE POLICY "manage fire attachments" ON public.fire_contract_attachments
  FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'maintenance_supervisor') OR has_role(auth.uid(),'owner'))
    AND EXISTS (
      SELECT 1 FROM public.fire_contracts c
      WHERE c.id = fire_contract_attachments.contract_id
        AND user_has_property(auth.uid(), c.property_id)
    )
  )
  WITH CHECK (
    (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'maintenance_supervisor') OR has_role(auth.uid(),'owner'))
    AND EXISTS (
      SELECT 1 FROM public.fire_contracts c
      WHERE c.id = fire_contract_attachments.contract_id
        AND user_has_property(auth.uid(), c.property_id)
    )
  );
