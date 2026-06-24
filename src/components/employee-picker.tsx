import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export type EmployeeOption = {
  id: string;
  full_name: string;
  department: string | null;
  employer: string;
  job_title: string | null;
};

interface Props {
  value: string | null;
  onChange: (employeeId: string | null, employee: EmployeeOption | null) => void;
  /** Filter shown employees by department (e.g. "النظافة"). Empty = all. */
  filterDepartment?: string;
  /** Default department for quick-add form. */
  defaultDepartment?: string;
  defaultEmployer?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function EmployeePicker({
  value,
  onChange,
  filterDepartment,
  defaultDepartment,
  defaultEmployer,
  placeholder = "اختر موظفاً",
  disabled,
}: Props) {
  const [items, setItems] = useState<EmployeeOption[]>([]);
  const [employers, setEmployers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    national_id: "",
    nationality: "",
    employer: defaultEmployer ?? "",
    job_title: "",
    department: defaultDepartment ?? "",
  });

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from("employees")
      .select("id, full_name, department, employer, job_title")
      .eq("status", "نشط")
      .order("full_name");
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((data ?? []) as EmployeeOption[]);
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
  }, []);

  const visible = useMemo(
    () => (filterDepartment ? items.filter((i) => i.department === filterDepartment) : items),
    [items, filterDepartment],
  );

  const quickAdd = async () => {
    if (!form.full_name.trim() || !form.employer) {
      toast.error("الاسم وجهة العمل مطلوبان");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await (supabase as any)
      .from("employees")
      .insert({
        full_name: form.full_name.trim(),
        mobile: form.mobile || null,
        national_id: form.national_id || null,
        nationality: form.nationality || null,
        employer: form.employer,
        job_title: form.job_title || null,
        department: form.department || null,
        status: "نشط",
        created_by: u.user?.id ?? null,
      })
      .select("id, full_name, department, employer, job_title")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تمت إضافة الموظف");
    setItems((prev) => [...prev, data as EmployeeOption].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    onChange(data.id, data as EmployeeOption);
    setOpen(false);
    setForm({
      full_name: "",
      mobile: "",
      national_id: "",
      nationality: "",
      employer: defaultEmployer ?? "",
      job_title: "",
      department: defaultDepartment ?? "",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Select
          value={value ?? ""}
          onValueChange={(v) => {
            const emp = items.find((i) => i.id === v) ?? null;
            onChange(v || null, emp);
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {visible.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">لا يوجد موظفون</div>
            ) : (
              visible.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.full_name}
                  {e.job_title ? ` — ${e.job_title}` : ""}
                  {e.department ? ` (${e.department})` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          title="إضافة موظف جديد"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة موظف جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>الاسم الكامل *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>رقم الجوال</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>رقم الهوية / الإقامة</Label>
                <Input
                  value={form.national_id}
                  onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>الجنسية</Label>
                <Input
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>المسمى الوظيفي</Label>
                <Input
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>جهة العمل *</Label>
                <Select
                  value={form.employer}
                  onValueChange={(v) => setForm({ ...form, employer: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {employers.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>القسم</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm({ ...form, department: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
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
            </div>
            <p className="text-xs text-muted-foreground">
              لإدخال بيانات تفصيلية (العنوان، تاريخ التعيين، الملاحظات) افتح صفحة الموظف بعد الحفظ.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={quickAdd} disabled={saving}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
