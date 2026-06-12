
CREATE POLICY "parking_photos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'parking-photos');
CREATE POLICY "parking_photos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'parking-photos');
CREATE POLICY "parking_photos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'parking-photos');
CREATE POLICY "parking_photos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'parking-photos');
