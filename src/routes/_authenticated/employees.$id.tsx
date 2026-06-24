import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ArrowRight, Save, X, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employees/$id")({
  component: EmployeeDetailPage,
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
};

type Assignment = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  role_on_entity: string | null;
  description: string | null;
  assigned_at: string;
};

function EmployeeDetailPage() {
  const { id } = useParams({ from: "/_authenticated/employees/$id" });
  const { hasRole, isSuperAdmin } = useAuth();
  const canManage =
    isSuperAdmin || hasRole("maintenance_supervisor") || hasRole("security_supervisor");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employers, setEmployers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return toast.error(error.message);
    setEmployee(data as Employee);
    setForm(data as Employee);

    const { data: ass } = await (supabase as any)
      .from("employee_assignments")
      .select("*")
      .eq("employee_id", id)
      .order("assigned_at", { ascending: false });
    setAssignments((ass ?? []) as Assignment[]);
  };

  const loadLookups = async () => {
    const [{ data: emp }, { data: dep }] = await Promise.all([
      (supabase as any).from("employee_employers").select("name").eq("is_active", true).order("name"),
      (supabase as any).from("employee_departments").select("name").eq("is_active", true).order("name"),
    ]);
    setEmployers((emp ?? []).map((r: any) => r.name));
    setDepartments((dep ?? []).map((r: any) => r.name));
  };

  useEffect(() => {
    load();
    loadLookups();
  }, [id]);

  const save = async () => {
    if (!form.full_name?.trim() || !form.employer) {
      toast.error("الاسم وجهة العمل مطلوبان");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from("employees")
      .update({
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
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم الحفظ");
    setEditing(false);
    load();
  };

  if (!employee) {
    return <div className="p-6 text-muted-foreground">جاري التحميل...</div>;
  }

  const ENTITY_LABELS: Record<string, string> = {
    maintenance_request: "طلب صيانة",
    cleaning_plan: "خطة نظافة",
    patrol: "جولة أمنية",
    inspection: "تفتيش",
    ticket: "تذكرة",
    security_incident: "حادث أمني",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link to="/employees">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{employee.full_name}</h1>
          <Badge variant={employee.status === "نشط" ? "default" : "secondary"}>
            {employee.status}
          </Badge>
        </div>
        {canManage && !editing && (
          <Button onClick={() => setEditing(true)}>
            <Pencil className="ms-1 h-4 w-4" />
            تعديل
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setForm(employee);
              }}
              disabled={saving}
            >
              <X className="ms-1 h-4 w-4" />
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="ms-1 h-4 w-4" />
              حفظ
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">البيانات الأساسية</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>الاسم الكامل *</Label>
                <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>رقم الجوال</Label>
                <Input value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>رقم الهوية / الإقامة</Label>
                <Input value={form.national_id ?? ""} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>الجنسية</Label>
                <Input value={form.nationality ?? ""} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>تاريخ التعيين</Label>
                <Input type="date" value={form.hire_date ?? ""} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>العنوان</Label>
                <Textarea rows={2} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>جهة العمل *</Label>
                <Select value={form.employer ?? ""} onValueChange={(v) => setForm({ ...form, employer: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {employers.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>القسم</Label>
                <Select value={form.department ?? ""} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {departments.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>المسمى الوظيفي</Label>
                <Input value={form.job_title ?? ""} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>الحالة</Label>
                <Select value={form.status ?? "نشط"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="نشط">نشط</SelectItem>
                    <SelectItem value="موقوف">موقوف</SelectItem>
                    <SelectItem value="منتهي">منتهي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>ملاحظات</Label>
                <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <Info label="رقم الجوال" value={employee.mobile} ltr />
              <Info label="رقم الهوية / الإقامة" value={employee.national_id} />
              <Info label="الجنسية" value={employee.nationality} />
              <Info label="تاريخ التعيين" value={employee.hire_date} />
              <Info label="جهة العمل" value={employee.employer} />
              <Info label="القسم" value={employee.department} />
              <Info label="المسمى الوظيفي" value={employee.job_title} />
              <Info label="الحالة" value={employee.status} />
              <Info label="العنوان" value={employee.address} full />
              <Info label="ملاحظات" value={employee.notes} full />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل الإسنادات ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المرجع</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الوصف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    لا توجد إسنادات بعد
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.assigned_at).toLocaleString("ar-EG")}</TableCell>
                    <TableCell>{ENTITY_LABELS[a.entity_type] ?? a.entity_type}</TableCell>
                    <TableCell>{a.entity_label ?? "—"}</TableCell>
                    <TableCell>{a.role_on_entity ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.description ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({
  label,
  value,
  ltr,
  full,
}: {
  label: string;
  value: string | null | undefined;
  ltr?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className={ltr ? "text-start" : ""} dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </div>
    </div>
  );
}
