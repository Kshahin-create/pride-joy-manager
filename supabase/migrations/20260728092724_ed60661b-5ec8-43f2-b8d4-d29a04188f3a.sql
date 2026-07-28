
-- 1) Add new .upload permission keys
INSERT INTO public.app_permissions (key, label, module, module_label, action, sort_order) VALUES
  ('assets.upload',            'رفع صور/ملفات الأصول',        'assets',      'الأصول',        'special', 810),
  ('maintenance.upload',       'رفع صور/ملفات الصيانة',       'maintenance', 'الصيانة',       'special', 610),
  ('cleaning.upload',          'رفع صور النظافة',              'cleaning',    'النظافة',       'special', 1510),
  ('inspections.upload',       'رفع صور التفتيش',              'inspections', 'التفتيشات',     'special', 1210),
  ('parking.upload',           'رفع صور المواقف',              'parking',     'المواقف',       'special', 1310),
  ('security.upload_incident', 'رفع صور الحوادث الأمنية',      'security',    'الأمن',         'special', 1040),
  ('security.upload_patrol',   'رفع صور الجولات الأمنية',      'security',    'الأمن',         'special', 1041),
  ('security.upload_guard',    'رفع صور الحراس',               'security',    'الأمن',         'special', 1042),
  ('documents.upload',         'رفع مستندات وملفات',           'documents',   'المستندات',     'special', 1610),
  ('contracts.upload',         'رفع مرفقات العقود',            'contracts',   'العقود',        'special', 310),
  ('expenses.upload',          'رفع مرفقات المصروفات',         'expenses',    'المصروفات',     'special', 510),
  ('offices.upload',           'رفع ملفات المكاتب',            'offices',     'المكاتب',       'special', 210),
  ('companies.upload',         'رفع ملفات العملاء',            'companies',   'العملاء',       'special', 410),
  ('payments.upload_receipt',  'رفع إيصالات الدفع',            'finance',     'المالية',       'special', 710)
ON CONFLICT (key) DO NOTHING;

-- 2) Grant these to sensible default roles
DO $$
DECLARE
  v_map record;
  v_role_id uuid;
BEGIN
  FOR v_map IN
    SELECT * FROM (VALUES
      ('super_admin',            'assets.upload'),
      ('maintenance_supervisor', 'assets.upload'),
      ('super_admin',            'maintenance.upload'),
      ('maintenance_supervisor', 'maintenance.upload'),
      ('super_admin',            'cleaning.upload'),
      ('maintenance_supervisor', 'cleaning.upload'),
      ('super_admin',            'inspections.upload'),
      ('maintenance_supervisor', 'inspections.upload'),
      ('security_supervisor',    'inspections.upload'),
      ('super_admin',            'parking.upload'),
      ('security_supervisor',    'parking.upload'),
      ('receptionist',           'parking.upload'),
      ('super_admin',            'security.upload_incident'),
      ('security_supervisor',    'security.upload_incident'),
      ('receptionist',           'security.upload_incident'),
      ('super_admin',            'security.upload_patrol'),
      ('security_supervisor',    'security.upload_patrol'),
      ('super_admin',            'security.upload_guard'),
      ('security_supervisor',    'security.upload_guard'),
      ('super_admin',            'documents.upload'),
      ('accountant',             'documents.upload'),
      ('super_admin',            'contracts.upload'),
      ('accountant',             'contracts.upload'),
      ('super_admin',            'expenses.upload'),
      ('accountant',             'expenses.upload'),
      ('maintenance_supervisor', 'expenses.upload'),
      ('super_admin',            'offices.upload'),
      ('accountant',             'offices.upload'),
      ('receptionist',           'offices.upload'),
      ('super_admin',            'companies.upload'),
      ('accountant',             'companies.upload'),
      ('receptionist',           'companies.upload'),
      ('super_admin',            'payments.upload_receipt'),
      ('accountant',             'payments.upload_receipt')
    ) AS t(role_name, perm_key)
  LOOP
    SELECT id INTO v_role_id FROM public.app_roles WHERE name = v_map.role_name;
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_key)
      VALUES (v_role_id, v_map.perm_key)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- 3) Extend storage INSERT policies to also honour the new .upload permissions

-- asset-photos
DROP POLICY IF EXISTS "asset_photos_upload_perm" ON storage.objects;
CREATE POLICY "asset_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-photos' AND public.has_permission(auth.uid(), 'assets.upload'));

-- maintenance-photos
DROP POLICY IF EXISTS "maintenance_photos_upload_perm" ON storage.objects;
CREATE POLICY "maintenance_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-photos' AND public.has_permission(auth.uid(), 'maintenance.upload'));
DROP POLICY IF EXISTS "maintenance_photos_delete_upload_perm" ON storage.objects;
CREATE POLICY "maintenance_photos_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'maintenance-photos' AND public.has_permission(auth.uid(), 'maintenance.upload'));

-- cleaning-photos
DROP POLICY IF EXISTS "cleaning_photos_upload_perm" ON storage.objects;
CREATE POLICY "cleaning_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cleaning-photos' AND public.has_permission(auth.uid(), 'cleaning.upload'));
DROP POLICY IF EXISTS "cleaning_photos_delete_upload_perm" ON storage.objects;
CREATE POLICY "cleaning_photos_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cleaning-photos' AND public.has_permission(auth.uid(), 'cleaning.upload'));

-- inspection-photos
DROP POLICY IF EXISTS "inspection_photos_upload_perm" ON storage.objects;
CREATE POLICY "inspection_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inspection-photos' AND public.has_permission(auth.uid(), 'inspections.upload'));
DROP POLICY IF EXISTS "inspection_photos_delete_upload_perm" ON storage.objects;
CREATE POLICY "inspection_photos_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'inspection-photos' AND public.has_permission(auth.uid(), 'inspections.upload'));

-- parking-photos
DROP POLICY IF EXISTS "parking_photos_upload_perm" ON storage.objects;
CREATE POLICY "parking_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'parking-photos' AND public.has_permission(auth.uid(), 'parking.upload'));
DROP POLICY IF EXISTS "parking_photos_delete_upload_perm" ON storage.objects;
CREATE POLICY "parking_photos_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'parking-photos' AND public.has_permission(auth.uid(), 'parking.upload'));

-- incident-photos
DROP POLICY IF EXISTS "incident_photos_upload_perm" ON storage.objects;
CREATE POLICY "incident_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident-photos' AND public.has_permission(auth.uid(), 'security.upload_incident'));
DROP POLICY IF EXISTS "incident_photos_delete_upload_perm" ON storage.objects;
CREATE POLICY "incident_photos_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'incident-photos' AND public.has_permission(auth.uid(), 'security.upload_incident'));

-- patrol-photos
DROP POLICY IF EXISTS "patrol_photos_upload_perm" ON storage.objects;
CREATE POLICY "patrol_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patrol-photos' AND public.has_permission(auth.uid(), 'security.upload_patrol'));
DROP POLICY IF EXISTS "patrol_photos_delete_upload_perm" ON storage.objects;
CREATE POLICY "patrol_photos_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patrol-photos' AND public.has_permission(auth.uid(), 'security.upload_patrol'));

-- guards-photos
DROP POLICY IF EXISTS "guards_photos_upload_perm" ON storage.objects;
CREATE POLICY "guards_photos_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'guards-photos' AND public.has_permission(auth.uid(), 'security.upload_guard'));
DROP POLICY IF EXISTS "guards_photos_delete_upload_perm" ON storage.objects;
CREATE POLICY "guards_photos_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'guards-photos' AND public.has_permission(auth.uid(), 'security.upload_guard'));

-- documents
DROP POLICY IF EXISTS "documents_upload_perm" ON storage.objects;
CREATE POLICY "documents_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.has_permission(auth.uid(), 'documents.upload'));
DROP POLICY IF EXISTS "documents_delete_upload_perm" ON storage.objects;
CREATE POLICY "documents_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.has_permission(auth.uid(), 'documents.upload'));

-- contracts + cleaning-contracts
DROP POLICY IF EXISTS "contracts_upload_perm" ON storage.objects;
CREATE POLICY "contracts_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND public.has_permission(auth.uid(), 'contracts.upload'));
DROP POLICY IF EXISTS "cleaning_contracts_upload_perm" ON storage.objects;
CREATE POLICY "cleaning_contracts_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cleaning-contracts' AND public.has_permission(auth.uid(), 'contracts.upload'));

-- expense-attachments
DROP POLICY IF EXISTS "expense_attachments_upload_perm" ON storage.objects;
CREATE POLICY "expense_attachments_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expense-attachments' AND public.has_permission(auth.uid(), 'expenses.upload'));
DROP POLICY IF EXISTS "expense_attachments_delete_upload_perm" ON storage.objects;
CREATE POLICY "expense_attachments_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'expense-attachments' AND public.has_permission(auth.uid(), 'expenses.upload'));

-- office-files
DROP POLICY IF EXISTS "office_files_upload_perm" ON storage.objects;
CREATE POLICY "office_files_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'office-files' AND public.has_permission(auth.uid(), 'offices.upload'));
DROP POLICY IF EXISTS "office_files_delete_upload_perm" ON storage.objects;
CREATE POLICY "office_files_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'office-files' AND public.has_permission(auth.uid(), 'offices.upload'));

-- companies
DROP POLICY IF EXISTS "companies_upload_perm" ON storage.objects;
CREATE POLICY "companies_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'companies' AND public.has_permission(auth.uid(), 'companies.upload'));
DROP POLICY IF EXISTS "companies_delete_upload_perm" ON storage.objects;
CREATE POLICY "companies_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'companies' AND public.has_permission(auth.uid(), 'companies.upload'));

-- payment-receipts
DROP POLICY IF EXISTS "payment_receipts_upload_perm" ON storage.objects;
CREATE POLICY "payment_receipts_upload_perm" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts' AND public.has_permission(auth.uid(), 'payments.upload_receipt'));
DROP POLICY IF EXISTS "payment_receipts_delete_upload_perm" ON storage.objects;
CREATE POLICY "payment_receipts_delete_upload_perm" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.has_permission(auth.uid(), 'payments.upload_receipt'));
