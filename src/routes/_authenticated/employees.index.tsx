import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Download, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employees/")({
  component: EmployeesPage,
});

type Employee = {
  id: string;
  full_name: string;
  mobile: string | null;
  national_id: string | null;
  nationality: string | null;
  address: string | null;
  employer: string;
  job_title: string | null;
  department: string | null;
  hire_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const EMPTY: Partial<Employee> = {
  full_name: "",
  mobile: "",
  national_id: "",
  nationality: "",
  address: "",
  employer: "",
  job_title: "",
  department: "",
  hire_date: "",
  status: "نشط",
  notes: "",
};

function EmployeesPage() {
  const { hasRole, isSuperAdmin } = useAuth();
  const canManage =
    isSuperAdmin || hasRole("maintenance_supervisor") || hasRole("security_supervisor");

  const [items, setItems] = useState<Employee[]>([]);
  const [employers, setEmployers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [vendors, setVendors] = useState<{ company_name: string; activity: string | null }[]>([]);
  const [q, setQ] = useState("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterEmp, setFilterEmp] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Employee>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const INTERNAL_COMPANY = "نخبة تسكين العقارية";

  // ربط جهة العمل بنوع القسم عبر نشاط المورد (vendors.activity)
  const deptKeywords = (dept: string): string[] => {
    const d = dept || "";
    if (d.includes("نظاف")) return ["نظاف"];
    if (d.includes("أمن") || d.includes("امن") || d.includes("حراس")) return ["أمن", "امن", "حراس"];
    if (d.includes("صيان")) return ["صيان"];
    if (d.includes("تكيي") || d.includes("تبريد")) return ["تكيي", "تبريد"];
    if (d.includes("مصعد") || d.includes("مصاعد")) return ["مصعد", "مصاعد"];
    if (d.includes("حريق") || d.includes("إطفاء") || d.includes("اطفاء")) return ["حريق", "إطفاء", "اطفاء"];
    if (d.includes("كهرب")) return ["كهرب"];
    if (d.includes("سباك") || d.includes("صحي")) return ["سباك", "صحي"];
    return [];
  };

  const employerOptions = useMemo(() => {
    const dept = form.department ?? "";
    const keys = deptKeywords(dept);
    const matched = keys.length
      ? vendors
          .filter((v) => v.activity && keys.some((k) => v.activity!.includes(k)))
          .map((v) => v.company_name)
      : vendors.map((v) => v.company_name);
    return Array.from(new Set([INTERNAL_COMPANY, ...matched, ...employers]));
  }, [form.department, vendors, employers]);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Employee[]);
  };

  const loadLookups = async () => {
    const [{ data: emp }, { data: dep }, { data: vds }] = await Promise.all([
      (supabase as any).from("employee_employers").select("name").eq("is_active", true).order("name"),
      (supabase as any).from("employee_departments").select("name").eq("is_active", true).order("name"),
      (supabase as any).from("vendors").select("company_name, activity").order("company_name"),
    ]);
    setEmployers((emp ?? []).map((r: any) => r.name));
    setDepartments((dep ?? []).map((r: any) => r.name));
    setVendors((vds ?? []) as { company_name: string; activity: string | null }[]);
  };

  useEffect(() => {
    load();
    loadLookups();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim();
    return items.filter((i) => {
      if (filterDept && i.department !== filterDept) return false;
      if (filterEmp && i.employer !== filterEmp) return false;
      if (!term) return true;
      return (
        i.full_name.includes(term) ||
        (i.mobile ?? "").includes(term) ||
        (i.national_id ?? "").includes(term) ||
        (i.job_title ?? "").includes(term)
      );
    });
  }, [items, q, filterDept, filterEmp]);

  const save = async () => {
    if (!form.full_name?.trim() || !form.employer) {
      toast.error("الاسم وجهة العمل مطلوبان");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload: any = {
      full_name: form.full_name.trim(),
      mobile: form.mobile || null,
      national_id: form.national_id || null,
      nationality: form.nationality || null,
      address: form.address || null,
      employer: form.employer,
      job_title: form.job_title || null,
      department: form.department || null,
      hire_date: form.hire_date || null,
      status: form.status || "نشط",
      notes: form.notes || null,
      created_by: u.user?.id ?? null,
    };
    const { error } = await (supabase as any).from("employees").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تمت إضافة الموظف");
    setOpen(false);
    setForm(EMPTY);
    load();
  };

  const exportCsv = () => {
    const header = [
      "الاسم",
      "الجوال",
      "الهوية/الإقامة",
      "الجنسية",
      "العنوان",
      "جهة العمل",
      "المسمى الوظيفي",
      "القسم",
      "تاريخ التعيين",
      "الحالة",
      "الملاحظات",
    ];
    const rows = filtered.map((e) => [
      e.full_name,
      e.mobile ?? "",
      e.national_id ?? "",
      e.nationality ?? "",
      e.address ?? "",
      e.employer,
      e.job_title ?? "",
      e.department ?? "",
      e.hire_date ?? "",
      e.status,
      (e.notes ?? "").replace(/\n/g, " "),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">الموظفون</h1>
          <Badge variant="secondary">{filtered.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="ms-1 h-4 w-4" />
            تصدير CSV
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="ms-1 h-4 w-4" />
            إضافة موظف
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">عوامل التصفية</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            placeholder="بحث بالاسم / الجوال / الهوية..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={filterDept || "all"} onValueChange={(v) => setFilterDept(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="كل الأقسام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأقسام</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEmp || "all"} onValueChange={(v) => setFilterEmp(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="كل جهات العمل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل جهات العمل</SelectItem>
              {employers.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>المسمى الوظيفي</TableHead>
                <TableHead>القسم</TableHead>
                <TableHead>جهة العمل</TableHead>
                <TableHead>الجوال</TableHead>
                <TableHead>تاريخ التعيين</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link to="/employees/$id" params={{ id: e.id }} className="text-primary hover:underline">
                        {e.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{e.job_title ?? "—"}</TableCell>
                    <TableCell>{e.department ?? "—"}</TableCell>
                    <TableCell>{e.employer}</TableCell>
                    <TableCell dir="ltr" className="text-start">
                      {e.mobile ?? "—"}
                    </TableCell>
                    <TableCell>{e.hire_date ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "نشط" ? "default" : "secondary"}>{e.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>الاسم الكامل *</Label>
              <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>رقم الجوال</Label>
                <Input value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>رقم الهوية / الإقامة</Label>
                <Input value={form.national_id ?? ""} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>الجنسية</Label>
                <Input value={form.nationality ?? ""} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>تاريخ التعيين</Label>
                <Input type="date" value={form.hire_date ?? ""} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>العنوان</Label>
              <Textarea rows={2} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>القسم</Label>
                <Select
                  value={form.department ?? ""}
                  onValueChange={(v) => setForm({ ...form, department: v, employer: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم أولاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>جهة العمل *</Label>
                <Select value={form.employer ?? ""} onValueChange={(v) => setForm({ ...form, employer: v })}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.department
                          ? `شركات ${form.department}`
                          : "اختر القسم لعرض الشركات المرتبطة"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {employerOptions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        لا توجد شركات مسجلة لهذا القسم — أضفها من صفحة الموردين
                      </div>
                    ) : (
                      employerOptions.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.department && (
                  <p className="text-[11px] text-muted-foreground">
                    القائمة مفلترة حسب الموردين بنشاط: {form.department}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>المسمى الوظيفي</Label>
                <Input value={form.job_title ?? ""} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>الحالة</Label>
                <Select value={form.status ?? "نشط"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="نشط">نشط</SelectItem>
                    <SelectItem value="موقوف">موقوف</SelectItem>
                    <SelectItem value="منتهي">منتهي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>ملاحظات</Label>
              <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!canManage && (
        <p className="text-xs text-muted-foreground text-center">
          ملاحظة: تعديل أو حذف الموظفين يتطلب صلاحيات إشرافية.
        </p>
      )}
    </div>
  );
}
