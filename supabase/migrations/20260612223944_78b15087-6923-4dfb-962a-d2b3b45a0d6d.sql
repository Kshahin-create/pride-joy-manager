DROP POLICY IF EXISTS "Authenticated can read building identity" ON public.building_identity;

CREATE POLICY "Privileged roles can read building identity"
ON public.building_identity
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'accountant'::app_role)
);