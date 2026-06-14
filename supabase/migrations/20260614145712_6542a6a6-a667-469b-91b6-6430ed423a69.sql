
CREATE SEQUENCE IF NOT EXISTS public.ac_contract_number_seq START 1;

CREATE TABLE public.ac_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'صيانة شاملة',
  status TEXT NOT NULL DEFAULT 'مسودة',
  first_party_name TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_name TEXT,
  vendor_contact_name TEXT,
  vendor_phone TEXT,
  vendor_email TEXT,
  vendor_cr TEXT,
  vendor_tax_number TEXT,
  start_date DATE,
  end_date DATE,
  duration_months INT,
  notice_period_days INT DEFAULT 30,
  covered_ac_unit_ids UUID[] DEFAULT ARRAY[]::UUID[],
  includes_preventive BOOLEAN DEFAULT true,
  includes_corrective BOOLEAN DEFAULT true,
  includes_emergency BOOLEAN DEFAULT true,
  spare_parts_included BOOLEAN DEFAULT false,
  spare_parts_notes TEXT,
  sla_critical_response_hours INT DEFAULT 2,
  sla_normal_response_hours INT DEFAULT 24,
  pm_frequency TEXT DEFAULT 'شهري',
  contract_value NUMERIC(12,2),
  payment_method TEXT,
  payment_frequency TEXT,
  tax_percentage NUMERIC(5,2) DEFAULT 15,
  tax_included BOOLEAN DEFAULT false,
  alert_thresholds_days INT[] DEFAULT ARRAY[90,30]::INT[],
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ac_contracts TO authenticated;
GRANT ALL ON public.ac_contracts TO service_role;
ALTER TABLE public.ac_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view ac_contracts in user properties" ON public.ac_contracts
  FOR SELECT TO authenticated
  USING (property_id IS NULL OR public.user_has_property(auth.uid(), property_id));
CREATE POLICY "manage ac_contracts in user properties" ON public.ac_contracts
  FOR ALL TO authenticated
  USING (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))
  WITH CHECK (property_id IS NULL OR public.user_has_property(auth.uid(), property_id));
CREATE POLICY "service_role ac_contracts" ON public.ac_contracts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_ac_contracts_property BEFORE INSERT ON public.ac_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_default_property_id();

CREATE OR REPLACE FUNCTION public.set_ac_contract_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'AC-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.ac_contract_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_ac_contract_number BEFORE INSERT ON public.ac_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_ac_contract_number();

CREATE TRIGGER trg_ac_contracts_updated BEFORE UPDATE ON public.ac_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ac_contract_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.ac_contracts(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  category TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ac_contract_attachments TO authenticated;
GRANT ALL ON public.ac_contract_attachments TO service_role;
ALTER TABLE public.ac_contract_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view ac_contract_attachments" ON public.ac_contract_attachments
  FOR SELECT TO authenticated
  USING (property_id IS NULL OR public.user_has_property(auth.uid(), property_id));
CREATE POLICY "manage ac_contract_attachments" ON public.ac_contract_attachments
  FOR ALL TO authenticated
  USING (property_id IS NULL OR public.user_has_property(auth.uid(), property_id))
  WITH CHECK (property_id IS NULL OR public.user_has_property(auth.uid(), property_id));

CREATE TRIGGER set_ac_contract_attachments_property BEFORE INSERT ON public.ac_contract_attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_default_property_id();
CREATE TRIGGER trg_ac_contract_attachments_updated BEFORE UPDATE ON public.ac_contract_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
