
-- 1) Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE public.work_order_type AS ENUM ('تصحيحي','وقائي','طارئ');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wo_priority AS ENUM ('طارئة','عالية','متوسطة','منخفضة');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pm_frequency AS ENUM ('أسبوعي','شهري','ربع سنوي','نصف سنوي','سنوي');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend notification_type if missing
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'work_order_overdue';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'pm_due';
EXCEPTION WHEN others THEN NULL; END $$;

-- Extend building_log event_type
DO $$ BEGIN
  ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'صيانة وقائية';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'تجاوز مهلة';
EXCEPTION WHEN others THEN NULL; END $$;

-- 2) Extend maintenance_requests
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS work_order_type public.work_order_type NOT NULL DEFAULT 'تصحيحي',
  ADD COLUMN IF NOT EXISTS priority public.wo_priority NOT NULL DEFAULT 'متوسطة',
  ADD COLUMN IF NOT EXISTS sla_response_hours INTEGER,
  ADD COLUMN IF NOT EXISTS sla_completion_hours INTEGER,
  ADD COLUMN IF NOT EXISTS response_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parts_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pm_plan_id UUID;

CREATE INDEX IF NOT EXISTS idx_mr_overdue ON public.maintenance_requests(is_overdue) WHERE is_overdue = true;
CREATE INDEX IF NOT EXISTS idx_mr_priority ON public.maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_mr_wo_type ON public.maintenance_requests(work_order_type);

-- 3) SLA defaults function
CREATE OR REPLACE FUNCTION public.apply_wo_sla_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE v_resp INT; v_comp INT;
BEGIN
  IF NEW.sla_response_hours IS NULL OR NEW.sla_completion_hours IS NULL THEN
    CASE NEW.priority
      WHEN 'طارئة' THEN v_resp := 1;  v_comp := 8;
      WHEN 'عالية' THEN v_resp := 4;  v_comp := 24;
      WHEN 'متوسطة' THEN v_resp := 8;  v_comp := 72;
      ELSE             v_resp := 24; v_comp := 168;
    END CASE;
    NEW.sla_response_hours   := COALESCE(NEW.sla_response_hours, v_resp);
    NEW.sla_completion_hours := COALESCE(NEW.sla_completion_hours, v_comp);
  END IF;
  IF NEW.response_due_at IS NULL THEN
    NEW.response_due_at := COALESCE(NEW.created_at, now()) + (NEW.sla_response_hours || ' hours')::interval;
  END IF;
  IF NEW.completion_due_at IS NULL THEN
    NEW.completion_due_at := COALESCE(NEW.created_at, now()) + (NEW.sla_completion_hours || ' hours')::interval;
  END IF;
  -- Total cost mirror into 'cost' column for backward compatibility
  NEW.cost := COALESCE(NEW.parts_cost,0) + COALESCE(NEW.labor_cost,0);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_wo_sla_defaults_ins ON public.maintenance_requests;
CREATE TRIGGER trg_wo_sla_defaults_ins
  BEFORE INSERT ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.apply_wo_sla_defaults();

DROP TRIGGER IF EXISTS trg_wo_sla_defaults_upd ON public.maintenance_requests;
CREATE TRIGGER trg_wo_sla_defaults_upd
  BEFORE UPDATE OF priority, parts_cost, labor_cost ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.apply_wo_sla_defaults();

-- 4) Strict closure: cost > 0, after_photo, notes required
CREATE OR REPLACE FUNCTION public.validate_wo_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE v_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NEW.status = 'مغلق' AND (OLD.status IS DISTINCT FROM 'مغلق') THEN
    IF COALESCE(NEW.parts_cost,0) + COALESCE(NEW.labor_cost,0) <= 0 THEN
      v_missing := array_append(v_missing,'التكلفة (قطع غيار أو عمالة)');
    END IF;
    IF NEW.after_photo_url IS NULL OR length(trim(NEW.after_photo_url)) = 0 THEN
      v_missing := array_append(v_missing,'صورة "بعد"');
    END IF;
    IF NEW.notes IS NULL OR length(trim(NEW.notes)) = 0 THEN
      v_missing := array_append(v_missing,'ملاحظات الإنجاز');
    END IF;
    IF array_length(v_missing,1) > 0 THEN
      RAISE EXCEPTION 'لا يمكن إغلاق أمر العمل قبل إدخال: %', array_to_string(v_missing,'، ');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_wo_closure ON public.maintenance_requests;
CREATE TRIGGER trg_validate_wo_closure
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_wo_closure();

-- 5) PM plans table
CREATE TABLE IF NOT EXISTS public.pm_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  frequency public.pm_frequency NOT NULL,
  checklist_items TEXT[] NOT NULL DEFAULT '{}',
  assigned_to TEXT,
  default_priority public.wo_priority NOT NULL DEFAULT 'متوسطة',
  last_executed_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_plans_asset ON public.pm_plans(asset_id);
CREATE INDEX IF NOT EXISTS idx_pm_plans_due ON public.pm_plans(next_due_at) WHERE is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_plans TO authenticated;
GRANT ALL ON public.pm_plans TO service_role;
ALTER TABLE public.pm_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pm_plans_read ON public.pm_plans;
CREATE POLICY pm_plans_read ON public.pm_plans FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS pm_plans_write ON public.pm_plans;
CREATE POLICY pm_plans_write ON public.pm_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'maintenance_supervisor'));

DROP TRIGGER IF EXISTS trg_pm_plans_updated_at ON public.pm_plans;
CREATE TRIGGER trg_pm_plans_updated_at BEFORE UPDATE ON public.pm_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Helper: frequency -> interval
CREATE OR REPLACE FUNCTION public.pm_frequency_interval(_f public.pm_frequency)
RETURNS INTERVAL LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _f
    WHEN 'أسبوعي'    THEN INTERVAL '7 days'
    WHEN 'شهري'      THEN INTERVAL '30 days'
    WHEN 'ربع سنوي'  THEN INTERVAL '90 days'
    WHEN 'نصف سنوي'  THEN INTERVAL '180 days'
    WHEN 'سنوي'      THEN INTERVAL '365 days'
  END
$$;

-- 7) Generate work orders for due PM plans
CREATE OR REPLACE FUNCTION public.generate_due_pm_work_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD; v_count INT := 0; v_id UUID;
BEGIN
  FOR r IN
    SELECT p.*, a.location AS asset_location, a.space_id AS asset_space
    FROM public.pm_plans p
    LEFT JOIN public.assets a ON a.id = p.asset_id
    WHERE p.is_active = true AND p.next_due_at <= now()
  LOOP
    -- skip if an open PM WO already exists for this plan
    IF EXISTS (
      SELECT 1 FROM public.maintenance_requests
      WHERE pm_plan_id = r.id AND status <> 'مغلق'
    ) THEN
      UPDATE public.pm_plans SET next_due_at = now() + public.pm_frequency_interval(r.frequency) WHERE id = r.id;
      CONTINUE;
    END IF;

    INSERT INTO public.maintenance_requests
      (request_date, location, request_type, description, asset_id, space_id, status,
       assigned_technician, work_order_type, priority, pm_plan_id, notes)
    VALUES
      (CURRENT_DATE, r.asset_location, 'صيانة وقائية',
       r.plan_name || COALESCE(' — قائمة: ' || array_to_string(r.checklist_items,' | '), ''),
       r.asset_id, COALESCE(r.space_id, r.asset_space), 'جديد',
       r.assigned_to, 'وقائي', r.default_priority, r.id,
       'تم إنشاؤه تلقائيًا من خطة الصيانة الوقائية')
    RETURNING id INTO v_id;

    UPDATE public.pm_plans
    SET last_executed_at = now(),
        next_due_at = now() + public.pm_frequency_interval(r.frequency)
    WHERE id = r.id;

    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('صيانة وقائية','maintenance_requests', v_id,
      'أُنشئ أمر صيانة وقائية تلقائيًا: ' || r.plan_name,
      jsonb_build_object('pm_plan_id', r.id, 'asset_id', r.asset_id), NULL, NULL);

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION public.generate_due_pm_work_orders() TO authenticated;

-- 8) Recompute overdue + escalate
CREATE OR REPLACE FUNCTION public.recompute_wo_overdue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD; v_count INT := 0;
BEGIN
  FOR r IN
    SELECT id, request_number, completion_due_at, is_overdue
    FROM public.maintenance_requests
    WHERE status <> 'مغلق'
      AND completion_due_at IS NOT NULL
      AND completion_due_at < now()
      AND is_overdue = false
  LOOP
    UPDATE public.maintenance_requests SET is_overdue = true WHERE id = r.id;
    PERFORM public.notify(
      'أمر عمل متأخر',
      'أمر العمل ' || COALESCE(r.request_number,'') || ' تجاوز مهلة الإنجاز',
      'work_order_overdue','maintenance_supervisor',
      '/maintenance','maintenance_requests', r.id,
      'wo_overdue:' || r.id::text
    );
    PERFORM public.notify(
      'أمر عمل متأخر',
      'أمر العمل ' || COALESCE(r.request_number,'') || ' تجاوز مهلة الإنجاز',
      'work_order_overdue','super_admin',
      '/maintenance','maintenance_requests', r.id,
      'wo_overdue_admin:' || r.id::text
    );
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('تجاوز مهلة','maintenance_requests', r.id,
      'تجاوز أمر العمل ' || COALESCE(r.request_number,'') || ' مهلة الإنجاز',
      jsonb_build_object('due', r.completion_due_at), NULL, NULL);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION public.recompute_wo_overdue() TO authenticated;

-- 9) Backfill SLA fields for existing rows so the new system applies retroactively
UPDATE public.maintenance_requests
SET priority = CASE
    WHEN request_type ILIKE '%طارئ%' OR request_type ILIKE '%emergency%' THEN 'طارئة'::wo_priority
    ELSE priority END
WHERE priority = 'متوسطة';

UPDATE public.maintenance_requests m
SET sla_response_hours = CASE priority
      WHEN 'طارئة' THEN 1 WHEN 'عالية' THEN 4 WHEN 'متوسطة' THEN 8 ELSE 24 END,
    sla_completion_hours = CASE priority
      WHEN 'طارئة' THEN 8 WHEN 'عالية' THEN 24 WHEN 'متوسطة' THEN 72 ELSE 168 END
WHERE sla_response_hours IS NULL OR sla_completion_hours IS NULL;

UPDATE public.maintenance_requests
SET response_due_at = created_at + (sla_response_hours || ' hours')::interval,
    completion_due_at = created_at + (sla_completion_hours || ' hours')::interval
WHERE response_due_at IS NULL OR completion_due_at IS NULL;

UPDATE public.maintenance_requests
SET parts_cost = COALESCE(cost,0)
WHERE parts_cost = 0 AND COALESCE(cost,0) > 0;

-- 10) Seed PM plans for critical assets if none exist for them
INSERT INTO public.pm_plans (asset_id, plan_name, frequency, checklist_items, default_priority, next_due_at, notes)
SELECT a.id,
  'صيانة وقائية — ' || a.asset_name,
  CASE
    WHEN a.asset_name ILIKE '%مصعد%' THEN 'شهري'::pm_frequency
    WHEN a.asset_name ILIKE '%حريق%' OR a.asset_name ILIKE '%إنذار%' THEN 'ربع سنوي'::pm_frequency
    WHEN a.asset_name ILIKE '%مضخ%' THEN 'شهري'::pm_frequency
    WHEN a.asset_name ILIKE '%خزان%' THEN 'نصف سنوي'::pm_frequency
    WHEN a.asset_name ILIKE '%لوحة%' OR a.asset_name ILIKE '%كهرب%' THEN 'ربع سنوي'::pm_frequency
    WHEN a.asset_name ILIKE '%مكيف%' OR a.asset_name ILIKE '%تكييف%' THEN 'نصف سنوي'::pm_frequency
    ELSE 'ربع سنوي'::pm_frequency
  END,
  CASE
    WHEN a.asset_name ILIKE '%مصعد%' THEN ARRAY['فحص الكوابل','فحص أنظمة الأمان','تشحيم القضبان','فحص الأزرار والإضاءة']
    WHEN a.asset_name ILIKE '%حريق%' THEN ARRAY['فحص الطفايات','اختبار المرشات','فحص أجهزة الكشف','اختبار صفارة الإنذار']
    WHEN a.asset_name ILIKE '%مضخ%' THEN ARRAY['فحص الضغط','تشحيم المحامل','فحص التسريبات','اختبار الحساسات']
    WHEN a.asset_name ILIKE '%خزان%' THEN ARRAY['تنظيف الخزان','تطهير المياه','فحص العوامات','اختبار الجودة']
    WHEN a.asset_name ILIKE '%لوحة%' OR a.asset_name ILIKE '%كهرب%' THEN ARRAY['شد التوصيلات','فحص القواطع','قياس الجهد','فحص التأريض']
    WHEN a.asset_name ILIKE '%مكيف%' THEN ARRAY['تنظيف الفلاتر','فحص الفريون','تنظيف الكويلات','اختبار الترموستات']
    ELSE ARRAY['فحص بصري عام','اختبار وظيفي','تنظيف','تشحيم']
  END,
  CASE WHEN a.criticality = 'حرج' THEN 'عالية'::wo_priority ELSE 'متوسطة'::wo_priority END,
  now() + INTERVAL '1 day',
  'أُنشئت تلقائيًا — يمكن تخصيصها'
FROM public.assets a
WHERE NOT EXISTS (SELECT 1 FROM public.pm_plans p WHERE p.asset_id = a.id)
  AND (a.criticality = 'حرج'
       OR a.asset_name ILIKE '%مصعد%' OR a.asset_name ILIKE '%حريق%' OR a.asset_name ILIKE '%مضخ%'
       OR a.asset_name ILIKE '%خزان%' OR a.asset_name ILIKE '%لوحة%' OR a.asset_name ILIKE '%مكيف%');

-- 11) pg_cron jobs (idempotent)
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('generate-pm-work-orders');
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.schedule('generate-pm-work-orders','0 6 * * *',
    'SELECT public.generate_due_pm_work_orders();');
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('recompute-wo-overdue');
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.schedule('recompute-wo-overdue','*/30 * * * *',
    'SELECT public.recompute_wo_overdue();');
EXCEPTION WHEN others THEN NULL; END $$;
