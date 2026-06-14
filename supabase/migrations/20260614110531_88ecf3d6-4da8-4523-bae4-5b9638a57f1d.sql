CREATE POLICY "payment receipts read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-receipts' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'owner')));

CREATE POLICY "payment receipts insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-receipts' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')));

CREATE POLICY "payment receipts update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-receipts' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')));

CREATE POLICY "payment receipts delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-receipts' AND (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant')));