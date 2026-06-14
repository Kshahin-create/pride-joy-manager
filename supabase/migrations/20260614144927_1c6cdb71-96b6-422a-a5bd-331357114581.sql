
-- Elevator maintenance contracts
CREATE SEQUENCE IF NOT EXISTS public.elevator_contract_number_seq START 1;

CREATE TABLE public.elevator_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'صيانة شاملة',
  status TEXT NOT NULL DEFAULT 'مسودة',
  
  -- Parties
  first_party_name TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_name TEXT,
  vendor_contact_name TEXT,
  vendor_phone TEXT,
  vendor_email TEXT,
  vendor_cr TEXT,
  vendor_tax_number TEXT,

  -- Duration
  start_date DATE,
  end_date DATE,
  duration_months INT,
  notice_period_days INT,

  -- Assets covered
  covered_elevator_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Scope
  includes_preventive BOOLEAN DEFAULT TRUE,
  includes_corrective BOOLEAN DEFAULT TRUE,
  includes_emergency BOOLEAN DEFAULT TRUE,
  spare_parts_included BOOLEAN DEFAULT FALSE,
  spare_parts_notes TEXT,

  -- SLA
  sla_critical_response_hours INT,
  sla_normal_response_hours INT,
  pm_frequency TEXT,

  -- Financial
  contract_value NUMERIC(14,2),
  payment_method TEXT,
  payment_frequency TEXT,
  tax_percentage NUMERIC(5,2) DEFAULT 15,
  tax_included BOOLEAN DEFAULT FALSE,

  -- Alerts
  alert_thresholds_days INT[] DEFAULT ARRAY[90,30]::INT[],

  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.elevator_contract_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elevator_contract_id UUID NOT NULL REFERENCES public.elevator_contracts(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.elevator_contracts TO authenticated;
GRANT ALL ON public.elevator_contracts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elevator_contract_attachments TO authenticated;
GRANT ALL ON public.elevator_contract_attachments TO service_role;

ALTER TABLE public.elevator_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elevator_contract_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ec_select" ON public.elevator_contracts FOR SELECT TO authenticated
  USING (public.user_has_property(auth.uid(), property_id));
CREATE POLICY "ec_insert" ON public.elevator_contracts FOR INSERT TO authenticated
  WITH CHECK (public.user_has_property(auth.uid(), property_id));
CREATE POLICY "ec_update" ON public.elevator_contracts FOR UPDATE TO authenticated
  USING (public.user_has_property(auth.uid(), property_id))
  WITH CHECK (public.user_has_property(auth.uid(), property_id));
CREATE POLICY "ec_delete" ON public.elevator_contracts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "eca_select" ON public.elevator_contract_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.elevator_contracts c WHERE c.id = elevator_contract_id AND public.user_has_property(auth.uid(), c.property_id)));
CREATE POLICY "eca_write" ON public.elevator_contract_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.elevator_contracts c WHERE c.id = elevator_contract_id AND public.user_has_property(auth.uid(), c.property_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.elevator_contracts c WHERE c.id = elevator_contract_id AND public.user_has_property(auth.uid(), c.property_id)));

-- Auto contract number
CREATE OR REPLACE FUNCTION public.set_elevator_contract_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'ELV-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.elevator_contract_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_set_elevator_contract_number BEFORE INSERT ON public.elevator_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_elevator_contract_number();
CREATE TRIGGER trg_set_default_property_elevator BEFORE INSERT ON public.elevator_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_default_property_id();
CREATE TRIGGER trg_elevator_contracts_updated BEFORE UPDATE ON public.elevator_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
