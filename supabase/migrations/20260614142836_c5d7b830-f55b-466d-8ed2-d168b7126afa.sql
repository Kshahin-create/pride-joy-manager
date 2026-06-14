
-- ============================================================
-- Multi-Property Support — Phase 1
-- ============================================================

-- 1) properties table
CREATE TYPE public.property_type AS ENUM (
  'برج','مجمع تجاري','مركز تجاري','مدينة صناعية','مجمع إداري','مجمع سكني','عقار آخر'
);

CREATE TYPE public.property_status AS ENUM ('نشط','غير نشط','أرشيف');

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  property_type public.property_type NOT NULL DEFAULT 'برج',
  status public.property_status NOT NULL DEFAULT 'نشط',
  owner_name TEXT,
  management_company TEXT,
  management_start_date DATE,
  city TEXT,
  country TEXT DEFAULT 'السعودية',
  address TEXT,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  total_floors INT,
  total_area NUMERIC(12,2),
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  cr_number TEXT,
  vat_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- We define user_properties + helper first, then policies that depend on them.

-- 2) user_properties
CREATE TABLE public.user_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_properties TO authenticated;
GRANT ALL ON public.user_properties TO service_role;

ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;

-- 3) helper function
CREATE OR REPLACE FUNCTION public.user_has_property(_user_id UUID, _property_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id,'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_properties
      WHERE user_id = _user_id AND property_id = _property_id
    )
$$;

-- 4) RLS on properties
CREATE POLICY "view assigned properties" ON public.properties
  FOR SELECT TO authenticated
  USING (public.user_has_property(auth.uid(), id));

CREATE POLICY "super admin manages properties" ON public.properties
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- 5) RLS on user_properties
CREATE POLICY "view own property assignments" ON public.user_properties
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "super admin manages user_properties" ON public.user_properties
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- updated_at trigger
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Seed default property from building_identity (if any)
DO $$
DECLARE
  v_id UUID;
  v_bi public.building_identity%ROWTYPE;
BEGIN
  SELECT * INTO v_bi FROM public.building_identity LIMIT 1;

  INSERT INTO public.properties (name, code, property_type, owner_name, address, city, country, phone, email, website, logo_url, total_floors, cr_number, vat_number, notes)
  VALUES (
    COALESCE(v_bi.building_name, 'العقار الافتراضي'),
    'DEFAULT',
    'برج',
    v_bi.owner_name,
    v_bi.address,
    v_bi.city,
    COALESCE(v_bi.country, 'السعودية'),
    v_bi.phone,
    v_bi.email,
    v_bi.website,
    v_bi.logo_url,
    v_bi.total_floors,
    v_bi.cr_number,
    v_bi.vat_number,
    'تم إنشاؤه تلقائياً عند تفعيل دعم عدة عقارات'
  )
  RETURNING id INTO v_id;

  -- Assign all existing users to the default property
  INSERT INTO public.user_properties (user_id, property_id, is_default)
  SELECT u.id, v_id, TRUE FROM auth.users u
  ON CONFLICT DO NOTHING;

  -- Store default id in a temp config row to be used below
  CREATE TEMP TABLE _tmp_default_property AS SELECT v_id AS id;
END $$;

-- 7) Add property_id to all core tables, backfill, and lock NOT NULL
DO $$
DECLARE
  v_default UUID;
  t TEXT;
  tables TEXT[] := ARRAY[
    'offices','spaces','parking_spots',
    'contracts','cleaning_contracts','companies',
    'assets','cameras','ac_units','electricity_meters','network_points',
    'maintenance_requests','pm_plans','tickets','inspections','inspection_templates',
    'invoices','payments','expenses','vendor_payments',
    'guards','patrols','security_incidents','visitors','patrol_checkpoints',
    'documents','building_log','cleaning_plans','vendor_contracts'
  ];
BEGIN
  SELECT id INTO v_default FROM _tmp_default_property;

  FOREACH t IN ARRAY tables LOOP
    -- only if the table actually exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT', t);
      EXECUTE format('UPDATE public.%I SET property_id = %L WHERE property_id IS NULL', t, v_default);
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN property_id SET NOT NULL', t);
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN property_id SET DEFAULT %L', t, v_default);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(property_id)', 'idx_'||t||'_property', t);
    END IF;
  END LOOP;
END $$;

-- 8) Helper: get current user's default property
CREATE OR REPLACE FUNCTION public.get_user_default_property(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT property_id FROM public.user_properties
  WHERE user_id = _user_id
  ORDER BY is_default DESC, created_at ASC
  LIMIT 1
$$;

-- 9) Auto-assign new users to default property
CREATE OR REPLACE FUNCTION public.assign_new_user_to_default_property()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM public.properties WHERE code = 'DEFAULT' LIMIT 1;
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.properties ORDER BY created_at LIMIT 1;
  END IF;
  IF v_id IS NOT NULL THEN
    INSERT INTO public.user_properties (user_id, property_id, is_default)
    VALUES (NEW.id, v_id, TRUE)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assign_user_property ON auth.users;
CREATE TRIGGER trg_assign_user_property
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_new_user_to_default_property();
