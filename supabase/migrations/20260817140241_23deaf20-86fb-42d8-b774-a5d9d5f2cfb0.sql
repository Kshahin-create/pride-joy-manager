-- ============ 1) Add missing permission keys (unified matrix) ============
INSERT INTO public.app_permissions (key, action, label, module, module_label, sort_order) VALUES
-- assets sub-modules split out
('network_points.view','view','عرض نقاط الشبكة','network_points','نقاط الشبكة',1850),
('network_points.create','create','إضافة نقطة شبكة','network_points','نقاط الشبكة',1851),
('network_points.edit','edit','تعديل نقاط الشبكة','network_points','نقاط الشبكة',1852),
('electricity.view','view','عرض العدادات والقراءات','electricity','الكهرباء',1860),
('electricity.create','create','إضافة عداد/قراءة','electricity','الكهرباء',1861),
('electricity.edit','edit','تعديل العدادات والقراءات','electricity','الكهرباء',1862),
('ac_units.view','view','عرض وحدات التكييف','ac_units','التكييف',1870),
('ac_units.create','create','إضافة وحدة تكييف','ac_units','التكييف',1871),
('ac_units.edit','edit','تعديل وحدات التكييف','ac_units','التكييف',1872),
-- building log
('building_log.create','create','إضافة سجل برج','building_log','سجل البرج',31),
('building_log.edit','edit','تعديل سجل البرج','building_log','سجل البرج',32),
-- cleaning
('cleaning.create','create','إضافة خطة/سجل نظافة','cleaning','النظافة',1101),
('cleaning.edit','edit','تعديل النظافة','cleaning','النظافة',1102),
-- tickets
('tickets.reopen','special','إعادة فتح التذاكر','complaints','الشكاوى والبلاغات',1306),
('tickets.upload','upload','رفع مرفقات التذاكر','complaints','الشكاوى والبلاغات',1310),
('tickets.file_delete','file_delete','حذف مرفقات التذاكر','complaints','الشكاوى والبلاغات',1311),
-- service contracts (AC / elevators / fire / supply / cleaning contracts)
('service_contracts.view','view','عرض عقود الخدمات','service_contracts','عقود الخدمات',330),
('service_contracts.create','create','إضافة عقد خدمة','service_contracts','عقود الخدمات',331),
('service_contracts.edit','edit','تعديل عقود الخدمات','service_contracts','عقود الخدمات',332),
('service_contracts.delete','delete','حذف عقود الخدمات','service_contracts','عقود الخدمات',333),
('service_contracts.upload','upload','رفع مرفقات عقود الخدمات','service_contracts','عقود الخدمات',334),
('service_contracts.file_delete','file_delete','حذف مرفقات عقود الخدمات','service_contracts','عقود الخدمات',335),
-- employees attachments
('employees.upload','upload','رفع ملفات الموظفين','employees','الموظفون',1210),
('employees.file_delete','file_delete','حذف ملفات الموظفين','employees','الموظفون',1211),
-- payments module
('payments.view','view','عرض الدفعات','payments','الدفعات',700),
('payments.create','create','إضافة دفعة','payments','الدفعات',701),
('payments.edit','edit','تعديل الدفعات','payments','الدفعات',702),
('payments.upload','upload','رفع إيصالات الدفع','payments','الدفعات',710),
('payments.file_delete','file_delete','حذف إيصالات الدفع','payments','الدفعات',711),
-- vendor payments module
('vendor_payments.view','view','عرض مدفوعات الموردين','vendor_payments','مدفوعات الموردين',1880),
('vendor_payments.create','create','إضافة سداد لمورد','vendor_payments','مدفوعات الموردين',1881),
('vendor_payments.edit','edit','تعديل مدفوعات الموردين','vendor_payments','مدفوعات الموردين',1882),
('vendor_payments.upload','upload','رفع مرفقات مدفوعات الموردين','vendor_payments','مدفوعات الموردين',1884),
('vendor_payments.file_delete','file_delete','حذف مرفقات مدفوعات الموردين','vendor_payments','مدفوعات الموردين',1885),
-- vendors extras
('vendors.upload','upload','رفع ملفات الموردين','vendors','الموردون',610),
('vendors.file_delete','file_delete','حذف ملفات الموردين','vendors','الموردون',611),
('vendors.evaluate','special','تقييم الموردين','vendors','الموردون',605),
-- patrols / cameras / visitors / parking / pm_plans / spaces splits
('patrols.edit','edit','تعديل الجولات الأمنية','patrols','الجولات الأمنية',1012),
('cameras.create','create','إضافة كاميرا','cameras','الكاميرات',1801),
('cameras.edit','edit','تعديل الكاميرات','cameras','الكاميرات',1802),
('visitors.create','create','إضافة زائر','visitors','الزوار',1204),
('visitors.edit','edit','تعديل بيانات الزوار','visitors','الزوار',1205),
('parking.create','create','إضافة مدخلات المواقف','parking','المواقف',1201),
('parking.edit','edit','تعديل مدخلات المواقف','parking','المواقف',1202),
('pm_plans.create','create','إضافة خطة صيانة وقائية','pm_plans','الصيانة الوقائية',751),
('pm_plans.edit','edit','تعديل خطط الصيانة الوقائية','pm_plans','الصيانة الوقائية',752),
('pm_plans.generate','special','توليد أوامر عمل من الخطط','pm_plans','الصيانة الوقائية',754),
('spaces.create','create','إضافة مساحة','spaces','المساحات',111),
('spaces.edit','edit','تعديل المساحات','spaces','المساحات',112),
-- archive/trash purge (renamed concept)
('records.purge','delete','حذف نهائي من الأرشيف/سلة المهملات','records','السجلات',903)
ON CONFLICT (key) DO NOTHING;

-- ============ 2) Migrate existing role grants to the new keys ============
-- *.manage -> create/edit/delete/view
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT rp.role_id, m.newkey
FROM public.role_permissions rp
JOIN (VALUES
  ('cleaning.manage','cleaning.create'),('cleaning.manage','cleaning.edit'),('cleaning.manage','cleaning.delete'),('cleaning.manage','cleaning.view'),
  ('spaces.manage','spaces.create'),('spaces.manage','spaces.edit'),('spaces.manage','spaces.delete'),('spaces.manage','spaces.view'),
  ('pm_plans.manage','pm_plans.create'),('pm_plans.manage','pm_plans.edit'),('pm_plans.manage','pm_plans.delete'),('pm_plans.manage','pm_plans.view'),('pm_plans.manage','pm_plans.generate'),
  ('parking.manage','parking.create'),('parking.manage','parking.edit'),('parking.manage','parking.delete'),('parking.manage','parking.view'),
  ('cameras.manage','cameras.create'),('cameras.manage','cameras.edit'),('cameras.manage','cameras.delete'),('cameras.manage','cameras.view'),
  ('security.upload_guard','guards.upload'),
  ('security.upload_patrol','patrols.upload'),
  ('security.upload_incident','incidents.upload'),
  ('companies.upload','tenants.upload'),
  ('payments.upload_receipt','payments.upload'),
  ('payments.record','payments.view'),('payments.record','payments.create'),
  ('payments.delete','payments.delete'),
  ('vendor_payments.record','vendor_payments.view'),('vendor_payments.record','vendor_payments.create'),
  ('records.delete','records.purge'),
  ('visitors.checkin','visitors.create'),('visitors.checkout','visitors.edit'),
  ('patrols.create','patrols.edit'),
  ('contracts.view','service_contracts.view'),('contracts.create','service_contracts.create'),
  ('contracts.edit','service_contracts.edit'),('contracts.delete','service_contracts.delete'),
  ('contracts.upload','service_contracts.upload'),('contracts.file_delete','service_contracts.file_delete'),
  ('employees.create','employees.upload'),('employees.edit','employees.upload'),('employees.delete','employees.file_delete'),
  ('vendors.create','vendors.upload'),('vendors.edit','vendors.upload'),('vendors.edit','vendors.evaluate'),('vendors.delete','vendors.file_delete'),
  ('tickets.create','tickets.upload'),('tickets.edit','tickets.upload'),('tickets.delete','tickets.file_delete'),('tickets.close','tickets.reopen'),
  ('invoices.view','payments.view'),('invoices.create','payments.create'),('invoices.edit','payments.edit'),
  ('invoices.upload','payments.upload'),('invoices.file_delete','payments.file_delete')
) AS m(oldkey,newkey) ON m.oldkey = rp.permission_key
WHERE EXISTS (SELECT 1 FROM public.app_permissions ap WHERE ap.key = m.newkey)
ON CONFLICT DO NOTHING;

-- files.delete / files.archive -> every module file_delete
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT rp.role_id, ap.key
FROM public.role_permissions rp
CROSS JOIN public.app_permissions ap
WHERE rp.permission_key = 'files.delete' AND ap.action = 'file_delete'
ON CONFLICT DO NOTHING;

-- ============ 3) Re-home scattered keys into their real modules ============
UPDATE public.app_permissions SET module='guards', module_label='الحراس'
  WHERE key IN ('guards.view','guards.create','guards.edit','guards.delete','guards.view_salary','guards.edit_salary','guards.manage_attendance','guards.upload','guards.file_delete');
UPDATE public.app_permissions SET module='patrols', module_label='الجولات الأمنية'
  WHERE key LIKE 'patrols.%';
UPDATE public.app_permissions SET module='incidents', module_label='الحوادث الأمنية'
  WHERE key LIKE 'incidents.%';
UPDATE public.app_permissions SET module='cameras', module_label='الكاميرات'
  WHERE key LIKE 'cameras.%';
UPDATE public.app_permissions SET module='network_points', module_label='نقاط الشبكة' WHERE key LIKE 'network_points.%';
UPDATE public.app_permissions SET module='electricity', module_label='الكهرباء' WHERE key LIKE 'electricity.%';
UPDATE public.app_permissions SET module='ac_units', module_label='التكييف' WHERE key LIKE 'ac_units.%';
UPDATE public.app_permissions SET module='tenants', module_label='العملاء/المستأجرون' WHERE key LIKE 'tenants.%';
UPDATE public.app_permissions SET module='invoices', module_label='الفواتير' WHERE key LIKE 'invoices.%';
UPDATE public.app_permissions SET module='payments', module_label='الدفعات' WHERE key LIKE 'payments.%';
UPDATE public.app_permissions SET module='vendor_payments', module_label='مدفوعات الموردين' WHERE key LIKE 'vendor_payments.%';
UPDATE public.app_permissions SET action='delete' WHERE key IN ('payments.delete','vendor_payments.delete');
UPDATE public.app_permissions SET action='create' WHERE key='payments.record';
UPDATE public.app_permissions SET label='حذف الأرشيف نهائياً (سلة المهملات)' WHERE key='records.purge';

-- ============ 4) Drop ambiguous / duplicated keys (grants already migrated) ============
DELETE FROM public.app_permissions WHERE key IN (
  'cleaning.manage','spaces.manage','pm_plans.manage','parking.manage','cameras.manage',
  'security.upload_guard','security.upload_patrol','security.upload_incident',
  'companies.upload','payments.upload_receipt','files.delete','files.archive','records.delete'
);

-- ============ 5) Keep purge-aware RPCs working ============
CREATE OR REPLACE FUNCTION public.delete_record(_table text, _id uuid, _reason text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_name text; v_uid uuid := auth.uid(); v_mod text;
BEGIN
  IF NOT public._is_archivable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح بحذفه';
  END IF;
  v_mod := public._module_for_table(_table);
  IF NOT (
    public.has_role(v_uid,'super_admin')
    OR public.has_permission(v_uid,'records.purge')
    OR (v_mod IS NOT NULL AND public.has_permission(v_uid, v_mod || '.delete'))
  ) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الحذف';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id, reason)
  VALUES (_table, _id, v_name, 'delete', v_uid, _reason);
  BEGIN
    EXECUTE format('DELETE FROM public.%I WHERE id = $1', _table) USING _id;
  EXCEPTION WHEN foreign_key_violation THEN
    DELETE FROM public.audit_log
      WHERE entity_type=_table AND entity_id=_id AND action='delete' AND actor_id=v_uid
      AND created_at > now() - interval '5 seconds';
    RAISE EXCEPTION 'لا يمكن حذف هذا العنصر لأنه مرتبط ببيانات أخرى. يمكنك أرشفته بدلاً من حذفه.';
  END;
END $function$;