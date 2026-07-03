
-- 1) building_log: add explicit INSERT policy so privileged roles / triggers can write audit entries
DROP POLICY IF EXISTS "building_log_insert_privileged" ON public.building_log;
CREATE POLICY "building_log_insert_privileged"
ON public.building_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'accountant')
  OR public.has_role(auth.uid(), 'maintenance_supervisor')
  OR public.has_role(auth.uid(), 'security_supervisor')
  OR public.has_role(auth.uid(), 'receptionist')
  OR public.has_role(auth.uid(), 'owner')
);

-- 2) profiles: allow internal staff to look up colleague profiles (needed for employee/assignment displays)
DROP POLICY IF EXISTS "profiles_staff_lookup" ON public.profiles;
CREATE POLICY "profiles_staff_lookup"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'maintenance_supervisor')
  OR public.has_role(auth.uid(), 'security_supervisor')
  OR public.has_role(auth.uid(), 'accountant')
  OR public.has_role(auth.uid(), 'receptionist')
);
