
DO $$ BEGIN
  CREATE TYPE public.visitor_status AS ENUM ('داخل','خرج','ملغي');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.visitor_type AS ENUM ('زائر','مقاول','موظف توصيل','صيانة خارجية','ضيف VIP','أخرى');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS public.visitor_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  national_id TEXT,
  phone TEXT,
  company_visiting TEXT,
  office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  host_name TEXT,
  visitor_type public.visitor_type NOT NULL DEFAULT 'زائر',
  purpose TEXT,
  vehicle_plate TEXT,
  badge_number TEXT,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  expected_duration_minutes INT,
  status public.visitor_status NOT NULL DEFAULT 'داخل',
  received_by_guard_id UUID REFERENCES public.guards(id) ON DELETE SET NULL,
  id_photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitors TO authenticated;
GRANT ALL ON public.visitors TO service_role;

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View visitors (staff)" ON public.visitors FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'receptionist') OR
  public.has_role(auth.uid(),'security_supervisor') OR
  public.has_role(auth.uid(),'owner')
);

CREATE POLICY "Manage visitors (staff)" ON public.visitors FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'receptionist') OR
  public.has_role(auth.uid(),'security_supervisor')
)
WITH CHECK (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'receptionist') OR
  public.has_role(auth.uid(),'security_supervisor')
);

CREATE OR REPLACE FUNCTION public.set_visitor_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.visitor_number IS NULL OR NEW.visitor_number = '' THEN
    NEW.visitor_number := 'VIS-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.visitor_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_visitor_number ON public.visitors;
CREATE TRIGGER trg_set_visitor_number BEFORE INSERT ON public.visitors
FOR EACH ROW EXECUTE FUNCTION public.set_visitor_number();

DROP TRIGGER IF EXISTS trg_visitors_updated_at ON public.visitors;
CREATE TRIGGER trg_visitors_updated_at BEFORE UPDATE ON public.visitors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.stamp_visitor_checkout()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'خرج' AND (OLD.status IS DISTINCT FROM 'خرج') AND NEW.check_out_at IS NULL THEN
    NEW.check_out_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_stamp_visitor_checkout ON public.visitors;
CREATE TRIGGER trg_stamp_visitor_checkout BEFORE UPDATE ON public.visitors
FOR EACH ROW EXECUTE FUNCTION public.stamp_visitor_checkout();

CREATE OR REPLACE FUNCTION public.log_visitor_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_office TEXT;
BEGIN
  IF NEW.office_id IS NOT NULL THEN
    SELECT code INTO v_office FROM public.offices WHERE id = NEW.office_id;
  END IF;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('دخول زائر','visitors',NEW.id,
      'دخل الزائر ' || NEW.full_name ||
      CASE WHEN v_office IS NOT NULL THEN ' لزيارة المكتب ' || v_office ELSE '' END ||
      CASE WHEN NEW.host_name IS NOT NULL THEN ' — المضيف: ' || NEW.host_name ELSE '' END,
      jsonb_build_object('visitor_number',NEW.visitor_number,'office_id',NEW.office_id,'type',NEW.visitor_type),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'خرج' AND OLD.status IS DISTINCT FROM 'خرج' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('خروج زائر','visitors',NEW.id,
      'خرج الزائر ' || NEW.full_name || ' (رقم ' || COALESCE(NEW.visitor_number,'') || ')',
      jsonb_build_object('visitor_number',NEW.visitor_number,'duration_minutes',
        EXTRACT(EPOCH FROM (COALESCE(NEW.check_out_at,now()) - NEW.check_in_at))/60),
      v_actor, v_actor);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_visitor_event ON public.visitors;
CREATE TRIGGER trg_log_visitor_event AFTER INSERT OR UPDATE ON public.visitors
FOR EACH ROW EXECUTE FUNCTION public.log_visitor_event();

CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_office ON public.visitors(office_id);
CREATE INDEX IF NOT EXISTS idx_visitors_check_in ON public.visitors(check_in_at DESC);
