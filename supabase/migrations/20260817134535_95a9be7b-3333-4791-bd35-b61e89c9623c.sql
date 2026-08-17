CREATE POLICY cleaning_plans_unified_sel ON public.cleaning_plans
FOR SELECT TO authenticated
USING (public.can_view_module(auth.uid(), 'cleaning'));