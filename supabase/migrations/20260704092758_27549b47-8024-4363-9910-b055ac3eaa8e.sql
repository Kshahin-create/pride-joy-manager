
-- 1) Tighten employees SELECT to super_admin + owner only (removes maintenance/security supervisors from PII read access)
DROP POLICY IF EXISTS employees_read_managers ON public.employees;
CREATE POLICY employees_read_admins ON public.employees
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner'));

-- 2) Tighten guards SELECT to super_admin + owner only (removes security_supervisor from salary/national_id read)
DROP POLICY IF EXISTS "read guards" ON public.guards;
CREATE POLICY "read guards" ON public.guards
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'owner'));

-- 3) Restrict maintenance_requests SELECT to relevant roles / reporter
DROP POLICY IF EXISTS mr_read_all_auth ON public.maintenance_requests;
CREATE POLICY mr_read_scoped ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'maintenance_supervisor')
    OR public.has_role(auth.uid(),'owner')
    OR public.has_role(auth.uid(),'receptionist')
    OR reported_by = auth.uid()
    OR public.has_permission(auth.uid(),'maintenance.view')
    OR public.has_permission(auth.uid(),'maintenance.manage')
  );

-- 4) has_role should consult both legacy user_roles and new user_role_assignments so the two systems can't diverge
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.app_roles r ON r.id = ura.role_id
    WHERE ura.user_id = _user_id AND r.name = _role::text
  );
$$;

-- 5) Keep both role tables in sync via triggers (writes to either propagate to the other)
CREATE OR REPLACE FUNCTION public._sync_user_roles_to_assignments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_role_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT id INTO v_role_id FROM public.app_roles WHERE name = NEW.role::text;
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.user_role_assignments (user_id, role_id, assigned_by)
      VALUES (NEW.user_id, v_role_id, auth.uid())
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT id INTO v_role_id FROM public.app_roles WHERE name = OLD.role::text;
    IF v_role_id IS NOT NULL THEN
      DELETE FROM public.user_role_assignments
      WHERE user_id = OLD.user_id AND role_id = v_role_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public._sync_assignments_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_name text;
        v_enum_names text[] := ARRAY['super_admin','accountant','security_supervisor','maintenance_supervisor','receptionist','owner'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO v_name FROM public.app_roles WHERE id = NEW.role_id;
    IF v_name IS NOT NULL AND v_name = ANY(v_enum_names) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, v_name::app_role)
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT name INTO v_name FROM public.app_roles WHERE id = OLD.role_id;
    IF v_name IS NOT NULL AND v_name = ANY(v_enum_names) THEN
      DELETE FROM public.user_roles
      WHERE user_id = OLD.user_id AND role = v_name::app_role;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_sync_user_roles_to_assignments ON public.user_roles;
CREATE TRIGGER trg_sync_user_roles_to_assignments
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public._sync_user_roles_to_assignments();

DROP TRIGGER IF EXISTS trg_sync_assignments_to_user_roles ON public.user_role_assignments;
CREATE TRIGGER trg_sync_assignments_to_user_roles
  AFTER INSERT OR DELETE ON public.user_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public._sync_assignments_to_user_roles();

-- Backfill: mirror any existing rows so both tables converge now
INSERT INTO public.user_role_assignments (user_id, role_id)
SELECT ur.user_id, ar.id
FROM public.user_roles ur
JOIN public.app_roles ar ON ar.name = ur.role::text
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT ura.user_id, ar.name::app_role
FROM public.user_role_assignments ura
JOIN public.app_roles ar ON ar.id = ura.role_id
WHERE ar.name IN ('super_admin','accountant','security_supervisor','maintenance_supervisor','receptionist','owner')
ON CONFLICT DO NOTHING;
