
ALTER TABLE public.building_log ADD COLUMN IF NOT EXISTS location TEXT;

-- Widen read access to all signed-in users
DROP POLICY IF EXISTS "قراءة سجل البرج للمدير والمالك" ON public.building_log;
DROP POLICY IF EXISTS "bl_read_all" ON public.building_log;
CREATE POLICY "bl_read_all" ON public.building_log
  FOR SELECT TO authenticated USING (true);

-- No UPDATE / DELETE policies => RLS denies both (log is immutable)

-- ============== TICKETS ==============
CREATE OR REPLACE FUNCTION public.log_ticket_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('شكوى جديدة','tickets',NEW.id,
      'تذكرة جديدة ' || COALESCE(NEW.ticket_number,'') || ' — ' || NEW.ticket_type::text ||
      ' (أولوية: ' || NEW.priority::text || ')',
      jsonb_build_object('ticket_number',NEW.ticket_number,'office_id',NEW.office_id,'company_id',NEW.company_id,'priority',NEW.priority,'type',NEW.ticket_type),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'مغلق' AND OLD.status IS DISTINCT FROM 'مغلق' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('إغلاق بلاغ','tickets',NEW.id,
      'تم إغلاق التذكرة ' || COALESCE(NEW.ticket_number,''),
      jsonb_build_object('ticket_number',NEW.ticket_number,'office_id',NEW.office_id,'company_id',NEW.company_id),
      v_actor, v_actor);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_ticket ON public.tickets;
CREATE TRIGGER trg_log_ticket AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_event();

-- ============== MAINTENANCE REQUESTS ==============
CREATE OR REPLACE FUNCTION public.log_maintenance_request_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, location, metadata, actor_id, created_by)
    VALUES ('طلب صيانة','maintenance_requests',NEW.id,
      'طلب صيانة جديد ' || COALESCE(NEW.request_number,'') ||
      CASE WHEN NEW.location IS NOT NULL THEN ' — ' || NEW.location ELSE '' END,
      NEW.location,
      jsonb_build_object('request_number',NEW.request_number,'asset_id',NEW.asset_id,'office_id',NEW.office_id,'status',NEW.status),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, location, metadata, actor_id, created_by)
    VALUES ('تغيير حالة صيانة','maintenance_requests',NEW.id,
      'تغيّرت حالة الطلب ' || COALESCE(NEW.request_number,'') || ' من "' || OLD.status::text || '" إلى "' || NEW.status::text || '"',
      NEW.location,
      jsonb_build_object('request_number',NEW.request_number,'from',OLD.status,'to',NEW.status),
      v_actor, v_actor);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_mr ON public.maintenance_requests;
CREATE TRIGGER trg_log_mr AFTER INSERT OR UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_maintenance_request_event();

-- ============== SECURITY INCIDENTS ==============
CREATE OR REPLACE FUNCTION public.log_security_incident_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, location, metadata, actor_id, created_by)
    VALUES ('حادث أمني','security_incidents',NEW.id,
      'حادث أمني جديد ' || COALESCE(NEW.incident_number,'') || ' — ' || NEW.incident_type ||
      CASE WHEN NEW.location IS NOT NULL THEN ' (' || NEW.location || ')' ELSE '' END,
      NEW.location,
      jsonb_build_object('incident_number',NEW.incident_number,'type',NEW.incident_type),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'مغلق' AND OLD.status IS DISTINCT FROM 'مغلق' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, location, metadata, actor_id, created_by)
    VALUES ('إغلاق بلاغ','security_incidents',NEW.id,
      'تم إغلاق الحادث ' || COALESCE(NEW.incident_number,''),
      NEW.location,
      jsonb_build_object('incident_number',NEW.incident_number),
      v_actor, v_actor);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_incident ON public.security_incidents;
CREATE TRIGGER trg_log_incident AFTER INSERT OR UPDATE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.log_security_incident_event();

-- ============== PATROLS ==============
CREATE OR REPLACE FUNCTION public.log_patrol_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_guard TEXT;
BEGIN
  SELECT full_name INTO v_guard FROM public.guards WHERE id = NEW.guard_id;
  INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
  VALUES ('جولة أمنية','patrols',NEW.id,
    'بدأت جولة أمنية ' || COALESCE(NEW.patrol_number,'') ||
    CASE WHEN v_guard IS NOT NULL THEN ' — الحارس: ' || v_guard ELSE '' END,
    jsonb_build_object('patrol_number',NEW.patrol_number,'guard_id',NEW.guard_id),
    v_actor, v_actor);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_patrol ON public.patrols;
CREATE TRIGGER trg_log_patrol AFTER INSERT ON public.patrols
  FOR EACH ROW EXECUTE FUNCTION public.log_patrol_event();

-- ============== PAYMENTS ==============
CREATE OR REPLACE FUNCTION public.log_payment_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
        v_inv TEXT; v_co TEXT; v_co_id UUID; v_office UUID;
BEGIN
  SELECT i.invoice_number, c.company_name, i.company_id, ct.office_id
    INTO v_inv, v_co, v_co_id, v_office
  FROM public.invoices i
  LEFT JOIN public.companies c ON c.id = i.company_id
  LEFT JOIN public.contracts ct ON ct.id = i.contract_id
  WHERE i.id = NEW.invoice_id;

  INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
  VALUES ('استلام دفعة','payments',NEW.id,
    'تم استلام دفعة ' || to_char(NEW.amount_paid,'FM999,999,990.00') ||
    ' على الفاتورة ' || COALESCE(v_inv,'') ||
    CASE WHEN v_co IS NOT NULL THEN ' من ' || v_co ELSE '' END,
    jsonb_build_object('receipt_number',NEW.receipt_number,'invoice_id',NEW.invoice_id,
      'invoice_number',v_inv,'company_id',v_co_id,'office_id',v_office,'amount',NEW.amount_paid),
    v_actor, v_actor);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_payment ON public.payments;
CREATE TRIGGER trg_log_payment AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_event();

-- ============== INSPECTIONS ==============
CREATE OR REPLACE FUNCTION public.log_inspection_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_tpl TEXT;
BEGIN
  SELECT template_name INTO v_tpl FROM public.inspection_templates WHERE id = NEW.template_id;
  INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
  VALUES ('تفتيش','inspections',NEW.id,
    'تم تنفيذ تفتيش "' || COALESCE(v_tpl,'') || '" — النتيجة: ' || NEW.overall_result::text ||
    CASE WHEN NEW.inspector_name IS NOT NULL THEN ' (المسؤول: ' || NEW.inspector_name || ')' ELSE '' END,
    jsonb_build_object('template_id',NEW.template_id,'template',v_tpl,'overall',NEW.overall_result,'date',NEW.inspection_date),
    v_actor, v_actor);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_inspection ON public.inspections;
CREATE TRIGGER trg_log_inspection AFTER INSERT ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.log_inspection_event();
