
CREATE TYPE public.ticket_type AS ENUM ('شكوى','صيانة','نظافة','أمن','استفسار');
CREATE TYPE public.ticket_priority AS ENUM ('منخفضة','متوسطة','عالية','طارئة');
CREATE TYPE public.ticket_status AS ENUM ('جديد','جاري المعالجة','مغلق');

CREATE SEQUENCE public.ticket_number_seq;

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
  ticket_type public.ticket_type NOT NULL,
  category TEXT,
  priority public.ticket_priority NOT NULL DEFAULT 'متوسطة',
  status public.ticket_status NOT NULL DEFAULT 'جديد',
  description TEXT NOT NULL,
  assigned_to UUID,
  resolution_notes TEXT,
  maintenance_request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
CREATE INDEX idx_tickets_office ON public.tickets(office_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_type ON public.tickets(ticket_type);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- read: super_admin & owner all; receptionist all; security_supervisor → أمن; maintenance_supervisor → صيانة/نظافة
CREATE POLICY "tickets_read" ON public.tickets FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'owner')
  OR public.has_role(auth.uid(),'receptionist')
  OR (public.has_role(auth.uid(),'security_supervisor') AND ticket_type = 'أمن')
  OR (public.has_role(auth.uid(),'maintenance_supervisor') AND ticket_type IN ('صيانة','نظافة'))
);

-- insert: super_admin or receptionist
CREATE POLICY "tickets_insert" ON public.tickets FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'receptionist')
);

-- update: super_admin; receptionist; specialists for their type
CREATE POLICY "tickets_update" ON public.tickets FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'receptionist')
  OR (public.has_role(auth.uid(),'security_supervisor') AND ticket_type = 'أمن')
  OR (public.has_role(auth.uid(),'maintenance_supervisor') AND ticket_type IN ('صيانة','نظافة'))
)
WITH CHECK (
  public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'receptionist')
  OR (public.has_role(auth.uid(),'security_supervisor') AND ticket_type = 'أمن')
  OR (public.has_role(auth.uid(),'maintenance_supervisor') AND ticket_type IN ('صيانة','نظافة'))
);

CREATE POLICY "tickets_delete" ON public.tickets FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'TKT-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.ticket_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_ticket_number BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_number();

CREATE OR REPLACE FUNCTION public.stamp_ticket_closure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'مغلق' AND (OLD.status IS DISTINCT FROM 'مغلق') THEN
    NEW.closed_at := now();
    NEW.closed_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_ticket_closure BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.stamp_ticket_closure();

CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
