import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Plus, Users2, ArrowRight, Pencil, Archive, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employees/departments")({
  component: DepartmentsPage,
  head: () => ({
    meta: [
      { title: "الأقسام — TAAM" },
      { name: "description", content: "إدارة أقسام الموظفين المرتبطة بجهات العمل" },
      { property: "og:title", content: "الأقسام — TAAM" },
      { property: "og:description", content: "إدارة أقسام الموظفين المرتبطة بجهات العمل" },
    ],
  }),
});

type Employer = { id: string; name: string };
type Department = {
  id: string;
  name: string;
  employer_id: string | null;
  is_active: boolean;
};

function DepartmentsPage() {
  const [rows, setRows] = useState<Department[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [filterEmployer, setFilterEmployer] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [employerId, setEmployerId] = useState<string>("none");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: deps }, { data: emps }, { data: employees }] = await Promise.all([
      (supabase as any)
        .from("employee_departments")
        .select("id, name, employer_id, is_active")
        .order("name"),
      (supabase as any)
        .from("employee_employers")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      (supabase as any).from("employees").select("department"),
    ]);
    setRows((deps ?? []) as Department[]);
    setEmployers((emps ?? []) as Employer[]);
    const c: Record<string, number> = {};
    ((employees ?? []) as any[]).forEach((e) => {
      if (e.department) c[e.department] = (c[e.department] ?? 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const employerName = (id: string | null) =>
    id ? employers.find((e) => e.id === id)?.name ?? "—" : "— (مشترك)";

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (showArchived ? r.is_active : !r.is_active) return false;
      if (filterEmployer === "all") return true;
      if (filterEmployer === "none") return r.employer_id === null;
      return r.employer_id === filterEmployer;
    });
  }, [rows, showArchived, filterEmployer]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setEmployerId(filterEmployer !== "all" ? filterEmployer : "none");
    setDialogOpen(true);
  };

  const openEdit = (r: Department) => {
    setEditing(r);
    setName(r.name);
    setEmployerId(r.employer_id ?? "none");
    setDialogOpen(true);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) return toast.error("الاسم مطلوب");
    setBusy(true);
    const payload = {
      name: n,
      employer_id: employerId === "none" ? null : employerId,
    };
    if (editing) {
      const { error } = await (supabase as any)
        .from("employee_departments")
        .update(payload)
        .eq("id", editing.id);
      setBusy(false);
      if (error) return toast.error("تعذّر الحفظ");
      toast.success("تم التحديث");
    } else {
      const { error } = await (supabase as any)
        .from("employee_departments")
        .insert(payload);
      setBusy(false);
      if (error) return toast.error("تعذّر الحفظ");
      toast.success("تمت الإضافة");
    }
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (r: Department) => {
    const { error } = await (supabase as any)
      .from("employee_departments")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) return toast.error("تعذّر التحديث");
    toast.success(r.is_active ? "تم الأرشفة" : "تم التفعيل");
    load();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/employees">
              <ArrowRight className="h-4 w-4 ms-1" />
              العودة للموظفين
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users2 className="h-6 w-6 text-gold" />
              الأقسام
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              الأقسام مرتبطة بجهة العمل — اترك جهة العمل فارغة لجعل القسم مشتركًا
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "عرض النشط" : "عرض المؤرشف"}
          </Button>
          <Button onClick={openAdd} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" />
            إضافة قسم
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">
            {showArchived ? "المؤرشف" : "النشط"} ({visible.length})
          </CardTitle>
          <div className="w-56">
            <Select value={filterEmployer} onValueChange={setFilterEmployer}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب جهة العمل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل جهات العمل</SelectItem>
                <SelectItem value="none">— مشترك (بدون جهة)</SelectItem>
                {employers.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">جارٍ التحميل…</p>
          ) : visible.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>جهة العمل</TableHead>
                  <TableHead>عدد الموظفين</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{employerName(r.employer_id)}</TableCell>
                    <TableCell>{counts[r.name] ?? 0}</TableCell>
                    <TableCell>
                      {r.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-800">نشط</Badge>
                      ) : (
                        <Badge variant="secondary">مؤرشف</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(r)}>
                          {r.is_active ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل القسم" : "إضافة قسم"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>جهة العمل</Label>
              <Select value={employerId} onValueChange={setEmployerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— مشترك (بدون جهة)</SelectItem>
                  {employers.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الاسم *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: المحاسبة"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={save}
              disabled={busy}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
