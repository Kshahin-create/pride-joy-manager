
-- Helper: single upload/create/edit permission check
CREATE OR REPLACE FUNCTION public.can_upload_module(_uid uuid, _mod text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_uid,'super_admin')
      OR public.has_permission(_uid, _mod || '.upload')
      OR public.has_permission(_uid, _mod || '.create')
      OR public.has_permission(_uid, _mod || '.edit')
      OR public.has_permission(_uid, _mod || '.manage')
$$;

CREATE OR REPLACE FUNCTION public.can_view_module(_uid uuid, _mod text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_uid,'super_admin')
      OR public.has_permission(_uid, _mod || '.view')
      OR public.has_permission(_uid, _mod || '.edit')
      OR public.has_permission(_uid, _mod || '.create')
      OR public.has_permission(_uid, _mod || '.manage')
      OR public.has_permission(_uid, _mod || '.upload')
$$;

-- Generic unified attachment policies per table.
-- Naming: <table>_unified_{ins,sel,del,upd}
DO $$
DECLARE
  r RECORD;
  tables_modules TEXT[][] := ARRAY[
    ARRAY['asset_attachments','assets'],
    ARRAY['maintenance_request_attachments','maintenance'],
    ARRAY['contract_attachments','contracts'],
    ARRAY['cleaning_contract_attachments','contracts'],
    ARRAY['ac_contract_attachments','contracts'],
    ARRAY['elevator_contract_attachments','contracts'],
    ARRAY['fire_contract_attachments','contracts'],
    ARRAY['supply_contract_attachments','contracts'],
    ARRAY['office_files','offices'],
    ARRAY['company_attachments','tenants'],
    ARRAY['expense_attachments','expenses'],
    ARRAY['inspection_results','inspections'],
    ARRAY['cleaning_logs','cleaning'],
    ARRAY['parking_maintenance_checks','parking'],
    ARRAY['parking_cleaning_logs','parking'],
    ARRAY['parking_violations','parking'],
    ARRAY['patrol_checkpoints','patrols']
  ];
  t TEXT; m TEXT;
BEGIN
  FOR i IN 1..array_length(tables_modules,1) LOOP
    t := tables_modules[i][1];
    m := tables_modules[i][2];

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_unified_ins', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_unified_sel', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_unified_del', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_unified_upd', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_upload_module(auth.uid(), %L))',
      t||'_unified_ins', t, m);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_view_module(auth.uid(), %L))',
      t||'_unified_sel', t, m);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_upload_module(auth.uid(), %L))',
      t||'_unified_del', t, m);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_upload_module(auth.uid(), %L)) WITH CHECK (public.can_upload_module(auth.uid(), %L))',
      t||'_unified_upd', t, m, m);
  END LOOP;
END $$;

-- Storage buckets: add a unified INSERT/SELECT/DELETE policy that accepts
-- any of upload/create/edit/manage on the mapped module (super_admin included).
DO $$
DECLARE
  buckets_modules TEXT[][] := ARRAY[
    ARRAY['asset-photos','assets'],
    ARRAY['maintenance-photos','maintenance'],
    ARRAY['inspection-photos','inspections'],
    ARRAY['cleaning-photos','cleaning'],
    ARRAY['parking-photos','parking'],
    ARRAY['incident-photos','incidents'],
    ARRAY['patrol-photos','patrols'],
    ARRAY['guards-photos','guards'],
    ARRAY['documents','documents'],
    ARRAY['contracts','contracts'],
    ARRAY['cleaning-contracts','contracts'],
    ARRAY['office-files','offices'],
    ARRAY['companies','tenants'],
    ARRAY['expense-attachments','expenses'],
    ARRAY['payment-receipts','invoices']
  ];
  b TEXT; m TEXT;
BEGIN
  FOR i IN 1..array_length(buckets_modules,1) LOOP
    b := buckets_modules[i][1];
    m := buckets_modules[i][2];

    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b||'_unified_ins');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b||'_unified_sel');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b||'_unified_del');

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND public.can_upload_module(auth.uid(), %L))',
      b||'_unified_ins', b, m);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L AND public.can_view_module(auth.uid(), %L))',
      b||'_unified_sel', b, m);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L AND public.can_upload_module(auth.uid(), %L))',
      b||'_unified_del', b, m);
  END LOOP;
END $$;

-- Ensure the upload permission keys exist for modules referenced above
INSERT INTO public.app_permissions(key, module, module_label, action, label)
VALUES
  ('assets.upload','assets','الأصول','upload','رفع صور/ملفات الأصول'),
  ('maintenance.upload','maintenance','الصيانة','upload','رفع صور/ملفات الصيانة'),
  ('contracts.upload','contracts','العقود','upload','رفع مرفقات العقود'),
  ('offices.upload','offices','المكاتب','upload','رفع ملفات المكاتب'),
  ('tenants.upload','tenants','المستأجرين','upload','رفع مرفقات المستأجرين'),
  ('expenses.upload','expenses','المصروفات','upload','رفع مرفقات المصروفات'),
  ('inspections.upload','inspections','التفتيش','upload','رفع صور التفتيش'),
  ('cleaning.upload','cleaning','النظافة','upload','رفع صور النظافة'),
  ('parking.upload','parking','المواقف','upload','رفع صور المواقف'),
  ('incidents.upload','incidents','الحوادث الأمنية','upload','رفع صور الحوادث الأمنية'),
  ('patrols.upload','patrols','الجولات الأمنية','upload','رفع صور الجولات'),
  ('guards.upload','guards','الحراس','upload','رفع صور الحراس'),
  ('documents.upload','documents','المستندات','upload','رفع مستندات'),
  ('invoices.upload','invoices','المدفوعات','upload','رفع مرفقات المدفوعات')
ON CONFLICT (key) DO NOTHING;
