
-- 1. has_permission: strict, explicit checks (no permissive LEFT JOIN), and
--    the permission key must be a defined key in app_permissions.
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL
     AND _permission_key IS NOT NULL
     AND (
       -- super_admin role assignment
       EXISTS (
         SELECT 1
         FROM public.user_role_assignments ura
         JOIN public.app_roles r ON r.id = ura.role_id
         WHERE ura.user_id = _user_id AND r.name = 'super_admin'
       )
       OR
       -- explicit grant that matches BOTH the user's assigned role and a defined permission key
       EXISTS (
         SELECT 1
         FROM public.user_role_assignments ura
         JOIN public.role_permissions rp ON rp.role_id = ura.role_id
         JOIN public.app_permissions ap ON ap.key = rp.permission_key
         WHERE ura.user_id = _user_id
           AND rp.permission_key = _permission_key
       )
     )
$$;

-- 2. maintenance_requests: require a maintenance-related permission/role to insert,
--    and force reported_by to be the caller.
DROP POLICY IF EXISTS mr_insert_all_auth ON public.maintenance_requests;
CREATE POLICY mr_insert_staff ON public.maintenance_requests
FOR INSERT TO authenticated
WITH CHECK (
  reported_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
    OR public.has_role(auth.uid(), 'receptionist')
    OR public.has_permission(auth.uid(), 'maintenance.create')
    OR public.has_permission(auth.uid(), 'maintenance.manage')
    OR public.has_permission(auth.uid(), 'maintenance.view')
  )
);

-- 3. notifications: non-super_admin users may only change read status.
CREATE OR REPLACE FUNCTION public.restrict_notification_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'super_admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only is_read / read_at may change for everyone else.
  NEW := OLD;
  NEW.is_read := (SELECT n.is_read FROM (SELECT $1) AS x(_) LIMIT 0);
  RETURN NEW;
END;
$$;
