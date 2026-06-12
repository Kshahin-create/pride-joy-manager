
DO $$ BEGIN
  CREATE TYPE public.doc_category AS ENUM (
    'عقد','هوية','سجل تجاري','فاتورة','سند','عقد مورد','عقد صيانة',
    'مخطط البرج','شهادة دفاع مدني','شهادة مصعد','عقد أمن',
    'شهادة نظام حريق','تقرير صيانة سنوي','أخرى'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.doc_entity_type AS ENUM ('tenant','contract','asset','vendor','building');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.doc_category NOT NULL DEFAULT 'أخرى',
  entity_type public.doc_entity_type NOT NULL DEFAULT 'building',
  entity_id UUID,
  file_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.documents(expiry_date) WHERE expiry_date IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_read_auth" ON public.documents;
CREATE POLICY "documents_read_auth" ON public.documents
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR (public.has_role(auth.uid(),'accountant') AND entity_type IN ('tenant','contract'))
  );

DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR (public.has_role(auth.uid(),'accountant') AND entity_type IN ('tenant','contract'))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR (public.has_role(auth.uid(),'accountant') AND entity_type IN ('tenant','contract'))
  );

DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR (public.has_role(auth.uid(),'accountant') AND entity_type IN ('tenant','contract'))
  );

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket policies (bucket created via tool)
DROP POLICY IF EXISTS "documents_bucket_read" ON storage.objects;
CREATE POLICY "documents_bucket_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_bucket_insert" ON storage.objects;
CREATE POLICY "documents_bucket_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_bucket_update" ON storage.objects;
CREATE POLICY "documents_bucket_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_bucket_delete" ON storage.objects;
CREATE POLICY "documents_bucket_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documents');
