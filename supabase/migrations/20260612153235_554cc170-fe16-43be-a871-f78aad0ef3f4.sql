
-- Enums
CREATE TYPE public.shift_type AS ENUM ('صباحي','مسائي','ليلي');
CREATE TYPE public.training_type AS ENUM ('أمن','سلامة','إسعافات أولية');
CREATE TYPE public.evaluation_type AS ENUM ('شهري','ربع سنوي');
CREATE TYPE public.penalty_reward_type AS ENUM ('مخالفة','إنذار','مكافأة');
CREATE TYPE public.leave_status AS ENUM ('قيد المراجعة','معتمدة','مرفوضة');
CREATE TYPE public.incident_status AS ENUM ('مفتوح','مغلق');

-- Sequences
CREATE SEQUENCE public.patrol_number_seq START 1;
CREATE SEQUENCE public.incident_number_seq START 1;

-- Helper: can manage security module
CREATE OR REPLACE FUNCTION public.can_manage_security(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'super_admin') OR public.has_role(_uid,'security_supervisor')
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_security(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_security(uuid) TO postgres;

-- =============== GUARDS ===============
CREATE TABLE public.guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  national_id text UNIQUE,
  nationality text,
  birth_date date,
  mobile text,
  address text,
  photo_url text,
  employee_number text UNIQUE,
  security_company text,
  job_title text,
  start_date date,
  contract_end_date date,
  salary numeric(12,2),
  direct_supervisor text,
  shift_type public.shift_type,
  working_hours text,
  working_days text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guards TO authenticated;
GRANT ALL ON public.guards TO service_role;
ALTER TABLE public.guards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read guards" ON public.guards FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'security_supervisor')
    OR public.has_role(auth.uid(),'owner')
  );
CREATE POLICY "manage guards" ON public.guards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE TRIGGER trg_guards_updated BEFORE UPDATE ON public.guards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Salary protection: only super_admin can write salary; trigger zeroes-out attempts by others.
CREATE OR REPLACE FUNCTION public.protect_guard_salary()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'super_admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.salary := NULL;
    ELSIF TG_OP = 'UPDATE' AND NEW.salary IS DISTINCT FROM OLD.salary THEN
      NEW.salary := OLD.salary;
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.protect_guard_salary() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_protect_guard_salary
BEFORE INSERT OR UPDATE ON public.guards
FOR EACH ROW EXECUTE FUNCTION public.protect_guard_salary();

-- Safe view (no salary) for non-admins to use
CREATE OR REPLACE VIEW public.guards_safe AS
SELECT id, full_name, national_id, nationality, birth_date, mobile, address, photo_url,
       employee_number, security_company, job_title, start_date, contract_end_date,
       direct_supervisor, shift_type, working_hours, working_days, notes,
       created_at, updated_at
FROM public.guards;
GRANT SELECT ON public.guards_safe TO authenticated;

-- =============== GUARD ATTENDANCE ===============
CREATE TABLE public.guard_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id uuid NOT NULL REFERENCES public.guards(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in time,
  check_out time,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guard_attendance TO authenticated;
GRANT ALL ON public.guard_attendance TO service_role;
ALTER TABLE public.guard_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read attendance" ON public.guard_attendance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage attendance" ON public.guard_attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE INDEX idx_attendance_guard ON public.guard_attendance(guard_id);

-- =============== GUARD LEAVES ===============
CREATE TABLE public.guard_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id uuid NOT NULL REFERENCES public.guards(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'قيد المراجعة',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guard_leaves TO authenticated;
GRANT ALL ON public.guard_leaves TO service_role;
ALTER TABLE public.guard_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read leaves" ON public.guard_leaves FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage leaves" ON public.guard_leaves FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE INDEX idx_leaves_guard ON public.guard_leaves(guard_id);

-- =============== GUARD TRAININGS ===============
CREATE TABLE public.guard_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id uuid NOT NULL REFERENCES public.guards(id) ON DELETE CASCADE,
  training_type public.training_type NOT NULL,
  issue_date date,
  expiry_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guard_trainings TO authenticated;
GRANT ALL ON public.guard_trainings TO service_role;
ALTER TABLE public.guard_trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read trainings" ON public.guard_trainings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage trainings" ON public.guard_trainings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE INDEX idx_trainings_guard ON public.guard_trainings(guard_id);

-- =============== GUARD EVALUATIONS ===============
CREATE TABLE public.guard_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id uuid NOT NULL REFERENCES public.guards(id) ON DELETE CASCADE,
  evaluation_type public.evaluation_type NOT NULL,
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  score numeric(4,2) CHECK (score >= 0 AND score <= 10),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guard_evaluations TO authenticated;
GRANT ALL ON public.guard_evaluations TO service_role;
ALTER TABLE public.guard_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read evaluations" ON public.guard_evaluations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage evaluations" ON public.guard_evaluations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE INDEX idx_evaluations_guard ON public.guard_evaluations(guard_id);

-- =============== GUARD PENALTIES / REWARDS ===============
CREATE TABLE public.guard_penalties_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id uuid NOT NULL REFERENCES public.guards(id) ON DELETE CASCADE,
  pr_type public.penalty_reward_type NOT NULL,
  pr_date date NOT NULL DEFAULT CURRENT_DATE,
  details text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guard_penalties_rewards TO authenticated;
GRANT ALL ON public.guard_penalties_rewards TO service_role;
ALTER TABLE public.guard_penalties_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read pr" ON public.guard_penalties_rewards FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage pr" ON public.guard_penalties_rewards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE INDEX idx_pr_guard ON public.guard_penalties_rewards(guard_id);

-- =============== PATROLS ===============
CREATE TABLE public.patrols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_number text NOT NULL UNIQUE,
  guard_id uuid REFERENCES public.guards(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patrols TO authenticated;
GRANT ALL ON public.patrols TO service_role;
ALTER TABLE public.patrols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read patrols" ON public.patrols FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage patrols" ON public.patrols FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));

CREATE OR REPLACE FUNCTION public.set_patrol_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.patrol_number IS NULL OR NEW.patrol_number = '' THEN
    NEW.patrol_number := 'PAT-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.patrol_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_patrol_number() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_set_patrol_number BEFORE INSERT ON public.patrols
  FOR EACH ROW EXECUTE FUNCTION public.set_patrol_number();
CREATE TRIGGER trg_patrols_updated BEFORE UPDATE ON public.patrols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== PATROL CHECKPOINTS ===============
CREATE TABLE public.patrol_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_id uuid NOT NULL REFERENCES public.patrols(id) ON DELETE CASCADE,
  checkpoint_name text NOT NULL,
  visit_time timestamptz NOT NULL DEFAULT now(),
  photo_path text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patrol_checkpoints TO authenticated;
GRANT ALL ON public.patrol_checkpoints TO service_role;
ALTER TABLE public.patrol_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read checkpoints" ON public.patrol_checkpoints FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage checkpoints" ON public.patrol_checkpoints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));
CREATE INDEX idx_checkpoints_patrol ON public.patrol_checkpoints(patrol_id);

-- =============== SECURITY INCIDENTS ===============
CREATE TABLE public.security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text NOT NULL UNIQUE,
  incident_date timestamptz NOT NULL DEFAULT now(),
  location text NOT NULL,
  incident_type text NOT NULL,
  description text,
  actions_taken text,
  status public.incident_status NOT NULL DEFAULT 'مفتوح',
  closure_report text,
  closed_at timestamptz,
  closed_by uuid,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_incidents TO authenticated;
GRANT ALL ON public.security_incidents TO service_role;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read incidents" ON public.security_incidents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "manage incidents" ON public.security_incidents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor'));

CREATE OR REPLACE FUNCTION public.set_incident_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.incident_number IS NULL OR NEW.incident_number = '' THEN
    NEW.incident_number := 'INC-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.incident_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_incident_number() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_set_incident_number BEFORE INSERT ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_incident_number();
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validate closure: status='مغلق' requires closure_report
CREATE OR REPLACE FUNCTION public.validate_incident_closure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'مغلق' AND (NEW.closure_report IS NULL OR length(trim(NEW.closure_report)) = 0) THEN
    RAISE EXCEPTION 'تقرير الإغلاق مطلوب لإغلاق الحادث';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'مغلق' AND OLD.status <> 'مغلق' THEN
    NEW.closed_at := now();
    NEW.closed_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.validate_incident_closure() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_validate_incident_closure
BEFORE INSERT OR UPDATE ON public.security_incidents
FOR EACH ROW EXECUTE FUNCTION public.validate_incident_closure();

-- =============== STORAGE POLICIES ===============
CREATE POLICY "read guards photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'guards-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner')));
CREATE POLICY "manage guards photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'guards-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));
CREATE POLICY "delete guards photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'guards-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));

CREATE POLICY "read patrol photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patrol-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner')));
CREATE POLICY "upload patrol photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patrol-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));
CREATE POLICY "delete patrol photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'patrol-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));

CREATE POLICY "read incident photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'incident-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor') OR public.has_role(auth.uid(),'owner')));
CREATE POLICY "upload incident photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));
CREATE POLICY "delete incident photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'incident-photos' AND
    (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'security_supervisor')));
