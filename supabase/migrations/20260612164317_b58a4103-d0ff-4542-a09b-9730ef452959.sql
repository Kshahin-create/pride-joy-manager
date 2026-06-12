
-- 1) profiles: prevent self-changing is_active. Replace UPDATE policy with WITH CHECK guard.
DROP POLICY IF EXISTS "كل مستخدم يحدّث ملفه" ON public.profiles;
CREATE POLICY "profiles_self_update_no_isactive"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (
  public.has_role(auth.uid(),'super_admin')
  OR (auth.uid() = id AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid()))
);

-- 2) contact_persons: restrict reads to roles that need it
DROP POLICY IF EXISTS "read contacts" ON public.contact_persons;
CREATE POLICY "contacts_read_scoped"
ON public.contact_persons FOR SELECT
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'receptionist')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'owner')
);

-- 3) vendors: restrict reads to roles that need it
DROP POLICY IF EXISTS "vendors_read_auth" ON public.vendors;
CREATE POLICY "vendors_read_scoped"
ON public.vendors FOR SELECT
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'accountant')
  OR public.has_role(auth.uid(),'maintenance_supervisor')
  OR public.has_role(auth.uid(),'security_supervisor')
  OR public.has_role(auth.uid(),'owner')
);

-- 4) Storage policies — tighten writes
-- documents bucket
DROP POLICY IF EXISTS documents_bucket_insert ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_update ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_delete ON storage.objects;
CREATE POLICY documents_bucket_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='documents' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')));
CREATE POLICY documents_bucket_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='documents' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')));
CREATE POLICY documents_bucket_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='documents' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')));

-- inspection-photos bucket
DROP POLICY IF EXISTS inspection_photos_insert ON storage.objects;
DROP POLICY IF EXISTS inspection_photos_delete ON storage.objects;
CREATE POLICY inspection_photos_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='inspection-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor') OR public.has_role(auth.uid(),'security_supervisor')));
CREATE POLICY inspection_photos_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='inspection-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor') OR public.has_role(auth.uid(),'security_supervisor')));

-- parking-photos bucket
DROP POLICY IF EXISTS parking_photos_insert ON storage.objects;
DROP POLICY IF EXISTS parking_photos_update ON storage.objects;
DROP POLICY IF EXISTS parking_photos_delete ON storage.objects;
CREATE POLICY parking_photos_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='parking-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));
CREATE POLICY parking_photos_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='parking-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));
CREATE POLICY parking_photos_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='parking-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));

-- maintenance-photos insert restriction
DROP POLICY IF EXISTS mphotos_insert_auth ON storage.objects;
CREATE POLICY mphotos_insert_scoped ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='maintenance-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor') OR public.has_role(auth.uid(),'receptionist')));

-- 5) Revoke EXECUTE on sensitive SECURITY DEFINER functions from anon/public
REVOKE EXECUTE ON FUNCTION public.notify(text,text,notification_type,app_role,text,text,uuid,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.recalc_invoice_status(uuid) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_overdue_invoices() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_daily_notifications() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.renew_contract(uuid,date,date,numeric) FROM anon, public;
