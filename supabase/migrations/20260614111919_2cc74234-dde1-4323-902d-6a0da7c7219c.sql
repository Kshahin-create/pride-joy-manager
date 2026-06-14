
-- Re-target SELECT policies from public to authenticated role
DROP POLICY IF EXISTS contacts_read_scoped ON public.contact_persons;
CREATE POLICY contacts_read_scoped ON public.contact_persons
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'accountant'::app_role)
    OR has_role(auth.uid(), 'receptionist'::app_role)
    OR has_role(auth.uid(), 'owner'::app_role)
  );

DROP POLICY IF EXISTS vendors_read_scoped ON public.vendors;
CREATE POLICY vendors_read_scoped ON public.vendors
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'accountant'::app_role)
    OR has_role(auth.uid(), 'maintenance_supervisor'::app_role)
  );
