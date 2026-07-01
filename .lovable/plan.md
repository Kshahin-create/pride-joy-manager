# خطة: نظام الحذف والأرشفة الموحّد

الطلب كبير ويلمس كل جداول النظام (١٥+ جدول) وكل شاشة. لضمان الجودة سأنفّذه على **دفعات متتابعة** بنفس نمطنا السابق، وبعد كل دفعة ألخّص وأنتقل للتالية.

## البنية التحتية (دفعة 1 — Migration واحدة)

1. **إضافة عمود `archived_at TIMESTAMPTZ` وحقول `archived_by`, `archive_reason`** على الجداول التالية (اللي ما فيها بالفعل):
   `assets, asset_types, employees, vendors, companies, contracts, cleaning_contracts, ac_contracts, elevator_contracts, fire_contracts, supply_contracts, tickets, maintenance_requests, invoices, documents, offices, parking_spots, spaces, employee_employers, employee_departments`.

2. **جدول `audit_log`** موحّد:
   - `entity_type, entity_id, entity_name, action ('archive'|'restore'|'delete'), actor_id, reason, metadata, created_at`.
   - RLS: قراءة للـ super_admin فقط، إدراج من الدوال الأمنية.

3. **صلاحيات جديدة** في `app_permissions`:
   - `records.archive` — أرشفة/تعطيل
   - `records.restore` — استعادة
   - `records.delete` — حذف نهائي (يُمنح افتراضيًا لـ super_admin فقط)

4. **دوال SECURITY DEFINER عامة**:
   - `public.archive_record(_table text, _id uuid, _reason text)` — يفحص `records.archive`، يحدّث الأعمدة، يسجّل في audit_log.
   - `public.restore_record(_table text, _id uuid)` — يفحص `records.restore`.
   - `public.delete_record(_table text, _id uuid, _reason text)` — يفحص `records.delete`، يحاول الحذف داخل SAVEPOINT، وعند خطأ FK يعيد رسالة عربية: «لا يمكن حذف هذا العنصر لأنه مرتبط ببيانات أخرى. يمكنك أرشفته بدلاً من حذفه». الجداول المسموح بها مقيّدة بـ whitelist داخل الدالة.
   - كل الدوال تسجّل تلقائيًا في `audit_log`.

5. **قيود FK**: التأكد أن كل FK حسّاسة عليها `ON DELETE RESTRICT` (بدل CASCADE الصامت) لتُفعّل رسالة الحماية.

## الواجهة (دفعات 2–5)

6. **مكوّن موحّد `<DeleteArchiveMenu />`** يظهر في:
   - صفحات القوائم (زر ⋯ لكل صف): أرشفة / استعادة / حذف نهائي.
   - صفحات التفاصيل (شريط الأدوات العلوي).
   - يستخدم `AlertDialog` للتأكيد بنص: «هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء».
   - حقل «سبب الحذف/الأرشفة» (اختياري للأرشفة، مقترح للحذف).
   - الأزرار تظهر/تُخفى حسب `hasPermission('records.delete' | 'records.archive' | 'records.restore')`.

7. **فلتر «عرض المؤرشف»** (Switch) في كل صفحة قائمة — افتراضيًا مخفي. الاستعلامات الافتراضية تضيف `.is('archived_at', null)`.

8. **صفحة سجل التدقيق** الجديدة `/audit-log` (للـ super_admin) تعرض كل عمليات الحذف/الأرشفة/الاستعادة مع فلاتر (نوع، مستخدم، تاريخ) وتصدير CSV.

## الشاشات المشمولة (بالترتيب)
- الدفعة 2: أنواع الأصول، الأصول، المكاتب، المواقف، المساحات.
- الدفعة 3: العملاء، المستأجرين، الموردين، الموظفين.
- الدفعة 4: كل أنواع العقود، الفواتير، الدفعات.
- الدفعة 5: البلاغات، أوامر الصيانة، الحجوزات، المستندات، Lookup tables (الأقسام، جهات العمل، أنواع الأصول).

## ملاحظات
- سنستخدم **soft-delete (أرشفة)** كافتراضي، والحذف الصلب متاح للـ super_admin فقط عبر الدالة الآمنة.
- Trigger `log_*_event` الموجود سيستمر في العمل مع تغيير الحالة، وسجل التدقيق يضاف فوقه لتفاصيل الأرشفة/الحذف تحديدًا.
- الفواتير المدفوعة والعقود السارية: **الحذف مرفوض** حتى للـ super_admin (يرجى إلغاء العقد أولاً).

---

هل أبدأ بالدفعة 1 (Migration + دوال SECURITY DEFINER + سجل التدقيق + الصلاحيات الجديدة)؟