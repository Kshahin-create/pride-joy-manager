
-- نوع حالة المكتب
CREATE TYPE public.office_status AS ENUM (
  'متاح',
  'محجوز',
  'مؤجر',
  'تحت الصيانة',
  'غير متاح'
);

-- جدول المكاتب
CREATE TABLE public.offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  office_number TEXT NOT NULL,
  floor SMALLINT NOT NULL CHECK (floor BETWEEN 1 AND 9),
  area_sqm NUMERIC(8,2),
  parking_count SMALLINT NOT NULL DEFAULT 0 CHECK (parking_count >= 0),
  view_type TEXT,
  status public.office_status NOT NULL DEFAULT 'متاح',
  management_entity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (floor, office_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offices TO authenticated;
GRANT ALL ON public.offices TO service_role;

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- قراءة لكل المستخدمين المصادق عليهم
CREATE POLICY "قراءة المكاتب لكل المصادقين" ON public.offices
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- المدير العام فقط يضيف
CREATE POLICY "المدير العام يضيف مكاتب" ON public.offices
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- المدير العام فقط يعدّل
CREATE POLICY "المدير العام يعدّل مكاتب" ON public.offices
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- المدير العام فقط يحذف
CREATE POLICY "المدير العام يحذف مكاتب" ON public.offices
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- مشغل updated_at
CREATE TRIGGER trg_offices_updated_at BEFORE UPDATE ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- دالة تسجيل الأحداث في سجل البرج
CREATE OR REPLACE FUNCTION public.log_office_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES (
      'office.created',
      'offices',
      NEW.id,
      'تم إنشاء مكتب جديد: ' || NEW.code,
      jsonb_build_object('code', NEW.code, 'floor', NEW.floor, 'status', NEW.status),
      v_actor,
      v_actor
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
      VALUES (
        'office.status_changed',
        'offices',
        NEW.id,
        'تغيّرت حالة المكتب ' || NEW.code || ' من "' || OLD.status || '" إلى "' || NEW.status || '"',
        jsonb_build_object('code', NEW.code, 'from', OLD.status, 'to', NEW.status),
        v_actor,
        v_actor
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES (
      'office.deleted',
      'offices',
      OLD.id,
      'تم حذف المكتب: ' || OLD.code,
      jsonb_build_object('code', OLD.code, 'floor', OLD.floor),
      v_actor,
      v_actor
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_office_event() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_offices_log
  AFTER INSERT OR UPDATE OR DELETE ON public.offices
  FOR EACH ROW EXECUTE FUNCTION public.log_office_event();

-- زرع 54 مكتب (9 أدوار × 6 مكاتب) بحالات موزّعة
INSERT INTO public.offices (code, office_number, floor, area_sqm, parking_count, view_type, status, management_entity)
SELECT
  'F' || f || '-' || lpad(n::text, 2, '0') AS code,
  lpad(n::text, 2, '0') AS office_number,
  f AS floor,
  CASE n
    WHEN 1 THEN 45.0
    WHEN 2 THEN 60.5
    WHEN 3 THEN 75.0
    WHEN 4 THEN 75.0
    WHEN 5 THEN 60.5
    WHEN 6 THEN 90.0
  END AS area_sqm,
  CASE WHEN n IN (3,4,6) THEN 2 ELSE 1 END AS parking_count,
  CASE
    WHEN n IN (1,2) THEN 'إطلالة جانبية'
    WHEN n IN (3,4) THEN 'إطلالة بحرية'
    WHEN n IN (5,6) THEN 'إطلالة مدينة'
  END AS view_type,
  -- توزيع واقعي: غالباً مؤجر، بعض متاح/محجوز، قليل صيانة/غير متاح
  (CASE ((f * 7 + n * 3) % 10)
    WHEN 0 THEN 'متاح'
    WHEN 1 THEN 'متاح'
    WHEN 2 THEN 'محجوز'
    WHEN 3 THEN 'مؤجر'
    WHEN 4 THEN 'مؤجر'
    WHEN 5 THEN 'مؤجر'
    WHEN 6 THEN 'مؤجر'
    WHEN 7 THEN 'مؤجر'
    WHEN 8 THEN 'تحت الصيانة'
    WHEN 9 THEN 'غير متاح'
  END)::public.office_status AS status,
  'إدارة البرج' AS management_entity
FROM generate_series(1, 9) AS f
CROSS JOIN generate_series(1, 6) AS n;
