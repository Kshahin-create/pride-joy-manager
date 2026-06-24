
-- 1) Restrict employees SELECT to admins/supervisors
DROP POLICY IF EXISTS employees_read_authenticated ON public.employees;
CREATE POLICY employees_read_managers ON public.employees
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'super_admin')
    OR has_role(auth.uid(),'maintenance_supervisor')
    OR has_role(auth.uid(),'security_supervisor')
  );

-- 2) Restrict cleaning-contracts bucket SELECT to roles allowed on the table
DROP POLICY IF EXISTS "cleaning contracts files read" ON storage.objects;
CREATE POLICY "cleaning contracts files read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cleaning-contracts'
    AND (
      has_role(auth.uid(),'super_admin')
      OR has_role(auth.uid(),'accountant')
      OR has_role(auth.uid(),'owner')
      OR has_role(auth.uid(),'maintenance_supervisor')
    )
  );

-- 3) Remove the overly-permissive maintenance-photos SELECT policy so only mphotos_read_auth applies
DROP POLICY IF EXISTS maintenance_photos_read_authenticated ON storage.objects;

-- 4) Tighten emp_assign_modify_managers UPDATE: replace WITH CHECK (true) with the same role gate
DROP POLICY IF EXISTS emp_assign_modify_managers ON public.employee_assignments;
CREATE POLICY emp_assign_modify_managers ON public.employee_assignments
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'super_admin')
    OR has_role(auth.uid(),'maintenance_supervisor')
    OR has_role(auth.uid(),'security_supervisor')
  )
  WITH CHECK (
    has_role(auth.uid(),'super_admin')
    OR has_role(auth.uid(),'maintenance_supervisor')
    OR has_role(auth.uid(),'security_supervisor')
  );
