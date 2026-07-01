DROP POLICY IF EXISTS "Super admin reads audit log" ON public.audit_log;
CREATE POLICY "Super admin and owner read audit log" ON public.audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'owner'::app_role));

DROP POLICY IF EXISTS "maintenance_photos_upload_authenticated" ON storage.objects;