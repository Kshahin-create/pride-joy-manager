
CREATE OR REPLACE FUNCTION public.generate_daily_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_days INT; v_pending NUMERIC;
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

  -- work orders overdue (still open)
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

  -- PM plans due today
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

  -- pending expenses (one aggregated alert)
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

  -- visitors not checked out > 12h
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
END $$;

-- Workflow guard: prevent re-opening a closed work order except by super_admin
CREATE OR REPLACE FUNCTION public.guard_wo_reopen()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'مغلق' AND NEW.status <> 'مغلق' THEN
    IF NOT public.has_role(auth.uid(),'super_admin') THEN
      RAISE EXCEPTION 'لا يمكن إعادة فتح أمر عمل مغلق. تواصل مع المدير العام.';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_wo_reopen ON public.maintenance_requests;
CREATE TRIGGER trg_guard_wo_reopen BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_wo_reopen();

-- Run it once now so today's items show up
SELECT public.generate_daily_notifications();
