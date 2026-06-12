
-- Enum
CREATE TYPE public.client_status AS ENUM ('استفسار','مهتم','معاينة','تفاوض','حجز','تعاقد','غير مهتم');
CREATE TYPE public.interaction_type AS ENUM ('مكالمة','زيارة','ملاحظة');

-- Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  activity TEXT,
  commercial_register TEXT,
  tax_number TEXT,
  status public.client_status NOT NULL DEFAULT 'استفسار',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "write companies" ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'));
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_companies_status ON public.companies(status);

-- Contact persons
CREATE TABLE public.contact_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  position TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_persons TO authenticated;
GRANT ALL ON public.contact_persons TO service_role;
ALTER TABLE public.contact_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read contacts" ON public.contact_persons FOR SELECT TO authenticated USING (true);
CREATE POLICY "write contacts" ON public.contact_persons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'));
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.contact_persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_contacts_company ON public.contact_persons(company_id);

-- Client interactions
CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  interaction_type public.interaction_type NOT NULL,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_interactions TO authenticated;
GRANT ALL ON public.client_interactions TO service_role;
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read interactions" ON public.client_interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "write interactions" ON public.client_interactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'));
CREATE TRIGGER trg_interactions_updated BEFORE UPDATE ON public.client_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_interactions_company ON public.client_interactions(company_id, interaction_date DESC);

-- Client unit views
CREATE TABLE public.client_unit_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_unit_views TO authenticated;
GRANT ALL ON public.client_unit_views TO service_role;
ALTER TABLE public.client_unit_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read unit views" ON public.client_unit_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "write unit views" ON public.client_unit_views FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'receptionist'));
CREATE TRIGGER trg_unit_views_updated BEFORE UPDATE ON public.client_unit_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_unit_views_company ON public.client_unit_views(company_id, view_date DESC);

-- Log company status changes to building_log
CREATE OR REPLACE FUNCTION public.log_company_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('company.created','clients',NEW.id,'تم إضافة عميل: ' || NEW.company_name,
      jsonb_build_object('name',NEW.company_name,'status',NEW.status), v_actor, v_actor);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('company.status_changed','clients',NEW.id,
      'تغيّرت حالة العميل ' || NEW.company_name || ' من "' || OLD.status || '" إلى "' || NEW.status || '"',
      jsonb_build_object('from',OLD.status,'to',NEW.status), v_actor, v_actor);
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_log_company AFTER INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.log_company_event();
