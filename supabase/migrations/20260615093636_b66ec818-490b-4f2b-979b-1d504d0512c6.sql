
-- 1) ac_contracts: restrict writes to roles
DROP POLICY IF EXISTS "manage ac_contracts in user properties" ON public.ac_contracts;

CREATE POLICY "ac_contracts_write_roles"
ON public.ac_contracts
FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(),'super_admin')
   OR public.has_role(auth.uid(),'maintenance_supervisor')
   OR public.has_role(auth.uid(),'accountant'))
  AND (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))
);

CREATE POLICY "ac_contracts_update_roles"
ON public.ac_contracts
FOR UPDATE TO authenticated
USING (
  (public.has_role(auth.uid(),'super_admin')
   OR public.has_role(auth.uid(),'maintenance_supervisor')
   OR public.has_role(auth.uid(),'accountant'))
  AND (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))
)
WITH CHECK (
  (public.has_role(auth.uid(),'super_admin')
   OR public.has_role(auth.uid(),'maintenance_supervisor')
   OR public.has_role(auth.uid(),'accountant'))
  AND (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))
);

CREATE POLICY "ac_contracts_delete_roles"
ON public.ac_contracts
FOR DELETE TO authenticated
USING (
  (public.has_role(auth.uid(),'super_admin')
   OR public.has_role(auth.uid(),'maintenance_supervisor')
   OR public.has_role(auth.uid(),'accountant'))
  AND (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))
);

-- 2) building_log: remove broad authenticated INSERT.
-- Trigger-based log functions are SECURITY DEFINER and bypass RLS,
-- and the existing service_role policy (property_scope_restrict ALL) covers admin writes.
DROP POLICY IF EXISTS "إدراج في سجل البرج" ON public.building_log;

-- 3) cleaning_contracts: replace broad SELECT with role-restricted SELECT
DROP POLICY IF EXISTS "view cleaning contracts" ON public.cleaning_contracts;

CREATE POLICY "cleaning_contracts_read_roles"
ON public.cleaning_contracts
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'owner')
  OR public.has_role(auth.uid(),'maintenance_supervisor')
);

-- 4) cleaning_contract_attachments: same restriction
DROP POLICY IF EXISTS "view cleaning attachments" ON public.cleaning_contract_attachments;

CREATE POLICY "cleaning_contract_attachments_read_roles"
ON public.cleaning_contract_attachments
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'owner')
  OR public.has_role(auth.uid(),'maintenance_supervisor')
);

-- 5) contract_deposit_deductions: restrict reads to finance roles
DROP POLICY IF EXISTS "read deposit deductions" ON public.contract_deposit_deductions;

CREATE POLICY "contract_deposit_deductions_read_roles"
ON public.contract_deposit_deductions
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'owner')
);

-- 6) contract_payment_schedule: restrict reads to finance roles
DROP POLICY IF EXISTS "read payment schedule" ON public.contract_payment_schedule;

CREATE POLICY "contract_payment_schedule_read_roles"
ON public.contract_payment_schedule
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'owner')
);
