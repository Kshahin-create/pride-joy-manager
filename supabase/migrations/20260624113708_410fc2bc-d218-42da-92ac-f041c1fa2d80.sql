
INSERT INTO public.app_permissions (key, module, module_label, action, label, sort_order)
VALUES
  ('dashboard.widget.occupancy',    'dashboard', 'لوحة التحكم', 'view', 'بطاقة نسبة الإشغال',           11),
  ('dashboard.widget.revenue_chart','dashboard', 'لوحة التحكم', 'view', 'مخطط الإيرادات',                12),
  ('dashboard.widget.finance',      'dashboard', 'لوحة التحكم', 'view', 'المؤشرات المالية',              13),
  ('dashboard.widget.expenses',     'dashboard', 'لوحة التحكم', 'view', 'بطاقات المصروفات',              14),
  ('dashboard.widget.operations',   'dashboard', 'لوحة التحكم', 'view', 'مؤشرات التشغيل والبلاغات',      15),
  ('dashboard.widget.work_orders',  'dashboard', 'لوحة التحكم', 'view', 'أوامر العمل والصيانة',          16),
  ('dashboard.widget.contracts',    'dashboard', 'لوحة التحكم', 'view', 'مؤشرات العقود',                 17),
  ('dashboard.widget.visitors',     'dashboard', 'لوحة التحكم', 'view', 'مؤشرات الزوار',                 18),
  ('dashboard.widget.security',     'dashboard', 'لوحة التحكم', 'view', 'مؤشرات الأمن',                  19),
  ('dashboard.widget.parking',      'dashboard', 'لوحة التحكم', 'view', 'مؤشرات المواقف',                20),
  ('dashboard.widget.events',       'dashboard', 'لوحة التحكم', 'view', 'سجل أحداث البرج',               21)
ON CONFLICT (key) DO NOTHING;
