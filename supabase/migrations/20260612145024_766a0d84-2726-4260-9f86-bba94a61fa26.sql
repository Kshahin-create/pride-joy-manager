
-- Enums
CREATE TYPE public.contract_status AS ENUM ('ساري','منتهي','مجدد','ملغي');
CREATE TYPE public.contract_attachment_type AS ENUM ('نسخة العقد','الهوية','السجل التجاري','سند دفع');

-- Sequence for contract numbers
CREATE SEQUENCE public.contract_number_seq START 1;

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  service_fees NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.contract_status NOT NULL DEFAULT 'ساري',
  notes TEXT,
  renewed_from_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_company ON public.contracts(company_id);
CREATE INDEX idx_contracts_office ON public.contracts(office_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages contracts" ON public.contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Accountant inserts contracts" ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'accountant'));

-- Attachments
CREATE TABLE public.contract_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  attachment_type public.contract_attachment_type NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_attachments_contract ON public.contract_attachments(contract_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_attachments TO authenticated;
GRANT ALL ON public.contract_attachments TO service_role;
ALTER TABLE public.contract_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read contract attachments" ON public.contract_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages contract attachments" ON public.contract_attachments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Accountant inserts contract attachments" ON public.contract_attachments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'accountant'));

-- updated_at triggers
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_contract_attachments_updated BEFORE UPDATE ON public.contract_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto contract number trigger
CREATE OR REPLACE FUNCTION public.set_contract_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number := 'CON-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.contract_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.set_contract_number() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_contracts_set_number BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_contract_number();

-- Office status sync trigger
CREATE OR REPLACE FUNCTION public.sync_office_status_from_contract()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'ساري' THEN
      UPDATE public.offices SET status = 'مؤجر' WHERE id = NEW.office_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'ساري' THEN
        UPDATE public.offices SET status = 'مؤجر' WHERE id = NEW.office_id;
      ELSIF NEW.status IN ('ملغي','منتهي') THEN
        -- only free if no other active contract on the office
        IF NOT EXISTS (
          SELECT 1 FROM public.contracts
          WHERE office_id = NEW.office_id AND status = 'ساري' AND id <> NEW.id
        ) THEN
          UPDATE public.offices SET status = 'متاح' WHERE id = NEW.office_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_office_status_from_contract() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_contracts_sync_office AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.sync_office_status_from_contract();

-- Building log trigger
CREATE OR REPLACE FUNCTION public.log_contract_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('contract.created','contracts',NEW.id,
      'تم إنشاء عقد ' || NEW.contract_number,
      jsonb_build_object('contract_number',NEW.contract_number,'office_id',NEW.office_id,'company_id',NEW.company_id,'status',NEW.status),
      v_actor, v_actor);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.building_log (event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('contract.status_changed','contracts',NEW.id,
      'تغيّرت حالة العقد ' || NEW.contract_number || ' من "' || OLD.status || '" إلى "' || NEW.status || '"',
      jsonb_build_object('from',OLD.status,'to',NEW.status,'office_id',NEW.office_id),
      v_actor, v_actor);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.log_contract_event() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_contracts_log AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_contract_event();

-- Renew contract RPC
CREATE OR REPLACE FUNCTION public.renew_contract(_contract_id UUID, _new_start DATE, _new_end DATE, _new_rent NUMERIC DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_old public.contracts; v_new_id UUID;
BEGIN
  SELECT * INTO v_old FROM public.contracts WHERE id = _contract_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'العقد غير موجود'; END IF;

  INSERT INTO public.contracts (company_id, office_id, start_date, end_date, rent_amount, deposit_amount, service_fees, status, notes, renewed_from_id, created_by)
  VALUES (v_old.company_id, v_old.office_id, _new_start, _new_end,
    COALESCE(_new_rent, v_old.rent_amount), v_old.deposit_amount, v_old.service_fees,
    'ساري', v_old.notes, v_old.id, auth.uid())
  RETURNING id INTO v_new_id;

  UPDATE public.contracts SET status = 'مجدد' WHERE id = _contract_id;
  RETURN v_new_id;
END $$;
GRANT EXECUTE ON FUNCTION public.renew_contract(UUID, DATE, DATE, NUMERIC) TO authenticated;

-- Storage policies for contracts bucket
CREATE POLICY "Auth read contracts bucket" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contracts');
CREATE POLICY "Super admin write contracts bucket" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')));
CREATE POLICY "Super admin update contracts bucket" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin delete contracts bucket" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(),'super_admin'));
