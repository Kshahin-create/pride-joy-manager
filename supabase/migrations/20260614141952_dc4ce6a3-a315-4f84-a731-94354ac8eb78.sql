
CREATE POLICY "cleaning contracts files read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cleaning-contracts');

CREATE POLICY "cleaning contracts files insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cleaning-contracts'
    AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'))
  );

CREATE POLICY "cleaning contracts files update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cleaning-contracts'
    AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'))
  );

CREATE POLICY "cleaning contracts files delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'cleaning-contracts'
    AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'))
  );
