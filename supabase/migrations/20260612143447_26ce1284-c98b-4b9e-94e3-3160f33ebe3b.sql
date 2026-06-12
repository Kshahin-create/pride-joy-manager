
-- ============ Electricity meters ============
CREATE TABLE public.electricity_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  meter_number TEXT NOT NULL,
  utility_account_number TEXT,
  meter_status TEXT NOT NULL DEFAULT 'يعمل',
  is_independent BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.electricity_meters TO authenticated;
GRANT ALL ON public.electricity_meters TO service_role;
ALTER TABLE public.electricity_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read meters" ON public.electricity_meters FOR SELECT TO authenticated USING (true);
CREATE POLICY "write meters" ON public.electricity_meters FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE TRIGGER trg_meters_updated BEFORE UPDATE ON public.electricity_meters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_meters_office ON public.electricity_meters(office_id);

-- ============ Electricity readings ============
CREATE TABLE public.electricity_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.electricity_meters(id) ON DELETE CASCADE,
  reading_value NUMERIC NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.electricity_readings TO authenticated;
GRANT ALL ON public.electricity_readings TO service_role;
ALTER TABLE public.electricity_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read readings" ON public.electricity_readings FOR SELECT TO authenticated USING (true);
CREATE POLICY "write readings" ON public.electricity_readings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE TRIGGER trg_readings_updated BEFORE UPDATE ON public.electricity_readings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_readings_meter ON public.electricity_readings(meter_id, reading_date DESC);

-- ============ AC units ============
CREATE TABLE public.ac_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  ac_type TEXT,
  manufacturer TEXT,
  capacity TEXT,
  install_date DATE,
  warranty_end_date DATE,
  maintenance_company TEXT,
  current_status TEXT NOT NULL DEFAULT 'يعمل',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ac_units TO authenticated;
GRANT ALL ON public.ac_units TO service_role;
ALTER TABLE public.ac_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read ac" ON public.ac_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "write ac" ON public.ac_units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE TRIGGER trg_ac_updated BEFORE UPDATE ON public.ac_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ac_office ON public.ac_units(office_id);

-- ============ AC maintenance logs ============
CREATE TABLE public.ac_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ac_unit_id UUID NOT NULL REFERENCES public.ac_units(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_maintenance_date DATE,
  technician TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ac_maintenance_logs TO authenticated;
GRANT ALL ON public.ac_maintenance_logs TO service_role;
ALTER TABLE public.ac_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read ac logs" ON public.ac_maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "write ac logs" ON public.ac_maintenance_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE TRIGGER trg_ac_logs_updated BEFORE UPDATE ON public.ac_maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ac_logs_unit ON public.ac_maintenance_logs(ac_unit_id, maintenance_date DESC);

-- ============ Network points ============
CREATE TABLE public.network_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  network_point TEXT,
  phone_point TEXT,
  service_provider TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_points TO authenticated;
GRANT ALL ON public.network_points TO service_role;
ALTER TABLE public.network_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read net" ON public.network_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "write net" ON public.network_points FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_net_updated BEFORE UPDATE ON public.network_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_net_office ON public.network_points(office_id);

-- ============ Office files ============
CREATE TABLE public.office_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL DEFAULT 'مرفق',
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_files TO authenticated;
GRANT ALL ON public.office_files TO service_role;
ALTER TABLE public.office_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read files" ON public.office_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "write files" ON public.office_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_files_updated BEFORE UPDATE ON public.office_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_files_office ON public.office_files(office_id);

-- ============ Storage policies for bucket 'office-files' ============
CREATE POLICY "office-files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'office-files');
CREATE POLICY "office-files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'office-files' AND public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "office-files update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'office-files' AND public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "office-files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'office-files' AND public.has_role(auth.uid(),'super_admin'));
