
CREATE TYPE public.cleaning_contract_type AS ENUM (
  'عقد خدمات نظافة',
  'عقد تشغيل نظافة متكامل',
  'عقد توريد عمالة نظافة'
);

CREATE TYPE public.cleaning_payment_frequency AS ENUM (
  'شهري','ربع سنوي','نصف سنوي','سنوي'
);

CREATE TYPE public.materials_responsibility AS ENUM (
  'على شركة النظافة','على مالك البرج','مشتركة'
);

CREATE TYPE public.cleaning_contract_attachment_type AS ENUM (
  'نسخة العقد','السجل التجاري','شهادات العمالة','التأمينات','شهادات السلامة','أخرى'
);

CREATE SEQUENCE IF NOT EXISTS public.cleaning_contract_number_seq;

CREATE TABLE public.cleaning_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE,
  cleaning_type public.cleaning_contract_type NOT NULL DEFAULT 'عقد خدمات نظافة',
  status public.contract_status NOT NULL DEFAULT 'مسودة',
  first_party_name TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_name TEXT,
  vendor_cr TEXT,
  vendor_tax_number TEXT,
  vendor_contact_name TEXT,
  vendor_phone TEXT,
  vendor_email TEXT,
  start_date DATE,
  end_date DATE,
  duration_months INT,
  notice_period_days INT DEFAULT 30,
  scope_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  day_workers INT DEFAULT 0,
  night_workers INT DEFAULT 0,
  supervisors INT DEFAULT 0,
  shift_start TIME,
  shift_end TIME,
  hours_per_day NUMERIC(4,1),
  materials_responsibility public.materials_responsibility DEFAULT 'على شركة النظافة',
  cleaning_supplies TEXT[] DEFAULT ARRAY[]::TEXT[],
  restroom_supplies TEXT[] DEFAULT ARRAY[]::TEXT[],
  sla_quality_pct_target NUMERIC(5,2) DEFAULT 95,
  sla_response_normal_hours INT DEFAULT 24,
  sla_response_emergency_hours INT DEFAULT 2,
  contract_value NUMERIC(14,2),
  monthly_value NUMERIC(14,2),
  annual_value NUMERIC(14,2),
  payment_frequency public.cleaning_payment_frequency DEFAULT 'شهري',
  taxable BOOLEAN DEFAULT TRUE,
  tax_pct NUMERIC(5,2) DEFAULT 15,
  tax_inclusive BOOLEAN DEFAULT FALSE,
  alert_thresholds_days INT[] DEFAULT ARRAY[90,30]::INT[],
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_contracts TO authenticated;
GRANT ALL ON public.cleaning_contracts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.cleaning_contract_number_seq TO authenticated;

ALTER TABLE public.cleaning_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view cleaning contracts" ON public.cleaning_contracts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "manage cleaning contracts" ON public.cleaning_contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));

CREATE TRIGGER trg_cleaning_contracts_updated_at
  BEFORE UPDATE ON public.cleaning_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_cleaning_contract_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'CLN-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.cleaning_contract_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_cleaning_contract_number
  BEFORE INSERT ON public.cleaning_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_cleaning_contract_number();

CREATE TABLE public.cleaning_contract_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_contract_id UUID NOT NULL REFERENCES public.cleaning_contracts(id) ON DELETE CASCADE,
  attachment_type public.cleaning_contract_attachment_type NOT NULL DEFAULT 'أخرى',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cleaning_contract_attachments TO authenticated;
GRANT ALL ON public.cleaning_contract_attachments TO service_role;

ALTER TABLE public.cleaning_contract_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view cleaning attachments" ON public.cleaning_contract_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "manage cleaning attachments" ON public.cleaning_contract_attachments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));

CREATE OR REPLACE FUNCTION public.log_cleaning_contract_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('cleaning_contract.created','cleaning_contracts',NEW.id,
      'تم إنشاء عقد نظافة ' || COALESCE(NEW.contract_number,''),
      jsonb_build_object('contract_number',NEW.contract_number,'vendor_id',NEW.vendor_id,'status',NEW.status),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('cleaning_contract.status_changed','cleaning_contracts',NEW.id,
      'تغيّرت حالة عقد النظافة ' || COALESCE(NEW.contract_number,'') || ' من "' || OLD.status || '" إلى "' || NEW.status || '"',
      jsonb_build_object('from',OLD.status,'to',NEW.status),
      v_actor, v_actor);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_log_cleaning_contract
  AFTER INSERT OR UPDATE ON public.cleaning_contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_cleaning_contract_event();
