
CREATE SEQUENCE IF NOT EXISTS public.fire_contract_number_seq START 1;

CREATE TABLE public.fire_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'صيانة أنظمة حريق',
  status TEXT NOT NULL DEFAULT 'مسودة',

  -- Parties
  first_party TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  company_name TEXT,
  commercial_register TEXT,
  tax_number TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Duration
  start_date DATE,
  end_date DATE,
  duration_months INTEGER,

  -- Covered systems (booleans)
  covers_fire_pumps BOOLEAN NOT NULL DEFAULT false,
  covers_fire_hoses BOOLEAN NOT NULL DEFAULT false,
  covers_fire_cabinets BOOLEAN NOT NULL DEFAULT false,
  covers_extinguishers BOOLEAN NOT NULL DEFAULT false,
  covers_smoke_detectors BOOLEAN NOT NULL DEFAULT false,
  covers_alarm_panels BOOLEAN NOT NULL DEFAULT false,
  covers_sprinklers BOOLEAN NOT NULL DEFAULT false,
  covered_asset_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Scope
  includes_preventive BOOLEAN NOT NULL DEFAULT true,
  includes_corrective BOOLEAN NOT NULL DEFAULT true,
  includes_periodic_tests BOOLEAN NOT NULL DEFAULT true,
  includes_certification_reports BOOLEAN NOT NULL DEFAULT false,
  includes_spare_parts BOOLEAN NOT NULL DEFAULT false,
  preventive_frequency TEXT,

  -- SLA
  response_time_hours INTEGER,
  resolution_time_hours INTEGER,

  -- Financial
  contract_value NUMERIC(12,2),
  payment_frequency TEXT,
  tax_included BOOLEAN NOT NULL DEFAULT true,
  tax_rate NUMERIC(5,2) DEFAULT 15.00,

  -- Alerts
  alert_thresholds_days INTEGER[] DEFAULT ARRAY[90,30]::INTEGER[],
  certification_expiry_date DATE,

  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fire_contracts TO authenticated;
GRANT ALL ON public.fire_contracts TO service_role;
ALTER TABLE public.fire_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view fire contracts by property" ON public.fire_contracts
  FOR SELECT TO authenticated
  USING (public.user_has_property(auth.uid(), property_id));
CREATE POLICY "manage fire contracts by property" ON public.fire_contracts
  FOR ALL TO authenticated
  USING (public.user_has_property(auth.uid(), property_id))
  WITH CHECK (public.user_has_property(auth.uid(), property_id));

CREATE OR REPLACE FUNCTION public.set_fire_contract_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'FIRE-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.fire_contract_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_fire_contract_number BEFORE INSERT ON public.fire_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_fire_contract_number();
CREATE TRIGGER trg_fire_contract_property BEFORE INSERT ON public.fire_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_default_property_id();
CREATE TRIGGER trg_fire_contract_updated BEFORE UPDATE ON public.fire_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.fire_contract_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.fire_contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  category TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fire_contract_attachments TO authenticated;
GRANT ALL ON public.fire_contract_attachments TO service_role;
ALTER TABLE public.fire_contract_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view fire attachments" ON public.fire_contract_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fire_contracts c WHERE c.id = contract_id AND public.user_has_property(auth.uid(), c.property_id)));
CREATE POLICY "manage fire attachments" ON public.fire_contract_attachments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fire_contracts c WHERE c.id = contract_id AND public.user_has_property(auth.uid(), c.property_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.fire_contracts c WHERE c.id = contract_id AND public.user_has_property(auth.uid(), c.property_id)));
