
ALTER TABLE public.offices DROP CONSTRAINT IF EXISTS offices_floor_check;
ALTER TABLE public.offices ADD CONSTRAINT offices_floor_check
  CHECK ((floor >= 1 AND floor <= 9) OR floor = 99);

ALTER TABLE public.parking_spots DROP CONSTRAINT IF EXISTS parking_spots_floor_check;
ALTER TABLE public.parking_spots ADD CONSTRAINT parking_spots_floor_check
  CHECK (floor = ANY (ARRAY['P1','P2','P3','P4','P5','P6','P7','P8','P9']));

CREATE TABLE IF NOT EXISTS public.asset_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_types TO authenticated;
GRANT ALL ON public.asset_types TO service_role;
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS asset_types_read ON public.asset_types;
CREATE POLICY asset_types_read ON public.asset_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS asset_types_manage ON public.asset_types;
CREATE POLICY asset_types_manage ON public.asset_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));

INSERT INTO public.asset_types(name) VALUES
  ('مكيف'),('مصعد'),('مضخة'),('كاميرا'),('لوحة كهرباء'),('نظام إنذار حريق'),
  ('خزان مياه'),('مولد كهرباء'),('جهاز شبكة'),('باب أوتوماتيكي')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS asset_type TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS photo_urls TEXT[] NOT NULL DEFAULT '{}'::text[];

CREATE SEQUENCE IF NOT EXISTS public.asset_code_seq;
CREATE OR REPLACE FUNCTION public.set_asset_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.asset_code IS NULL OR length(trim(NEW.asset_code)) = 0 THEN
    NEW.asset_code := 'AST-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.asset_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_set_asset_code ON public.assets;
CREATE TRIGGER trg_set_asset_code BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_asset_code();

DROP POLICY IF EXISTS "asset_photos_read_auth" ON storage.objects;
CREATE POLICY "asset_photos_read_auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'asset-photos');
DROP POLICY IF EXISTS "asset_photos_write_managers" ON storage.objects;
CREATE POLICY "asset_photos_write_managers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor')));
DROP POLICY IF EXISTS "asset_photos_delete_managers" ON storage.objects;
CREATE POLICY "asset_photos_delete_managers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'asset-photos' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor')));
