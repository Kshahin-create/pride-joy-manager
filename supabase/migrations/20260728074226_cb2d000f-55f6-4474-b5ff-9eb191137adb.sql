INSERT INTO public.app_permissions (key, module, module_label, action, label, description, sort_order)
VALUES
  ('employees.view', 'employees', 'الموظفون', 'view', 'عرض الموظفين', 'عرض بيانات الموظفين', 1200),
  ('employees.create', 'employees', 'الموظفون', 'create', 'إضافة موظف', 'إضافة موظفين جدد', 1201),
  ('employees.edit', 'employees', 'الموظفون', 'edit', 'تعديل الموظفين', 'تعديل بيانات الموظفين', 1202),
  ('employees.delete', 'employees', 'الموظفون', 'delete', 'حذف الموظفين', 'حذف أو أرشفة الموظفين', 1203)
ON CONFLICT (key) DO UPDATE SET
  module = EXCLUDED.module,
  module_label = EXCLUDED.module_label,
  action = EXCLUDED.action,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM public.app_roles r
CROSS JOIN public.app_permissions p
WHERE r.name IN ('super_admin', 'maintenance_supervisor', 'security_supervisor', 'accountant', 'data_entry')
  AND p.key IN ('employees.view', 'employees.create', 'employees.edit')
ON CONFLICT (role_id, permission_key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM public.app_roles r
CROSS JOIN public.app_permissions p
WHERE r.name IN ('super_admin')
  AND p.key IN ('employees.delete')
ON CONFLICT (role_id, permission_key) DO NOTHING;

DROP POLICY IF EXISTS employees_perm_write ON public.employees;
DROP POLICY IF EXISTS employees_perm_select ON public.employees;
DROP POLICY IF EXISTS employees_perm_insert ON public.employees;
DROP POLICY IF EXISTS employees_perm_update ON public.employees;
DROP POLICY IF EXISTS employees_perm_delete ON public.employees;

CREATE POLICY employees_perm_select
ON public.employees
FOR SELECT
TO authenticated
USING (
  public.has_permission(auth.uid(), 'employees.view')
  OR public.has_permission(auth.uid(), 'users.view')
  OR public.has_permission(auth.uid(), 'guards.view')
);

CREATE POLICY employees_perm_insert
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.has_permission(auth.uid(), 'employees.create')
    OR public.has_permission(auth.uid(), 'users.create')
    OR public.has_permission(auth.uid(), 'guards.create')
  )
  AND (created_by = auth.uid() OR created_by IS NULL)
);

CREATE POLICY employees_perm_update
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'employees.edit')
  OR public.has_permission(auth.uid(), 'users.edit')
  OR public.has_permission(auth.uid(), 'guards.edit')
)
WITH CHECK (
  public.has_permission(auth.uid(), 'employees.edit')
  OR public.has_permission(auth.uid(), 'users.edit')
  OR public.has_permission(auth.uid(), 'guards.edit')
);

CREATE POLICY employees_perm_delete
ON public.employees
FOR DELETE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'employees.delete')
  OR public.has_permission(auth.uid(), 'users.delete')
);
