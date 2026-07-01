import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Flame } from "lucide-react";
import { VendorQuickAddDialog } from "@/components/vendor-quick-add-dialog";
import { ArchivedFilterToggle, DeleteArchiveMenu } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/fire-contracts")({
  component: FireContractsPage,
});

const STATUSES = ["مسودة", "ساري", "موقوف", "منتهي", "مجدد", "ملغي"] as const;
const PAY_FREQ = ["شهري", "ربع سنوي", "نصف سنوي", "سنوي", "دفعة واحدة"] as const;
const PM_FREQ = ["أسبوعي", "شهري", "ربع سنوي", "نصف سنوي", "سنوي"] as const;
const PAY_METHODS = ["تحويل بنكي", "شيك", "نقدي", "بطاقة"] as const;
const ALERT_OPTIONS = [180, 90, 60, 30, 15, 7];

const SYSTEMS: { key: string; label: string }[] = [
  { key: "covers_fire_pumps", label: "مضخات الحريق" },
  { key: "covers_fire_hoses", label: "خراطيم الحريق" },
  { key: "covers_fire_cabinets", label: "صناديق الحريق" },
  { key: "covers_extinguishers", label: "طفايات الحريق" },
  { key: "covers_smoke_detectors", label: "كواشف الدخان" },
  { key: "covers_alarm_panels", label: "لوحات الإنذار" },
  { key: "covers_sprinklers", label: "أنظمة الرش الآلي" },
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "ساري": "default", "مسودة": "outline", "منتهي": "secondary",
  "ملغي": "destructive", "موقوف": "destructive", "مجدد": "secondary",
};

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("en-US") + " ر.س";

type Vendor = { id: string; company_name: string };
type Contract = {
  id: string;
  contract_number: string | null;
  contract_name: string;
  status: string;
  vendor_id: string | null;
  company_name: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_value: number | null;
  [k: string]: any;
};

const emptyForm = () => ({
  contract_name: "",
  contract_type: "صيانة أنظمة حريق",
  status: "مسودة",
  first_party: "",
  vendor_id: "",
  company_name: "",
  commercial_register: "",
  tax_number: "",
  contact_person: "",
  contact_phone: "",
  contact_email: "",
  start_date: "",
  end_date: "",
  duration_months: "" as string | number,
  covers_fire_pumps: false,
  covers_fire_hoses: false,
  covers_fire_cabinets: false,
  covers_extinguishers: false,
  covers_smoke_detectors: false,
  covers_alarm_panels: false,
  covers_sprinklers: false,
  includes_preventive: true,
  includes_corrective: true,
  includes_periodic_tests: true,
  includes_certification_reports: false,
  includes_spare_parts: false,
  preventive_frequency: "ربع سنوي",
  response_time_hours: "2" as string | number,
  resolution_time_hours: "24" as string | number,
  contract_value: "" as string | number,
  payment_frequency: "سنوي",
  tax_included: true,
  tax_rate: "15" as string | number,
  alert_thresholds_days: [90, 30] as number[],
  certification_expiry_date: "",
  notes: "",
});

function FireContractsPage() {
  const { user } = useAuth();
  const { activePropertyId } = useActiveProperty();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [vendorAddOpen, setVendorAddOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const load = async () => {
    setLoading(true);
    const sb = supabase as any;
    let cq = sb.from("fire_contracts").select("*");
    cq = showArchived ? cq.not("archived_at", "is", null) : cq.is("archived_at", null);
    const [{ data: cs }, { data: vs }] = await Promise.all([
      scoped(cq.order("created_at", { ascending: false }), activePropertyId),
      sb.from("vendors").select("id, company_name").order("company_name"),
    ]);
    setContracts((cs as any) || []);
    setVendors((vs as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [activePropertyId, showArchived]);


  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (c.contract_number || "").toLowerCase().includes(s)
          || (c.contract_name || "").toLowerCase().includes(s)
          || (c.company_name || "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [contracts, search, statusFilter]);

  const startNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const startEdit = (c: Contract) => {
    setEditing(c);
    setForm({
      ...emptyForm(),
      ...c,
      vendor_id: c.vendor_id || "",
      start_date: c.start_date || "",
      end_date: c.end_date || "",
      certification_expiry_date: (c as any).certification_expiry_date || "",
      alert_thresholds_days: (c as any).alert_thresholds_days || [90, 30],
    } as any);
    setOpen(true);
  };

  const save = async () => {
    if (!form.contract_name) { toast.error("اسم العقد مطلوب"); return; }
    setSaving(true);
    const num = (v: any) => v === "" || v == null ? null : Number(v);
    const payload: any = {
      contract_name: form.contract_name,
      contract_type: form.contract_type,
      status: form.status,
      first_party: form.first_party || null,
      vendor_id: form.vendor_id || null,
      company_name: form.company_name || null,
      commercial_register: form.commercial_register || null,
      tax_number: form.tax_number || null,
      contact_person: form.contact_person || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      duration_months: num(form.duration_months),
      covers_fire_pumps: form.covers_fire_pumps,
      covers_fire_hoses: form.covers_fire_hoses,
      covers_fire_cabinets: form.covers_fire_cabinets,
      covers_extinguishers: form.covers_extinguishers,
      covers_smoke_detectors: form.covers_smoke_detectors,
      covers_alarm_panels: form.covers_alarm_panels,
      covers_sprinklers: form.covers_sprinklers,
      includes_preventive: form.includes_preventive,
      includes_corrective: form.includes_corrective,
      includes_periodic_tests: form.includes_periodic_tests,
      includes_certification_reports: form.includes_certification_reports,
      includes_spare_parts: form.includes_spare_parts,
      preventive_frequency: form.preventive_frequency || null,
      response_time_hours: num(form.response_time_hours),
      resolution_time_hours: num(form.resolution_time_hours),
      contract_value: num(form.contract_value),
      payment_frequency: form.payment_frequency || null,
      tax_included: form.tax_included,
      tax_rate: num(form.tax_rate),
      alert_thresholds_days: form.alert_thresholds_days,
      certification_expiry_date: form.certification_expiry_date || null,
      notes: form.notes || null,
    };

    let res;
    if (editing) {
      res = await supabase.from("fire_contracts" as any).update(payload).eq("id", editing.id);
    } else {
      const ap = typeof window !== "undefined" ? localStorage.getItem("taam_active_property") : null;
      if (ap && ap !== "all") payload.property_id = ap;
      payload.created_by = user?.id;
      res = await supabase.from("fire_contracts" as any).insert(payload);
    }
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "تم تحديث العقد" : "تم إنشاء العقد");
    setOpen(false);
    load();
  };

  const remove = async (c: Contract) => {
    if (!confirm(`حذف العقد ${c.contract_number}؟`)) return;
    const { error } = await supabase.from("fire_contracts" as any).delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success("تم الحذف"); load(); }
  };

  const toggleAlert = (d: number) => {
    setForm((f) => ({
      ...f,
      alert_thresholds_days: f.alert_thresholds_days.includes(d)
        ? f.alert_thresholds_days.filter((x) => x !== d)
        : [...f.alert_thresholds_days, d].sort((a, b) => b - a),
    }));
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-destructive" /> عقود أنظمة الحريق
          </h1>
          <p className="text-muted-foreground">إدارة عقود صيانة أنظمة الحماية من الحريق، الاختبارات الدورية والاعتمادات</p>
        </div>
        <div className="flex gap-2">
          <ArchivedFilterToggle value={showArchived} onChange={setShowArchived} />
          <Button onClick={startNew}><Plus className="ml-2 h-4 w-4" /> عقد جديد</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="بحث برقم/اسم العقد أو الشركة..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground mr-auto">{filtered.length} عقد</div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="py-10 text-center text-muted-foreground">جاري التحميل...</div> :
            filtered.length === 0 ? <div className="py-10 text-center text-muted-foreground">لا توجد عقود</div> :
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم العقد</TableHead>
                  <TableHead>اسم العقد</TableHead>
                  <TableHead>الشركة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>من</TableHead>
                  <TableHead>إلى</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.contract_number || "—"}</TableCell>
                    <TableCell>{c.contract_name}</TableCell>
                    <TableCell>{c.company_name || vendors.find((v) => v.id === c.vendor_id)?.company_name || "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[c.status] || "outline"}>{c.status}</Badge></TableCell>
                    <TableCell>{fmtMoney(c.contract_value)}</TableCell>
                    <TableCell>{c.start_date || "—"}</TableCell>
                    <TableCell>{c.end_date || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل العقد ${editing.contract_number}` : "عقد أنظمة حريق جديد"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> البيانات الأساسية</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>اسم العقد *</Label><Input value={form.contract_name} onChange={(e) => setForm({ ...form, contract_name: e.target.value })} /></div>
                <div><Label>حالة العقد</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">أطراف العقد</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>الطرف الأول (مالك البرج/الإدارة)</Label><Input value={form.first_party} onChange={(e) => setForm({ ...form, first_party: e.target.value })} /></div>
                <div><Label>المورد (الطرف الثاني)</Label>
                  <div className="flex gap-2">
                    <Select value={form.vendor_id || "none"} onValueChange={(v) => {
                      if (v === "none") setForm({ ...form, vendor_id: "", company_name: "" });
                      else { const ve = vendors.find((x) => x.id === v); setForm({ ...form, vendor_id: v, company_name: ve?.company_name || "" }); }
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="اختر مورد" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— يدوي —</SelectItem>
                        {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setVendorAddOpen(true)} title="إضافة مورد جديد">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div><Label>اسم شركة أنظمة الحريق</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                <div><Label>السجل التجاري</Label><Input value={form.commercial_register} onChange={(e) => setForm({ ...form, commercial_register: e.target.value })} /></div>
                <div><Label>الرقم الضريبي</Label><Input value={form.tax_number} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} /></div>
                <div><Label>اسم المسؤول</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                <div><Label>الجوال</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
                <div><Label>البريد الإلكتروني</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">مدة العقد</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <div><Label>تاريخ البداية</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>تاريخ النهاية</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                <div><Label>المدة (شهور)</Label><Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">الأنظمة المشمولة</h3>
              <div className="grid md:grid-cols-3 gap-2">
                {SYSTEMS.map((s) => (
                  <label key={s.key} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-accent">
                    <Checkbox
                      checked={(form as any)[s.key]}
                      onCheckedChange={(v) => setForm({ ...form, [s.key]: !!v } as any)}
                    />
                    <span className="text-sm">{s.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">نطاق الخدمة</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_preventive} onCheckedChange={(v) => setForm({ ...form, includes_preventive: !!v })} /> صيانة وقائية</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_corrective} onCheckedChange={(v) => setForm({ ...form, includes_corrective: !!v })} /> صيانة تصحيحية</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_periodic_tests} onCheckedChange={(v) => setForm({ ...form, includes_periodic_tests: !!v })} /> اختبارات دورية</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_certification_reports} onCheckedChange={(v) => setForm({ ...form, includes_certification_reports: !!v })} /> تقارير الاعتماد</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_spare_parts} onCheckedChange={(v) => setForm({ ...form, includes_spare_parts: !!v })} /> يشمل قطع الغيار</label>
                <div><Label>تكرار الصيانة الوقائية</Label>
                  <Select value={form.preventive_frequency} onValueChange={(v) => setForm({ ...form, preventive_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PM_FREQ.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">اتفاقية مستوى الخدمة (SLA)</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>زمن الاستجابة (ساعات)</Label><Input type="number" value={form.response_time_hours} onChange={(e) => setForm({ ...form, response_time_hours: e.target.value })} /></div>
                <div><Label>مدة معالجة الأعطال (ساعات)</Label><Input type="number" value={form.resolution_time_hours} onChange={(e) => setForm({ ...form, resolution_time_hours: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">البيانات المالية</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <div><Label>قيمة العقد</Label><Input type="number" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} /></div>
                <div><Label>طريقة السداد</Label>
                  <Select value={form.payment_frequency} onValueChange={(v) => setForm({ ...form, payment_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAY_FREQ.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>نسبة الضريبة %</Label><Input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} /></div>
                <label className="flex items-center gap-2 md:col-span-3"><Checkbox checked={form.tax_included} onCheckedChange={(v) => setForm({ ...form, tax_included: !!v })} /> الضريبة شاملة في القيمة</label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">الاعتمادات والتنبيهات</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>تاريخ انتهاء الاعتماد</Label><Input type="date" value={form.certification_expiry_date} onChange={(e) => setForm({ ...form, certification_expiry_date: e.target.value })} /></div>
              </div>
              <div>
                <Label>تنبيهات قبل الانتهاء/التجديد (أيام)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ALERT_OPTIONS.map((d) => (
                    <label key={d} className="flex items-center gap-2 px-3 py-1 rounded border cursor-pointer">
                      <Checkbox checked={form.alert_thresholds_days.includes(d)} onCheckedChange={() => toggleAlert(d)} />
                      <span className="text-sm">{d} يوم</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">ملاحظات</h3>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <VendorQuickAddDialog
        open={vendorAddOpen}
        onClose={() => setVendorAddOpen(false)}
        defaultActivity="أنظمة حريق"
        onCreated={(v) => {
          setVendors((prev) => [...prev, v].sort((a, b) => a.company_name.localeCompare(b.company_name)));
          setForm((f) => ({ ...f, vendor_id: v.id, company_name: v.company_name }));
          setVendorAddOpen(false);
        }}
      />
    </div>
  );
}
