import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, Users as UsersIcon, ArrowRight, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth, roleLabel } from "@/lib/auth-context";
import {
  listRoles, listPermissions, getRolePermissions,
  createRole, updateRole, deleteRole, setRolePermissions,
} from "@/lib/roles-admin.functions";

export const Route = createFileRoute("/_authenticated/roles")({
  component: RolesPage,
});

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  user_count: number;
  permission_count: number;
  created_at: string;
}
interface Permission {
  key: string;
  module: string;
  module_label: string;
  action: string;
  label: string;
  sort_order: number;
}

function RolesPage() {
  const { isSuperAdmin } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [permsRole, setPermsRole] = useState<Role | null>(null);
  const [delRole, setDelRole] = useState<Role | null>(null);

  const fnList = useServerFn(listRoles);
  const fnPerms = useServerFn(listPermissions);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([fnList(), fnPerms()]);
      setRoles(r as Role[]);
      setPermissions(p as Permission[]);
    } catch (e: any) {
      toast.error(e?.message ?? "تعذّر التحميل");
    }
    setLoading(false);
  }, [fnList, fnPerms]);

  useEffect(() => { load(); }, [load]);

  const filtered = roles.filter((r) =>
    !search.trim() ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    roleLabel(r.name).includes(search) ||
    (r.description ?? "").includes(search),
  );

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground space-y-2">
          <ShieldCheck className="h-10 w-10 mx-auto opacity-40" />
          <p>هذه الصفحة متاحة للمدير العام فقط.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/users"><Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4 ms-1" />المستخدمون</Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">إدارة الأدوار والصلاحيات</h1>
            <p className="text-sm text-muted-foreground">أنشئ أدوار مخصصة وحدّد صلاحيات تفصيلية لكل دور</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="h-4 w-4 ms-1" /> دور جديد
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              dir="rtl"
              placeholder="بحث في الأدوار..."
              className="pe-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table className="min-w-[680px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-11 px-4">الدور</TableHead>
                    <TableHead className="h-11 px-4">الوصف</TableHead>
                    <TableHead className="h-11 px-4 text-center">المستخدمون</TableHead>
                    <TableHead className="h-11 px-4 text-center">الصلاحيات</TableHead>
                    <TableHead className="h-11 px-4 text-end w-[200px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="h-16">
                      <TableCell className="px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{roleLabel(r.name)}</span>
                          {r.is_system && <Badge variant="outline" className="text-xs">نظام</Badge>}
                          {r.name === "super_admin" && <Badge className="bg-gold text-gold-foreground text-xs">مدير عام</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{r.name}</div>
                      </TableCell>
                      <TableCell className="px-4 text-xs text-muted-foreground max-w-xs">{r.description ?? "—"}</TableCell>
                      <TableCell className="px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <UsersIcon className="h-3 w-3 text-muted-foreground" />
                          {r.user_count}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        {r.name === "super_admin" ? (
                          <Badge className="bg-gold text-gold-foreground">كل الصلاحيات</Badge>
                        ) : (
                          <Badge variant="outline">{r.permission_count}/{permissions.length}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPermsRole(r)}
                            disabled={r.name === "super_admin"}
                          >
                            <ShieldCheck className="h-4 w-4 ms-1" /> الصلاحيات
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditRole(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDelRole(r)}
                            disabled={r.is_system}
                          >
                            <Trash2 className={`h-4 w-4 ${r.is_system ? "text-muted-foreground" : "text-destructive"}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد أدوار مطابقة.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleFormDialog
        open={createOpen || !!editRole}
        role={editRole}
        onClose={() => { setCreateOpen(false); setEditRole(null); }}
        onSaved={() => { setCreateOpen(false); setEditRole(null); load(); }}
      />

      <RolePermissionsDialog
        role={permsRole}
        permissions={permissions}
        onClose={() => setPermsRole(null)}
        onSaved={() => { setPermsRole(null); load(); }}
      />

      <AlertDialog open={!!delRole} onOpenChange={(o) => !o && setDelRole(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدور</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الدور "{delRole && roleLabel(delRole.name)}" نهائيًا.
              {delRole && delRole.user_count > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ يوجد {delRole.user_count} مستخدم مرتبط بهذا الدور وسيفقدون صلاحياته.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!delRole) return;
                try {
                  await (useServerFn(deleteRole) as any)({ data: { role_id: delRole.id } });
                } catch (e: any) {
                  toast.error(e?.message ?? "تعذّر الحذف");
                  return;
                }
                toast.success("تم حذف الدور");
                setDelRole(null);
                load();
              }}
            >حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ============ Dialog: إنشاء/تعديل الدور ============ */
function RoleFormDialog({ open, role, onClose, onSaved }: {
  open: boolean; role: Role | null; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const fnCreate = useServerFn(createRole);
  const fnUpdate = useServerFn(updateRole);

  useEffect(() => {
    if (open) {
      setName(role?.name ?? "");
      setDescription(role?.description ?? "");
    }
  }, [open, role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (role) {
        await (fnUpdate as any)({ data: { role_id: role.id, name: role.is_system ? undefined : name, description } });
      } else {
        await (fnCreate as any)({ data: { name, description } });
      }
      toast.success(role ? "تم التحديث" : "تم إنشاء الدور");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذّر الحفظ");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{role ? `تعديل الدور: ${roleLabel(role.name)}` : "دور جديد"}</DialogTitle>
            <DialogDescription>
              {role?.is_system
                ? "هذا دور نظام — يمكنك تعديل الوصف فقط."
                : "أدخل اسمًا تقنيًا قصيرًا بالإنجليزية (مثل branch_manager) ووصفًا بالعربية."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>الاسم التقني</Label>
              <Input
                dir="ltr"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="branch_manager"
                disabled={role?.is_system}
                required
              />
              <p className="text-xs text-muted-foreground">حروف إنجليزية وأرقام وشرطة سفلية فقط.</p>
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر للدور والمسؤوليات"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={busy} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Dialog: تعديل صلاحيات الدور ============ */
function RolePermissionsDialog({ role, permissions, onClose, onSaved }: {
  role: Role | null;
  permissions: Permission[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fnGet = useServerFn(getRolePermissions);
  const fnSet = useServerFn(setRolePermissions);

  useEffect(() => {
    if (!role) return;
    setLoading(true);
    (fnGet as any)({ data: { role_id: role.id } })
      .then((keys: string[]) => setSelected(new Set(keys)))
      .catch((e: any) => toast.error(e?.message ?? "تعذّر التحميل"))
      .finally(() => setLoading(false));
  }, [role, fnGet]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; perms: Permission[] }>();
    permissions.forEach((p) => {
      if (!map.has(p.module)) map.set(p.module, { label: p.module_label, perms: [] });
      map.get(p.module)!.perms.push(p);
    });
    return Array.from(map.entries());
  }, [permissions]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleModule = (perms: Permission[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => on ? next.add(p.key) : next.delete(p.key));
      return next;
    });
  };

  const submit = async () => {
    if (!role) return;
    setBusy(true);
    try {
      await (fnSet as any)({ data: { role_id: role.id, permission_keys: Array.from(selected) } });
      toast.success("تم حفظ الصلاحيات");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "تعذّر الحفظ");
    }
    setBusy(false);
  };

  return (
    <Dialog open={!!role} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>صلاحيات الدور: {role && roleLabel(role.name)}</DialogTitle>
          <DialogDescription>
            اختر الصلاحيات التي يحصل عليها هذا الدور. التغييرات تسري فورًا على كل المستخدمين المرتبطين بالدور.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([module, { label, perms }]) => {
                const allOn = perms.every((p) => selected.has(p.key));
                const someOn = perms.some((p) => selected.has(p.key));
                return (
                  <div key={module} className="border border-border rounded-md p-3">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allOn ? true : someOn ? "indeterminate" : false}
                          onCheckedChange={(v) => toggleModule(perms, v === true)}
                        />
                        <span className="font-semibold text-sm">{label}</span>
                        <Badge variant="outline" className="text-xs">
                          {perms.filter((p) => selected.has(p.key)).length}/{perms.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {perms.map((p) => (
                        <label
                          key={p.key}
                          className="flex items-start gap-2 cursor-pointer hover:bg-muted/40 rounded p-2 transition-colors"
                        >
                          <Checkbox
                            checked={selected.has(p.key)}
                            onCheckedChange={() => toggle(p.key)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">{p.label}</div>
                            <div className="text-[10px] text-muted-foreground font-mono" dir="ltr">{p.key}</div>
                          </div>
                          {p.action === "special" && (
                            <Badge variant="outline" className="text-[10px] shrink-0">خاص</Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4 mt-0">
          <div className="flex items-center justify-between w-full gap-3">
            <Badge variant="outline" className="text-xs">
              <Check className="h-3 w-3 ms-1" />
              {selected.size} صلاحية مختارة
            </Badge>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
              <Button onClick={submit} disabled={busy || loading} className="bg-gold text-gold-foreground hover:bg-gold/90">
                {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}حفظ الصلاحيات
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
