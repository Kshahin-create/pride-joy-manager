
CREATE TYPE public.parking_spot_status AS ENUM ('متاح','مخصص','مشغول','صيانة');
CREATE TYPE public.parking_spot_type AS ENUM ('عادي','VIP','ذوي احتياجات');
CREATE TYPE public.parking_check_status AS ENUM ('سليم','يحتاج صيانة');
CREATE TYPE public.parking_violation_status AS ENUM ('مفتوحة','محلولة');

CREATE TABLE public.parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_number TEXT NOT NULL,
  floor TEXT NOT NULL CHECK (floor IN ('P1','P2','P3')),
  location_description TEXT,
  spot_type public.parking_spot_type NOT NULL DEFAULT 'عادي',
  office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
  camera_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
  coverage_notes TEXT,
  status public.parking_spot_status NOT NULL DEFAULT 'متاح',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (floor, spot_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_spots TO authenticated;
GRANT ALL ON public.parking_spots TO service_role;
ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_read" ON public.parking_spots FOR SELECT TO authenticated USING (true);
CREATE POLICY "ps_manage" ON public.parking_spots FOR ALL TO authenticated
  USING (public.can_manage_security(auth.uid()))
  WITH CHECK (public.can_manage_security(auth.uid()));
CREATE TRIGGER trg_ps_updated BEFORE UPDATE ON public.parking_spots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.parking_maintenance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  floors_status public.parking_check_status NOT NULL DEFAULT 'سليم',
  paint_status public.parking_check_status NOT NULL DEFAULT 'سليم',
  signage_status public.parking_check_status NOT NULL DEFAULT 'سليم',
  bumpers_status public.parking_check_status NOT NULL DEFAULT 'سليم',
  gates_status public.parking_check_status NOT NULL DEFAULT 'سليم',
  fire_pipes_status public.parking_check_status NOT NULL DEFAULT 'سليم',
  fire_hoses_status public.parking_check_status NOT NULL DEFAULT 'سليم',
  next_check_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_maintenance_checks TO authenticated;
GRANT ALL ON public.parking_maintenance_checks TO service_role;
ALTER TABLE public.parking_maintenance_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pmc_read" ON public.parking_maintenance_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "pmc_manage" ON public.parking_maintenance_checks FOR ALL TO authenticated
  USING (public.can_manage_security(auth.uid()))
  WITH CHECK (public.can_manage_security(auth.uid()));
CREATE TRIGGER trg_pmc_updated BEFORE UPDATE ON public.parking_maintenance_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.parking_cleaning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_date DATE NOT NULL DEFAULT CURRENT_DATE,
  responsible TEXT,
  notes TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_cleaning_logs TO authenticated;
GRANT ALL ON public.parking_cleaning_logs TO service_role;
ALTER TABLE public.parking_cleaning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcl_read" ON public.parking_cleaning_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "pcl_manage" ON public.parking_cleaning_logs FOR ALL TO authenticated
  USING (public.can_manage_security(auth.uid()))
  WITH CHECK (public.can_manage_security(auth.uid()));
CREATE TRIGGER trg_pcl_updated BEFORE UPDATE ON public.parking_cleaning_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.parking_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  spot_id UUID REFERENCES public.parking_spots(id) ON DELETE SET NULL,
  violation_type TEXT NOT NULL,
  description TEXT,
  status public.parking_violation_status NOT NULL DEFAULT 'مفتوحة',
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  resolved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_violations TO authenticated;
GRANT ALL ON public.parking_violations TO service_role;
ALTER TABLE public.parking_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_read" ON public.parking_violations FOR SELECT TO authenticated USING (true);
CREATE POLICY "pv_manage" ON public.parking_violations FOR ALL TO authenticated
  USING (public.can_manage_security(auth.uid()))
  WITH CHECK (public.can_manage_security(auth.uid()));
CREATE TRIGGER trg_pv_updated BEFORE UPDATE ON public.parking_violations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: 30 spots per floor
DO $$
DECLARE f TEXT; i INT; t public.parking_spot_type;
BEGIN
  FOREACH f IN ARRAY ARRAY['P1','P2','P3'] LOOP
    FOR i IN 1..30 LOOP
      t := CASE
        WHEN i <= 3 THEN 'VIP'::public.parking_spot_type
        WHEN i = 4 THEN 'ذوي احتياجات'::public.parking_spot_type
        ELSE 'عادي'::public.parking_spot_type
      END;
      INSERT INTO public.parking_spots (spot_number, floor, location_description, spot_type)
      VALUES (lpad(i::text,3,'0'), f, f || ' - الصف ' || ceil(i/10.0)::int, t);
    END LOOP;
  END LOOP;
END $$;
