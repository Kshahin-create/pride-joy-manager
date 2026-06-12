
DO $$ BEGIN
  CREATE TYPE public.inspection_frequency AS ENUM ('يومي','أسبوعي','شهري');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inspection_overall AS ENUM ('مطابق','ملاحظات','غير مطابق');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inspection_item_result AS ENUM ('سليم','يحتاج إجراء');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  frequency public.inspection_frequency NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_templates TO authenticated;
GRANT ALL ON public.inspection_templates TO service_role;
ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tpl_read" ON public.inspection_templates;
CREATE POLICY "tpl_read" ON public.inspection_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tpl_manage" ON public.inspection_templates;
CREATE POLICY "tpl_manage" ON public.inspection_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'maintenance_supervisor')
      OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'maintenance_supervisor')
      OR public.has_role(auth.uid(),'security_supervisor'));

DROP TRIGGER IF EXISTS trg_tpl_updated_at ON public.inspection_templates;
CREATE TRIGGER trg_tpl_updated_at BEFORE UPDATE ON public.inspection_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.inspection_templates(id) ON DELETE RESTRICT,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspector_name TEXT,
  overall_result public.inspection_overall NOT NULL DEFAULT 'مطابق',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_tpl_date ON public.inspections(template_id, inspection_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT ALL ON public.inspections TO service_role;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insp_read" ON public.inspections;
CREATE POLICY "insp_read" ON public.inspections FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insp_manage" ON public.inspections;
CREATE POLICY "insp_manage" ON public.inspections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'maintenance_supervisor')
      OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'maintenance_supervisor')
      OR public.has_role(auth.uid(),'security_supervisor'));

DROP TRIGGER IF EXISTS trg_insp_updated_at ON public.inspections;
CREATE TRIGGER trg_insp_updated_at BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inspection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  result public.inspection_item_result NOT NULL DEFAULT 'سليم',
  notes TEXT,
  corrective_action TEXT,
  photo_urls TEXT[] DEFAULT '{}'::text[],
  maintenance_request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ir_inspection ON public.inspection_results(inspection_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_results TO authenticated;
GRANT ALL ON public.inspection_results TO service_role;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ir_read" ON public.inspection_results;
CREATE POLICY "ir_read" ON public.inspection_results FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ir_manage" ON public.inspection_results;
CREATE POLICY "ir_manage" ON public.inspection_results FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'maintenance_supervisor')
      OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'maintenance_supervisor')
      OR public.has_role(auth.uid(),'security_supervisor'));

-- Link maintenance_requests back to source inspection (optional)
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL;

-- Storage policies for inspection-photos bucket (bucket created via tool)
DROP POLICY IF EXISTS "inspection_photos_read" ON storage.objects;
CREATE POLICY "inspection_photos_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'inspection-photos');
DROP POLICY IF EXISTS "inspection_photos_insert" ON storage.objects;
CREATE POLICY "inspection_photos_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inspection-photos');
DROP POLICY IF EXISTS "inspection_photos_delete" ON storage.objects;
CREATE POLICY "inspection_photos_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'inspection-photos');

-- Seed templates
INSERT INTO public.inspection_templates (template_name, frequency, items) VALUES
  ('تفتيش يومي', 'يومي',
    '["اللوبي","المواقف","دورات المياه","المصاعد","المداخل"]'::jsonb),
  ('تفتيش أسبوعي', 'أسبوعي',
    '["أنظمة الحريق","الكاميرات","التكييف"]'::jsonb),
  ('تفتيش شهري', 'شهري',
    '["المصاعد","الكهرباء","الخزانات","المضخات"]'::jsonb)
ON CONFLICT DO NOTHING;
