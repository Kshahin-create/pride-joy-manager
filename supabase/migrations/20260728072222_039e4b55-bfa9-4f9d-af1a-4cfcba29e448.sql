
DROP POLICY IF EXISTS assets_manage_admins ON public.assets;
DROP POLICY IF EXISTS assets_read_all_auth ON public.assets;

CREATE POLICY assets_select_perm ON public.assets
FOR SELECT TO authenticated
USING (
  public.has_permission(auth.uid(),'assets.view')
  OR public.has_role(auth.uid(),'super_admin')
);

CREATE POLICY assets_insert_perm ON public.assets
FOR INSERT TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(),'assets.create')
  OR public.has_role(auth.uid(),'super_admin')
);

CREATE POLICY assets_update_perm ON public.assets
FOR UPDATE TO authenticated
USING (
  public.has_permission(auth.uid(),'assets.edit')
  OR public.has_role(auth.uid(),'super_admin')
)
WITH CHECK (
  public.has_permission(auth.uid(),'assets.edit')
  OR public.has_role(auth.uid(),'super_admin')
);

CREATE POLICY assets_delete_perm ON public.assets
FOR DELETE TO authenticated
USING (
  public.has_permission(auth.uid(),'assets.delete')
  OR public.has_role(auth.uid(),'super_admin')
);
