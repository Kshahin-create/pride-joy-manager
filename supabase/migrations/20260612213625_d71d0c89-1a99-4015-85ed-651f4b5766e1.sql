
DO $$ BEGIN
  CREATE TYPE public.space_type AS ENUM (
    'مكتب','موقف سيارة','لوبي','مكتب مدير البرج','غرفة كاميرات','مخزن',
    'دورة مياه','ممر','مصعد','سلم','غرفة كهرباء','سطح','أخرى'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.space_status AS ENUM ('نشط','تحت الصيانة','مغلق');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_code TEXT NOT NULL UNIQUE,
  space_name TEXT NOT NULL,
  space_type public.space_type NOT NULL,
  floor SMALLINT,
  area_sqm NUMERIC(10,2),
  status public.space_status NOT NULL DEFAULT 'نشط',
  parent_space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spaces_type ON public.spaces(space_type);
CREATE INDEX IF NOT EXISTS idx_spaces_floor ON public.spaces(floor);
CREATE INDEX IF NOT EXISTS idx_spaces_parent ON public.spaces(parent_space_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spaces TO authenticated;
GRANT ALL ON public.spaces TO service_role;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS spaces_read ON public.spaces;
CREATE POLICY spaces_read ON public.spaces FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS spaces_admin_write ON public.spaces;
CREATE POLICY spaces_admin_write ON public.spaces FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

DROP TRIGGER IF EXISTS trg_spaces_updated_at ON public.spaces;
CREATE TRIGGER trg_spaces_updated_at BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.offices ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;
ALTER TABLE public.parking_spots ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;
ALTER TABLE public.cleaning_logs ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;
ALTER TABLE public.security_incidents ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_space ON public.assets(space_id);
CREATE INDEX IF NOT EXISTS idx_tickets_space ON public.tickets(space_id);
CREATE INDEX IF NOT EXISTS idx_mr_space ON public.maintenance_requests(space_id);

INSERT INTO public.spaces (space_code, space_name, space_type, floor, area_sqm, status)
SELECT
  'SPC-OFC-' || o.code,
  'مكتب ' || COALESCE(o.office_number, o.code),
  'مكتب'::public.space_type,
  o.floor,
  o.area_sqm,
  CASE WHEN o.status::text = 'تحت الصيانة' THEN 'تحت الصيانة'::public.space_status
       WHEN o.status::text = 'غير متاح'    THEN 'مغلق'::public.space_status
       ELSE 'نشط'::public.space_status END
FROM public.offices o
WHERE o.space_id IS NULL
ON CONFLICT (space_code) DO NOTHING;

UPDATE public.offices o
SET space_id = s.id
FROM public.spaces s
WHERE o.space_id IS NULL AND s.space_code = 'SPC-OFC-' || o.code;

INSERT INTO public.spaces (space_code, space_name, space_type, floor, status)
SELECT
  'SPC-PRK-' || p.spot_number,
  'موقف ' || p.spot_number,
  'موقف سيارة'::public.space_type,
  NULLIF(regexp_replace(COALESCE(p.floor::text,''), '\D', '', 'g'), '')::smallint,
  'نشط'::public.space_status
FROM public.parking_spots p
WHERE p.space_id IS NULL
ON CONFLICT (space_code) DO NOTHING;

UPDATE public.parking_spots p
SET space_id = s.id
FROM public.spaces s
WHERE p.space_id IS NULL AND s.space_code = 'SPC-PRK-' || p.spot_number;

INSERT INTO public.spaces (space_code, space_name, space_type, floor, status) VALUES
  ('SPC-LOBBY',       'اللوبي الرئيسي',         'لوبي',              0, 'نشط'),
  ('SPC-MGR-OFFICE',  'مكتب مدير البرج',        'مكتب مدير البرج',   0, 'نشط'),
  ('SPC-CAM-ROOM',    'غرفة الكاميرات',         'غرفة كاميرات',      0, 'نشط'),
  ('SPC-STORAGE',     'المخزن الرئيسي',         'مخزن',              0, 'نشط'),
  ('SPC-ROOF',        'السطح',                  'سطح',              99, 'نشط'),
  ('SPC-ELEVATORS',   'المصاعد',                'مصعد',              0, 'نشط'),
  ('SPC-STAIRS',      'السلالم',                'سلم',               0, 'نشط'),
  ('SPC-ELEC-ROOM',   'غرفة الكهرباء الرئيسية', 'غرفة كهرباء',       0, 'نشط')
ON CONFLICT (space_code) DO NOTHING;

UPDATE public.assets a SET space_id = s.id
FROM public.spaces s
WHERE a.space_id IS NULL AND s.space_code = 'SPC-ELEVATORS'
  AND (a.asset_name ILIKE '%مصعد%' OR a.asset_name ILIKE '%elevator%' OR a.asset_name ILIKE '%lift%');

UPDATE public.assets a SET space_id = s.id
FROM public.spaces s
WHERE a.space_id IS NULL AND s.space_code = 'SPC-ELEC-ROOM'
  AND (a.asset_name ILIKE '%كهرب%' OR a.asset_name ILIKE '%لوحة%' OR a.asset_name ILIKE '%محول%' OR a.asset_name ILIKE '%مولد%');

UPDATE public.assets a SET space_id = s.id
FROM public.spaces s
WHERE a.space_id IS NULL AND s.space_code = 'SPC-CAM-ROOM'
  AND (a.asset_name ILIKE '%كامير%' OR a.asset_name ILIKE '%DVR%' OR a.asset_name ILIKE '%NVR%');

UPDATE public.assets a SET space_id = s.id
FROM public.spaces s
WHERE a.space_id IS NULL AND s.space_code = 'SPC-ROOF'
  AND (a.asset_name ILIKE '%خزان%' OR a.asset_name ILIKE '%مضخ%' OR a.asset_name ILIKE '%تكييف%' OR a.asset_name ILIKE '%مكيف%');

UPDATE public.assets a SET space_id = s.id
FROM public.spaces s
WHERE a.space_id IS NULL AND s.space_code = 'SPC-LOBBY';

CREATE OR REPLACE FUNCTION public.log_space_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('حدث يدوي','spaces',NEW.id,
      'تمت إضافة مساحة جديدة: ' || NEW.space_name || ' (' || NEW.space_code || ')',
      jsonb_build_object('code',NEW.space_code,'type',NEW.space_type,'floor',NEW.floor),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('حدث يدوي','spaces',NEW.id,
      'تغيّرت حالة المساحة ' || NEW.space_name || ' من "' || OLD.status || '" إلى "' || NEW.status || '"',
      jsonb_build_object('code',NEW.space_code,'from',OLD.status,'to',NEW.status),
      v_actor, v_actor);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_space_event ON public.spaces;
CREATE TRIGGER trg_log_space_event AFTER INSERT OR UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.log_space_event();

DROP POLICY IF EXISTS "Auth read contracts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Scoped read contracts bucket" ON storage.objects;
CREATE POLICY "Scoped read contracts bucket"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'accountant')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'receptionist')
  )
);
