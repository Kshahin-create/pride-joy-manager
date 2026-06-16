
-- ========== AC CONTRACTS: restrict SELECT to privileged roles ==========
DROP POLICY IF EXISTS "view ac_contracts in user properties" ON public.ac_contracts;
CREATE POLICY "ac_contracts_read_roles" ON public.ac_contracts
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role)
   OR has_role(auth.uid(),'owner'::app_role))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
);

-- ========== ELEVATOR CONTRACTS: add role checks ==========
DROP POLICY IF EXISTS "ec_select" ON public.elevator_contracts;
DROP POLICY IF EXISTS "ec_insert" ON public.elevator_contracts;
DROP POLICY IF EXISTS "ec_update" ON public.elevator_contracts;

CREATE POLICY "elevator_contracts_read_roles" ON public.elevator_contracts
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role)
   OR has_role(auth.uid(),'owner'::app_role))
  AND user_has_property(auth.uid(), property_id)
);

CREATE POLICY "elevator_contracts_insert_roles" ON public.elevator_contracts
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND user_has_property(auth.uid(), property_id)
);

CREATE POLICY "elevator_contracts_update_roles" ON public.elevator_contracts
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND user_has_property(auth.uid(), property_id)
)
WITH CHECK (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND user_has_property(auth.uid(), property_id)
);

-- ========== FIRE CONTRACTS: replace permissive policies ==========
DROP POLICY IF EXISTS "manage fire contracts by property" ON public.fire_contracts;
DROP POLICY IF EXISTS "view fire contracts by property" ON public.fire_contracts;

CREATE POLICY "fire_contracts_read_roles" ON public.fire_contracts
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role)
   OR has_role(auth.uid(),'owner'::app_role))
  AND user_has_property(auth.uid(), property_id)
);

CREATE POLICY "fire_contracts_insert_roles" ON public.fire_contracts
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND user_has_property(auth.uid(), property_id)
);

CREATE POLICY "fire_contracts_update_roles" ON public.fire_contracts
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND user_has_property(auth.uid(), property_id)
)
WITH CHECK (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND user_has_property(auth.uid(), property_id)
);

CREATE POLICY "fire_contracts_delete_roles" ON public.fire_contracts
FOR DELETE TO authenticated
USING (has_role(auth.uid(),'super_admin'::app_role));

-- ========== SUPPLY CONTRACTS: add role checks ==========
DROP POLICY IF EXISTS "supply_contracts_select" ON public.supply_contracts;
DROP POLICY IF EXISTS "supply_contracts_insert" ON public.supply_contracts;
DROP POLICY IF EXISTS "supply_contracts_update" ON public.supply_contracts;

CREATE POLICY "supply_contracts_read_roles" ON public.supply_contracts
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role)
   OR has_role(auth.uid(),'owner'::app_role))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
);

CREATE POLICY "supply_contracts_insert_roles" ON public.supply_contracts
FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
);

CREATE POLICY "supply_contracts_update_roles" ON public.supply_contracts
FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
)
WITH CHECK (
  (has_role(auth.uid(),'super_admin'::app_role)
   OR has_role(auth.uid(),'accountant'::app_role)
   OR has_role(auth.uid(),'maintenance_supervisor'::app_role))
  AND (property_id IS NULL OR user_has_property(auth.uid(), property_id))
);

-- ========== BUILDING LOG: restrict reads to super_admin / owner ==========
DROP POLICY IF EXISTS "bl_read_all" ON public.building_log;
CREATE POLICY "building_log_read_privileged" ON public.building_log
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(),'super_admin'::app_role)
  OR has_role(auth.uid(),'owner'::app_role)
);

-- ========== AVATARS: explicit public read policy (intentionally public) ==========
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');
