
-- pm_plans
DROP POLICY IF EXISTS "admin manage pm_plans" ON public.pm_plans;
DROP POLICY IF EXISTS "pm_plans_manage" ON public.pm_plans;
CREATE POLICY "pm_plans_manage_perm" ON public.pm_plans FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'pm_plans.manage') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'pm_plans.manage') OR has_role(auth.uid(),'super_admin'));

-- inspection_templates
DROP POLICY IF EXISTS "tpl_manage" ON public.inspection_templates;
CREATE POLICY "tpl_manage_perm" ON public.inspection_templates FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'inspections.manage_templates') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'inspections.manage_templates') OR has_role(auth.uid(),'super_admin'));

-- inspections
DROP POLICY IF EXISTS "insp_manage" ON public.inspections;
CREATE POLICY "insp_insert_perm" ON public.inspections FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(),'inspections.create') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "insp_update_perm" ON public.inspections FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(),'inspections.edit') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'inspections.edit') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "insp_delete_perm" ON public.inspections FOR DELETE TO authenticated
  USING (has_permission(auth.uid(),'inspections.delete') OR has_role(auth.uid(),'super_admin'));

-- inspection_results
DROP POLICY IF EXISTS "ir_manage" ON public.inspection_results;
CREATE POLICY "ir_manage_perm" ON public.inspection_results FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'inspections.edit') OR has_permission(auth.uid(),'inspections.create') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'inspections.edit') OR has_permission(auth.uid(),'inspections.create') OR has_role(auth.uid(),'super_admin'));

-- cleaning_plans
DROP POLICY IF EXISTS "admin manage cleaning_plans" ON public.cleaning_plans;
CREATE POLICY "cleaning_plans_manage_perm" ON public.cleaning_plans FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'cleaning.manage') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'cleaning.manage') OR has_role(auth.uid(),'super_admin'));

-- asset_types
DROP POLICY IF EXISTS "asset_types_manage" ON public.asset_types;
CREATE POLICY "asset_types_manage_perm" ON public.asset_types FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create') OR has_role(auth.uid(),'super_admin'));

-- cameras
DROP POLICY IF EXISTS "security manage cameras" ON public.cameras;
CREATE POLICY "cameras_manage_perm" ON public.cameras FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'cameras.manage') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'cameras.manage') OR has_role(auth.uid(),'super_admin'));

-- network_points (manage under assets)
DROP POLICY IF EXISTS "admin manage network_points" ON public.network_points;
DROP POLICY IF EXISTS "network_points_manage" ON public.network_points;
CREATE POLICY "network_points_manage_perm" ON public.network_points FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create') OR has_role(auth.uid(),'super_admin'));

-- parking_spots
DROP POLICY IF EXISTS "admin manage parking_spots" ON public.parking_spots;
DROP POLICY IF EXISTS "parking_spots_manage" ON public.parking_spots;
CREATE POLICY "parking_spots_manage_perm" ON public.parking_spots FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'parking.manage') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'parking.manage') OR has_role(auth.uid(),'super_admin'));

-- spaces
DROP POLICY IF EXISTS "admin manage spaces" ON public.spaces;
DROP POLICY IF EXISTS "spaces_manage" ON public.spaces;
CREATE POLICY "spaces_manage_perm" ON public.spaces FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'spaces.manage') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_permission(auth.uid(),'spaces.manage') OR has_role(auth.uid(),'super_admin'));
