
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  activity TEXT,
  contact_person TEXT,
  mobile TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_read_auth" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendors_admin_all" ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_vendors_updated BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.vendor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  attachment_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_contracts TO authenticated;
GRANT ALL ON public.vendor_contracts TO service_role;
ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vc_read_auth" ON public.vendor_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "vc_admin_all" ON public.vendor_contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_vc_updated BEFORE UPDATE ON public.vendor_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_vc_vendor ON public.vendor_contracts(vendor_id);
CREATE INDEX idx_vc_end_date ON public.vendor_contracts(end_date);

CREATE TABLE public.vendor_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  quality_score SMALLINT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  commitment_score SMALLINT NOT NULL CHECK (commitment_score BETWEEN 1 AND 5),
  speed_score SMALLINT NOT NULL CHECK (speed_score BETWEEN 1 AND 5),
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_evaluations TO authenticated;
GRANT ALL ON public.vendor_evaluations TO service_role;
ALTER TABLE public.vendor_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ve_read_auth" ON public.vendor_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "ve_admin_all" ON public.vendor_evaluations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "ve_supervisor_insert" ON public.vendor_evaluations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'maintenance_supervisor'));
CREATE TRIGGER trg_ve_updated BEFORE UPDATE ON public.vendor_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_ve_vendor ON public.vendor_evaluations(vendor_id);
