import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Search,
  UserPlus,
  KeyRound,
  Trash2,
  Pencil,
  ShieldCheck,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth-context";
import {
  createUser,
  updateUserProfile,
  resetUserPassword,
  deleteUser,
  setUserRoles,
} from "@/lib/users-admin.functions";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
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
  roles: string[];
}

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

function roleDisplay(name: string, opts: RoleOption[]) {
  const found = opts.find((o) => o.name === name);
  return ROLE_LABELS[name] ?? found?.description ?? name;
}

function genPassword(len = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function initials(name: string | null) {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function UsersPage() {
  const { hasRole, user: me } = useAuth();
  const allowed = hasRole("super_admin");

  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [creating, setCreating] = useState(false);
  const [editingRoles, setEditingRoles] = useState<ProfileRow | null>(null);
  const [editingProfile, setEditingProfile] = useState<ProfileRow | null>(null);
  const [resetting, setResetting] = useState<ProfileRow | null>(null);
  const [deleting, setDeleting] = useState<ProfileRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [profilesRes, rolesRes, assignmentsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, is_active, created_at")
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("app_roles")
        .select("id, name, description")
        .order("name", { ascending: true }),
      (supabase as any)
        .from("user_role_assignments")
        .select("user_id, app_roles(name)"),
    ]);
    if (profilesRes.error || rolesRes.error || assignmentsRes.error) {
      toast.error("تعذّر تحميل المستخدمين");
      setLoading(false);
      return;
    }
    setAllRoles((rolesRes.data ?? []) as RoleOption[]);
    const byUser = new Map<string, string[]>();
    ((assignmentsRes.data ?? []) as any[]).forEach((r) => {
      const name = r.app_roles?.name;
      if (!name) return;
      const arr = byUser.get(r.user_id) ?? [];
      if (!arr.includes(name)) arr.push(name);
      byUser.set(r.user_id, arr);
    });
    setRows(
      ((profilesRes.data ?? []) as Omit<ProfileRow, "roles">[]).map((p) => ({
        ...p,
        roles: byUser.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.is_active).length;
    const admins = rows.filter((r) => r.roles.includes("super_admin")).length;
    return { total: rows.length, active, inactive: rows.length - active, admins };
  }, [rows]);

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
    const s = q.trim().toLowerCase();
    if (s) {
      const match =
        (r.full_name ?? "").toLowerCase().includes(s) ||
        (r.phone ?? "").toLowerCase().includes(s) ||
        r.id.includes(s);
      if (!match) return false;
    }
    if (roleFilter !== "all" && !r.roles.includes(roleFilter)) return false;
    if (statusFilter === "active" && !r.is_active) return false;
    if (statusFilter === "inactive" && r.is_active) return false;
    return true;
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
          <h1 className="text-2xl font-bold text-primary">إدارة المستخدمين</h1>
          <p className="text-sm text-muted-foreground mt-1">
            أنشئ الحسابات، عدّل الصلاحيات، وتحكّم في تفعيل الموظفين.
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-gold text-gold-foreground hover:bg-gold/90"
        >
          <UserPlus className="h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<UsersIcon className="h-5 w-5" />} label="الإجمالي" value={stats.total} />
        <StatCard icon={<UserCheck className="h-5 w-5 text-success" />} label="نشط" value={stats.active} />
        <StatCard icon={<UserX className="h-5 w-5 text-destructive" />} label="معطّل" value={stats.inactive} />
        <StatCard icon={<ShieldCheck className="h-5 w-5 text-gold" />} label="مدير عام" value={stats.admins} />
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف…"
            className="ps-8"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">كل الأدوار</option>
          {allRoles.map((r) => (
            <option key={r.id} value={r.name}>
              {roleDisplay(r.name, allRoles)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">معطّل</option>
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-11 px-4">المستخدم</TableHead>
              <TableHead className="h-11 px-4 hidden md:table-cell">الهاتف</TableHead>
              <TableHead className="h-11 px-4">الأدوار</TableHead>
              <TableHead className="h-11 px-4 w-[140px]">الحالة</TableHead>
              <TableHead className="h-11 px-4 hidden lg:table-cell">تاريخ الإضافة</TableHead>
              <TableHead className="h-11 px-4 text-end w-[80px]">إجراءات</TableHead>
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
                <TableRow key={r.id} className="h-16">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initials(r.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          <span className="truncate">{r.full_name || "—"}</span>
                          {r.id === me?.id && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              أنت
                            </Badge>
                          )}
                        </div>
                        <div
                          className="text-xs text-muted-foreground truncate md:hidden"
                          dir="ltr"
                        >
                          {r.phone || "—"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="px-4 text-right hidden md:table-cell text-sm">
                    {r.phone || "—"}
                  </TableCell>
                  <TableCell className="px-4">
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
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={r.is_active}
                        onCheckedChange={() => toggleActive(r)}
                        aria-label="تفعيل/تعطيل"
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          r.is_active ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {r.is_active ? "نشط" : "معطّل"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-xs text-muted-foreground hidden lg:table-cell">
                    {new Date(r.created_at).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell className="px-4 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingProfile(r)}>
                          <Pencil className="h-4 w-4" />
                          تعديل البيانات
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingRoles(r)}>
                          <ShieldCheck className="h-4 w-4" />
                          تعديل الأدوار
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetting(r)}>
                          <KeyRound className="h-4 w-4" />
                          إعادة تعيين كلمة المرور
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={r.id === me?.id}
                          onClick={() => setDeleting(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف الحساب
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} onSaved={load} />
      <EditRolesDialog
        user={editingRoles}
        onClose={() => setEditingRoles(null)}
        onSaved={() => {
          setEditingRoles(null);
          load();
        }}
      />
      <EditProfileDialog
        user={editingProfile}
        onClose={() => setEditingProfile(null)}
        onSaved={() => {
          setEditingProfile(null);
          load();
        }}
      />
      <ResetPasswordDialog
        user={resetting}
        onClose={() => setResetting(null)}
      />
      <DeleteUserDialog
        user={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          load();
        }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </Card>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fn = useServerFn(createUser);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(() => genPassword());
  const [showPw, setShowPw] = useState(false);
  const [roles, setRoles] = useState<Set<AppRole>>(new Set());
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setFullName("");
      setPhone("");
      setPassword(genPassword());
      setRoles(new Set());
      setIsActive(true);
      setShowPw(false);
    }
  }, [open]);

  const toggle = (r: AppRole) => {
    setRoles((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  const submit = async () => {
    if (!email || !fullName || password.length < 8) {
      toast.error("املأ كل الحقول المطلوبة (كلمة المرور 8 أحرف على الأقل)");
      return;
    }
    setSaving(true);
    try {
      await fn({
        data: {
          email,
          password,
          full_name: fullName,
          phone,
          roles: [...roles],
          is_active: isActive,
        },
      });
      toast.success("تم إنشاء المستخدم");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر إنشاء المستخدم");
    } finally {
      setSaving(false);
    }
  };

  const copyPw = async () => {
    await navigator.clipboard.writeText(password);
    toast.success("تم نسخ كلمة المرور");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          <DialogDescription>
            سيتم إنشاء الحساب فورًا. أرسل كلمة المرور للمستخدم بعد الحفظ.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>الاسم الكامل *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>البريد الإلكتروني *</Label>
            <Input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>رقم الهاتف</Label>
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>كلمة المرور *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPw ? "text" : "password"}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={copyPw} title="نسخ">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPassword(genPassword())}
              >
                توليد
              </Button>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">الأدوار</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent text-sm"
                >
                  <Checkbox checked={roles.has(r)} onCheckedChange={() => toggle(r)} />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm">تفعيل الحساب فور إنشائه</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            إنشاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const fn = useServerFn(setUserRoles);
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
    try {
      await fn({ data: { user_id: user.id, roles: [...selected] } });
      toast.success("تم حفظ الأدوار");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل أدوار: {user.full_name || "—"}</DialogTitle>
          <DialogDescription>اختر دور أو أكثر لهذا المستخدم.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {ALL_ROLES.map((r) => (
            <label
              key={r}
              className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent"
            >
              <Checkbox checked={selected.has(r)} onCheckedChange={() => toggle(r)} />
              <span className="flex-1">{ROLE_LABELS[r]}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({
  user,
  onClose,
  onSaved,
}: {
  user: ProfileRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fn = useServerFn(updateUserProfile);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  if (!user) return null;

  const save = async () => {
    if (!fullName.trim()) return toast.error("الاسم مطلوب");
    setSaving(true);
    try {
      await fn({ data: { user_id: user.id, full_name: fullName, phone } });
      toast.success("تم تحديث البيانات");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>الاسم الكامل</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>الهاتف</Label>
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: ProfileRow | null;
  onClose: () => void;
}) {
  const fn = useServerFn(resetUserPassword);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPassword(genPassword());
      setShowPw(false);
    }
  }, [user]);

  if (!user) return null;

  const save = async () => {
    if (password.length < 8) return toast.error("كلمة المرور 8 أحرف على الأقل");
    setSaving(true);
    try {
      await fn({ data: { user_id: user.id, password } });
      await navigator.clipboard.writeText(password).catch(() => {});
      toast.success("تم تغيير كلمة المرور (تم نسخها للحافظة)");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر تغيير كلمة المرور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          <DialogDescription>
            {user.full_name || "—"} — احفظ كلمة المرور وأرسلها للمستخدم.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>كلمة المرور الجديدة</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showPw ? "text" : "password"}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pe-9"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPassword(genPassword())}>
              توليد
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: ProfileRow | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const fn = useServerFn(deleteUser);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async () => {
    setSaving(true);
    try {
      await fn({ data: { user_id: user.id } });
      toast.success("تم حذف الحساب");
      onDeleted();
    } catch (e: any) {
      toast.error(e?.message || "تعذّر الحذف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>حذف حساب المستخدم؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف {user.full_name || "هذا المستخدم"} نهائيًا مع كل صلاحياته. لا يمكن التراجع.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={submit}
            disabled={saving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
