-- ============ EMPLOYEES ============
DROP POLICY IF EXISTS employees_insert_managers ON public.employees;
DROP POLICY IF EXISTS employees_update_managers ON public.employees;
DROP POLICY IF EXISTS employees_delete_admin ON public.employees;
DROP POLICY IF EXISTS employees_read_admins ON public.employees;
DROP POLICY IF EXISTS employees_perm_select ON public.employees;
DROP POLICY IF EXISTS employees_perm_insert ON public.employees;
DROP POLICY IF EXISTS employees_perm_update ON public.employees;
DROP POLICY IF EXISTS employees_perm_delete ON public.employees;

CREATE POLICY employees_select ON public.employees FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_permission(auth.uid(), 'employees.view')
  OR has_permission(auth.uid(), 'guards.view')
);

CREATE POLICY employees_insert ON public.employees FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'employees.create'))
  AND (created_by = auth.uid() OR created_by IS NULL)
);

CREATE POLICY employees_update ON public.employees FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'employees.edit'))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'employees.edit'));

CREATE POLICY employees_delete ON public.employees FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'employees.delete'));

-- restrictive gate: no access at all without an employee-scoped grant
DROP POLICY IF EXISTS employees_access_restrict ON public.employees;
CREATE POLICY employees_access_restrict ON public.employees AS RESTRICTIVE FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_permission(auth.uid(), 'employees.view')
  OR has_permission(auth.uid(), 'employees.create')
  OR has_permission(auth.uid(), 'employees.edit')
  OR has_permission(auth.uid(), 'employees.delete')
  OR has_permission(auth.uid(), 'guards.view')
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_permission(auth.uid(), 'employees.create')
  OR has_permission(auth.uid(), 'employees.edit')
);

-- ============ GUARDS ============
DROP POLICY IF EXISTS guards_perm_write ON public.guards;
DROP POLICY IF EXISTS guards_insert_manage ON public.guards;
DROP POLICY IF EXISTS guards_update_manage ON public.guards;
DROP POLICY IF EXISTS guards_delete_manage ON public.guards;

CREATE POLICY guards_insert ON public.guards FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'guards.create'));

CREATE POLICY guards_update ON public.guards FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'guards.edit'))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'guards.edit'));

CREATE POLICY guards_delete ON public.guards FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_permission(auth.uid(), 'guards.delete'));

-- ============ PROFILES ============
DROP POLICY IF EXISTS profiles_self_update_no_isactive ON public.profiles;

CREATE POLICY profiles_self_update_safe_columns ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active IS NOT DISTINCT FROM profiles.is_active
      AND p.created_at IS NOT DISTINCT FROM profiles.created_at
      AND p.created_by IS NOT DISTINCT FROM profiles.created_by
  )
);
