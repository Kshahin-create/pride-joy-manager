
-- Contract type enum
CREATE TYPE public.contract_type AS ENUM (
  'عقد إيجار مكتب',
  'عقد إيجار عدة مكاتب',
  'عقد حجز',
  'عقد تجديد',
  'ملحق عقد'
);

-- Extend contract_status
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'مسودة';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'قيد المراجعة';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'بانتظار المستندات';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'بانتظار الاعتماد';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'موقوف';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'متعثر';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'تحت التجديد';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'مخلى';

-- Extend contract_attachment_type
ALTER TYPE public.contract_attachment_type ADD VALUE IF NOT EXISTS 'التفويض';
ALTER TYPE public.contract_attachment_type ADD VALUE IF NOT EXISTS 'السندات';
ALTER TYPE public.contract_attachment_type ADD VALUE IF NOT EXISTS 'الشيكات';
ALTER TYPE public.contract_attachment_type ADD VALUE IF NOT EXISTS 'الفواتير';
ALTER TYPE public.contract_attachment_type ADD VALUE IF NOT EXISTS 'الملاحق';

-- New columns on contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contract_type public.contract_type NOT NULL DEFAULT 'عقد إيجار مكتب',
  ADD COLUMN IF NOT EXISTS contract_name text,
  ADD COLUMN IF NOT EXISTS lessor_name text,
  ADD COLUMN IF NOT EXISTS lessor_cr text,
  ADD COLUMN IF NOT EXISTS lessor_id_number text,
  ADD COLUMN IF NOT EXISTS alert_thresholds_days integer[] NOT NULL DEFAULT ARRAY[90, 30]::integer[],
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notice_period_days integer,
  ADD COLUMN IF NOT EXISTS annual_increase_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS evacuation_date date;

-- Update daily-notifications fn to use per-contract thresholds
CREATE OR REPLACE FUNCTION public.generate_daily_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD; v_days INT; v_pending NUMERIC; v_t INT;
BEGIN
  -- contracts expiring: per-contract thresholds
  FOR r IN SELECT id, contract_number, end_date, alert_thresholds_days
           FROM public.contracts
           WHERE status='ساري'
             AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '365 days'
  LOOP
    v_days := (r.end_date - CURRENT_DATE);
    FOREACH v_t IN ARRAY COALESCE(r.alert_thresholds_days, ARRAY[90,30]::int[])
    LOOP
      IF v_days = v_t THEN
        PERFORM public.notify(
          'عقد على وشك الانتهاء',
          'العقد ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
          'contract_expiring','super_admin',
          '/contracts/' || r.id::text,'contracts',r.id,
          'contract_exp:' || r.id::text || ':' || v_t::text
        );
      END IF;
    END LOOP;
  END LOOP;

  FOR r IN SELECT id, invoice_number FROM public.invoices WHERE status='متأخر'
  LOOP
    PERFORM public.notify(
      'فاتورة متأخرة',
      'الفاتورة ' || COALESCE(r.invoice_number,'') || ' تجاوزت تاريخ الاستحقاق',
      'invoice_overdue','accountant',
      '/finance','invoices',r.id,
      'invoice_overdue:' || r.id::text
    );
  END LOOP;

  FOR r IN SELECT id, title, expiry_date FROM public.documents
           WHERE expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  LOOP
    PERFORM public.notify(
      'شهادة تنتهي قريبًا',
      'المستند "' || r.title || '" ينتهي بتاريخ ' || r.expiry_date::text,
      'document_expiring','super_admin',
      '/documents','documents',r.id,
      'doc_exp:' || r.id::text
    );
  END LOOP;

  FOR r IN SELECT id, training_type, expiry_date FROM public.guard_trainings
           WHERE expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  LOOP
    PERFORM public.notify(
      'تدريب حارس على وشك الانتهاء',
      'التدريب "' || r.training_type || '" ينتهي بتاريخ ' || r.expiry_date::text,
      'training_expiring','security_supervisor',
      '/security','guard_trainings',r.id,
      'train_exp:' || r.id::text
    );
  END LOOP;

  FOR r IN SELECT id, request_number FROM public.maintenance_requests
           WHERE status <> 'مغلق' AND is_overdue = true
  LOOP
    PERFORM public.notify(
      'أمر عمل متأخر',
      'أمر العمل ' || COALESCE(r.request_number,'') || ' تجاوز مهلة الإنجاز',
      'work_order_overdue','maintenance_supervisor',
      '/maintenance','maintenance_requests',r.id,
      'wo_overdue_daily:' || r.id::text || ':' || to_char(CURRENT_DATE,'YYYYMMDD')
    );
  END LOOP;

  FOR r IN SELECT id, plan_name FROM public.pm_plans
           WHERE is_active = true AND next_due_at <= now() + INTERVAL '1 day'
  LOOP
    PERFORM public.notify(
      'خطة صيانة وقائية مستحقة',
      'الخطة "' || r.plan_name || '" مستحقة اليوم',
      'work_order_overdue','maintenance_supervisor',
      '/pm-plans','pm_plans',r.id,
      'pm_due:' || r.id::text || ':' || to_char(CURRENT_DATE,'YYYYMMDD')
    );
  END LOOP;

  SELECT COALESCE(SUM(amount),0) INTO v_pending FROM public.expenses WHERE status = 'معلّق';
  IF v_pending > 0 THEN
    PERFORM public.notify(
      'مصروفات بانتظار الاعتماد',
      'يوجد مصروفات بانتظار اعتمادك بإجمالي ' || to_char(v_pending,'FM999,999,990.00'),
      'invoice_overdue','accountant',
      '/expenses','expenses',NULL,
      'exp_pending:' || to_char(CURRENT_DATE,'YYYYMMDD')
    );
  END IF;

  FOR r IN SELECT id, full_name, visitor_number FROM public.visitors
           WHERE status = 'داخل' AND check_in_at < now() - INTERVAL '12 hours'
  LOOP
    PERFORM public.notify(
      'زائر لم يسجّل خروجه',
      'الزائر ' || r.full_name || ' (' || COALESCE(r.visitor_number,'') || ') داخل البرج منذ أكثر من 12 ساعة',
      'training_expiring','security_supervisor',
      '/visitors','visitors',r.id,
      'visitor_stale:' || r.id::text
    );
  END LOOP;
END $function$;
