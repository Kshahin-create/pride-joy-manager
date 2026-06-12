# صفحة API كاملة للسيستم

## الفكرة العامة

كل مستخدم مسجل يدخل على صفحة **`/api-docs`** ويلاقي فيها 3 أقسام:

1. **توثيق المصادر (Resources)** — كل جداول السيستم مع الأعمدة، العمليات المتاحة (GET/POST/PATCH/DELETE) **محسوبة على دور المستخدم نفسه** (لو ما يقدرش يحذف، الزر يبان مقفول مع شرح).
2. **رابط جاهز للاستخدام داخل المتصفح / السيرفر** — Base URL + التوكن الحالي للجلسة + مثال curl قابل للنسخ لكل جدول.
3. **مفاتيح API شخصية (Personal API Keys)** — المستخدم يولّد مفتاح، يديه اسم، ويستخدمه من خارج النظام (Postman, n8n, موبايل…). المفتاح مربوط بصاحبه فبيرث صلاحياته تلقائيًا.

---

## ما سأنشئه

### 1. قاعدة البيانات (Migration)

جدول جديد `public.api_keys`:
- `user_id` (FK → auth.users) — صاحب المفتاح
- `name` — اسم وصفي (مثلاً "موبايل الحارس")
- `key_prefix` (8 chars) — جزء ظاهر دائمًا للتعريف (مثل `pjk_a3f2…`)
- `key_hash` — SHA-256 للمفتاح كامل (المفتاح الأصلي لا يُخزَّن أبدًا)
- `last_used_at`, `expires_at`, `revoked_at`
- RLS: المستخدم يدير مفاتيحه فقط، `super_admin` يشوف الكل

دالة Postgres `public.verify_api_key(_key text)` تتحقق وترجع `user_id` وتحدّث `last_used_at` (SECURITY DEFINER).

### 2. نقطة وصول خارجية (Server Route)

`src/routes/api/public/v1/$.ts` — splat route، يقبل أي مسار شكل:
```
GET    /api/public/v1/offices
GET    /api/public/v1/maintenance_requests?status=eq.جديد
POST   /api/public/v1/visitors
PATCH  /api/public/v1/tickets?id=eq.xxx
DELETE /api/public/v1/expenses?id=eq.xxx
```

التدفق:
1. يقرأ `Authorization: Bearer pjk_...`
2. يستدعي `verify_api_key` → يجيب `user_id` + أدواره
3. يتحقق من **خريطة الصلاحيات** (نفس المعتمدة في الواجهة) لقبول/رفض الـ method على هذا الجدول
4. يمرّر الطلب إلى Supabase REST API باستخدام service role، مع تقييد الـ DELETE/UPDATE على الجداول المسموحة فقط

### 3. خريطة الموارد والصلاحيات (`src/lib/api-resources.ts`)

ملف واحد يعرّف كل جدول:
```ts
{
  table: "expenses",
  description: "المصروفات",
  read:   ["super_admin","accountant","maintenance_supervisor"],
  write:  ["super_admin","accountant"],
  delete: ["super_admin"],
}
```
يُستخدم في:
- صفحة التوثيق (لإظهار/إخفاء كل endpoint)
- Server route (للتحقق قبل الإرسال)

تغطية كل الجداول الرئيسية: offices, companies, contracts, invoices, payments, expenses, vendors, maintenance_requests, pm_plans, assets, tickets, visitors, security_incidents, guards, patrols, documents, inspections, parking_spots, cameras, …إلخ.

### 4. صفحة `/_authenticated/api-docs.tsx`

تبويبات:
- **نظرة عامة** — base URLs، طريقة المصادقة (Bearer token), معدل الاستخدام
- **الموارد** — قائمة قابلة للبحث/الفلترة، كل مورد فيه:
  - الأعمدة (من types.ts)
  - أمثلة curl جاهزة للنسخ لكل عملية
  - زر "جرّب الآن" يفتح في تبويب (للقراءة فقط)
- **مفاتيحي** — جدول مفاتيحي مع: إنشاء جديد (يعرض المفتاح مرّة واحدة)، نسخ، إلغاء

### 5. روابط في القائمة الجانبية

إضافة "API" بأيقونة `<Code />` لكل المستخدمين المسجلين.

---

## القيود الواعية

- المفتاح الكامل يظهر **مرة واحدة فقط** عند الإنشاء (تخزين hash لا أصل)
- لا أكشف service role key أبدًا للواجهة
- الـ rate limit مش متضمن في النسخة دي (نضيفه لاحقًا لو احتجت)
- العمليات على schemas حساسة (auth, storage, user_roles) مرفوضة دائمًا على API الخارجي

---

## ملاحظة مهمة عن التحقق من الصلاحيات

السيرفر يطبّق نفس الـ RLS Policies الموجودة في الداتابيز بشكل غير مباشر: التحقق الأولي يحصل في الخريطة (`api-resources.ts`)، والصفوف نفسها لو فيها فلتر بـ `user_id` هتشتغل على service role، فعملنا **تحقق role-based في طبقة الـ API** بدل JWT-impersonation عشان البنية الحالية.

---

**موافق نبدأ؟** أو تحب أعدّل حاجة في النطاق (مثلاً أبدأ بالقراءة فقط ونؤجّل الكتابة الخارجية، أو نضيف rate limit من أول مرة)؟
