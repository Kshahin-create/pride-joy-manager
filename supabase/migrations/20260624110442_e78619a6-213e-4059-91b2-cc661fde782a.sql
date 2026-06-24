
-- Attachments table
CREATE TABLE public.maintenance_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  file_path text NOT NULL,                 -- storage path inside 'maintenance-photos' bucket
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  attachment_kind text,                    -- 'before', 'after', 'document', 'other'
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mra_request ON public.maintenance_request_attachments(request_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_request_attachments TO authenticated;
GRANT ALL ON public.maintenance_request_attachments TO service_role;
ALTER TABLE public.maintenance_request_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mra_read_authenticated"
  ON public.maintenance_request_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "mra_insert_authenticated"
  ON public.maintenance_request_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() OR uploaded_by IS NULL);

CREATE POLICY "mra_delete_owner_or_manager"
  ON public.maintenance_request_attachments FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
  );

-- Storage policies for the private 'maintenance-photos' bucket
-- Read (download / signed URLs): authenticated only
CREATE POLICY "maintenance_photos_read_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-photos');

-- Upload: authenticated users
CREATE POLICY "maintenance_photos_upload_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-photos' AND owner = auth.uid());

-- Update own files
CREATE POLICY "maintenance_photos_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'maintenance-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'maintenance-photos' AND owner = auth.uid());

-- Delete: owner or maintenance supervisor / super admin
CREATE POLICY "maintenance_photos_delete_owner_or_manager"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'maintenance-photos'
    AND (
      owner = auth.uid()
      OR public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'maintenance_supervisor')
    )
  );

-- Relax hold_reason requirement at DB level (user wants it optional)
CREATE OR REPLACE FUNCTION public.validate_wo_closure()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'مغلق' AND (OLD.status IS DISTINCT FROM 'مغلق') THEN
    IF OLD.status <> 'مكتمل مبدئياً' AND NOT public.has_role(auth.uid(),'super_admin') THEN
      RAISE EXCEPTION 'يجب أن يصل أمر العمل إلى حالة "مكتمل مبدئياً" قبل الاعتماد والإغلاق';
    END IF;
  END IF;
  -- hold_reason is now optional (UI may still suggest it)
  RETURN NEW;
END $function$;
