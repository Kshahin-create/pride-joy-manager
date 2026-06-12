
-- contracts: scope SELECT to super_admin, accountant, owner, receptionist
DROP POLICY IF EXISTS "Authenticated can read contracts" ON public.contracts;
DROP POLICY IF EXISTS contracts_read_auth ON public.contracts;
CREATE POLICY contracts_read_scoped ON public.contracts
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'owner')
  OR public.has_role(auth.uid(),'receptionist')
);

-- contract_attachments: scope SELECT to super_admin, accountant, owner
DROP POLICY IF EXISTS "Authenticated can read contract attachments" ON public.contract_attachments;
DROP POLICY IF EXISTS contract_attachments_read_auth ON public.contract_attachments;
CREATE POLICY contract_attachments_read_scoped ON public.contract_attachments
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'owner')
);

-- vendor_contracts: scope SELECT to super_admin, accountant, maintenance_supervisor, owner
DROP POLICY IF EXISTS vc_read_auth ON public.vendor_contracts;
CREATE POLICY vc_read_scoped ON public.vendor_contracts
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'maintenance_supervisor')
  OR public.has_role(auth.uid(),'owner')
);
