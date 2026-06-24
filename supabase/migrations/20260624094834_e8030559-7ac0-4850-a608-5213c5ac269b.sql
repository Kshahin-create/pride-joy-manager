
-- Tighten user_roles: add RESTRICTIVE policy preventing non-super_admins from writing
CREATE POLICY "restrict_user_roles_writes"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Tighten storage read policies: replace broad authenticated reads with role-scoped reads
DROP POLICY IF EXISTS "read cleaning photos" ON storage.objects;
CREATE POLICY "read cleaning photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cleaning-photos'
  AND (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
    OR public.has_role(auth.uid(), 'owner')
  )
);

DROP POLICY IF EXISTS "mphotos_read_auth" ON storage.objects;
CREATE POLICY "mphotos_read_auth"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'maintenance-photos'
  AND (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
    OR public.has_role(auth.uid(), 'owner')
  )
);

DROP POLICY IF EXISTS "inspection_photos_read" ON storage.objects;
CREATE POLICY "inspection_photos_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-photos'
  AND (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'maintenance_supervisor')
    OR public.has_role(auth.uid(), 'security_supervisor')
    OR public.has_role(auth.uid(), 'owner')
  )
);

DROP POLICY IF EXISTS "parking_photos_read" ON storage.objects;
CREATE POLICY "parking_photos_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'parking-photos'
  AND (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'security_supervisor')
    OR public.has_role(auth.uid(), 'owner')
  )
);
