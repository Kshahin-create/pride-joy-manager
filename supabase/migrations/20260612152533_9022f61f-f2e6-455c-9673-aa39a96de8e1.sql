
-- Enums
CREATE TYPE public.cleaning_frequency AS ENUM ('يومي','أسبوعي','شهري');
CREATE TYPE public.camera_status AS ENUM ('تعمل','معطلة','تحت الصيانة');
CREATE TYPE public.cleaning_photo_kind AS ENUM ('قبل','بعد');

-- cleaning_plans
CREATE TABLE public.cleaning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  frequency public.cleaning_frequency NOT NULL DEFAULT 'يومي',
  contractor_company text,
  supervisor text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_plans TO authenticated;
GRANT ALL ON public.cleaning_plans TO service_role;
ALTER TABLE public.cleaning_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read cleaning_plans" ON public.cleaning_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage cleaning_plans" ON public.cleaning_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE TRIGGER trg_cleaning_plans_updated BEFORE UPDATE ON public.cleaning_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- cleaning_logs
CREATE TABLE public.cleaning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.cleaning_plans(id) ON DELETE CASCADE,
  execution_date date NOT NULL DEFAULT CURRENT_DATE,
  executed_by text,
  notes text,
  before_photo_path text,
  after_photo_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_logs TO authenticated;
GRANT ALL ON public.cleaning_logs TO service_role;
ALTER TABLE public.cleaning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read cleaning_logs" ON public.cleaning_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage cleaning_logs" ON public.cleaning_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE TRIGGER trg_cleaning_logs_updated BEFORE UPDATE ON public.cleaning_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_cleaning_logs_plan ON public.cleaning_logs(plan_id);

-- cameras
CREATE TABLE public.cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_number text NOT NULL UNIQUE,
  location text NOT NULL,
  camera_type text,
  status public.camera_status NOT NULL DEFAULT 'تعمل',
  next_maintenance_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cameras TO authenticated;
GRANT ALL ON public.cameras TO service_role;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read cameras" ON public.cameras FOR SELECT TO authenticated USING (true);
CREATE POLICY "security manage cameras" ON public.cameras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE TRIGGER trg_cameras_updated BEFORE UPDATE ON public.cameras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- camera_maintenance_logs
CREATE TABLE public.camera_maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id uuid NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  next_maintenance_date date,
  issue_description text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camera_maintenance_logs TO authenticated;
GRANT ALL ON public.camera_maintenance_logs TO service_role;
ALTER TABLE public.camera_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read camera_maintenance_logs" ON public.camera_maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "security manage camera_maintenance_logs" ON public.camera_maintenance_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE TRIGGER trg_camera_maintenance_logs_updated BEFORE UPDATE ON public.camera_maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_camera_maintenance_logs_camera ON public.camera_maintenance_logs(camera_id);

-- Auto update camera.next_maintenance_date when a maintenance log is inserted
CREATE OR REPLACE FUNCTION public.sync_camera_next_maintenance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.next_maintenance_date IS NOT NULL THEN
    UPDATE public.cameras SET next_maintenance_date = NEW.next_maintenance_date WHERE id = NEW.camera_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_camera_next_maintenance
AFTER INSERT ON public.camera_maintenance_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_camera_next_maintenance();

-- Storage policies for cleaning-photos bucket
CREATE POLICY "read cleaning photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cleaning-photos');
CREATE POLICY "upload cleaning photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cleaning-photos'
    AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  );
CREATE POLICY "delete cleaning photos" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cleaning-photos'
    AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  );
