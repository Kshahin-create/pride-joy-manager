
-- enums
DO $$ BEGIN
  CREATE TYPE public.asset_criticality AS ENUM ('حرج','عادي');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.maintenance_request_status AS ENUM ('جديد','جاري التنفيذ','بانتظار قطع غيار','مغلق');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- assets
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_code TEXT NOT NULL UNIQUE,
  location TEXT,
  manufacturer TEXT,
  supplier TEXT,
  serial_number TEXT,
  install_date DATE,
  warranty_end_date DATE,
  expected_lifespan_years INTEGER,
  responsible_person TEXT,
  criticality public.asset_criticality NOT NULL DEFAULT 'عادي',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_read_all_auth" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "assets_manage_admins" ON public.assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));

CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- maintenance_requests
CREATE SEQUENCE IF NOT EXISTS public.maintenance_request_number_seq START 1;

CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reported_by UUID,
  reporter_name TEXT,
  location TEXT,
  request_type TEXT,
  description TEXT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
  status public.maintenance_request_status NOT NULL DEFAULT 'جديد',
  assigned_technician TEXT,
  cost NUMERIC(12,2),
  before_photo_url TEXT,
  after_photo_url TEXT,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- everyone authenticated can read & create
CREATE POLICY "mr_read_all_auth" ON public.maintenance_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "mr_insert_all_auth" ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid() OR reported_by IS NULL);
-- only admins update/delete
CREATE POLICY "mr_update_admins" ON public.maintenance_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE POLICY "mr_delete_admins" ON public.maintenance_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));

CREATE TRIGGER trg_mr_updated_at BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto request number
CREATE OR REPLACE FUNCTION public.set_maintenance_request_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := 'MNT-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.maintenance_request_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_set_mr_number BEFORE INSERT ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_maintenance_request_number();

-- close stamping
CREATE OR REPLACE FUNCTION public.stamp_mr_closure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'مغلق' AND (OLD.status IS DISTINCT FROM 'مغلق') THEN
    NEW.closed_at := now();
    NEW.closed_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_stamp_mr_closure BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.stamp_mr_closure();

-- storage policies for maintenance-photos
CREATE POLICY "mphotos_read_auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-photos');
CREATE POLICY "mphotos_insert_auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-photos');
CREATE POLICY "mphotos_update_admins" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'maintenance-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor')));
CREATE POLICY "mphotos_delete_admins" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'maintenance-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor')));

-- seed assets
INSERT INTO public.assets (asset_name, asset_code, location, criticality) VALUES
  ('المصعد رقم 1','AST-ELV-01','جميع الأدوار','حرج'),
  ('المصعد رقم 2','AST-ELV-02','جميع الأدوار','حرج'),
  ('اللوحة الكهربائية الرئيسية','AST-ELC-01','غرفة الكهرباء','عادي'),
  ('مضخة المياه الرئيسية','AST-PMP-01','غرفة المضخات','عادي'),
  ('نظام إنذار الحريق','AST-FRA-01','البرج بالكامل','حرج'),
  ('نظام إطفاء الحريق','AST-FRS-01','البرج بالكامل','حرج'),
  ('البوابة الرئيسية','AST-GAT-01','المدخل','عادي'),
  ('خزان المياه العلوي','AST-TNK-01','السطح','عادي'),
  ('مواسير الدفاع المدني','AST-CDP-01','البرج بالكامل','عادي'),
  ('خراطيم الحريق','AST-FHS-01','جميع الأدوار','عادي'),
  ('صناديق الحريق','AST-FBX-01','جميع الأدوار','عادي'),
  ('غرفة الكاميرات','AST-CAM-01','الدور الأرضي','عادي'),
  ('مكتب مدير البرج','AST-OFF-01','الدور الأرضي','عادي'),
  ('المخزن','AST-STR-01','البدروم','عادي')
ON CONFLICT (asset_code) DO NOTHING;
