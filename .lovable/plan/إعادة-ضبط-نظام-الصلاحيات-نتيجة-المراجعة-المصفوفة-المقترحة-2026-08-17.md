# إعادة ضبط نظام الصلاحيات — نتيجة المراجعة + المصفوفة المقترحة

لا توجد أي Migration منفّذة. ده Audit + Matrix للاعتماد.

## 1) نتيجة المراجعة (الوضع الحالي)

**الصلاحيات:** 172 مفتاح في 32 موديول، لكن غير موحّدة:

- موديولات فيها `manage` مبهمة بدل create/edit/delete: `spaces`, `pm_plans`, `cleaning`, `parking`, `cameras`, `settings` (identity/telegram/api_keys).
- موديولات ناقصها create/edit/view كاملة: `patrols` (فيها delete/upload فقط + create/view تحت security)، `incidents` (نفس المشكلة)، `guards` (upload/file_delete تحت guards + باقي المفاتيح تحت security)، `invoices` (متكرر في موديولين)، `payments`, `vendor_payments` (مفيش view/edit)، `visitors` (مفيش edit)، `building_log` (مفيش create/edit)، `electricity`, `network_points`, `ac_units` (delete بس)، `companies` (upload بس).
- تكرار/تشتت: `tenants` معرّف بموديولين (العملاء/المستأجرون + المستأجرين)، `security` موديول عملاق فيه 19 مفتاح لحاجات بتخص guards/patrols/incidents/cameras، `assets` فيه 4 مفاتيح delete متكررة، `invoices` مقسوم بين المالية والمدفوعات.
- `records.archive/delete/restore` + `files.archive/delete` بيشتغلوا كصلاحيات عامة فوق صلاحيات الموديولات.

**RLS في قاعدة البيانات:** 63 جدول لسه فيه سياسات معتمدة على `has_role()` فقط بدون `has_permission()` — أبرزها: `contracts`, `offices`, `expenses`, `tickets`, `documents`, `invoices`, `payments`, `pm_plans`, `spaces`, `vendors`, `vendor_payments`, `visitors`, `patrols`, `security_incidents`, `guard_*`, `companies`, كل عقود الخدمات (`ac_/fire_/elevator_/supply_/cleaning_contracts`) وجداول المرفقات التابعة لها. وفي سياسة owner-scoped واحدة على `profiles` (مقصودة: تعديل البروفايل الشخصي).

**Storage:** 16 bucket، منهم 15 لسه فيهم سياسات role-only (من 2 لـ 5 سياسات لكل bucket) متعايشة مع سياسات الصلاحيات — يعني القراءة/الرفع لسه بتعتمد على اسم الدور في مسارات كتير، وده سبب أخطاء الرفع المتكررة. الـ`avatars` bucket المفروض يفضل owner-scoped.

## 2) قواعد الحكم النهائية

1. `super_admin` يتجاوز كل شيء (بدون تغيير).
2. أي مستخدم آخر: القرار من `role_permissions` فقط — ممنوع أي شرط على اسم الدور.
3. `edit`/`delete` مش owner-only: أي حد عنده المفتاح يعدّل/يمسح أي سجل داخل نطاق عقاراته.
4. عزل `property_id` باقٍ كما هو لكل الجداول اللي فيها عقار.
5. دالة موحّدة `can(uid, key)` = `super_admin OR has_permission(uid, key)`، و`can_in_property(uid, key, property_id)` تضيف شرط العقار.

## 3) المصفوفة المقترحة (Permission Matrix)

الأعمدة الأساسية لكل موديول: `view` / `create` / `edit` / `delete` + (`upload`, `file_delete` لو فيه مرفقات) + مفاتيح خاصة.

| الموديول | الأساسية | مرفقات | مفاتيح خاصة |
|---|---|---|---|
| offices | view create edit delete | upload file_delete | change_status |
| spaces | view create edit delete | — | — (إلغاء `spaces.manage`) |
| assets | view create edit delete | upload file_delete | — (تنظيف delete المكرر) |
| employees | view create edit delete | upload file_delete | — |
| tenants (العملاء/المستأجرون) | view create edit delete | upload file_delete | — (دمج الموديولين) |
| companies | view create edit delete | upload file_delete | — |
| vendors | view create edit delete | upload file_delete | evaluate |
| contracts | view create edit delete | upload file_delete | renew cancel |
| service_contracts (AC/مصاعد/حريق/توريد/نظافة) | view create edit delete | upload file_delete | — |
| invoices | view create edit delete | upload file_delete | — (توحيد الموديول) |
| payments | view create edit delete | upload file_delete | record |
| vendor_payments | view create edit delete | upload file_delete | record |
| expenses | view create edit delete | upload file_delete | approve reject pay |
| maintenance (أوامر العمل) | view create edit delete | upload file_delete | assign close reopen |
| pm_plans | view create edit delete | — | generate (توليد أوامر) |
| inspections | view create edit delete | upload file_delete | manage_templates |
| cleaning | view create edit delete | upload file_delete | — (إلغاء `cleaning.manage`) |
| parking | view create edit delete | upload file_delete | violations (إلغاء `parking.manage`) |
| visitors | view create edit delete | — | checkin checkout |
| tickets (الشكاوى) | view create edit delete | upload file_delete | assign close reopen |
| incidents | view create edit delete | upload file_delete | close |
| patrols | view create edit delete | upload file_delete | — |
| guards | view create edit delete | upload file_delete | view_salary edit_salary manage_attendance |
| cameras | view create edit delete | — | — (إلغاء `cameras.manage`) |
| documents | view create edit delete | upload file_delete | — |
| building_log | view create edit delete | — | — |
| electricity | view create edit delete | — | — |
| network_points | view create edit delete | — | — |
| ac_units | view create edit delete | — | — |
| identity (هوية المبنى) | view edit | upload file_delete | — |
| users | view create edit delete | — | assign_roles deactivate |
| roles | view manage | — | — (إدارية بحتة، تفضل كما هي) |
| settings (api_keys / telegram) | view manage | — | — (إدارية بحتة) |
| dashboard / daily_report / building_map | view (+ widgets) | — | — |

**الصلاحيات العامة:** `records.archive/restore` تفضل للأرشيف، و`records.purge` (بديل واضح لـ`records.delete`) للحذف النهائي من سلة المهملات فقط — مش بديل عن حذف الموديولات. `files.archive/delete` تتشال لصالح `<module>.file_delete`.

## 4) اللي هيتغيّر مقابل اللي هيفضل

**هيتغيّر:**
- تقسيم كل `*.manage` التشغيلية إلى create/edit/delete (مع إبقاء المفتاح القديم شغّال مؤقتًا كـ alias عشان الأدوار الحالية ما تفقدش صلاحياتها).
- إضافة المفاتيح الناقصة (حوالي 60 مفتاح) وإعادة تجميع موديول `security` تحت guards/patrols/incidents/cameras.
- إعادة كتابة RLS لكل الـ63 جدول لتصبح: `can(uid,'<module>.<action>') AND user_has_property(...)`.
- إعادة كتابة سياسات الـ15 bucket لتعتمد `can_upload_module` / `can_view_module` / `can_delete_files` فقط وحذف السياسات role-only المتبقية.
- ترحيل تلقائي: كل دور عنده `X.manage` ياخد X.create/edit/delete، وكل دور عنده صلاحية قديمة تحت `security.*` ياخد المفتاح الجديد المقابل.

**هيفضل كما هو:**
- تجاوز `super_admin` الكامل.
- عزل `property_id`.
- `profiles` self-update، و`avatars` owner-scoped.
- مفاتيح الـ dashboard widgets.
- شاشة الأدوار/الصلاحيات ديناميكية (بتقرأ من `app_permissions`) فمش محتاجة إعادة بناء، بس هتعرض الأعمدة الجديدة.

## 5) خطوات التنفيذ بعد الاعتماد

1. Migration 1: تحديث `app_permissions` (إضافة/إعادة تسمية/دمج) + ترحيل `role_permissions`.
2. Migration 2: دوال `can()` / `can_in_property()` + إعادة كتابة RLS لكل الجداول.
3. Migration 3: إعادة كتابة سياسات الـ Storage buckets وحذف role-only.
4. تحديث الواجهة: بوابات `hasPermission` للأزرار (create/edit/delete/upload) بدل `manage`، وتحديث `delete-archive-menu`.
5. اختبار بحساب غير Super Admin: إنشاء/تعديل/حذف/رفع في كل موديول.

**محتاج اعتمادك على المصفوفة (خصوصًا تقسيم `manage` وتسمية `records.purge`) قبل تنفيذ أي Migration.**
