
-- 1) New per-module "delete records" permission keys
INSERT INTO public.app_permissions (key, label, module, module_label, action, sort_order) VALUES
  ('cleaning.delete',     'حذف سجلات النظافة',        'cleaning',      'النظافة',            'delete', 1103),
  ('parking.delete',      'حذف مدخلات المواقف',        'parking',       'المواقف',            'delete', 1203),
  ('pm_plans.delete',     'حذف خطط الصيانة الوقائية',  'pm_plans',      'الصيانة الوقائية',   'delete', 1303),
  ('spaces.delete',       'حذف المساحات',              'spaces',        'المساحات',           'delete', 1403),
  ('guards.delete',       'حذف الحراس',                'guards',        'الحراس',             'delete', 1503),
  ('incidents.delete',    'حذف الحوادث الأمنية',       'incidents',     'الحوادث الأمنية',    'delete', 1603),
  ('patrols.delete',      'حذف الجولات الأمنية',       'patrols',       'الجولات الأمنية',    'delete', 1653),
  ('invoices.delete',     'حذف الفواتير والمدفوعات',   'invoices',      'المدفوعات',          'delete', 1703),
  ('building_log.delete', 'حذف سجلات البرج',           'building_log',  'سجل البرج',          'delete', 1753),
  ('cameras.delete',      'حذف الكاميرات',             'security',      'الأمن',              'delete', 1803),
  ('network_points.delete','حذف نقاط الشبكة',          'assets',        'الأصول',             'delete', 1853),
  ('electricity.delete',  'حذف العدادات والقراءات',    'assets',        'الأصول',             'delete', 1863),
  ('ac_units.delete',     'حذف وحدات التكييف',         'assets',        'الأصول',             'delete', 1873),
  ('vendor_payments.delete','حذف مدفوعات الموردين',    'vendors',       'الموردون',           'delete', 1883)
ON CONFLICT (key) DO NOTHING;

-- 2) Grant them all to super_admin role(s)
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM public.app_roles r
CROSS JOIN (VALUES
  ('cleaning.delete'),('parking.delete'),('pm_plans.delete'),('spaces.delete'),
  ('guards.delete'),('incidents.delete'),('patrols.delete'),('invoices.delete'),
  ('building_log.delete'),('cameras.delete'),('network_points.delete'),
  ('electricity.delete'),('ac_units.delete'),('vendor_payments.delete')
) AS p(key)
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- 3) Uniform DELETE policies driven by those permissions
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
    ('cleaning_logs','cleaning.delete'),
    ('cleaning_plans','cleaning.delete'),
    ('parking_cleaning_logs','parking.delete'),
    ('parking_maintenance_checks','parking.delete'),
    ('parking_spots','parking.delete'),
    ('parking_violations','parking.delete'),
    ('pm_plans','pm_plans.delete'),
    ('spaces','spaces.delete'),
    ('guards','guards.delete'),
    ('guard_attendance','guards.delete'),
    ('guard_evaluations','guards.delete'),
    ('guard_leaves','guards.delete'),
    ('guard_penalties_rewards','guards.delete'),
    ('guard_trainings','guards.delete'),
    ('security_incidents','incidents.delete'),
    ('patrols','patrols.delete'),
    ('patrol_checkpoints','patrols.delete'),
    ('invoices','invoices.delete'),
    ('payments','invoices.delete'),
    ('building_log','building_log.delete'),
    ('cameras','cameras.delete'),
    ('camera_maintenance_logs','cameras.delete'),
    ('network_points','network_points.delete'),
    ('electricity_meters','electricity.delete'),
    ('electricity_readings','electricity.delete'),
    ('ac_units','ac_units.delete'),
    ('vendor_payments','vendor_payments.delete'),
    ('vendor_evaluations','vendor_payments.delete')
  ) AS v(tbl, perm)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.tbl || '_perm_delete', t.tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), %L))',
      t.tbl || '_perm_delete', t.tbl, t.perm
    );
  END LOOP;
END $$;
