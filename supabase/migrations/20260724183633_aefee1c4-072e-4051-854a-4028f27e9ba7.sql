
DROP POLICY IF EXISTS "read files" ON public.office_files;
CREATE POLICY "office_files_read_staff" ON public.office_files FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
);

DROP POLICY IF EXISTS "ve_read_auth" ON public.vendor_evaluations;
CREATE POLICY "ve_read_staff" ON public.vendor_evaluations FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
);
