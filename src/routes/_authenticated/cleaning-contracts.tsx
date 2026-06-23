import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Sparkles, FileText, Upload, Trash2, Pencil, Download, Calendar, Users } from "lucide-react";
import { VendorQuickAddDialog } from "@/components/vendor-quick-add-dialog";

export const Route = createFileRoute("/_authenticated/cleaning-contracts")({
  component: CleaningContractsPage,
});

const CLEANING_TYPES = ["عقد خدمات نظافة","عقد تشغيل نظافة متكامل","عقد توريد عمالة نظافة"] as const;
const STATUSES = ["مسودة","قيد المراجعة","بانتظار الاعتماد","ساري","موقوف","تحت التجديد","مجدد","منتهي","ملغي"] as const;
const PAY_FREQ = ["شهري","ربع سنوي","نصف سنوي","سنوي"] as const;
const MAT_RESP = ["على شركة النظافة","على مالك البرج","مشتركة"] as const;
const SCOPE_AREAS = ["المكاتب","اللوبي","الممرات","المصاعد","السلالم","دورات المياه","المواقف","غرفة الإدارة","غرفة الكاميرات","المستودع","المناطق الخارجية"];
const CLEAN_SUPPLIES = ["منظفات الأرضيات","منظفات الزجاج","المعقمات","أكياس النفايات"];
const RESTROOM_SUPPLIES = ["مناديل ورقية","صابون","معطرات","مناديل تجفيف"];
const ATTACH_TYPES = ["نسخة العقد","السجل التجاري","شهادات العمالة","التأمينات","شهادات السلامة","أخرى"] as const;
const ALERT_OPTIONS = [180, 90, 60, 30, 15, 7];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "ساري": "default", "مسودة": "outline", "منتهي": "secondary", "ملغي": "destructive",
  "موقوف": "destructive", "مجدد": "secondary",
};

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("en-US") + " ر.س";

type Vendor = { id: string; company_name: string };
type CleaningContract = {
  id: string;
  contract_number: string | null;
  cleaning_type: string;
  status: string;
  vendor_id: string | null;
  vendor_name: string | null;
  vendor_contact_name: string | null;
  vendor_phone: string | null;
  start_date: string | null;
  end_date: string | null;
  monthly_value: number | null;
  annual_value: number | null;
  contract_value: number | null;
  day_workers: number | null;
  night_workers: number | null;
  supervisors: number | null;
  [k: string]: any;
};
type Attachment = {
  id: string;
  cleaning_contract_id: string;
  attachment_type: string;
  file_name: string;
  file_path: string;
  created_at: string;
};

const emptyForm = () => ({
  cleaning_type: "عقد خدمات نظافة",
  status: "مسودة",
  first_party_name: "",
  vendor_id: "",
  vendor_name: "",
  vendor_cr: "",
  vendor_tax_number: "",
  vendor_contact_name: "",
  vendor_phone: "",
  vendor_email: "",
  start_date: "",
  end_date: "",
  duration_months: "",
  notice_period_days: 30,
  scope_areas: [] as string[],
  day_workers: 0,
  night_workers: 0,
  supervisors: 0,
  shift_start: "",
  shift_end: "",
  hours_per_day: "",
  materials_responsibility: "على شركة النظافة",
  cleaning_supplies: [] as string[],
  restroom_supplies: [] as string[],
  sla_quality_pct_target: 95,
  sla_response_normal_hours: 24,
  sla_response_emergency_hours: 2,
  contract_value: "",
  monthly_value: "",
  annual_value: "",
  payment_frequency: "شهري",
  taxable: true,
  tax_pct: 15,
  tax_inclusive: false,
  alert_thresholds_days: [90, 30] as number[],
  notes: "",
});

function CleaningContractsPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "accountant"]);

  const [rows, setRows] = useState<CleaningContract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("الكل");
  const [typeFilter, setTypeFilter] = useState<string>("الكل");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CleaningContract | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [busy, setBusy] = useState(false);

  // attachments dialog
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachContract, setAttachContract] = useState<CleaningContract | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachType, setAttachType] = useState<string>("نسخة العقد");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [c, v] = await Promise.all([scoped(supabase.from("cleaning_contracts").select("*"), activePropertyId).order("created_at", { ascending: false }),
      supabase.from("vendors").select("id,company_name").order("company_name"),
    ]);
    if (c.error) toast.error(c.error.message);
    else setRows((c.data ?? []) as any);
    if (!v.error) setVendors((v.data ?? []) as Vendor[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "الكل" && r.status !== statusFilter) return false;
      if (typeFilter !== "الكل" && r.cleaning_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.contract_number ?? ""} ${r.vendor_name ?? ""} ${r.vendor_contact_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, typeFilter, search]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "ساري");
    return {
      total: rows.length,
      active: active.length,
      expiring: rows.filter((r) => {
        if (r.status !== "ساري" || !r.end_date) return false;
        const days = Math.ceil((new Date(r.end_date).getTime() - Date.now()) / 86400000);
        return days >= 0 && days <= 90;
      }).length,
      annualTotal: active.reduce((s, r) => s + Number(r.annual_value || 0), 0),
    };
  }, [rows]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const openEdit = (r: CleaningContract) => {
    setEditing(r);
    setForm({
      ...emptyForm(),
      ...r,
      vendor_id: r.vendor_id ?? "",
      duration_months: r.duration_months ?? "",
      hours_per_day: r.hours_per_day ?? "",
      contract_value: r.contract_value ?? "",
      monthly_value: r.monthly_value ?? "",
      annual_value: r.annual_value ?? "",
      shift_start: r.shift_start ?? "",
      shift_end: r.shift_end ?? "",
      start_date: r.start_date ?? "",
      end_date: r.end_date ?? "",
      scope_areas: r.scope_areas ?? [],
      cleaning_supplies: r.cleaning_supplies ?? [],
      restroom_supplies: r.restroom_supplies ?? [],
      alert_thresholds_days: r.alert_thresholds_days ?? [90, 30],
    });
    setOpen(true);
  };

  const toggleArr = (key: string, val: any) => {
    setForm((f: any) => {
      const arr: any[] = f[key] ?? [];
      return { ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  };

  const save = async () => {
    if (!canManage) return;
    setBusy(true);
    const payload: any = {
      cleaning_type: form.cleaning_type,
      status: form.status,
      first_party_name: form.first_party_name || null,
      vendor_id: form.vendor_id || null,
      vendor_name: form.vendor_name || null,
      vendor_cr: form.vendor_cr || null,
      vendor_tax_number: form.vendor_tax_number || null,
      vendor_contact_name: form.vendor_contact_name || null,
      vendor_phone: form.vendor_phone || null,
      vendor_email: form.vendor_email || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      duration_months: form.duration_months ? Number(form.duration_months) : null,
      notice_period_days: Number(form.notice_period_days) || null,
      scope_areas: form.scope_areas,
      day_workers: Number(form.day_workers) || 0,
      night_workers: Number(form.night_workers) || 0,
      supervisors: Number(form.supervisors) || 0,
      shift_start: form.shift_start || null,
      shift_end: form.shift_end || null,
      hours_per_day: form.hours_per_day ? Number(form.hours_per_day) : null,
      materials_responsibility: form.materials_responsibility,
      cleaning_supplies: form.cleaning_supplies,
      restroom_supplies: form.restroom_supplies,
      sla_quality_pct_target: Number(form.sla_quality_pct_target) || null,
      sla_response_normal_hours: Number(form.sla_response_normal_hours) || null,
      sla_response_emergency_hours: Number(form.sla_response_emergency_hours) || null,
      contract_value: form.contract_value ? Number(form.contract_value) : null,
      monthly_value: form.monthly_value ? Number(form.monthly_value) : null,
      annual_value: form.annual_value ? Number(form.annual_value) : null,
      payment_frequency: form.payment_frequency,
      taxable: !!form.taxable,
      tax_pct: Number(form.tax_pct) || 0,
      tax_inclusive: !!form.tax_inclusive,
      alert_thresholds_days: form.alert_thresholds_days,
      notes: form.notes || null,
    };
    const q = editing
      ? await supabase.from("cleaning_contracts").update(payload).eq("id", editing.id)
      : await supabase.from("cleaning_contracts").insert(payload);
    setBusy(false);
    if (q.error) return toast.error(q.error.message);
    toast.success(editing ? "تم تحديث العقد" : "تم إضافة العقد");
    setOpen(false);
    load();
  };

  const remove = async (r: CleaningContract) => {
    if (!confirm(`حذف العقد ${r.contract_number}؟`)) return;
    const { error } = await supabase.from("cleaning_contracts").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  const openAttachments = async (r: CleaningContract) => {
    setAttachContract(r);
    setAttachOpen(true);
    const { data, error } = await supabase
      .from("cleaning_contract_attachments")
      .select("*")
      .eq("cleaning_contract_id", r.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setAttachments((data ?? []) as any);
  };

  const uploadAttachment = async (file: File) => {
    if (!attachContract) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${attachContract.id}/${Date.now()}.${ext}`;
    const up = await supabase.storage.from("cleaning-contracts").upload(path, file);
    if (up.error) { setUploading(false); return toast.error(up.error.message); }
    const ins = await supabase.from("cleaning_contract_attachments").insert({
      cleaning_contract_id: attachContract.id,
      attachment_type: attachType as any,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    });
    setUploading(false);
    if (ins.error) return toast.error(ins.error.message);
    toast.success("تم رفع المرفق");
    openAttachments(attachContract);
  };

  const downloadAttachment = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from("cleaning-contracts").createSignedUrl(a.file_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const deleteAttachment = async (a: Attachment) => {
    if (!confirm("حذف المرفق؟")) return;
    await supabase.storage.from("cleaning-contracts").remove([a.file_path]);
    const { error } = await supabase.from("cleaning_contract_attachments").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    setAttachments((xs) => xs.filter((x) => x.id !== a.id));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            عقود النظافة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة عقود شركات النظافة من التعاقد حتى التجديد.</p>
        </div>
        {canManage && (
          <Button onClick={openNew} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 ms-1" /> عقد نظافة جديد
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي العقود" value={stats.total} />
        <StatCard label="العقود السارية" value={stats.active} />
        <StatCard label="قرب الانتهاء (90 يوم)" value={stats.expiring} />
        <StatCard label="القيمة السنوية الإجمالية" value={fmtMoney(stats.annualTotal)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <CardTitle>قائمة العقود</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="بحث: رقم، شركة، مسؤول"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="الكل">كل الأنواع</SelectItem>
                  {CLEANING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="الكل">كل الحالات</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العقد</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>شركة النظافة</TableHead>
                  <TableHead>الفترة</TableHead>
                  <TableHead>العمالة</TableHead>
                  <TableHead>القيمة الشهرية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-end">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا يوجد عقود</TableCell></TableRow>
                ) : filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.contract_number}</TableCell>
                    <TableCell className="text-xs">{r.cleaning_type}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.vendor_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.vendor_contact_name} {r.vendor_phone && `· ${r.vendor_phone}`}</div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {r.start_date} → {r.end_date}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Users className="h-3 w-3 inline ms-1" />
                      {(r.day_workers ?? 0) + (r.night_workers ?? 0)} عامل · {r.supervisors ?? 0} مشرف
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{fmtMoney(r.monthly_value)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-end whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openAttachments(r)} title="المرفقات">
                        <FileText className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <>
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

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل عقد النظافة ${editing.contract_number}` : "عقد نظافة جديد"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Section: Contract Info */}
            <Section title="بيانات العقد الأساسية">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="نوع العقد">
                  <Select value={form.cleaning_type} onValueChange={(v) => setForm({ ...form, cleaning_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CLEANING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="حالة العقد">
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="الطرف الأول (مالك البرج / شركة الإدارة)">
                  <Input value={form.first_party_name} onChange={(e) => setForm({ ...form, first_party_name: e.target.value })} />
                </Field>
              </div>
            </Section>

            {/* Section: Cleaning Company */}
            <Section title="بيانات شركة النظافة">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="المورد المسجّل (اختياري)">
                  <Select value={form.vendor_id || "none"} onValueChange={(v) => {
                    if (v === "none") { setForm({ ...form, vendor_id: "" }); return; }
                    const vendor = vendors.find((x) => x.id === v);
                    setForm({ ...form, vendor_id: v, vendor_name: vendor?.company_name ?? form.vendor_name });
                  }}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— بدون ربط —</SelectItem>
                      {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="اسم الشركة"><Input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} /></Field>
                <Field label="السجل التجاري"><Input value={form.vendor_cr} onChange={(e) => setForm({ ...form, vendor_cr: e.target.value })} /></Field>
                <Field label="الرقم الضريبي"><Input value={form.vendor_tax_number} onChange={(e) => setForm({ ...form, vendor_tax_number: e.target.value })} /></Field>
                <Field label="اسم المسؤول"><Input value={form.vendor_contact_name} onChange={(e) => setForm({ ...form, vendor_contact_name: e.target.value })} /></Field>
                <Field label="الجوال"><Input value={form.vendor_phone} onChange={(e) => setForm({ ...form, vendor_phone: e.target.value })} /></Field>
                <Field label="البريد الإلكتروني"><Input type="email" value={form.vendor_email} onChange={(e) => setForm({ ...form, vendor_email: e.target.value })} /></Field>
              </div>
            </Section>

            {/* Section: Duration */}
            <Section title="مدة العقد">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="تاريخ البداية"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
                <Field label="تاريخ النهاية"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
                <Field label="المدة بالأشهر"><Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} /></Field>
                <Field label="فترة الإشعار قبل الإنهاء (يوم)"><Input type="number" value={form.notice_period_days} onChange={(e) => setForm({ ...form, notice_period_days: e.target.value })} /></Field>
              </div>
            </Section>

            {/* Section: Scope */}
            <Section title="نطاق العمل — المناطق المشمولة">
              <CheckGrid items={SCOPE_AREAS} selected={form.scope_areas} onToggle={(v) => toggleArr("scope_areas", v)} />
            </Section>

            {/* Section: Workforce */}
            <Section title="بيانات العمالة وأوقات العمل">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="عدد العمال النهاري"><Input type="number" value={form.day_workers} onChange={(e) => setForm({ ...form, day_workers: e.target.value })} /></Field>
                <Field label="عدد العمال الليلي"><Input type="number" value={form.night_workers} onChange={(e) => setForm({ ...form, night_workers: e.target.value })} /></Field>
                <Field label="عدد المشرفين"><Input type="number" value={form.supervisors} onChange={(e) => setForm({ ...form, supervisors: e.target.value })} /></Field>
                <Field label="بداية الشفت"><Input type="time" value={form.shift_start} onChange={(e) => setForm({ ...form, shift_start: e.target.value })} /></Field>
                <Field label="نهاية الشفت"><Input type="time" value={form.shift_end} onChange={(e) => setForm({ ...form, shift_end: e.target.value })} /></Field>
                <Field label="عدد ساعات العمل"><Input type="number" step="0.5" value={form.hours_per_day} onChange={(e) => setForm({ ...form, hours_per_day: e.target.value })} /></Field>
              </div>
            </Section>

            {/* Section: Materials */}
            <Section title="المواد والمستهلكات">
              <Field label="مسؤولية المواد">
                <Select value={form.materials_responsibility} onValueChange={(v) => setForm({ ...form, materials_responsibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MAT_RESP.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <div className="mt-3">
                <Label className="text-xs font-semibold text-muted-foreground">مواد النظافة</Label>
                <CheckGrid items={CLEAN_SUPPLIES} selected={form.cleaning_supplies} onToggle={(v) => toggleArr("cleaning_supplies", v)} />
              </div>
              <div className="mt-3">
                <Label className="text-xs font-semibold text-muted-foreground">مستهلكات دورات المياه</Label>
                <CheckGrid items={RESTROOM_SUPPLIES} selected={form.restroom_supplies} onToggle={(v) => toggleArr("restroom_supplies", v)} />
              </div>
            </Section>

            {/* Section: SLA */}
            <Section title="مؤشرات الأداء (SLA)">
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="نسبة جودة النظافة المستهدفة %"><Input type="number" value={form.sla_quality_pct_target} onChange={(e) => setForm({ ...form, sla_quality_pct_target: e.target.value })} /></Field>
                <Field label="زمن الاستجابة للبلاغات العادية (ساعة)"><Input type="number" value={form.sla_response_normal_hours} onChange={(e) => setForm({ ...form, sla_response_normal_hours: e.target.value })} /></Field>
                <Field label="زمن الاستجابة للبلاغات الطارئة (ساعة)"><Input type="number" value={form.sla_response_emergency_hours} onChange={(e) => setForm({ ...form, sla_response_emergency_hours: e.target.value })} /></Field>
              </div>
            </Section>

            {/* Section: Financials */}
            <Section title="البيانات المالية">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="قيمة العقد الإجمالية"><Input type="number" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} /></Field>
                <Field label="القيمة الشهرية"><Input type="number" value={form.monthly_value} onChange={(e) => setForm({ ...form, monthly_value: e.target.value })} /></Field>
                <Field label="القيمة السنوية"><Input type="number" value={form.annual_value} onChange={(e) => setForm({ ...form, annual_value: e.target.value })} /></Field>
                <Field label="طريقة السداد">
                  <Select value={form.payment_frequency} onValueChange={(v) => setForm({ ...form, payment_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAY_FREQ.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="نسبة الضريبة %"><Input type="number" value={form.tax_pct} onChange={(e) => setForm({ ...form, tax_pct: e.target.value })} /></Field>
                <div className="flex flex-col gap-2 pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.taxable} onCheckedChange={(v) => setForm({ ...form, taxable: !!v })} />
                    خاضع للضريبة
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.tax_inclusive} onCheckedChange={(v) => setForm({ ...form, tax_inclusive: !!v })} />
                    السعر شامل الضريبة
                  </label>
                </div>
              </div>
            </Section>

            {/* Section: Alerts */}
            <Section title="التنبيهات">
              <Label className="text-xs text-muted-foreground">تنبيهات قبل انتهاء العقد (يوم)</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {ALERT_OPTIONS.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={form.alert_thresholds_days.includes(d)}
                      onCheckedChange={() => {
                        const arr: number[] = form.alert_thresholds_days;
                        setForm({ ...form, alert_thresholds_days: arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort((a, b) => b - a) });
                      }}
                    />
                    {d} يوم
                  </label>
                ))}
              </div>
            </Section>

            <Section title="ملاحظات">
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} disabled={busy || !canManage}>{editing ? "حفظ التعديلات" : "إضافة العقد"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachments Dialog */}
      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>مرفقات العقد {attachContract?.contract_number}</DialogTitle>
          </DialogHeader>
          {canManage && (
            <div className="flex items-end gap-2 p-3 border rounded-md bg-muted/40">
              <div className="flex-1">
                <Label className="text-xs">نوع المرفق</Label>
                <Select value={attachType} onValueChange={setAttachType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTACH_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && uploadAttachment(e.target.files[0])}
                />
                <Button asChild disabled={uploading}>
                  <span><Upload className="h-4 w-4 ms-1" /> {uploading ? "جاري الرفع..." : "رفع ملف"}</span>
                </Button>
              </label>
            </div>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attachments.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">لا توجد مرفقات</p>
            ) : attachments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border rounded-md p-3">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.file_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{a.attachment_type}</Badge>
                    <Calendar className="h-3 w-3" />
                    {new Date(a.created_at).toLocaleDateString("en-US")}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => downloadAttachment(a)}><Download className="h-4 w-4" /></Button>
                {canManage && (
                  <Button size="sm" variant="ghost" onClick={() => deleteAttachment(a)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-bold text-primary">{value}</div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
      <h3 className="font-semibold text-sm text-primary">{title}</h3>
      <div>{children}</div>
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

function CheckGrid({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((it) => (
        <label key={it} className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-muted">
          <Checkbox checked={selected.includes(it)} onCheckedChange={() => onToggle(it)} />
          {it}
        </label>
      ))}
    </div>
  );
}
