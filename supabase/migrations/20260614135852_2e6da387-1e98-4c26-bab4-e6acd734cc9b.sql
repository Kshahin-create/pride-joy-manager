
-- contract_delegates
CREATE TABLE public.contract_delegates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  position text,
  id_number text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_delegates TO authenticated;
GRANT ALL ON public.contract_delegates TO service_role;
ALTER TABLE public.contract_delegates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delegates_read_scoped" ON public.contract_delegates FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant')
      OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'receptionist'));
CREATE POLICY "delegates_write_manager" ON public.contract_delegates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'));
CREATE INDEX idx_contract_delegates_contract ON public.contract_delegates(contract_id);
CREATE TRIGGER trg_contract_delegates_updated BEFORE UPDATE ON public.contract_delegates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- contract_offices (multi-office link)
CREATE TABLE public.contract_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL DEFAULT false,
  rent_share numeric(12,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, office_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_offices TO authenticated;
GRANT ALL ON public.contract_offices TO service_role;
ALTER TABLE public.contract_offices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "co_read_scoped" ON public.contract_offices FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant')
      OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'receptionist'));
CREATE POLICY "co_write_manager" ON public.contract_offices FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'));
CREATE INDEX idx_contract_offices_contract ON public.contract_offices(contract_id);
CREATE INDEX idx_contract_offices_office ON public.contract_offices(office_id);
CREATE TRIGGER trg_contract_offices_updated BEFORE UPDATE ON public.contract_offices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- contract_parking_spots
CREATE TABLE public.contract_parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  parking_spot_id uuid NOT NULL REFERENCES public.parking_spots(id) ON DELETE RESTRICT,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, parking_spot_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_parking_spots TO authenticated;
GRANT ALL ON public.contract_parking_spots TO service_role;
ALTER TABLE public.contract_parking_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cps_read_scoped" ON public.contract_parking_spots FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant')
      OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'receptionist'));
CREATE POLICY "cps_write_manager" ON public.contract_parking_spots FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'))
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'));
CREATE INDEX idx_contract_parking_spots_contract ON public.contract_parking_spots(contract_id);
CREATE TRIGGER trg_contract_parking_spots_updated BEFORE UPDATE ON public.contract_parking_spots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
