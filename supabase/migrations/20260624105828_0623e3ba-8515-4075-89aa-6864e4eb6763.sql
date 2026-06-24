
-- =========================================
-- Employees module
-- =========================================

-- Lookup tables
CREATE TABLE public.employee_employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employee_employers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employee_employers TO authenticated;
GRANT ALL ON public.employee_employers TO service_role;
ALTER TABLE public.employee_employers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employers_read_authenticated"
  ON public.employee_employers FOR SELECT TO authenticated USING (true);
CREATE POLICY "employers_write_managers"
  ON public.employee_employers FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  );

CREATE TABLE public.employee_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employee_departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employee_departments TO authenticated;
GRANT ALL ON public.employee_departments TO service_role;
ALTER TABLE public.employee_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_read_authenticated"
  ON public.employee_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_write_managers"
  ON public.employee_departments FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  );

-- Seed lookup data
INSERT INTO public.employee_employers (name) VALUES
  ('نخبة تسكين العقارية'),
  ('شركة أمن'),
  ('شركة نظافة'),
  ('شركة صيانة')
ON CONFLICT DO NOTHING;

INSERT INTO public.employee_departments (name) VALUES
  ('الصيانة'),
  ('الأمن'),
  ('النظافة'),
  ('خدمة العملاء')
ON CONFLICT DO NOTHING;

-- Main employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  mobile text,
  national_id text,
  nationality text,
  address text,
  employer text NOT NULL,
  job_title text,
  department text,
  hire_date date,
  status text NOT NULL DEFAULT 'نشط',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_employer ON public.employees(employer);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_employees_status ON public.employees(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users can read non-sensitive employee directory
-- (needed for pickers in maintenance/cleaning/security forms)
CREATE POLICY "employees_read_authenticated"
  ON public.employees FOR SELECT TO authenticated USING (true);

-- Insert: any authenticated user can quick-add (so pickers work),
-- but the row is owned via created_by
CREATE POLICY "employees_insert_authenticated"
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

-- Update / Delete: only privileged roles
CREATE POLICY "employees_update_managers"
  ON public.employees FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  );

CREATE POLICY "employees_delete_admin"
  ON public.employees FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assignment log: every time an employee is assigned to a record, log it
CREATE TABLE public.employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entity_type text NOT NULL,         -- e.g. 'maintenance_request', 'cleaning_plan', 'patrol'...
  entity_id uuid,
  entity_label text,                 -- human-friendly reference (request number, plan name...)
  role_on_entity text,               -- e.g. 'مشرف', 'فني منفذ', 'مسؤول'
  description text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_emp_assign_employee ON public.employee_assignments(employee_id);
CREATE INDEX idx_emp_assign_entity ON public.employee_assignments(entity_type, entity_id);

GRANT SELECT, INSERT ON public.employee_assignments TO authenticated;
GRANT UPDATE, DELETE ON public.employee_assignments TO authenticated;
GRANT ALL ON public.employee_assignments TO service_role;
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emp_assign_read_authenticated"
  ON public.employee_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "emp_assign_insert_authenticated"
  ON public.employee_assignments FOR INSERT TO authenticated
  WITH CHECK (assigned_by = auth.uid() OR assigned_by IS NULL);

CREATE POLICY "emp_assign_modify_managers"
  ON public.employee_assignments FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'security_supervisor')
  )
  WITH CHECK (true);

CREATE POLICY "emp_assign_delete_admin"
  ON public.employee_assignments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));
