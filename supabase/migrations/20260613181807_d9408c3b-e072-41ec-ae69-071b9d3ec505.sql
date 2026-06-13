
-- 1) Extend status enum (new values are additive — old ones remain)
ALTER TYPE public.maintenance_request_status ADD VALUE IF NOT EXISTS 'معلّق للتعيين';
ALTER TYPE public.maintenance_request_status ADD VALUE IF NOT EXISTS 'معلّق';
ALTER TYPE public.maintenance_request_status ADD VALUE IF NOT EXISTS 'مكتمل مبدئياً';

-- 2) Request source enum
DO $$ BEGIN
  CREATE TYPE public.wo_request_source AS ENUM ('مستأجر','صيانة وقائية','جولة تفتيش','حادث أمني','إدارة');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) New columns
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS request_source public.wo_request_source,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS hold_reason text,
  ADD COLUMN IF NOT EXISTS materials_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS labor_hours numeric,
  ADD COLUMN IF NOT EXISTS assigned_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 4) Trigger: stamp lifecycle transitions
CREATE OR REPLACE FUNCTION public.stamp_wo_transitions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'جاري التنفيذ' AND (OLD.status IS DISTINCT FROM 'جاري التنفيذ') AND NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  IF NEW.status = 'مكتمل مبدئياً' AND (OLD.status IS DISTINCT FROM 'مكتمل مبدئياً') AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_stamp_wo_transitions ON public.maintenance_requests;
CREATE TRIGGER trg_stamp_wo_transitions
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.stamp_wo_transitions();

-- 5) Stamp approver on final close
CREATE OR REPLACE FUNCTION public.stamp_mr_closure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'مغلق' AND (OLD.status IS DISTINCT FROM 'مغلق') THEN
    NEW.closed_at := now();
    NEW.closed_by := auth.uid();
    NEW.approved_by := COALESCE(NEW.approved_by, auth.uid());
    NEW.approved_at := COALESCE(NEW.approved_at, now());
  END IF;
  RETURN NEW;
END $$;

-- 6) Closure validation: must come from "مكتمل مبدئياً" (super_admin bypass)
CREATE OR REPLACE FUNCTION public.validate_wo_closure()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NEW.status = 'مغلق' AND (OLD.status IS DISTINCT FROM 'مغلق') THEN
    -- Enforce flow: only from مكتمل مبدئياً (super_admin can bypass)
    IF OLD.status <> 'مكتمل مبدئياً' AND NOT public.has_role(auth.uid(),'super_admin') THEN
      RAISE EXCEPTION 'يجب أن يصل أمر العمل إلى حالة "مكتمل مبدئياً" قبل الاعتماد والإغلاق';
    END IF;
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
  -- Hold reason required when status = معلّق
  IF NEW.status = 'معلّق' AND (NEW.hold_reason IS NULL OR length(trim(NEW.hold_reason)) = 0) THEN
    RAISE EXCEPTION 'سبب التعليق مطلوب عند تعليق أمر العمل';
  END IF;
  RETURN NEW;
END $$;
