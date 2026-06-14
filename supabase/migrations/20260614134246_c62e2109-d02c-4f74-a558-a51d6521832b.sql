
-- Add delegate fields to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS delegate_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Company attachments
CREATE TABLE IF NOT EXISTS public.company_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL DEFAULT 'أخرى',
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_attachments TO authenticated;
GRANT ALL ON public.company_attachments TO service_role;

ALTER TABLE public.company_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read company attachments" ON public.company_attachments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert company attachments" ON public.company_attachments
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist')
  );
CREATE POLICY "update company attachments" ON public.company_attachments
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist')
  );
CREATE POLICY "delete company attachments" ON public.company_attachments
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(),'super_admin')
  );

CREATE TRIGGER trg_company_attachments_updated
  BEFORE UPDATE ON public.company_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for 'companies' bucket
CREATE POLICY "read companies bucket" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'companies' AND (
      public.has_role(auth.uid(),'super_admin') OR
      public.has_role(auth.uid(),'receptionist') OR
      public.has_role(auth.uid(),'accountant') OR
      public.has_role(auth.uid(),'owner')
    )
  );
CREATE POLICY "upload companies bucket" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'companies' AND (
      public.has_role(auth.uid(),'super_admin') OR
      public.has_role(auth.uid(),'receptionist')
    )
  );
CREATE POLICY "delete companies bucket" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'companies' AND public.has_role(auth.uid(),'super_admin')
  );
