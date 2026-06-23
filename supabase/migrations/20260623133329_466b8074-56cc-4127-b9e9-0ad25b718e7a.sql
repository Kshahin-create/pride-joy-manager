
-- 1) Financial contract attachments: role-gate like parent contracts
DROP POLICY IF EXISTS "manage ac_contract_attachments" ON public.ac_contract_attachments;
DROP POLICY IF EXISTS "view ac_contract_attachments" ON public.ac_contract_attachments;

CREATE POLICY "ac_attachments_select_privileged" ON public.ac_contract_attachments
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor')
   OR has_role(auth.uid(),'owner'))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
);

CREATE POLICY "ac_attachments_write_privileged" ON public.ac_contract_attachments
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor'))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
);

CREATE POLICY "ac_attachments_update_privileged" ON public.ac_contract_attachments
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor'))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
);

CREATE POLICY "ac_attachments_delete_privileged" ON public.ac_contract_attachments
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'super_admin'));

-- Elevator
DROP POLICY IF EXISTS "eca_select" ON public.elevator_contract_attachments;
DROP POLICY IF EXISTS "eca_write" ON public.elevator_contract_attachments;

CREATE POLICY "eca_select_privileged" ON public.elevator_contract_attachments
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor')
   OR has_role(auth.uid(),'owner'))
  AND EXISTS (
    SELECT 1 FROM public.elevator_contracts c
    WHERE c.id = elevator_contract_attachments.elevator_contract_id
      AND user_has_property(auth.uid(), c.property_id)
  )
);

CREATE POLICY "eca_insert_privileged" ON public.elevator_contract_attachments
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor'))
  AND EXISTS (
    SELECT 1 FROM public.elevator_contracts c
    WHERE c.id = elevator_contract_attachments.elevator_contract_id
      AND user_has_property(auth.uid(), c.property_id)
  )
);

CREATE POLICY "eca_update_privileged" ON public.elevator_contract_attachments
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor'))
  AND EXISTS (
    SELECT 1 FROM public.elevator_contracts c
    WHERE c.id = elevator_contract_attachments.elevator_contract_id
      AND user_has_property(auth.uid(), c.property_id)
  )
);

CREATE POLICY "eca_delete_privileged" ON public.elevator_contract_attachments
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'super_admin'));

-- Supply
DROP POLICY IF EXISTS "supply_contract_att_manage" ON public.supply_contract_attachments;
DROP POLICY IF EXISTS "supply_contract_att_select" ON public.supply_contract_attachments;

CREATE POLICY "sca_select_privileged" ON public.supply_contract_attachments
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor')
   OR has_role(auth.uid(),'owner'))
  AND EXISTS (
    SELECT 1 FROM public.supply_contracts c
    WHERE c.id = supply_contract_attachments.contract_id
      AND (c.property_id IS NULL OR user_has_property(auth.uid(), c.property_id))
  )
);

CREATE POLICY "sca_insert_privileged" ON public.supply_contract_attachments
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor'))
  AND EXISTS (
    SELECT 1 FROM public.supply_contracts c
    WHERE c.id = supply_contract_attachments.contract_id
      AND (c.property_id IS NULL OR user_has_property(auth.uid(), c.property_id))
  )
);

CREATE POLICY "sca_update_privileged" ON public.supply_contract_attachments
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(),'super_admin')
   OR has_role(auth.uid(),'accountant')
   OR has_role(auth.uid(),'maintenance_supervisor'))
  AND EXISTS (
    SELECT 1 FROM public.supply_contracts c
    WHERE c.id = supply_contract_attachments.contract_id
      AND (c.property_id IS NULL OR user_has_property(auth.uid(), c.property_id))
  )
);

CREATE POLICY "sca_delete_privileged" ON public.supply_contract_attachments
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'super_admin'));

-- 2) Avatars bucket: remove broad listing policy.
-- Files remain reachable via public URLs (bucket stays public),
-- but storage.objects listing is no longer allowed.
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
