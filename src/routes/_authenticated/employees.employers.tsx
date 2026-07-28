import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { Plus, Building2, ArrowRight, Pencil, Archive, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employees/employers")({
  component: EmployersPage,
  head: () => ({
    meta: [
      { title: "جهات العمل — TAAM" },
      { name: "description", content: "إدارة جهات العمل الخاصة بالموظفين" },
      { property: "og:title", content: "جهات العمل — TAAM" },
      { property: "og:description", content: "إدارة جهات العمل الخاصة بالموظفين" },
    ],
  }),
});

type Employer = { id: string; name: string; is_active: boolean; created_at: string };

function EmployersPage() {
  const [rows, setRows] = useState<Employer[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employer | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("employee_employers")
      .select("id, name, is_active, created_at")
      .order("name");
    setRows((data ?? []) as Employer[]);

    const { data: emps } = await (supabase as any)
      .from("employees")
      .select("employer");
    const c: Record<string, number> = {};
    ((emps ?? []) as any[]).forEach((e) => {
      if (e.employer) c[e.employer] = (c[e.employer] ?? 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (r: Employer) => {
    setEditing(r);
    setName(r.name);
    setDialogOpen(true);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) return toast.error("الاسم مطلوب");
    setBusy(true);
    if (editing) {
      const { error } = await (supabase as any)
        .from("employee_employers")
        .update({ name: n })
        .eq("id", editing.id);
      setBusy(false);
      if (error) return toast.error("تعذّر الحفظ");
      toast.success("تم التحديث");
    } else {
      const { error } = await (supabase as any)
        .from("employee_employers")
        .insert({ name: n });
      setBusy(false);
      if (error) return toast.error("تعذّر الحفظ");
      toast.success("تمت الإضافة");
    }
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (r: Employer) => {
    const { error } = await (supabase as any)
      .from("employee_employers")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) return toast.error("تعذّر التحديث");
    toast.success(r.is_active ? "تم الأرشفة" : "تم التفعيل");
    load();
  };

  const visible = rows.filter((r) => (showArchived ? !r.is_active : r.is_active));

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
              <Building2 className="h-6 w-6 text-gold" />
              جهات العمل
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              إدارة جهات العمل التي ينتمي إليها الموظفون
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
            إضافة جهة عمل
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {showArchived ? "المؤرشف" : "النشط"} ({visible.length})
          </CardTitle>
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
                  <TableHead>عدد الموظفين</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
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
            <DialogTitle>{editing ? "تعديل جهة العمل" : "إضافة جهة عمل"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>الاسم *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شركة نخبة تسكين"
              autoFocus
            />
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
