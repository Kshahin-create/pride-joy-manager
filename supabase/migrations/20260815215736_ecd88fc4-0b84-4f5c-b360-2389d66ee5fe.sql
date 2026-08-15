-- 1) permission keys
INSERT INTO public.app_permissions (key, module, module_label, action, label, description, sort_order) VALUES
  ('files.delete','files','الملفات والصور','delete','حذف أي صور وملفات (كل الأقسام)','يسمح بحذف أو استبدال أي صورة أو ملف في جميع الأقسام',1),
  ('files.archive','files','الملفات والصور','archive','أرشفة الصور والملفات','يسمح بأرشفة سجلات المرفقات',2),
  ('assets.file_delete','assets','الأصول','file_delete','حذف صور وملفات الأصول',NULL,810),
  ('maintenance.file_delete','maintenance','الصيانة','file_delete','حذف صور وملفات الصيانة',NULL,710),
  ('cleaning.file_delete','cleaning','النظافة','file_delete','حذف صور النظافة',NULL,1110),
  ('inspections.file_delete','inspections','التفتيشات','file_delete','حذف صور التفتيش',NULL,910),
  ('parking.file_delete','parking','المواقف','file_delete','حذف صور المواقف',NULL,1010),
  ('incidents.file_delete','incidents','الحوادث الأمنية','file_delete','حذف صور الحوادث',NULL,10),
  ('patrols.file_delete','patrols','الجولات الأمنية','file_delete','حذف صور الجولات',NULL,10),
  ('guards.file_delete','guards','الحراس','file_delete','حذف صور الحراس',NULL,10),
  ('documents.file_delete','documents','المستندات','file_delete','حذف ملفات المستندات',NULL,1410),
  ('contracts.file_delete','contracts','العقود','file_delete','حذف مرفقات العقود',NULL,310),
  ('expenses.file_delete','expenses','المصروفات','file_delete','حذف مرفقات المصروفات',NULL,510),
  ('offices.file_delete','offices','المكاتب','file_delete','حذف ملفات المكاتب',NULL,110),
  ('tenants.file_delete','tenants','العملاء/المستأجرون','file_delete','حذف مرفقات المستأجرين',NULL,210),
  ('invoices.file_delete','invoices','المدفوعات','file_delete','حذف مرفقات المدفوعات',NULL,410)
ON CONFLICT (key) DO NOTHING;

-- 2) helper
CREATE OR REPLACE FUNCTION public.can_delete_files(_uid uuid, _mod text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.has_role(_uid,'super_admin')
      OR public.has_permission(_uid, 'files.delete')
      OR public.has_permission(_uid, _mod || '.file_delete')
      OR public.has_permission(_uid, _mod || '.delete')
      OR public.has_permission(_uid, _mod || '.manage')
      OR public.has_permission(_uid, _mod || '.edit')
$$;

-- 3) storage policies (delete + update/replace) per bucket
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN
    SELECT * FROM (VALUES
      ('asset-photos','assets'),
      ('cleaning-contracts','contracts'),
      ('cleaning-photos','cleaning'),
      ('companies','tenants'),
      ('contracts','contracts'),
      ('documents','documents'),
      ('expense-attachments','expenses'),
      ('guards-photos','guards'),
      ('incident-photos','incidents'),
      ('inspection-photos','inspections'),
      ('maintenance-photos','maintenance'),
      ('office-files','offices'),
      ('parking-photos','parking'),
      ('patrol-photos','patrols'),
      ('payment-receipts','invoices')
    ) AS t(bucket, module)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', m.bucket || '_files_delete');
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND public.can_delete_files(auth.uid(), %L))$f$,
      m.bucket || '_files_delete', m.bucket, m.module);

    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', m.bucket || '_files_update');
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND public.can_delete_files(auth.uid(), %L))
      WITH CHECK (bucket_id = %L AND public.can_delete_files(auth.uid(), %L))$f$,
      m.bucket || '_files_update', m.bucket, m.module, m.bucket, m.module);
  END LOOP;
END $$;

-- 4) attachment table delete policies
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('asset_attachments','assets'),
      ('maintenance_request_attachments','maintenance'),
      ('contract_attachments','contracts'),
      ('ac_contract_attachments','contracts'),
      ('cleaning_contract_attachments','contracts'),
      ('elevator_contract_attachments','contracts'),
      ('fire_contract_attachments','contracts'),
      ('supply_contract_attachments','contracts'),
      ('company_attachments','tenants'),
      ('expense_attachments','expenses'),
      ('office_files','offices'),
      ('documents','documents')
    ) AS x(tbl, module)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.tbl || '_files_delete', t.tbl);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR DELETE TO authenticated
      USING (public.can_delete_files(auth.uid(), %L))$f$,
      t.tbl || '_files_delete', t.tbl, t.module);
  END LOOP;
END $$;
