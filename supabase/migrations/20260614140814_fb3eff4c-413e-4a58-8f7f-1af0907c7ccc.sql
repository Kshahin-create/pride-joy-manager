
-- Deposit status enum
DO $$ BEGIN
  CREATE TYPE public.deposit_status AS ENUM ('محتجز','مسترد جزئياً','مسترد كلياً','مخصوم');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payment schedule status enum
DO $$ BEGIN
  CREATE TYPE public.payment_schedule_status AS ENUM ('مجدول','مستحق','مدفوع','متأخر','ملغي');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS deposit_status public.deposit_status DEFAULT 'محتجز',
  ADD COLUMN IF NOT EXISTS deposit_refund_date DATE,
  ADD COLUMN IF NOT EXISTS deposit_refund_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS deposit_notes TEXT,
  ADD COLUMN IF NOT EXISTS vat_percentage NUMERIC(5,2) DEFAULT 15,
  ADD COLUMN IF NOT EXISTS vat_inclusive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_fees_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS operating_fees NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_notes TEXT;

-- Deposit deductions
CREATE TABLE IF NOT EXISTS public.contract_deposit_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  deduction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  reason TEXT NOT NULL,
  attachment_path TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_deposit_deductions TO authenticated;
GRANT ALL ON public.contract_deposit_deductions TO service_role;
ALTER TABLE public.contract_deposit_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read deposit deductions"
  ON public.contract_deposit_deductions FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage deposit deductions"
  ON public.contract_deposit_deductions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));

CREATE TRIGGER trg_deposit_ded_updated
  BEFORE UPDATE ON public.contract_deposit_deductions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payment schedule
CREATE TABLE IF NOT EXISTS public.contract_payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status public.payment_schedule_status NOT NULL DEFAULT 'مجدول',
  paid_date DATE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, installment_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_payment_schedule TO authenticated;
GRANT ALL ON public.contract_payment_schedule TO service_role;
ALTER TABLE public.contract_payment_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read payment schedule"
  ON public.contract_payment_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage payment schedule"
  ON public.contract_payment_schedule FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));

CREATE TRIGGER trg_payment_sched_updated
  BEFORE UPDATE ON public.contract_payment_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_payment_sched_contract ON public.contract_payment_schedule(contract_id);
CREATE INDEX IF NOT EXISTS idx_deposit_ded_contract ON public.contract_deposit_deductions(contract_id);
