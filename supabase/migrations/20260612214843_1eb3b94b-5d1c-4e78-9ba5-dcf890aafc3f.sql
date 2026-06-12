
DO $$ BEGIN
  CREATE TYPE public.expense_status AS ENUM ('معلّق','معتمد','مرفوض','مدفوع');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_category AS ENUM (
    'صيانة','نظافة','أمن','كهرباء','مياه','مكتبية','مرافق','مقاولين','رواتب','تأمين','ضرائب ورسوم','أخرى'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS public.expense_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.vendor_payment_number_seq START 1;

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number TEXT UNIQUE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category public.expense_category NOT NULL DEFAULT 'أخرى',
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  maintenance_request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  invoice_attachment_url TEXT,
  payment_method TEXT,
  status public.expense_status NOT NULL DEFAULT 'معلّق',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View expenses (finance)" ON public.expenses FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'accountant') OR
  public.has_role(auth.uid(),'owner') OR
  public.has_role(auth.uid(),'maintenance_supervisor')
);

CREATE POLICY "Insert expenses (accountant+admin+maint)" ON public.expenses FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'accountant') OR
  public.has_role(auth.uid(),'maintenance_supervisor')
);

CREATE POLICY "Update expenses (accountant+admin)" ON public.expenses FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'accountant')
)
WITH CHECK (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'accountant')
);

CREATE POLICY "Delete expenses (admin only)" ON public.expenses FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.set_expense_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
    NEW.expense_number := 'EXP-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.expense_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_expense_number ON public.expenses;
CREATE TRIGGER trg_set_expense_number BEFORE INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.set_expense_number();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Approval stamping + restrict who can approve
CREATE OR REPLACE FUNCTION public.stamp_expense_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('معتمد','مرفوض') AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')) THEN
      RAISE EXCEPTION 'لا تملك صلاحية اعتماد/رفض المصروف';
    END IF;
    NEW.approved_by := auth.uid();
    NEW.approved_at := now();
  END IF;
  IF NEW.status = 'مدفوع' AND OLD.status IS DISTINCT FROM 'مدفوع' THEN
    NEW.paid_at := COALESCE(NEW.paid_at, now());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_stamp_expense_approval ON public.expenses;
CREATE TRIGGER trg_stamp_expense_approval BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.stamp_expense_approval();

-- Log to building_log + notify accountant on creation
CREATE OR REPLACE FUNCTION public.log_expense_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES ('مصروف جديد','expenses',NEW.id,
      'تم تسجيل مصروف ' || COALESCE(NEW.expense_number,'') || ' بقيمة ' || to_char(NEW.amount,'FM999,999,990.00') || ' — ' || NEW.category::text,
      jsonb_build_object('amount',NEW.amount,'category',NEW.category,'vendor_id',NEW.vendor_id), v_actor, v_actor);
    PERFORM public.notify(
      'مصروف جديد بانتظار الاعتماد',
      'المصروف ' || COALESCE(NEW.expense_number,'') || ' بقيمة ' || to_char(NEW.amount,'FM999,999,990.00'),
      'invoice_overdue','accountant',
      '/expenses','expenses',NEW.id,
      'expense_new:' || NEW.id::text
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
    VALUES (
      CASE NEW.status WHEN 'معتمد' THEN 'اعتماد مصروف' WHEN 'مرفوض' THEN 'رفض مصروف' WHEN 'مدفوع' THEN 'دفع مصروف' ELSE 'تغيير حالة مصروف' END,
      'expenses', NEW.id,
      'المصروف ' || COALESCE(NEW.expense_number,'') || ' أصبح "' || NEW.status::text || '"',
      jsonb_build_object('from',OLD.status,'to',NEW.status,'amount',NEW.amount),
      v_actor, v_actor
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_expense_event ON public.expenses;
CREATE TRIGGER trg_log_expense_event AFTER INSERT OR UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_event();

CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON public.expenses(vendor_id);

-- Vendor payments
CREATE TABLE IF NOT EXISTS public.vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  reference_number TEXT,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  vendor_contract_id UUID REFERENCES public.vendor_contracts(id) ON DELETE SET NULL,
  attachment_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_payments TO authenticated;
GRANT ALL ON public.vendor_payments TO service_role;

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View vendor payments (finance)" ON public.vendor_payments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'accountant') OR
  public.has_role(auth.uid(),'owner')
);

CREATE POLICY "Manage vendor payments (finance)" ON public.vendor_payments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'accountant')
)
WITH CHECK (
  public.has_role(auth.uid(),'super_admin') OR
  public.has_role(auth.uid(),'accountant')
);

CREATE OR REPLACE FUNCTION public.set_vendor_payment_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
    NEW.payment_number := 'VPM-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.vendor_payment_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_vendor_payment_number ON public.vendor_payments;
CREATE TRIGGER trg_set_vendor_payment_number BEFORE INSERT ON public.vendor_payments
FOR EACH ROW EXECUTE FUNCTION public.set_vendor_payment_number();

DROP TRIGGER IF EXISTS trg_vendor_payments_updated_at ON public.vendor_payments;
CREATE TRIGGER trg_vendor_payments_updated_at BEFORE UPDATE ON public.vendor_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.log_vendor_payment_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_vendor TEXT;
BEGIN
  SELECT name INTO v_vendor FROM public.vendors WHERE id = NEW.vendor_id;
  INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
  VALUES ('دفع مورد','vendor_payments',NEW.id,
    'تم سداد ' || to_char(NEW.amount,'FM999,999,990.00') || ' للمورد ' || COALESCE(v_vendor,'') ||
    ' (سند ' || COALESCE(NEW.payment_number,'') || ')',
    jsonb_build_object('vendor_id',NEW.vendor_id,'amount',NEW.amount,'expense_id',NEW.expense_id),
    v_actor, v_actor);

  -- mark linked expense as paid
  IF NEW.expense_id IS NOT NULL THEN
    UPDATE public.expenses SET status = 'مدفوع', paid_at = now()
    WHERE id = NEW.expense_id AND status <> 'مدفوع';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_vendor_payment_event ON public.vendor_payments;
CREATE TRIGGER trg_log_vendor_payment_event AFTER INSERT ON public.vendor_payments
FOR EACH ROW EXECUTE FUNCTION public.log_vendor_payment_event();

CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON public.vendor_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON public.vendor_payments(vendor_id);
