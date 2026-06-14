import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useActiveProperty } from "@/lib/active-property-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Building2, Pencil, Trash2, Users, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/properties")({
  component: PropertiesPage,
});

const PROPERTY_TYPES = ["برج","مجمع تجاري","مركز تجاري","مدينة صناعية","مجمع إداري","مجمع سكني","عقار آخر"] as const;
const STATUSES = ["نشط","غير نشط","أرشيف"] as const;

type Property = {
  id: string;
  name: string;
  code: string | null;
  property_type: string;
  status: string;
  owner_name: string | null;
  management_company: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  total_floors: number | null;
  total_area: number | null;
  phone: string | null;
  email: string | null;
  cr_number: string | null;
  vat_number: string | null;
  logo_url: string | null;
  notes: string | null;
};

type UserRow = { id: string; full_name: string | null; email?: string };

const empty = () => ({
  name: "", code: "", property_type: "برج", status: "نشط",
  owner_name: "", management_company: "", city: "", country: "السعودية",
  address: "", total_floors: "", total_area: "", phone: "", email: "",
  cr_number: "", vat_number: "", logo_url: "", notes: "",
});

function PropertiesPage() {
  const { isSuperAdmin } = useAuth();
  const { refresh: refreshActive } = useActiveProperty();
  const [rows, setRows] = useState<Property[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState<any>(empty());
  const [busy, setBusy] = useState(false);

  // assigned users dialog
  const [usersOpen, setUsersOpen] = useState(false);
  const [usersFor, setUsersFor] = useState<Property | null>(null);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Property[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const openEdit = (r: Property) => {
    setEditing(r);
    setForm({
      ...empty(), ...r,
      total_floors: r.total_floors ?? "",
      total_area: r.total_area ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!isSuperAdmin) return;
    if (!form.name?.trim()) return toast.error("اسم العقار مطلوب");
    setBusy(true);
    const payload: any = {
      name: form.name, code: form.code || null,
      property_type: form.property_type, status: form.status,
      owner_name: form.owner_name || null,
      management_company: form.management_company || null,
      city: form.city || null, country: form.country || null,
      address: form.address || null,
      total_floors: form.total_floors ? Number(form.total_floors) : null,
      total_area: form.total_area ? Number(form.total_area) : null,
      phone: form.phone || null, email: form.email || null,
      cr_number: form.cr_number || null, vat_number: form.vat_number || null,
      logo_url: form.logo_url || null, notes: form.notes || null,
    };
    const q = editing
      ? await supabase.from("properties").update(payload).eq("id", editing.id)
      : await supabase.from("properties").insert(payload);
    setBusy(false);
    if (q.error) return toast.error(q.error.message);
    toast.success(editing ? "تم تحديث العقار" : "تم إضافة العقار");
    setOpen(false);
    load();
    refreshActive();
  };

  const remove = async (r: Property) => {
    if (!confirm(`حذف العقار "${r.name}"؟ سيُرفض الحذف إذا كان مرتبطاً ببيانات.`)) return;
    const { error } = await supabase.from("properties").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
    refreshActive();
  };

  const openUsers = async (r: Property) => {
    setUsersFor(r);
    setUsersOpen(true);
    const [u, ua] = await Promise.all([
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase.from("user_properties").select("user_id").eq("property_id", r.id),
    ]);
    if (!u.error) setAllUsers((u.data ?? []) as UserRow[]);
    if (!ua.error) setAssigned(new Set(((ua.data ?? []) as any[]).map((x) => x.user_id)));
  };

  const toggleUser = async (uid: string) => {
    if (!usersFor) return;
    if (assigned.has(uid)) {
      const { error } = await supabase.from("user_properties")
        .delete().eq("user_id", uid).eq("property_id", usersFor.id);
      if (error) return toast.error(error.message);
      setAssigned((s) => { const n = new Set(s); n.delete(uid); return n; });
    } else {
      const { error } = await supabase.from("user_properties")
        .insert({ user_id: uid, property_id: usersFor.id });
      if (error) return toast.error(error.message);
      setAssigned((s) => new Set(s).add(uid));
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            العقارات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة كل العقارات المُدارة في النظام وتعيين المستخدمين لكل عقار.
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openNew} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 ms-1" /> عقار جديد
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>قائمة العقارات</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>المالك / المدير</TableHead>
                  <TableHead>الأدوار</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد عقارات</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code ?? "—"}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs">{r.property_type}</TableCell>
                    <TableCell className="text-xs">{r.city ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      <div>{r.owner_name ?? "—"}</div>
                      <div className="text-muted-foreground">{r.management_company ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-xs">{r.total_floors ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "نشط" ? "default" : r.status === "أرشيف" ? "secondary" : "outline"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end whitespace-nowrap">
                      {isSuperAdmin && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => openUsers(r)} title="المستخدمون">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)} title="تعديل">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(r)} title="حذف">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل العقار ${editing.name}` : "عقار جديد"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="الاسم *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="الكود"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
              <Field label="النوع">
                <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="الحالة">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="المالك"><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></Field>
              <Field label="شركة الإدارة"><Input value={form.management_company} onChange={(e) => setForm({ ...form, management_company: e.target.value })} /></Field>
              <Field label="المدينة"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <Field label="الدولة"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field>
              <Field label="عدد الأدوار"><Input type="number" value={form.total_floors} onChange={(e) => setForm({ ...form, total_floors: e.target.value })} /></Field>
              <Field label="المساحة الإجمالية (م²)"><Input type="number" value={form.total_area} onChange={(e) => setForm({ ...form, total_area: e.target.value })} /></Field>
              <Field label="الهاتف"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="البريد"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="السجل التجاري"><Input value={form.cr_number} onChange={(e) => setForm({ ...form, cr_number: e.target.value })} /></Field>
              <Field label="الرقم الضريبي"><Input value={form.vat_number} onChange={(e) => setForm({ ...form, vat_number: e.target.value })} /></Field>
              <Field label="رابط الشعار"><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></Field>
            </div>
            <Field label="العنوان">
              <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label="ملاحظات">
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} disabled={busy}>{editing ? "حفظ" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assigned users */}
      <Dialog open={usersOpen} onOpenChange={setUsersOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>المستخدمون المسموح لهم بـ {usersFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {allUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">لا يوجد مستخدمون</p>
            ) : allUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className="w-full flex items-center justify-between gap-2 border rounded-md px-3 py-2 hover:bg-muted text-right"
              >
                <span className="text-sm">{u.full_name || "—"}</span>
                {assigned.has(u.id) && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">المدير العام يصل تلقائياً لكل العقارات.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
