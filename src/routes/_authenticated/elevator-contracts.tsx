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
import { Plus, Pencil, Trash2, FileText, ArrowUpDown } from "lucide-react";
import { VendorQuickAddDialog } from "@/components/vendor-quick-add-dialog";

export const Route = createFileRoute("/_authenticated/elevator-contracts")({
  component: ElevatorContractsPage,
});

const CONTRACT_TYPES = ["صيانة شاملة","صيانة دورية","صيانة طوارئ فقط","عقد قطع غيار","عقد استبدال/تحديث"] as const;
const STATUSES = ["مسودة","ساري","موقوف","منتهي","مجدد","ملغي"] as const;
const PAY_FREQ = ["شهري","ربع سنوي","نصف سنوي","سنوي","دفعة واحدة"] as const;
const PM_FREQ = ["أسبوعي","شهري","ربع سنوي","نصف سنوي","سنوي"] as const;
const PAY_METHODS = ["تحويل بنكي","شيك","نقدي","بطاقة"] as const;
const ALERT_OPTIONS = [180, 90, 60, 30, 15, 7];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "ساري": "default", "مسودة": "outline", "منتهي": "secondary",
  "ملغي": "destructive", "موقوف": "destructive", "مجدد": "secondary",
};

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("en-US") + " ر.س";

type Vendor = { id: string; company_name: string };
type Asset = { id: string; asset_name: string; asset_code?: string | null; category?: string | null };
type Contract = {
  id: string;
  contract_number: string | null;
  contract_name: string;
  contract_type: string;
  status: string;
  vendor_id: string | null;
  vendor_name: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_value: number | null;
  covered_elevator_ids: string[] | null;
  [k: string]: any;
};

const emptyForm = () => ({
  contract_name: "",
  contract_type: "صيانة شاملة",
  status: "مسودة",
  first_party_name: "",
  vendor_id: "",
  vendor_name: "",
  vendor_contact_name: "",
  vendor_phone: "",
  vendor_email: "",
  vendor_cr: "",
  vendor_tax_number: "",
  start_date: "",
  end_date: "",
  duration_months: "" as string | number,
  notice_period_days: "30" as string | number,
  covered_elevator_ids: [] as string[],
  includes_preventive: true,
  includes_corrective: true,
  includes_emergency: true,
  spare_parts_included: false,
  spare_parts_notes: "",
  sla_critical_response_hours: "2" as string | number,
  sla_normal_response_hours: "24" as string | number,
  pm_frequency: "شهري",
  contract_value: "" as string | number,
  payment_method: "تحويل بنكي",
  payment_frequency: "شهري",
  tax_percentage: "15" as string | number,
  tax_included: false,
  alert_thresholds_days: [90, 30] as number[],
  notes: "",
});

function ElevatorContractsPage() {
  const { user } = useAuth();
  const { activePropertyId } = useActiveProperty();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [elevators, setElevators] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: cs }, { data: vs }, { data: as }] = await Promise.all([
      scoped(supabase.from("elevator_contracts").select("*").order("created_at", { ascending: false }), activePropertyId),
      supabase.from("vendors").select("id, company_name").order("company_name"),
      scoped(supabase.from("assets").select("id, asset_name, asset_code, category").ilike("category", "%مصعد%").order("asset_name"), activePropertyId),
    ]);
    setContracts((cs as any) || []);
    setVendors((vs as any) || []);
    setElevators((as as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [activePropertyId]);

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (c.contract_number || "").toLowerCase().includes(s)
          || (c.contract_name || "").toLowerCase().includes(s)
          || (c.vendor_name || "").toLowerCase().includes(s);
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
      covered_elevator_ids: c.covered_elevator_ids || [],
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
      first_party_name: form.first_party_name || null,
      vendor_id: form.vendor_id || null,
      vendor_name: form.vendor_name || null,
      vendor_contact_name: form.vendor_contact_name || null,
      vendor_phone: form.vendor_phone || null,
      vendor_email: form.vendor_email || null,
      vendor_cr: form.vendor_cr || null,
      vendor_tax_number: form.vendor_tax_number || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      duration_months: num(form.duration_months),
      notice_period_days: num(form.notice_period_days),
      covered_elevator_ids: form.covered_elevator_ids,
      includes_preventive: form.includes_preventive,
      includes_corrective: form.includes_corrective,
      includes_emergency: form.includes_emergency,
      spare_parts_included: form.spare_parts_included,
      spare_parts_notes: form.spare_parts_notes || null,
      sla_critical_response_hours: num(form.sla_critical_response_hours),
      sla_normal_response_hours: num(form.sla_normal_response_hours),
      pm_frequency: form.pm_frequency || null,
      contract_value: num(form.contract_value),
      payment_method: form.payment_method || null,
      payment_frequency: form.payment_frequency || null,
      tax_percentage: num(form.tax_percentage),
      tax_included: form.tax_included,
      alert_thresholds_days: form.alert_thresholds_days,
      notes: form.notes || null,
    };

    let res;
    if (editing) {
      res = await supabase.from("elevator_contracts").update(payload).eq("id", editing.id);
    } else {
      const ap = typeof window !== "undefined" ? localStorage.getItem("taam_active_property") : null;
      if (ap && ap !== "all") payload.property_id = ap;
      payload.created_by = user?.id;
      res = await supabase.from("elevator_contracts").insert(payload);
    }
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "تم تحديث العقد" : "تم إنشاء العقد");
    setOpen(false);
    load();
  };

  const remove = async (c: Contract) => {
    if (!confirm(`حذف العقد ${c.contract_number}؟`)) return;
    const { error } = await supabase.from("elevator_contracts").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success("تم الحذف"); load(); }
  };

  const toggleElevator = (id: string) => {
    setForm(f => ({
      ...f,
      covered_elevator_ids: f.covered_elevator_ids.includes(id)
        ? f.covered_elevator_ids.filter(x => x !== id)
        : [...f.covered_elevator_ids, id],
    }));
  };
  const toggleAlert = (d: number) => {
    setForm(f => ({
      ...f,
      alert_thresholds_days: f.alert_thresholds_days.includes(d)
        ? f.alert_thresholds_days.filter(x => x !== d)
        : [...f.alert_thresholds_days, d].sort((a, b) => b - a),
    }));
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6" /> عقود صيانة المصاعد
          </h1>
          <p className="text-muted-foreground">إدارة عقود صيانة المصاعد، نطاق الخدمة وSLA</p>
        </div>
        <Button onClick={startNew}><Plus className="ml-2 h-4 w-4" /> عقد جديد</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="بحث برقم/اسم العقد أو الشركة..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>من</TableHead>
                  <TableHead>إلى</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{c.contract_number || "—"}</TableCell>
                    <TableCell>{c.contract_name}</TableCell>
                    <TableCell>{c.vendor_name || vendors.find(v => v.id === c.vendor_id)?.company_name || "—"}</TableCell>
                    <TableCell>{c.contract_type}</TableCell>
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
            <DialogTitle>{editing ? `تعديل العقد ${editing.contract_number}` : "عقد صيانة مصاعد جديد"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <section className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> البيانات الأساسية</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>اسم العقد *</Label><Input value={form.contract_name} onChange={e => setForm({ ...form, contract_name: e.target.value })} /></div>
                <div><Label>نوع العقد</Label>
                  <Select value={form.contract_type} onValueChange={v => setForm({ ...form, contract_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CONTRACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>حالة العقد</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">أطراف العقد</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>الطرف الأول (مالك البرج/الإدارة)</Label><Input value={form.first_party_name} onChange={e => setForm({ ...form, first_party_name: e.target.value })} /></div>
                <div><Label>المورد (الطرف الثاني)</Label>
                  <Select value={form.vendor_id || "none"} onValueChange={v => {
                    if (v === "none") setForm({ ...form, vendor_id: "", vendor_name: "" });
                    else { const ve = vendors.find(x => x.id === v); setForm({ ...form, vendor_id: v, vendor_name: ve?.company_name || "" }); }
                  }}>
                    <SelectTrigger><SelectValue placeholder="اختر مورد" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— يدوي —</SelectItem>
                      {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>اسم شركة المصاعد</Label><Input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} /></div>
                <div><Label>اسم المسؤول</Label><Input value={form.vendor_contact_name} onChange={e => setForm({ ...form, vendor_contact_name: e.target.value })} /></div>
                <div><Label>الجوال</Label><Input value={form.vendor_phone} onChange={e => setForm({ ...form, vendor_phone: e.target.value })} /></div>
                <div><Label>البريد الإلكتروني</Label><Input value={form.vendor_email} onChange={e => setForm({ ...form, vendor_email: e.target.value })} /></div>
                <div><Label>السجل التجاري</Label><Input value={form.vendor_cr} onChange={e => setForm({ ...form, vendor_cr: e.target.value })} /></div>
                <div><Label>الرقم الضريبي</Label><Input value={form.vendor_tax_number} onChange={e => setForm({ ...form, vendor_tax_number: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">مدة العقد</h3>
              <div className="grid md:grid-cols-4 gap-3">
                <div><Label>تاريخ البداية</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>تاريخ النهاية</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                <div><Label>المدة (شهور)</Label><Input type="number" value={form.duration_months} onChange={e => setForm({ ...form, duration_months: e.target.value })} /></div>
                <div><Label>فترة الإشعار قبل الإنهاء (يوم)</Label><Input type="number" value={form.notice_period_days} onChange={e => setForm({ ...form, notice_period_days: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">الأصول المشمولة (المصاعد)</h3>
              {elevators.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد مصاعد مسجّلة بفئة "مصعد" ضمن الأصول. أضف مصاعد من شاشة الأصول أولاً.</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                  {elevators.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.covered_elevator_ids.includes(a.id)} onCheckedChange={() => toggleElevator(a.id)} />
                      <span>{a.asset_name} {a.asset_code ? `(${a.asset_code})` : ""}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">نطاق الخدمة</h3>
              <div className="grid md:grid-cols-2 gap-2">
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_preventive} onCheckedChange={v => setForm({ ...form, includes_preventive: !!v })} /> صيانة وقائية</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_corrective} onCheckedChange={v => setForm({ ...form, includes_corrective: !!v })} /> صيانة تصحيحية</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.includes_emergency} onCheckedChange={v => setForm({ ...form, includes_emergency: !!v })} /> صيانة طوارئ</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.spare_parts_included} onCheckedChange={v => setForm({ ...form, spare_parts_included: !!v })} /> قطع الغيار مشمولة</label>
              </div>
              <div>
                <Label>تردد الصيانة الوقائية</Label>
                <Select value={form.pm_frequency} onValueChange={v => setForm({ ...form, pm_frequency: v })}>
                  <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>{PM_FREQ.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>ملاحظات قطع الغيار</Label><Textarea rows={2} value={form.spare_parts_notes} onChange={e => setForm({ ...form, spare_parts_notes: e.target.value })} /></div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">اتفاقية مستوى الخدمة (SLA)</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>زمن الاستجابة للأعطال الحرجة (ساعة)</Label><Input type="number" value={form.sla_critical_response_hours} onChange={e => setForm({ ...form, sla_critical_response_hours: e.target.value })} /></div>
                <div><Label>زمن الاستجابة للأعطال العادية (ساعة)</Label><Input type="number" value={form.sla_normal_response_hours} onChange={e => setForm({ ...form, sla_normal_response_hours: e.target.value })} /></div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">البيانات المالية</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>قيمة العقد</Label><Input type="number" value={form.contract_value} onChange={e => setForm({ ...form, contract_value: e.target.value })} /></div>
                <div><Label>طريقة السداد</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAY_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>دورية الدفع</Label>
                  <Select value={form.payment_frequency} onValueChange={v => setForm({ ...form, payment_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAY_FREQ.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>الضريبة %</Label><Input type="number" value={form.tax_percentage} onChange={e => setForm({ ...form, tax_percentage: e.target.value })} /></div>
                <label className="flex items-center gap-2"><Checkbox checked={form.tax_included} onCheckedChange={v => setForm({ ...form, tax_included: !!v })} /> الضريبة مشمولة في القيمة</label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">التنبيهات قبل انتهاء العقد</h3>
              <div className="flex flex-wrap gap-3">
                {ALERT_OPTIONS.map(d => (
                  <label key={d} className="flex items-center gap-2 border rounded px-3 py-1 cursor-pointer">
                    <Checkbox checked={form.alert_thresholds_days.includes(d)} onCheckedChange={() => toggleAlert(d)} />
                    <span>{d} يوم</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
