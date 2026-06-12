
-- Enums
CREATE TYPE public.invoice_type AS ENUM ('إيجار','تأمين','رسوم تشغيل','رسوم خدمات','غرامات');
CREATE TYPE public.invoice_status AS ENUM ('مستحق','مدفوع جزئي','مدفوع','متأخر');
CREATE TYPE public.payment_method AS ENUM ('نقدي','تحويل بنكي','شيك');

-- Sequences
CREATE SEQUENCE public.invoice_number_seq START 1;
CREATE SEQUENCE public.receipt_number_seq START 1;

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  invoice_type public.invoice_type NOT NULL,
  amount_due NUMERIC(12,2) NOT NULL CHECK (amount_due >= 0),
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'مستحق',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_contract ON public.invoices(contract_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance read" ON public.invoices FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'owner')
);
CREATE POLICY "finance write" ON public.invoices FOR ALL TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')
) WITH CHECK (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method public.payment_method NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'owner')
);
CREATE POLICY "payments write" ON public.payments FOR ALL TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')
) WITH CHECK (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')
);

-- Auto-numbering: invoice
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.invoice_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_set_invoice_number BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

-- Auto-numbering: receipt
CREATE OR REPLACE FUNCTION public.set_receipt_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'REC-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.receipt_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_set_receipt_number BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_receipt_number();

-- Recalculate invoice totals & status
CREATE OR REPLACE FUNCTION public.recalc_invoice_status(_invoice_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total NUMERIC(12,2);
  v_due NUMERIC(12,2);
  v_due_date DATE;
  v_new_status public.invoice_status;
BEGIN
  SELECT COALESCE(SUM(amount_paid),0) INTO v_total FROM public.payments WHERE invoice_id = _invoice_id;
  SELECT amount_due, due_date INTO v_due, v_due_date FROM public.invoices WHERE id = _invoice_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_total >= v_due THEN
    v_new_status := 'مدفوع';
  ELSIF v_total > 0 THEN
    v_new_status := 'مدفوع جزئي';
  ELSE
    v_new_status := 'مستحق';
  END IF;

  IF v_new_status <> 'مدفوع' AND v_due_date < CURRENT_DATE THEN
    v_new_status := 'متأخر';
  END IF;

  UPDATE public.invoices SET amount_paid = v_total, status = v_new_status, updated_at = now() WHERE id = _invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.payments_recalc_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_invoice_status(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_invoice_status(NEW.invoice_id);
    IF TG_OP = 'UPDATE' AND NEW.invoice_id <> OLD.invoice_id THEN
      PERFORM public.recalc_invoice_status(OLD.invoice_id);
    END IF;
    RETURN NEW;
  END IF;
END $$;
CREATE TRIGGER trg_payments_recalc AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.payments_recalc_trigger();

-- When invoice itself changes (amount_due/due_date), recalc
CREATE OR REPLACE FUNCTION public.invoices_recalc_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.amount_due IS DISTINCT FROM OLD.amount_due OR NEW.due_date IS DISTINCT FROM OLD.due_date THEN
    PERFORM public.recalc_invoice_status(NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_invoices_recalc AFTER UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.invoices_recalc_trigger();

-- Updated_at
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mark overdue daily
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.invoices
  SET status = 'متأخر', updated_at = now()
  WHERE due_date < CURRENT_DATE
    AND status IN ('مستحق','مدفوع جزئي')
    AND amount_paid < amount_due;
END $$;
