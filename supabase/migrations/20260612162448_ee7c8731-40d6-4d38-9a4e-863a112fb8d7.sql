
-- ============= DASHBOARD VIEWS =============
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.offices) AS offices_total,
  (SELECT COUNT(*) FROM public.offices WHERE status='مؤجر') AS offices_rented,
  (SELECT COUNT(*) FROM public.offices WHERE status='متاح') AS offices_available,
  (SELECT COUNT(*) FROM public.offices WHERE status='محجوز') AS offices_reserved,
  (SELECT COUNT(*) FROM public.offices WHERE status='تحت الصيانة') AS offices_maintenance,
  (SELECT COALESCE(SUM(p.amount_paid),0) FROM public.payments p WHERE p.payment_date >= date_trunc('month', CURRENT_DATE)) AS collected_this_month,
  (SELECT COALESCE(SUM(i.amount_due - i.amount_paid),0) FROM public.invoices i WHERE i.status IN ('متأخر','مستحق','مدفوع جزئي')) AS overdue_total,
  (SELECT COALESCE(SUM(p.amount_paid),0) FROM public.payments p WHERE p.payment_date >= date_trunc('year', CURRENT_DATE)) AS revenue_ytd,
  (SELECT COUNT(*) FROM public.tickets WHERE status IN ('جديد','جاري المعالجة')) AS tickets_open,
  (SELECT COUNT(*) FROM public.tickets WHERE status='مغلق') AS tickets_closed,
  (SELECT COUNT(*) FROM public.tickets WHERE priority='طارئة' AND status<>'مغلق') AS tickets_emergency,
  (SELECT COUNT(*) FROM public.maintenance_requests mr LEFT JOIN public.assets a ON a.id=mr.asset_id WHERE a.criticality='حرج' AND mr.status<>'مغلق') AS critical_failures,
  (SELECT COUNT(*) FROM public.maintenance_requests WHERE status IN ('جديد','جاري التنفيذ','بانتظار قطع غيار') AND request_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') AS scheduled_week,
  (SELECT COUNT(*) FROM public.contracts WHERE status='ساري') AS contracts_active,
  (SELECT COUNT(*) FROM public.contracts WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days') AS contracts_expiring,
  (SELECT COUNT(*) FROM public.contracts WHERE status='منتهي') AS contracts_expired,
  (SELECT COUNT(*) FROM public.guards) AS guards_count,
  (SELECT COUNT(*) FROM public.patrols WHERE start_time >= now() - INTERVAL '7 days') AS patrols_week,
  (SELECT COUNT(*) FROM public.security_incidents WHERE status='مفتوح') AS incidents_open,
  (SELECT COUNT(*) FROM public.parking_spots WHERE status IN ('مشغول','مخصص')) AS parking_occupied,
  (SELECT COUNT(*) FROM public.parking_spots WHERE status='متاح') AS parking_available,
  (SELECT COUNT(*) FROM public.parking_violations WHERE status='مفتوحة') AS violations_open;

GRANT SELECT ON public.dashboard_stats TO authenticated;

CREATE OR REPLACE VIEW public.monthly_revenue AS
SELECT
  to_char(gs, 'YYYY-MM') AS month,
  COALESCE(SUM(p.amount_paid), 0)::numeric AS revenue
FROM generate_series(
  date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
  date_trunc('month', CURRENT_DATE),
  INTERVAL '1 month'
) AS gs
LEFT JOIN public.payments p ON date_trunc('month', p.payment_date) = gs
GROUP BY gs
ORDER BY gs;

GRANT SELECT ON public.monthly_revenue TO authenticated;

-- ============= NOTIFICATIONS =============
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'contract_expiring','invoice_overdue','document_expiring','training_expiring',
    'ticket_emergency','asset_critical_failure','generic'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role public.app_role,
  title TEXT NOT NULL,
  body TEXT,
  notification_type public.notification_type NOT NULL DEFAULT 'generic',
  link TEXT,
  entity_type TEXT,
  entity_id UUID,
  dedupe_key TEXT UNIQUE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  CHECK (user_id IS NOT NULL OR target_role IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_role ON public.notifications(target_role, is_read);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (target_role IS NOT NULL AND public.has_role(auth.uid(), target_role))
  OR public.has_role(auth.uid(),'super_admin')
);

CREATE POLICY "users mark own notifications read"
ON public.notifications FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR (target_role IS NOT NULL AND public.has_role(auth.uid(), target_role))
  OR public.has_role(auth.uid(),'super_admin')
)
WITH CHECK (
  user_id = auth.uid()
  OR (target_role IS NOT NULL AND public.has_role(auth.uid(), target_role))
  OR public.has_role(auth.uid(),'super_admin')
);

CREATE POLICY "super_admin manage notifications"
ON public.notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- helper: insert notification (dedupe)
CREATE OR REPLACE FUNCTION public.notify(
  _title TEXT, _body TEXT, _type public.notification_type,
  _role public.app_role, _link TEXT, _entity_type TEXT, _entity_id UUID, _dedupe TEXT
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(target_role, title, body, notification_type, link, entity_type, entity_id, dedupe_key)
  VALUES (_role, _title, _body, _type, _link, _entity_type, _entity_id, _dedupe)
  ON CONFLICT (dedupe_key) DO NOTHING;
END $$;

-- ============= TRIGGERS =============
CREATE OR REPLACE FUNCTION public.notify_emergency_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.priority = 'طارئة' AND NEW.status <> 'مغلق' THEN
    PERFORM public.notify(
      'تذكرة طارئة جديدة',
      'تذكرة ' || COALESCE(NEW.ticket_number,'') || ' بحاجة لإجراء فوري',
      'ticket_emergency', 'super_admin',
      '/complaints/' || NEW.id::text, 'tickets', NEW.id,
      'ticket_emergency:' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_emergency_ticket ON public.tickets;
CREATE TRIGGER trg_notify_emergency_ticket
AFTER INSERT OR UPDATE OF priority, status ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_emergency_ticket();

CREATE OR REPLACE FUNCTION public.notify_critical_failure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_crit public.asset_criticality; v_name TEXT;
BEGIN
  IF NEW.asset_id IS NOT NULL THEN
    SELECT criticality, asset_name INTO v_crit, v_name FROM public.assets WHERE id = NEW.asset_id;
    IF v_crit = 'حرج' THEN
      PERFORM public.notify(
        'عطل في أصل حرج',
        'طلب صيانة ' || COALESCE(NEW.request_number,'') || ' على الأصل: ' || COALESCE(v_name,''),
        'asset_critical_failure', 'maintenance_supervisor',
        '/maintenance', 'maintenance_requests', NEW.id,
        'critical_fail:' || NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_critical_failure ON public.maintenance_requests;
CREATE TRIGGER trg_notify_critical_failure
AFTER INSERT ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_critical_failure();

-- ============= DAILY GENERATION =============
CREATE OR REPLACE FUNCTION public.generate_daily_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_days INT;
BEGIN
  -- contracts expiring 90/30
  FOR r IN SELECT id, contract_number, end_date FROM public.contracts
           WHERE status='ساري' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
  LOOP
    v_days := (r.end_date - CURRENT_DATE);
    PERFORM public.notify(
      'عقد على وشك الانتهاء',
      'العقد ' || COALESCE(r.contract_number,'') || ' ينتهي خلال ' || v_days || ' يوم',
      'contract_expiring','super_admin',
      '/contracts/' || r.id::text,'contracts',r.id,
      'contract_exp:' || r.id::text || ':' || (CASE WHEN v_days <= 30 THEN '30' ELSE '90' END)
    );
  END LOOP;

  -- invoices overdue
  FOR r IN SELECT id, invoice_number FROM public.invoices
           WHERE status='متأخر'
  LOOP
    PERFORM public.notify(
      'فاتورة متأخرة',
      'الفاتورة ' || COALESCE(r.invoice_number,'') || ' تجاوزت تاريخ الاستحقاق',
      'invoice_overdue','accountant',
      '/finance','invoices',r.id,
      'invoice_overdue:' || r.id::text
    );
  END LOOP;

  -- documents expiring within 30 days
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

  -- guard trainings expiring within 30 days
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
END $$;

GRANT EXECUTE ON FUNCTION public.generate_daily_notifications() TO authenticated;
