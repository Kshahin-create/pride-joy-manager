DROP POLICY IF EXISTS mr_update_admins ON public.maintenance_requests;

CREATE POLICY mr_update_scoped ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
  OR reported_by = auth.uid()
  OR has_permission(auth.uid(), 'maintenance.manage')
  OR has_permission(auth.uid(), 'maintenance.update')
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
  OR reported_by = auth.uid()
  OR has_permission(auth.uid(), 'maintenance.manage')
  OR has_permission(auth.uid(), 'maintenance.update')
);