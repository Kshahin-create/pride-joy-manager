
-- Add permission-based storage policies alongside existing role-based ones.
-- Any user with the mapped permission (or super_admin) can perform the action.

-- Helper for readability inside policies (inline expressions actually used).

-- cleaning-photos
CREATE POLICY "cleaning_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='cleaning-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'cleaning.manage')));
CREATE POLICY "cleaning_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='cleaning-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'cleaning.view') OR has_permission(auth.uid(),'cleaning.manage')));
CREATE POLICY "cleaning_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='cleaning-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'cleaning.manage') OR owner = auth.uid()));

-- maintenance-photos
CREATE POLICY "maintenance_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='maintenance-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'maintenance.create') OR has_permission(auth.uid(),'maintenance.edit')));
CREATE POLICY "maintenance_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='maintenance-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'maintenance.view')));
CREATE POLICY "maintenance_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='maintenance-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'maintenance.delete') OR has_permission(auth.uid(),'maintenance.edit') OR owner = auth.uid()));

-- inspection-photos
CREATE POLICY "inspection_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='inspection-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'inspections.create') OR has_permission(auth.uid(),'inspections.edit')));
CREATE POLICY "inspection_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='inspection-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'inspections.view')));
CREATE POLICY "inspection_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='inspection-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'inspections.delete') OR has_permission(auth.uid(),'inspections.edit') OR owner = auth.uid()));

-- parking-photos
CREATE POLICY "parking_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='parking-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'parking.manage') OR has_permission(auth.uid(),'parking.violations')));
CREATE POLICY "parking_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='parking-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'parking.view') OR has_permission(auth.uid(),'parking.manage')));
CREATE POLICY "parking_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='parking-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'parking.manage') OR owner = auth.uid()));

-- patrol-photos
CREATE POLICY "patrol_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='patrol-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'patrols.create')));
CREATE POLICY "patrol_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='patrol-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'patrols.view')));
CREATE POLICY "patrol_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='patrol-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'patrols.create') OR owner = auth.uid()));

-- incident-photos
CREATE POLICY "incident_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='incident-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'incidents.create') OR has_permission(auth.uid(),'incidents.edit')));
CREATE POLICY "incident_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='incident-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'incidents.view')));
CREATE POLICY "incident_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='incident-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'incidents.close') OR has_permission(auth.uid(),'incidents.edit') OR owner = auth.uid()));

-- guards-photos
CREATE POLICY "guards_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='guards-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'guards.create') OR has_permission(auth.uid(),'guards.edit')));
CREATE POLICY "guards_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='guards-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'guards.view')));
CREATE POLICY "guards_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='guards-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'guards.delete') OR has_permission(auth.uid(),'guards.edit')));

-- asset-photos
CREATE POLICY "asset_photos_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='asset-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'assets.create') OR has_permission(auth.uid(),'assets.edit')));
CREATE POLICY "asset_photos_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='asset-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'assets.view')));
CREATE POLICY "asset_photos_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='asset-photos' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'assets.delete') OR has_permission(auth.uid(),'assets.edit')));

-- documents
CREATE POLICY "documents_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='documents' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'documents.create') OR has_permission(auth.uid(),'documents.edit')));
CREATE POLICY "documents_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='documents' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'documents.view')));
CREATE POLICY "documents_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='documents' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'documents.delete') OR has_permission(auth.uid(),'documents.edit')));

-- office-files
CREATE POLICY "office_files_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='office-files' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'offices.create') OR has_permission(auth.uid(),'offices.edit')));
CREATE POLICY "office_files_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='office-files' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'offices.view')));
CREATE POLICY "office_files_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='office-files' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'offices.delete') OR has_permission(auth.uid(),'offices.edit')));

-- contracts bucket
CREATE POLICY "contracts_bucket_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='contracts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'contracts.create') OR has_permission(auth.uid(),'contracts.edit')));
CREATE POLICY "contracts_bucket_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='contracts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'contracts.view')));
CREATE POLICY "contracts_bucket_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='contracts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'contracts.delete') OR has_permission(auth.uid(),'contracts.edit')));

-- cleaning-contracts bucket
CREATE POLICY "cleaning_contracts_bucket_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='cleaning-contracts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'contracts.create') OR has_permission(auth.uid(),'contracts.edit')));
CREATE POLICY "cleaning_contracts_bucket_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='cleaning-contracts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'contracts.view')));
CREATE POLICY "cleaning_contracts_bucket_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='cleaning-contracts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'contracts.delete') OR has_permission(auth.uid(),'contracts.edit')));

-- companies
CREATE POLICY "companies_bucket_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='companies' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'tenants.create') OR has_permission(auth.uid(),'tenants.edit')));
CREATE POLICY "companies_bucket_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='companies' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'tenants.view')));
CREATE POLICY "companies_bucket_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='companies' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'tenants.delete') OR has_permission(auth.uid(),'tenants.edit')));

-- expense-attachments
CREATE POLICY "expense_attachments_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='expense-attachments' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'expenses.create') OR has_permission(auth.uid(),'expenses.edit')));
CREATE POLICY "expense_attachments_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='expense-attachments' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'expenses.view')));
CREATE POLICY "expense_attachments_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='expense-attachments' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'expenses.delete') OR has_permission(auth.uid(),'expenses.edit')));

-- payment-receipts
CREATE POLICY "payment_receipts_insert_perm" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='payment-receipts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'payments.record')));
CREATE POLICY "payment_receipts_select_perm" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='payment-receipts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'invoices.view') OR has_permission(auth.uid(),'payments.record')));
CREATE POLICY "payment_receipts_delete_perm" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='payment-receipts' AND (has_role(auth.uid(),'super_admin') OR has_permission(auth.uid(),'payments.delete')));
