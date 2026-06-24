
-- Enums
DO $$ BEGIN
  CREATE TYPE public.asset_location_type AS ENUM ('مكتب','مرفق مشترك','البرج');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.warranty_status AS ENUM ('ساري','على وشك الانتهاء','منتهي','لا يوجد ضمان','غير معروف');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.asset_current_status AS ENUM ('يعمل','يعمل مع ملاحظات','يحتاج صيانة','تحت الصيانة','معطل','مستبدل','خارج الخدمة');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.asset_maintenance_frequency AS ENUM ('شهري','كل 3 أشهر','كل 6 أشهر','سنوي','مدة مخصصة');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_type public.asset_location_type,
  ADD COLUMN IF NOT EXISTS capacity text,
  ADD COLUMN IF NOT EXISTS maintenance_company text,
  ADD COLUMN IF NOT EXISTS maintenance_company_phone text,
  ADD COLUMN IF NOT EXISTS warranty_start_date date,
  ADD COLUMN IF NOT EXISTS warranty_status public.warranty_status,
  ADD COLUMN IF NOT EXISTS current_status public.asset_current_status NOT NULL DEFAULT 'يعمل',
  ADD COLUMN IF NOT EXISTS maintenance_frequency public.asset_maintenance_frequency,
  ADD COLUMN IF NOT EXISTS custom_frequency_days integer,
  ADD COLUMN IF NOT EXISTS last_maintenance_date date,
  ADD COLUMN IF NOT EXISTS next_maintenance_date date;

CREATE INDEX IF NOT EXISTS idx_assets_office ON public.assets(office_id);

-- Attachments
CREATE TABLE IF NOT EXISTS public.asset_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  attachment_name text,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_attachments TO authenticated;
GRANT ALL ON public.asset_attachments TO service_role;
ALTER TABLE public.asset_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asset_attachments_read_auth" ON public.asset_attachments;
CREATE POLICY "asset_attachments_read_auth" ON public.asset_attachments
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "asset_attachments_manage_admins" ON public.asset_attachments;
CREATE POLICY "asset_attachments_manage_admins" ON public.asset_attachments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'maintenance_supervisor'));
CREATE INDEX IF NOT EXISTS idx_asset_attachments_asset ON public.asset_attachments(asset_id);

-- Asset events trigger -> building_log
CREATE OR REPLACE FUNCTION public.log_asset_event() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('asset.created','assets',NEW.id,
      'تم إنشاء أصل: ' || NEW.asset_name || ' (' || NEW.asset_code || ')',
      jsonb_build_object('code',NEW.asset_code,'type',NEW.asset_type,'office_id',NEW.office_id),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.current_status IS DISTINCT FROM OLD.current_status THEN
      INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
      VALUES ('asset.status_changed','assets',NEW.id,
        'تغيّرت حالة الأصل ' || NEW.asset_name || ' من "' || COALESCE(OLD.current_status::text,'—') || '" إلى "' || NEW.current_status::text || '"',
        jsonb_build_object('from',OLD.current_status,'to',NEW.current_status), v_actor, v_actor);
    END IF;
    IF NEW.last_maintenance_date IS DISTINCT FROM OLD.last_maintenance_date AND NEW.last_maintenance_date IS NOT NULL THEN
      INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
      VALUES ('asset.maintenance_logged','assets',NEW.id,
        'تم تسجيل صيانة للأصل ' || NEW.asset_name || ' بتاريخ ' || NEW.last_maintenance_date::text,
        jsonb_build_object('date',NEW.last_maintenance_date), v_actor, v_actor);
    END IF;
    IF NEW.warranty_end_date IS DISTINCT FROM OLD.warranty_end_date AND NEW.warranty_end_date IS NOT NULL AND NEW.warranty_end_date < CURRENT_DATE THEN
      INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
      VALUES ('asset.warranty_expired','assets',NEW.id,
        'انتهى ضمان الأصل ' || NEW.asset_name,
        jsonb_build_object('warranty_end',NEW.warranty_end_date), v_actor, v_actor);
    END IF;
  END IF;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_log_asset_event ON public.assets;
CREATE TRIGGER trg_log_asset_event
  AFTER INSERT OR UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.log_asset_event();
