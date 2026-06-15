
-- 1) Priority & Category enums
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('critical','high','medium','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM ('financial','maintenance','security','contracts','operations','general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Extend notifications table
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS priority notification_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS category notification_category NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS group_key TEXT,
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_from UUID;

CREATE INDEX IF NOT EXISTS idx_notif_group ON public.notifications(group_key, is_read) WHERE group_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notif_priority ON public.notifications(priority, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_dismissed ON public.notifications(dismissed_at);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);

-- 3) Backfill existing rows with sensible priority/category
UPDATE public.notifications SET priority='high', category='maintenance' WHERE notification_type='work_order_overdue' AND priority='medium';
UPDATE public.notifications SET priority='critical', category='maintenance' WHERE notification_type='asset_critical_failure';
UPDATE public.notifications SET priority='critical', category='security' WHERE notification_type='ticket_emergency';
UPDATE public.notifications SET priority='high', category='financial' WHERE notification_type='invoice_overdue';
UPDATE public.notifications SET category='contracts' WHERE notification_type='contract_expiring';
UPDATE public.notifications SET category='security' WHERE notification_type='training_expiring';
UPDATE public.notifications SET category='maintenance' WHERE notification_type='pm_due';

-- Add group_key for legacy rows
UPDATE public.notifications SET group_key='work_orders_overdue' WHERE notification_type='work_order_overdue' AND group_key IS NULL;
UPDATE public.notifications SET group_key='invoices_overdue' WHERE notification_type='invoice_overdue' AND group_key IS NULL;
UPDATE public.notifications SET group_key='contract_expiring' WHERE notification_type='contract_expiring' AND group_key IS NULL;

-- 4) Enhanced notify function
CREATE OR REPLACE FUNCTION public.notify_v2(
  _title text, _body text, _type notification_type, _role app_role,
  _link text, _entity_type text, _entity_id uuid, _dedupe text,
  _priority notification_priority DEFAULT 'medium',
  _category notification_category DEFAULT 'general',
  _group_key text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.notifications(
    target_role, title, body, notification_type, link, entity_type, entity_id,
    dedupe_key, priority, category, group_key
  ) VALUES (
    _role, _title, _body, _type, _link, _entity_type, _entity_id,
    _dedupe, _priority, _category, _group_key
  )
  ON CONFLICT (dedupe_key) DO NOTHING;
END $$;

-- 5) Replace daily generator with the rich version
CREATE OR REPLACE FUNCTION public.generate_daily_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r RECORD; v_days INT; v_t INT; v_p notification_priority;
BEGIN
  -- General contracts
  FOR r IN SELECT id, contract_number, end_date, alert_thresholds_days
           FROM public.contracts
           WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '365 days'
  LOOP
    v_days := r.end_date - CURRENT_DATE;
    FOREACH v_t IN ARRAY COALESCE(r.alert_thresholds_days, ARRAY[90,30,7]::int[]) LOOP
      IF v_days = v_t THEN
        v_p := CASE WHEN v_t<=7 THEN 'critical'::notification_priority
                    WHEN v_t<=30 THEN 'high'::notification_priority
                    ELSE 'medium'::notification_priority END;
        PERFORM public.notify_v2(
          'عقد على وشك الانتهاء',
          'العقد ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
          'contract_expiring','super_admin',
          '/contracts/' || r.id::text,'contracts',r.id,
          'contract_exp:' || r.id::text || ':' || v_t::text,
          v_p, 'contracts', 'contract_expiring'
        );
      END IF;
    END LOOP;
  END LOOP;

  -- Specialized contracts: same threshold logic
  FOR r IN SELECT id, contract_number, end_date FROM public.cleaning_contracts
           WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' LOOP
    v_days := r.end_date - CURRENT_DATE;
    IF v_days IN (90,30,7,1) THEN
      v_p := CASE WHEN v_days<=7 THEN 'critical' WHEN v_days<=30 THEN 'high' ELSE 'medium' END;
      PERFORM public.notify_v2('عقد نظافة قارب الانتهاء',
        'عقد النظافة ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
        'contract_expiring','super_admin','/cleaning-contracts','cleaning_contracts',r.id,
        'clean_exp:' || r.id::text || ':' || v_days, v_p,'contracts','contract_expiring');
    END IF;
  END LOOP;

  FOR r IN SELECT id, contract_number, end_date FROM public.ac_contracts
           WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' LOOP
    v_days := r.end_date - CURRENT_DATE;
    IF v_days IN (90,30,7,1) THEN
      v_p := CASE WHEN v_days<=7 THEN 'critical' WHEN v_days<=30 THEN 'high' ELSE 'medium' END;
      PERFORM public.notify_v2('عقد تكييف قارب الانتهاء',
        'عقد التكييف ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
        'contract_expiring','super_admin','/ac-contracts','ac_contracts',r.id,
        'ac_exp:' || r.id::text || ':' || v_days, v_p,'contracts','contract_expiring');
    END IF;
  END LOOP;

  FOR r IN SELECT id, contract_number, end_date FROM public.elevator_contracts
           WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' LOOP
    v_days := r.end_date - CURRENT_DATE;
    IF v_days IN (90,30,7,1) THEN
      v_p := CASE WHEN v_days<=7 THEN 'critical' WHEN v_days<=30 THEN 'high' ELSE 'medium' END;
      PERFORM public.notify_v2('عقد مصاعد قارب الانتهاء',
        'عقد المصاعد ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
        'contract_expiring','super_admin','/elevator-contracts','elevator_contracts',r.id,
        'elev_exp:' || r.id::text || ':' || v_days, v_p,'contracts','contract_expiring');
    END IF;
  END LOOP;

  FOR r IN SELECT id, contract_number, end_date FROM public.fire_contracts
           WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' LOOP
    v_days := r.end_date - CURRENT_DATE;
    IF v_days IN (90,30,7,1) THEN
      v_p := CASE WHEN v_days<=7 THEN 'critical' WHEN v_days<=30 THEN 'high' ELSE 'medium' END;
      PERFORM public.notify_v2('عقد أنظمة حريق قارب الانتهاء',
        'عقد أنظمة الحريق ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
        'contract_expiring','super_admin','/fire-contracts','fire_contracts',r.id,
        'fire_exp:' || r.id::text || ':' || v_days, v_p,'contracts','contract_expiring');
    END IF;
  END LOOP;

  FOR r IN SELECT id, contract_number, end_date FROM public.supply_contracts
           WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' LOOP
    v_days := r.end_date - CURRENT_DATE;
    IF v_days IN (90,30,7,1) THEN
      v_p := CASE WHEN v_days<=7 THEN 'critical' WHEN v_days<=30 THEN 'high' ELSE 'medium' END;
      PERFORM public.notify_v2('عقد توريد قارب الانتهاء',
        'عقد التوريد ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
        'contract_expiring','super_admin','/supply-contracts','supply_contracts',r.id,
        'supp_exp:' || r.id::text || ':' || v_days, v_p,'contracts','contract_expiring');
    END IF;
  END LOOP;

  -- Invoices overdue
  FOR r IN SELECT id, invoice_number FROM public.invoices WHERE status='متأخر' LOOP
    PERFORM public.notify_v2('فاتورة متأخرة',
      'الفاتورة ' || COALESCE(r.invoice_number,'') || ' تجاوزت تاريخ الاستحقاق',
      'invoice_overdue','accountant','/finance','invoices',r.id,
      'invoice_overdue:' || r.id::text,'high','financial','invoices_overdue');
  END LOOP;

  -- Documents expiring
  FOR r IN SELECT id, title, expiry_date FROM public.documents
           WHERE expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' LOOP
    v_days := r.expiry_date - CURRENT_DATE;
    v_p := CASE WHEN v_days<=7 THEN 'critical' WHEN v_days<=15 THEN 'high' ELSE 'medium' END;
    PERFORM public.notify_v2('شهادة تنتهي قريبًا',
      'المستند "' || r.title || '" ينتهي بتاريخ ' || r.expiry_date::text,
      'document_expiring','super_admin','/documents','documents',r.id,
      'doc_exp:' || r.id::text, v_p,'general','docs_expiring');
  END LOOP;

  -- Trainings
  FOR r IN SELECT id, training_type, expiry_date FROM public.guard_trainings
           WHERE expiry_date IS NOT NULL AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' LOOP
    PERFORM public.notify_v2('تدريب حارس على وشك الانتهاء',
      'التدريب "' || r.training_type || '" ينتهي بتاريخ ' || r.expiry_date::text,
      'training_expiring','security_supervisor','/security','guard_trainings',r.id,
      'train_exp:' || r.id::text,'medium','security','trainings_expiring');
  END LOOP;

  -- Work orders overdue
  FOR r IN SELECT id, request_number FROM public.maintenance_requests
           WHERE status <> 'مغلق' AND is_overdue=true LOOP
    PERFORM public.notify_v2('أمر عمل متأخر',
      'أمر العمل ' || COALESCE(r.request_number,'') || ' تجاوز مهلة الإنجاز',
      'work_order_overdue','maintenance_supervisor','/maintenance','maintenance_requests',r.id,
      'wo_overdue_daily:' || r.id::text || ':' || to_char(CURRENT_DATE,'YYYYMMDD'),
      'high','maintenance','work_orders_overdue');
  END LOOP;

  -- PM plans
  FOR r IN SELECT id, plan_name FROM public.pm_plans
           WHERE is_active=true AND next_due_at <= now() + INTERVAL '1 day' LOOP
    PERFORM public.notify_v2('خطة صيانة وقائية مستحقة',
      'الخطة "' || r.plan_name || '" مستحقة',
      'pm_due','maintenance_supervisor','/pm-plans','pm_plans',r.id,
      'pm_due:' || r.id::text || ':' || to_char(CURRENT_DATE,'YYYYMMDD'),
      'medium','maintenance','pm_due');
  END LOOP;
END $$;

-- 6) Escalation function
CREATE OR REPLACE FUNCTION public.escalate_critical_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM public.notifications
    WHERE priority IN ('critical','high')
      AND is_read=false
      AND dismissed_at IS NULL
      AND escalated_at IS NULL
      AND created_at < now() - INTERVAL '4 hours'
      AND (target_role IS NULL OR target_role <> 'super_admin')
  LOOP
    INSERT INTO public.notifications(
      target_role, title, body, notification_type, link, entity_type, entity_id,
      dedupe_key, priority, category, group_key, escalated_from
    ) VALUES (
      'super_admin',
      '🚨 تصعيد: ' || r.title,
      COALESCE(r.body,'') || E'\n(لم يتم التعامل معه منذ أكثر من 4 ساعات)',
      r.notification_type, r.link, r.entity_type, r.entity_id,
      'escalation:' || r.id::text,
      'critical', r.category, 'escalations', r.id
    ) ON CONFLICT (dedupe_key) DO NOTHING;
    UPDATE public.notifications SET escalated_at=now() WHERE id=r.id;
  END LOOP;
END $$;

-- 7) RPC for grouped/digest view
CREATE OR REPLACE FUNCTION public.get_notification_groups(_only_unread boolean DEFAULT false)
RETURNS TABLE(
  group_key text,
  category notification_category,
  priority notification_priority,
  count bigint,
  unread_count bigint,
  latest_title text,
  latest_body text,
  latest_link text,
  latest_created_at timestamptz,
  notification_type notification_type
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH visible AS (
    SELECT * FROM public.notifications
    WHERE dismissed_at IS NULL
      AND (user_id = auth.uid()
           OR (target_role IS NOT NULL AND has_role(auth.uid(), target_role))
           OR has_role(auth.uid(), 'super_admin'))
      AND (NOT _only_unread OR is_read=false)
  ),
  ranked AS (
    SELECT v.*, ROW_NUMBER() OVER (PARTITION BY COALESCE(v.group_key, v.id::text) ORDER BY v.created_at DESC) rn,
           COUNT(*) OVER (PARTITION BY COALESCE(v.group_key, v.id::text)) total,
           SUM(CASE WHEN v.is_read=false THEN 1 ELSE 0 END) OVER (PARTITION BY COALESCE(v.group_key, v.id::text)) unread,
           MAX(CASE v.priority WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END)
             OVER (PARTITION BY COALESCE(v.group_key, v.id::text)) max_p
    FROM visible v
  )
  SELECT
    COALESCE(group_key, id::text),
    category,
    (CASE max_p WHEN 4 THEN 'critical' WHEN 3 THEN 'high' WHEN 2 THEN 'medium' ELSE 'low' END)::notification_priority,
    total, unread, title, body, link, created_at, notification_type
  FROM ranked
  WHERE rn=1
  ORDER BY max_p DESC, created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.notify_v2 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.escalate_critical_notifications TO service_role;
GRANT EXECUTE ON FUNCTION public.get_notification_groups TO authenticated;
