
-- 1) profiles_staff_lookup_scoped: narrow to supervisors + super_admin
DROP POLICY IF EXISTS "profiles_staff_lookup_scoped" ON public.profiles;
CREATE POLICY "profiles_staff_lookup_scoped" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'super_admin'::app_role)
     OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
     OR has_role(auth.uid(), 'security_supervisor'::app_role))
    AND EXISTS (
      SELECT 1
      FROM user_properties up_self
      JOIN user_properties up_target ON up_self.property_id = up_target.property_id
      WHERE up_self.user_id = auth.uid()
        AND up_target.user_id = profiles.id
    )
  );

-- 2) profiles_self_update_no_isactive: scope to authenticated only
DROP POLICY IF EXISTS "profiles_self_update_no_isactive" ON public.profiles;
CREATE POLICY "profiles_self_update_no_isactive" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.uid() = id) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR ((auth.uid() = id)
         AND (is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())))
  );

-- 3) vendors write policies: require super_admin OR (role AND permission)
DROP POLICY IF EXISTS "vendors_write_privileged_insert" ON public.vendors;
CREATE POLICY "vendors_write_privileged_insert" ON public.vendors
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'maintenance_supervisor'::app_role))
      AND has_permission(auth.uid(), 'vendors.create')
    )
  );

DROP POLICY IF EXISTS "vendors_write_privileged_update" ON public.vendors;
CREATE POLICY "vendors_write_privileged_update" ON public.vendors
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'maintenance_supervisor'::app_role))
      AND has_permission(auth.uid(), 'vendors.edit')
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'maintenance_supervisor'::app_role))
      AND has_permission(auth.uid(), 'vendors.edit')
    )
  );

DROP POLICY IF EXISTS "vendors_write_privileged_delete" ON public.vendors;
CREATE POLICY "vendors_write_privileged_delete" ON public.vendors
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      (has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'maintenance_supervisor'::app_role))
      AND has_permission(auth.uid(), 'vendors.delete')
    )
  );
