
CREATE SEQUENCE IF NOT EXISTS public.supply_contract_number_seq;

CREATE TABLE public.supply_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  contract_number TEXT UNIQUE,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'توريد',
  status TEXT NOT NULL DEFAULT 'مسودة',
  first_party TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_company_name TEXT,
  vendor_commercial_registration TEXT,
  vendor_tax_number TEXT,
  vendor_contact_person TEXT,
  vendor_mobile TEXT,
  vendor_email TEXT,
  start_date DATE,
  end_date DATE,
  duration_months INTEGER,
  supply_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  supply_items JSONB DEFAULT '[]'::jsonb,
  supply_schedule TEXT,
  contract_value NUMERIC(14,2) DEFAULT 0,
  payment_method TEXT,
  payment_frequency TEXT,
  tax_included BOOLEAN DEFAULT TRUE,
  tax_rate NUMERIC(5,2) DEFAULT 15,
  alert_thresholds_days INTEGER[] DEFAULT ARRAY[90,30],
  delivery_delay_alert_days INTEGER DEFAULT 7,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_contracts TO authenticated;
GRANT ALL ON public.supply_contracts TO service_role;
ALTER TABLE public.supply_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supply_contracts_select" ON public.supply_contracts FOR SELECT TO authenticated
  USING (property_id IS NULL OR public.user_has_property(auth.uid(), property_id));
CREATE POLICY "supply_contracts_insert" ON public.supply_contracts FOR INSERT TO authenticated
  WITH CHECK (property_id IS NULL OR public.user_has_property(auth.uid(), property_id));
CREATE POLICY "supply_contracts_update" ON public.supply_contracts FOR UPDATE TO authenticated
  USING (property_id IS NULL OR public.user_has_property(auth.uid(), property_id));
CREATE POLICY "supply_contracts_delete" ON public.supply_contracts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE OR REPLACE FUNCTION public.set_supply_contract_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'SUP-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.supply_contract_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_supply_contract_number BEFORE INSERT ON public.supply_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_supply_contract_number();
CREATE TRIGGER trg_supply_contract_property BEFORE INSERT ON public.supply_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_default_property_id();
CREATE TRIGGER trg_supply_contract_updated BEFORE UPDATE ON public.supply_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.supply_contract_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.supply_contracts(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL DEFAULT 'عقد',
  file_url TEXT NOT NULL,
  file_name TEXT,
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_contract_attachments TO authenticated;
GRANT ALL ON public.supply_contract_attachments TO service_role;
ALTER TABLE public.supply_contract_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supply_contract_att_select" ON public.supply_contract_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.supply_contracts c WHERE c.id = contract_id AND (c.property_id IS NULL OR public.user_has_property(auth.uid(), c.property_id))));
CREATE POLICY "supply_contract_att_manage" ON public.supply_contract_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.supply_contracts c WHERE c.id = contract_id AND (c.property_id IS NULL OR public.user_has_property(auth.uid(), c.property_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.supply_contracts c WHERE c.id = contract_id AND (c.property_id IS NULL OR public.user_has_property(auth.uid(), c.property_id))));
