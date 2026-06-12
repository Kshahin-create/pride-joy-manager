import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  roles: AppRole[];
}

const ALL_ROLES: AppRole[] = [
  "super_admin",
  "accountant",
  "security_supervisor",
  "maintenance_supervisor",
  "receptionist",
  "owner",
];

function UsersPage() {
  const { hasRole, user: me } = useAuth();
  const allowed = hasRole("super_admin");

  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProfileRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles, error: e1 } = await supabase
      .from("profiles")
      .select("id, full_name, phone, is_active, created_at")
      .order("created_at", { ascending: false });
    const { data: rolesData, error: e2 } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (e1 || e2) {
      toast.error("تعذّر تحميل المستخدمين");
      setLoading(false);
      return;
    }
    const byUser = new Map<string, AppRole[]>();
    ((rolesData ?? []) as { user_id: string; role: AppRole }[]).forEach((r) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role);
      byUser.set(r.user_id, arr);
    });
    setRows(
      ((profiles ?? []) as Omit<ProfileRow, "roles">[]).map((p) => ({
        ...p,
        roles: byUser.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold text-destructive">غير مصرّح</p>
        <p className="text-sm text-muted-foreground mt-1">
          هذه الصفحة متاحة للمدير العام فقط.
        </p>
      </Card>
    );
  }

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return (
      (r.full_name ?? "").toLowerCase().includes(s) ||
      (r.phone ?? "").toLowerCase().includes(s) ||
      r.id.includes(s)
    );
  });

  const toggleActive = async (row: ProfileRow) => {
    const next = !row.is_active;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: next })
      .eq("id", row.id);
    if (error) return toast.error("تعذّر تحديث الحالة");
    toast.success(next ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم");
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_active: next } : r)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">المستخدمون</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة موظفي البرج وأدوارهم وحالة تفعيلهم.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 -translate-y-1/2 start-2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف…"
            className="ps-8"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الأدوار</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإضافة</TableHead>
              <TableHead className="text-end">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  لا يوجد مستخدمون مطابقون
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.full_name || "—"}
                    {r.id === me?.id && (
                      <Badge variant="outline" className="ms-2 text-[10px]">أنت</Badge>
                    )}
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">{r.phone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.roles.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {r.roles.map((rl) => (
                        <Badge key={rl} variant="secondary" className="text-[10px]">
                          {ROLE_LABELS[rl]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.is_active ? (
                      <Badge className="bg-success text-success-foreground">نشط</Badge>
                    ) : (
                      <Badge variant="secondary">معطّل</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={r.is_active}
                        onCheckedChange={() => toggleActive(r)}
                        aria-label="تفعيل/تعطيل"
                      />
                      <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                        تعديل الأدوار
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <EditRolesDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}

function EditRolesDialog({
  user,
  onClose,
  onSaved,
}: {
  user: ProfileRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<AppRole>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setSelected(new Set(user.roles));
  }, [user]);

  if (!user) return null;

  const toggle = (r: AppRole) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const current = new Set(user.roles);
    const target = selected;
    const toAdd = [...target].filter((r) => !current.has(r));
    const toRemove = [...current].filter((r) => !target.has(r));

    if (toRemove.length) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id)
        .in("role", toRemove);
      if (error) {
        toast.error("تعذّر إزالة بعض الأدوار");
        setSaving(false);
        return;
      }
    }
    if (toAdd.length) {
      const { error } = await supabase
        .from("user_roles")
        .insert(toAdd.map((role) => ({ user_id: user.id, role })));
      if (error) {
        toast.error("تعذّر إضافة بعض الأدوار");
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    toast.success("تم حفظ الأدوار");
    onSaved();
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل أدوار: {user.full_name || "—"}</DialogTitle>
          <DialogDescription>اختر دور أو أكثر لهذا المستخدم.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {ALL_ROLES.map((r) => (
            <label
              key={r}
              className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent"
            >
              <Checkbox
                checked={selected.has(r)}
                onCheckedChange={() => toggle(r)}
                id={`role-${r}`}
              />
              <Label htmlFor={`role-${r}`} className="cursor-pointer flex-1">
                {ROLE_LABELS[r]}
              </Label>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
            {saving && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
