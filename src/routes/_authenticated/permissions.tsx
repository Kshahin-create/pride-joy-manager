import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Eye, Pencil } from "lucide-react";
import { ROLE_LABELS, type AppRole } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/permissions")({
  component: PermissionsPage,
});

type Access = "manage" | "view" | "none";

const ROLES: AppRole[] = [
  "super_admin", "owner", "accountant", "maintenance_supervisor", "security_supervisor", "receptionist",
];

type ModuleRow = { module: string; access: Record<AppRole, Access>; notes?: string };

const MODULES: ModuleRow[] = [
  { module: "لوحة الإدارة", access: { super_admin: "manage", owner: "view", accountant: "view", maintenance_supervisor: "view", security_supervisor: "view", receptionist: "view" } },
  { module: "خريطة البرج والمساحات", access: { super_admin: "manage", owner: "view", accountant: "view", maintenance_supervisor: "view", security_supervisor: "view", receptionist: "view" } },
  { module: "سجل البرج (Audit)", access: { super_admin: "view", owner: "view", accountant: "none", maintenance_supervisor: "none", security_supervisor: "none", receptionist: "none" } },
  { module: "المكاتب والوحدات", access: { super_admin: "manage", owner: "view", accountant: "view", maintenance_supervisor: "view", security_supervisor: "none", receptionist: "view" } },
  { module: "العملاء (المستأجرون)", access: { super_admin: "manage", owner: "view", accountant: "view", maintenance_supervisor: "none", security_supervisor: "none", receptionist: "view" } },
  { module: "العقود", access: { super_admin: "manage", owner: "view", accountant: "manage", maintenance_supervisor: "none", security_supervisor: "none", receptionist: "view" } },
  { module: "المالية (فواتير ومدفوعات)", access: { super_admin: "manage", owner: "view", accountant: "manage", maintenance_supervisor: "none", security_supervisor: "none", receptionist: "none" } },
  { module: "المصروفات والاعتمادات", access: { super_admin: "manage", owner: "view", accountant: "manage", maintenance_supervisor: "view", security_supervisor: "none", receptionist: "none" }, notes: "الإنشاء: محاسب + مشرف صيانة. الاعتماد: محاسب + مدير عام." },
  { module: "سداد الموردين", access: { super_admin: "manage", owner: "view", accountant: "manage", maintenance_supervisor: "none", security_supervisor: "none", receptionist: "none" } },
  { module: "أوامر العمل (CMMS)", access: { super_admin: "manage", owner: "view", accountant: "view", maintenance_supervisor: "manage", security_supervisor: "none", receptionist: "view" }, notes: "إعادة فتح المغلق: المدير العام فقط." },
  { module: "الصيانة الوقائية", access: { super_admin: "manage", owner: "view", accountant: "none", maintenance_supervisor: "manage", security_supervisor: "none", receptionist: "none" } },
  { module: "الأصول", access: { super_admin: "manage", owner: "view", accountant: "view", maintenance_supervisor: "manage", security_supervisor: "view", receptionist: "none" } },
  { module: "الموردون", access: { super_admin: "manage", owner: "view", accountant: "manage", maintenance_supervisor: "manage", security_supervisor: "none", receptionist: "none" } },
  { module: "التفتيشات", access: { super_admin: "manage", owner: "view", accountant: "none", maintenance_supervisor: "manage", security_supervisor: "manage", receptionist: "none" } },
  { module: "الأمن (حراس، جولات)", access: { super_admin: "manage", owner: "view", accountant: "none", maintenance_supervisor: "none", security_supervisor: "manage", receptionist: "none" }, notes: "رواتب الحراس: المدير العام فقط." },
  { module: "الحوادث الأمنية", access: { super_admin: "manage", owner: "view", accountant: "none", maintenance_supervisor: "none", security_supervisor: "manage", receptionist: "view" } },
  { module: "المواقف", access: { super_admin: "manage", owner: "view", accountant: "none", maintenance_supervisor: "view", security_supervisor: "manage", receptionist: "view" } },
  { module: "الزوار", access: { super_admin: "manage", owner: "view", accountant: "none", maintenance_supervisor: "none", security_supervisor: "manage", receptionist: "manage" } },
  { module: "الشكاوى والبلاغات", access: { super_admin: "manage", owner: "view", accountant: "view", maintenance_supervisor: "manage", security_supervisor: "manage", receptionist: "manage" } },
  { module: "المستندات", access: { super_admin: "manage", owner: "view", accountant: "manage", maintenance_supervisor: "view", security_supervisor: "view", receptionist: "view" } },
  { module: "المستخدمون والأدوار", access: { super_admin: "manage", owner: "none", accountant: "none", maintenance_supervisor: "none", security_supervisor: "none", receptionist: "none" } },
];

const Cell = ({ a }: { a: Access }) => {
  if (a === "manage") return <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-semibold"><Pencil className="h-3 w-3" /> إدارة</span>;
  if (a === "view") return <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 text-xs"><Eye className="h-3 w-3" /> قراءة</span>;
  return <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><X className="h-3 w-3" /> —</span>;
};

function PermissionsPage() {
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">مصفوفة الصلاحيات</h1>
        <p className="text-sm text-muted-foreground">
          من يستطيع رؤية أو إدارة كل وحدة. الصلاحيات منفّذة فعليًا عبر RLS وSecurity Definer Functions في قاعدة البيانات.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">الدلالات</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3 text-emerald-600" /> إدارة كاملة (إنشاء/تعديل/حذف)</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3 text-blue-600" /> قراءة فقط</span>
          <span className="inline-flex items-center gap-1"><X className="h-3 w-3 text-muted-foreground" /> لا صلاحية</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right sticky right-0 bg-background min-w-[200px]">الوحدة / الموديول</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r} className="text-center min-w-[110px]">{ROLE_LABELS[r]}</TableHead>
                ))}
                <TableHead className="min-w-[260px]">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODULES.map((m) => (
                <TableRow key={m.module}>
                  <TableCell className="font-medium sticky right-0 bg-background">{m.module}</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r} className="text-center"><Cell a={m.access[r]} /></TableCell>
                  ))}
                  <TableCell className="text-xs text-muted-foreground">{m.notes || ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">قواعد Workflow المنفّذة</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm list-disc pr-5">
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> لا يمكن إغلاق أمر العمل قبل إدخال: التكلفة + صورة "بعد" + ملاحظات الإنجاز.</li>
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> لا يمكن إعادة فتح أمر عمل مغلق إلا للمدير العام.</li>
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> اعتماد/رفض المصروف مقصور على المحاسب والمدير العام.</li>
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> سداد مرتبط بمصروف يحوّل حالة المصروف تلقائيًا إلى "مدفوع".</li>
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> إغلاق الحادث الأمني يستلزم تقرير إغلاق.</li>
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> SLA يُحسب تلقائيًا حسب أولوية أمر العمل (طارئة: 1س ردّ/8س إنجاز).</li>
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> توليد أوامر صيانة وقائية تلقائيًا من الخطط النشطة عند استحقاقها.</li>
            <li><Check className="inline h-3 w-3 text-emerald-600 ml-1" /> رواتب الحراس مخفية ومحميّة من التعديل لغير المدير العام.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">الإشعارات اليومية التلقائية</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm list-disc pr-5">
            <li>عقود تنتهي خلال 90 / 30 يوم → المدير العام</li>
            <li>فواتير متأخرة → المحاسب</li>
            <li>مستندات/شهادات تنتهي خلال 30 يوم → المدير العام</li>
            <li>تدريبات حراس تنتهي خلال 30 يوم → مشرف الأمن</li>
            <li>أوامر عمل متأخرة عن SLA → مشرف الصيانة + المدير العام</li>
            <li>خطط وقائية مستحقة اليوم → مشرف الصيانة</li>
            <li>مصروفات معلّقة بانتظار الاعتماد (مجمّعة) → المحاسب</li>
            <li>زوار لم يسجّلوا خروجهم لأكثر من 12 ساعة → مشرف الأمن</li>
            <li>أعطال في أصول حرجة → مشرف الصيانة (لحظي)</li>
            <li>بلاغات طارئة → المدير العام (لحظي)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
