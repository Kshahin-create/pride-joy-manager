-- Restrict private bucket reads to relevant roles only
DROP POLICY IF EXISTS "documents_bucket_read" ON storage.objects;
CREATE POLICY "documents_bucket_read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'receptionist')
  )
);

DROP POLICY IF EXISTS "office-files read" ON storage.objects;
CREATE POLICY "office-files read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'office-files'
  AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'receptionist')
  )
);