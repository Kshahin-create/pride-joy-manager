-- Fix 1: Make has_role SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix 2: Allow accountant + maintenance_supervisor to write vendors
CREATE POLICY vendors_write_privileged_insert ON public.vendors
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
);

CREATE POLICY vendors_write_privileged_update ON public.vendors
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
);

CREATE POLICY vendors_write_privileged_delete ON public.vendors
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
);
