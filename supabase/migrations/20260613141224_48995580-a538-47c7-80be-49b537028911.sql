
-- ============================================================
-- المرحلة 1: نظام الأدوار والصلاحيات الديناميكي
-- جداول جديدة + seed + دالة has_permission + ترحيل المستخدمين
-- الجداول والدوال القديمة (user_roles, has_role) تفضل شغالة بدون لمس
-- ============================================================

-- 1) جدول الأدوار
CREATE TABLE public.app_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
GRANT SELECT ON public.app_roles TO authenticated;
GRANT ALL ON public.app_roles TO service_role;
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read roles" ON public.app_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_admin manages roles" ON public.app_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- 2) جدول الصلاحيات (catalog ثابت)
CREATE TABLE public.app_permissions (
  key TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  module_label TEXT NOT NULL,
  action TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.app_permissions TO authenticated;
GRANT ALL ON public.app_permissions TO service_role;
ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read permissions" ON public.app_permissions FOR SELECT TO authenticated USING (true);

-- 3) جدول ربط الدور بالصلاحيات
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.app_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.app_permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_admin manages role_permissions" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- 4) جدول ربط المستخدم بالأدوار
CREATE TABLE public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.app_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE (user_id, role_id)
);
GRANT SELECT ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.user_role_assignments TO service_role;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own assignments" ON public.user_role_assignments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "super_admin manages assignments" ON public.user_role_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- 5) trigger updated_at على app_roles
CREATE TRIGGER trg_app_roles_updated_at BEFORE UPDATE ON public.app_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) دالة has_permission — الأساس الجديد
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.app_roles r ON r.id = ura.role_id
    LEFT JOIN public.role_permissions rp ON rp.role_id = ura.role_id AND rp.permission_key = _permission_key
    WHERE ura.user_id = _user_id
      AND (r.name = 'super_admin' OR rp.permission_key IS NOT NULL)
  )
$$;

-- 7) دالة لجلب كل صلاحيات المستخدم (للواجهة)
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH is_super AS (
    SELECT EXISTS(
      SELECT 1 FROM public.user_role_assignments ura
      JOIN public.app_roles r ON r.id = ura.role_id
      WHERE ura.user_id = auth.uid() AND r.name = 'super_admin'
    ) AS super
  )
  SELECT key FROM public.app_permissions WHERE (SELECT super FROM is_super)
  UNION
  SELECT DISTINCT rp.permission_key
  FROM public.user_role_assignments ura
  JOIN public.role_permissions rp ON rp.role_id = ura.role_id
  WHERE ura.user_id = auth.uid();
$$;

-- 8) seed: كل الصلاحيات
INSERT INTO public.app_permissions (key, module, module_label, action, label, sort_order) VALUES
-- Dashboard
('dashboard.view', 'dashboard', 'لوحة التحكم', 'view', 'عرض لوحة التحكم', 10),
-- Building Map
('building_map.view', 'building_map', 'خريطة البرج', 'view', 'عرض خريطة البرج', 20),
-- Building Log
('building_log.view', 'building_log', 'سجل البرج', 'view', 'عرض سجل البرج', 30),
-- Daily Report
('daily_report.view', 'daily_report', 'التقرير اليومي', 'view', 'عرض التقرير اليومي', 40),
-- Offices
('offices.view', 'offices', 'المكاتب', 'view', 'عرض المكاتب', 100),
('offices.create', 'offices', 'المكاتب', 'create', 'إضافة مكتب', 101),
('offices.edit', 'offices', 'المكاتب', 'edit', 'تعديل المكاتب', 102),
('offices.delete', 'offices', 'المكاتب', 'delete', 'حذف المكاتب', 103),
('offices.change_status', 'offices', 'المكاتب', 'special', 'تغيير حالة المكتب', 104),
-- Spaces
('spaces.view', 'spaces', 'المساحات', 'view', 'عرض المساحات', 110),
('spaces.manage', 'spaces', 'المساحات', 'manage', 'إدارة المساحات', 111),
-- Tenants (companies)
('tenants.view', 'tenants', 'العملاء/المستأجرون', 'view', 'عرض العملاء', 200),
('tenants.create', 'tenants', 'العملاء/المستأجرون', 'create', 'إضافة عميل', 201),
('tenants.edit', 'tenants', 'العملاء/المستأجرون', 'edit', 'تعديل العملاء', 202),
('tenants.delete', 'tenants', 'العملاء/المستأجرون', 'delete', 'حذف العملاء', 203),
-- Contracts
('contracts.view', 'contracts', 'العقود', 'view', 'عرض العقود', 300),
('contracts.create', 'contracts', 'العقود', 'create', 'إضافة عقد', 301),
('contracts.edit', 'contracts', 'العقود', 'edit', 'تعديل العقود', 302),
('contracts.delete', 'contracts', 'العقود', 'delete', 'حذف العقود', 303),
('contracts.renew', 'contracts', 'العقود', 'special', 'تجديد العقود', 304),
('contracts.cancel', 'contracts', 'العقود', 'special', 'إلغاء العقود', 305),
-- Invoices
('invoices.view', 'finance', 'المالية', 'view', 'عرض الفواتير', 400),
('invoices.create', 'finance', 'المالية', 'create', 'إنشاء فاتورة', 401),
('invoices.edit', 'finance', 'المالية', 'edit', 'تعديل الفواتير', 402),
('invoices.delete', 'finance', 'المالية', 'delete', 'حذف الفواتير', 403),
('payments.record', 'finance', 'المالية', 'special', 'تسجيل دفعة', 404),
('payments.delete', 'finance', 'المالية', 'special', 'حذف دفعة', 405),
-- Expenses
('expenses.view', 'expenses', 'المصروفات', 'view', 'عرض المصروفات', 500),
('expenses.create', 'expenses', 'المصروفات', 'create', 'إضافة مصروف', 501),
('expenses.edit', 'expenses', 'المصروفات', 'edit', 'تعديل المصروفات', 502),
('expenses.delete', 'expenses', 'المصروفات', 'delete', 'حذف المصروفات', 503),
('expenses.approve', 'expenses', 'المصروفات', 'special', 'اعتماد المصروفات', 504),
('expenses.reject', 'expenses', 'المصروفات', 'special', 'رفض المصروفات', 505),
('expenses.pay', 'expenses', 'المصروفات', 'special', 'دفع المصروفات', 506),
-- Vendors
('vendors.view', 'vendors', 'الموردون', 'view', 'عرض الموردين', 600),
('vendors.create', 'vendors', 'الموردون', 'create', 'إضافة مورد', 601),
('vendors.edit', 'vendors', 'الموردون', 'edit', 'تعديل الموردين', 602),
('vendors.delete', 'vendors', 'الموردون', 'delete', 'حذف الموردين', 603),
('vendor_payments.record', 'vendors', 'الموردون', 'special', 'تسجيل سداد لمورد', 604),
-- Maintenance (work orders)
('maintenance.view', 'maintenance', 'الصيانة', 'view', 'عرض أوامر العمل', 700),
('maintenance.create', 'maintenance', 'الصيانة', 'create', 'إنشاء أمر عمل', 701),
('maintenance.edit', 'maintenance', 'الصيانة', 'edit', 'تعديل أوامر العمل', 702),
('maintenance.delete', 'maintenance', 'الصيانة', 'delete', 'حذف أوامر العمل', 703),
('maintenance.assign', 'maintenance', 'الصيانة', 'special', 'إسناد أمر عمل لفني', 704),
('maintenance.close', 'maintenance', 'الصيانة', 'special', 'إغلاق أمر عمل', 705),
('maintenance.reopen', 'maintenance', 'الصيانة', 'special', 'إعادة فتح أمر عمل مغلق', 706),
-- PM Plans
('pm_plans.view', 'pm_plans', 'الصيانة الوقائية', 'view', 'عرض خطط الصيانة الوقائية', 750),
('pm_plans.manage', 'pm_plans', 'الصيانة الوقائية', 'manage', 'إدارة خطط الصيانة الوقائية', 751),
-- Assets
('assets.view', 'assets', 'الأصول', 'view', 'عرض الأصول', 800),
('assets.create', 'assets', 'الأصول', 'create', 'إضافة أصل', 801),
('assets.edit', 'assets', 'الأصول', 'edit', 'تعديل الأصول', 802),
('assets.delete', 'assets', 'الأصول', 'delete', 'حذف الأصول', 803),
-- Inspections
('inspections.view', 'inspections', 'التفتيشات', 'view', 'عرض التفتيشات', 900),
('inspections.create', 'inspections', 'التفتيشات', 'create', 'إنشاء تفتيش', 901),
('inspections.edit', 'inspections', 'التفتيشات', 'edit', 'تعديل التفتيشات', 902),
('inspections.delete', 'inspections', 'التفتيشات', 'delete', 'حذف التفتيشات', 903),
('inspections.manage_templates', 'inspections', 'التفتيشات', 'special', 'إدارة قوالب التفتيش', 904),
-- Security: Guards
('guards.view', 'security', 'الأمن', 'view', 'عرض الحراس', 1000),
('guards.create', 'security', 'الأمن', 'create', 'إضافة حارس', 1001),
('guards.edit', 'security', 'الأمن', 'edit', 'تعديل بيانات الحراس', 1002),
('guards.delete', 'security', 'الأمن', 'delete', 'حذف حارس', 1003),
('guards.view_salary', 'security', 'الأمن', 'special', 'عرض رواتب الحراس', 1004),
('guards.edit_salary', 'security', 'الأمن', 'special', 'تعديل رواتب الحراس', 1005),
('guards.manage_attendance', 'security', 'الأمن', 'special', 'إدارة الحضور والإجازات', 1006),
-- Patrols
('patrols.view', 'security', 'الأمن', 'view', 'عرض الجولات الأمنية', 1010),
('patrols.create', 'security', 'الأمن', 'create', 'تسجيل جولة', 1011),
-- Incidents
('incidents.view', 'security', 'الأمن', 'view', 'عرض الحوادث الأمنية', 1020),
('incidents.create', 'security', 'الأمن', 'create', 'تسجيل حادث', 1021),
('incidents.edit', 'security', 'الأمن', 'edit', 'تعديل الحوادث', 1022),
('incidents.close', 'security', 'الأمن', 'special', 'إغلاق الحوادث', 1023),
-- Cameras
('cameras.view', 'security', 'الأمن', 'view', 'عرض الكاميرات', 1030),
('cameras.manage', 'security', 'الأمن', 'manage', 'إدارة الكاميرات', 1031),
-- Parking
('parking.view', 'parking', 'المواقف', 'view', 'عرض المواقف', 1100),
('parking.manage', 'parking', 'المواقف', 'manage', 'إدارة المواقف', 1101),
('parking.violations', 'parking', 'المواقف', 'special', 'تسجيل مخالفات المواقف', 1102),
-- Visitors
('visitors.view', 'visitors', 'الزوار', 'view', 'عرض الزوار', 1200),
('visitors.checkin', 'visitors', 'الزوار', 'create', 'تسجيل دخول زائر', 1201),
('visitors.checkout', 'visitors', 'الزوار', 'edit', 'تسجيل خروج زائر', 1202),
('visitors.delete', 'visitors', 'الزوار', 'delete', 'حذف زائر', 1203),
-- Tickets / Complaints
('tickets.view', 'complaints', 'الشكاوى والبلاغات', 'view', 'عرض التذاكر', 1300),
('tickets.create', 'complaints', 'الشكاوى والبلاغات', 'create', 'إنشاء تذكرة', 1301),
('tickets.edit', 'complaints', 'الشكاوى والبلاغات', 'edit', 'تعديل التذاكر', 1302),
('tickets.delete', 'complaints', 'الشكاوى والبلاغات', 'delete', 'حذف التذاكر', 1303),
('tickets.assign', 'complaints', 'الشكاوى والبلاغات', 'special', 'إسناد التذاكر', 1304),
('tickets.close', 'complaints', 'الشكاوى والبلاغات', 'special', 'إغلاق التذاكر', 1305),
-- Documents
('documents.view', 'documents', 'المستندات', 'view', 'عرض المستندات', 1400),
('documents.create', 'documents', 'المستندات', 'create', 'رفع مستند', 1401),
('documents.edit', 'documents', 'المستندات', 'edit', 'تعديل المستندات', 1402),
('documents.delete', 'documents', 'المستندات', 'delete', 'حذف المستندات', 1403),
-- Cleaning
('cleaning.view', 'cleaning', 'النظافة', 'view', 'عرض سجلات النظافة', 1500),
('cleaning.manage', 'cleaning', 'النظافة', 'manage', 'إدارة النظافة', 1501),
-- Users & Roles
('users.view', 'users', 'إدارة المستخدمين', 'view', 'عرض المستخدمين', 1600),
('users.create', 'users', 'إدارة المستخدمين', 'create', 'إضافة مستخدم', 1601),
('users.edit', 'users', 'إدارة المستخدمين', 'edit', 'تعديل المستخدمين', 1602),
('users.delete', 'users', 'إدارة المستخدمين', 'delete', 'حذف مستخدم', 1603),
('users.deactivate', 'users', 'إدارة المستخدمين', 'special', 'تعطيل/تفعيل المستخدمين', 1604),
('users.assign_roles', 'users', 'إدارة المستخدمين', 'special', 'إسناد الأدوار للمستخدمين', 1605),
('roles.manage', 'users', 'إدارة المستخدمين', 'special', 'إدارة الأدوار والصلاحيات', 1606),
-- Building Identity
('identity.view', 'settings', 'الإعدادات', 'view', 'عرض هوية البرج', 1700),
('identity.manage', 'settings', 'الإعدادات', 'manage', 'تعديل هوية البرج', 1701),
-- Telegram
('telegram.view', 'settings', 'الإعدادات', 'view', 'عرض إعدادات تيليجرام', 1710),
('telegram.manage', 'settings', 'الإعدادات', 'manage', 'إدارة تيليجرام', 1711),
-- API Keys
('api_keys.view', 'settings', 'الإعدادات', 'view', 'عرض مفاتيح API', 1720),
('api_keys.manage', 'settings', 'الإعدادات', 'manage', 'إدارة مفاتيح API', 1721);

-- 9) seed: الأدوار الافتراضية (نفس الـ 6 الحاليين عشان مفيش حد يفقد وصوله)
INSERT INTO public.app_roles (name, description, is_system) VALUES
('super_admin', 'المدير العام — صلاحية كاملة على كل شيء', true),
('owner', 'مالك البرج — عرض كل شيء بدون تعديل', false),
('accountant', 'محاسب — يدير المالية والعقود', false),
('maintenance_supervisor', 'مشرف الصيانة — يدير الصيانة والأصول', false),
('security_supervisor', 'مشرف الأمن — يدير الأمن والحوادث', false),
('receptionist', 'موظف استقبال — يدير الزوار والتذاكر', false);

-- 10) seed: ربط الصلاحيات بكل دور
-- super_admin يحصل على true تلقائيًا من has_permission، ومش محتاج صفوف هنا — لكن للاتساق هنحط له كل الصلاحيات
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT (SELECT id FROM public.app_roles WHERE name='super_admin'), key FROM public.app_permissions;

-- owner: عرض كل شيء
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT (SELECT id FROM public.app_roles WHERE name='owner'), key
FROM public.app_permissions WHERE action = 'view';

-- accountant
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT (SELECT id FROM public.app_roles WHERE name='accountant'), key
FROM public.app_permissions
WHERE key IN (
  'dashboard.view','building_map.view','daily_report.view',
  'offices.view','tenants.view','tenants.create','tenants.edit',
  'contracts.view','contracts.create','contracts.edit','contracts.renew','contracts.cancel',
  'invoices.view','invoices.create','invoices.edit','invoices.delete','payments.record','payments.delete',
  'expenses.view','expenses.create','expenses.edit','expenses.approve','expenses.reject','expenses.pay',
  'vendors.view','vendors.create','vendors.edit','vendor_payments.record',
  'documents.view','documents.create','documents.edit',
  'tickets.view'
);

-- maintenance_supervisor
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT (SELECT id FROM public.app_roles WHERE name='maintenance_supervisor'), key
FROM public.app_permissions
WHERE key IN (
  'dashboard.view','building_map.view','daily_report.view','building_log.view',
  'offices.view','tenants.view','contracts.view',
  'maintenance.view','maintenance.create','maintenance.edit','maintenance.assign','maintenance.close',
  'pm_plans.view','pm_plans.manage',
  'assets.view','assets.create','assets.edit',
  'vendors.view','vendors.create','vendors.edit',
  'expenses.view','expenses.create',
  'inspections.view','inspections.create','inspections.edit',
  'documents.view','documents.create',
  'tickets.view','tickets.edit','tickets.assign','tickets.close',
  'parking.view'
);

-- security_supervisor
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT (SELECT id FROM public.app_roles WHERE name='security_supervisor'), key
FROM public.app_permissions
WHERE key IN (
  'dashboard.view','building_map.view','daily_report.view','building_log.view',
  'guards.view','guards.create','guards.edit','guards.manage_attendance',
  'patrols.view','patrols.create',
  'incidents.view','incidents.create','incidents.edit','incidents.close',
  'cameras.view','cameras.manage',
  'parking.view','parking.manage','parking.violations',
  'visitors.view','visitors.checkin','visitors.checkout',
  'inspections.view','inspections.create',
  'assets.view',
  'tickets.view','tickets.edit','tickets.assign','tickets.close',
  'documents.view'
);

-- receptionist
INSERT INTO public.role_permissions (role_id, permission_key)
SELECT (SELECT id FROM public.app_roles WHERE name='receptionist'), key
FROM public.app_permissions
WHERE key IN (
  'dashboard.view','building_map.view',
  'offices.view','tenants.view','contracts.view',
  'visitors.view','visitors.checkin','visitors.checkout',
  'parking.view',
  'tickets.view','tickets.create','tickets.edit',
  'incidents.view','documents.view'
);

-- 11) ترحيل المستخدمين الحاليين من user_roles إلى user_role_assignments
INSERT INTO public.user_role_assignments (user_id, role_id, assigned_by)
SELECT ur.user_id, r.id, ur.created_by
FROM public.user_roles ur
JOIN public.app_roles r ON r.name = ur.role::text
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 12) تحديث handle_new_user عشان يضيف للنظامين (القديم + الجديد) لحد ما نشيل القديم
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_super_role_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );

  -- إذا لم يوجد أي مدير عام، اجعل هذا المستخدم مديراً عاماً
  SELECT COUNT(*) INTO v_count FROM public.user_roles WHERE role = 'super_admin';
  IF v_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
    SELECT id INTO v_super_role_id FROM public.app_roles WHERE name = 'super_admin';
    IF v_super_role_id IS NOT NULL THEN
      INSERT INTO public.user_role_assignments (user_id, role_id) VALUES (NEW.id, v_super_role_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
