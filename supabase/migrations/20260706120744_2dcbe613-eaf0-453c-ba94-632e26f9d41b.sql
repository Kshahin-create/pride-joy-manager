
-- 1. Scope offices SELECT to property access (remove broad authenticated read)
DROP POLICY IF EXISTS "قراءة المكاتب لكل المصادقين" ON public.offices;

CREATE POLICY "read offices within scope"
ON public.offices
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR (property_id IS NOT NULL AND user_has_property(auth.uid(), property_id))
);

-- 2. Scope profiles staff lookup to profiles of users sharing at least one property
DROP POLICY IF EXISTS "profiles_staff_lookup" ON public.profiles;

CREATE POLICY "profiles_staff_lookup_scoped"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (
    has_role(auth.uid(), 'maintenance_supervisor'::app_role)
    OR has_role(auth.uid(), 'security_supervisor'::app_role)
    OR has_role(auth.uid(), 'accountant'::app_role)
    OR has_role(auth.uid(), 'receptionist'::app_role)
  )
  AND EXISTS (
    SELECT 1
    FROM public.user_properties up_self
    JOIN public.user_properties up_target
      ON up_self.property_id = up_target.property_id
    WHERE up_self.user_id = auth.uid()
      AND up_target.user_id = public.profiles.id
  )
);
