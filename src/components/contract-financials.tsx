import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, ShieldCheck, CalendarClock, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const DEPOSIT_STATUSES = ["محتجز", "مسترد جزئياً", "مسترد كلياً", "مخصوم"] as const;
type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

const SCHED_STATUSES = ["مجدول", "مستحق", "مدفوع", "متأخر", "ملغي"] as const;
type SchedStatus = (typeof SCHED_STATUSES)[number];

const SCHED_BADGE: Record<SchedStatus, string> = {
  "مجدول": "bg-muted text-foreground",
  "مستحق": "bg-warning/20 text-warning-foreground",
  "مدفوع": "bg-success text-success-foreground",
  "متأخر": "bg-destructive/20 text-destructive",
  "ملغي": "bg-muted-foreground/40 text-background",
};

interface Deduction {
  id: string;
  deduction_date: string;
  amount: number;
  reason: string;
}

interface ScheduleItem {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: SchedStatus;
  paid_date: string | null;
  notes: string | null;
}

interface ContractFin {
  deposit_amount: number;
  deposit_status: DepositStatus | null;
  deposit_refund_date: string | null;
  deposit_refund_amount: number | null;
  deposit_notes: string | null;
  vat_percentage: number | null;
  vat_inclusive: boolean | null;
  operating_fees: number | null;
  discount_amount: number | null;
  discount_notes: string | null;
  service_fees_breakdown: Record<string, number> | null;
}

const FEE_KEYS = ["كهرباء", "مياه", "نظافة", "أمن", "إنترنت", "أخرى"] as const;

export function TaxFeesCard({ contractId, canManage }: { contractId: string; canManage: boolean }) {
  const [data, setData] = useState<ContractFin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContractFin | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contracts")
      .select("deposit_amount, deposit_status, deposit_refund_date, deposit_refund_amount, deposit_notes, vat_percentage, vat_inclusive, operating_fees, discount_amount, discount_notes, service_fees_breakdown")
      .eq("id", contractId).maybeSingle();
    if (error) toast.error(error.message);
    setData(data as ContractFin | null);
    setForm(data as ContractFin | null);
    setLoading(false);
  }, [contractId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const { error } = await supabase.from("contracts").update({
      vat_percentage: Number(form.vat_percentage) || 0,
      vat_inclusive: !!form.vat_inclusive,
      operating_fees: Number(form.operating_fees) || 0,
      discount_amount: Number(form.discount_amount) || 0,
      discount_notes: form.discount_notes,
      service_fees_breakdown: form.service_fees_breakdown ?? {},
    }).eq("id", contractId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    load();
  };

  if (loading || !form) {
    return (
      <Card><CardContent className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>
    );
  }
  const breakdown = form.service_fees_breakdown ?? {};

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> الضريبة والرسوم</CardTitle>
        {canManage && (
          <Button size="sm" onClick={save} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />} حفظ
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>نسبة ضريبة القيمة المضافة %</Label>
            <Input type="number" step="0.01" disabled={!canManage}
              value={form.vat_percentage ?? 15}
              onChange={(e) => setForm({ ...form, vat_percentage: Number(e.target.value) })} />
          </div>
          <div>
            <Label>الضريبة شاملة بالإيجار؟</Label>
            <Select value={form.vat_inclusive ? "yes" : "no"} disabled={!canManage}
              onValueChange={(v) => setForm({ ...form, vat_inclusive: v === "yes" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">لا — تُضاف</SelectItem>
                <SelectItem value="yes">نعم — شاملة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>رسوم تشغيلية إضافية</Label>
            <Input type="number" disabled={!canManage}
              value={form.operating_fees ?? 0}
              onChange={(e) => setForm({ ...form, operating_fees: Number(e.target.value) })} />
          </div>
          <div>
            <Label>قيمة الخصم</Label>
            <Input type="number" disabled={!canManage}
              value={form.discount_amount ?? 0}
              onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })} />
          </div>
        </div>

        <div>
          <Label>تفاصيل رسوم الخدمات</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {FEE_KEYS.map((k) => (
              <div key={k}>
                <Label className="text-xs text-muted-foreground">{k}</Label>
                <Input type="number" disabled={!canManage}
                  value={breakdown[k] ?? 0}
                  onChange={(e) => setForm({
                    ...form,
                    service_fees_breakdown: { ...breakdown, [k]: Number(e.target.value) },
                  })} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>ملاحظات الخصم</Label>
          <Textarea disabled={!canManage} value={form.discount_notes ?? ""}
            onChange={(e) => setForm({ ...form, discount_notes: e.target.value })} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DepositCard({ contractId, canManage }: { contractId: string; canManage: boolean }) {
  const [contract, setContract] = useState<ContractFin | null>(null);
  const [items, setItems] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ deduction_date: new Date().toISOString().slice(0, 10), amount: "", reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [c, d] = await Promise.all([
      supabase.from("contracts")
        .select("deposit_amount, deposit_status, deposit_refund_date, deposit_refund_amount, deposit_notes, vat_percentage, vat_inclusive, operating_fees, discount_amount, discount_notes, service_fees_breakdown")
        .eq("id", contractId).maybeSingle(),
      supabase.from("contract_deposit_deductions")
        .select("*").eq("contract_id", contractId).order("deduction_date", { ascending: false }),
    ]);
    if (c.error) toast.error(c.error.message);
    if (d.error) toast.error(d.error.message);
    setContract(c.data as ContractFin | null);
    setItems((d.data as Deduction[]) ?? []);
    setLoading(false);
  }, [contractId]);
  useEffect(() => { load(); }, [load]);

  const saveContractDeposit = async (patch: Partial<ContractFin>) => {
    setSaving(true);
    const { error } = await supabase.from("contracts").update(patch).eq("id", contractId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    load();
  };

  const addDeduction = async () => {
    if (!form.amount || !form.reason) { toast.error("القيمة والسبب مطلوبان"); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("contract_deposit_deductions").insert({
      contract_id: contractId,
      deduction_date: form.deduction_date,
      amount: Number(form.amount),
      reason: form.reason,
      created_by: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة الخصم");
    setOpen(false);
    setForm({ deduction_date: new Date().toISOString().slice(0, 10), amount: "", reason: "" });
    load();
  };

  const removeDeduction = async (id: string) => {
    const { error } = await supabase.from("contract_deposit_deductions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    load();
  };

  if (loading || !contract) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>;
  }

  const totalDed = items.reduce((s, i) => s + Number(i.amount), 0);
  const remaining = Number(contract.deposit_amount) - totalDed - Number(contract.deposit_refund_amount ?? 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> التأمين والخصومات</CardTitle>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 ms-1" /> خصم جديد
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Info label="مبلغ التأمين" value={Number(contract.deposit_amount).toLocaleString("en-US") + " ر.س"} />
          <Info label="إجمالي الخصومات" value={totalDed.toLocaleString("en-US") + " ر.س"} />
          <Info label="المسترد" value={Number(contract.deposit_refund_amount ?? 0).toLocaleString("en-US") + " ر.س"} />
          <Info label="المتبقي" value={remaining.toLocaleString("en-US") + " ر.س"} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label>حالة التأمين</Label>
            <Select value={contract.deposit_status ?? "محتجز"} disabled={!canManage}
              onValueChange={(v) => saveContractDeposit({ deposit_status: v as DepositStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEPOSIT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>تاريخ الاسترداد</Label>
            <Input type="date" disabled={!canManage}
              value={contract.deposit_refund_date ?? ""}
              onChange={(e) => setContract({ ...contract, deposit_refund_date: e.target.value })}
              onBlur={(e) => saveContractDeposit({ deposit_refund_date: e.target.value || null })} />
          </div>
          <div>
            <Label>قيمة المسترد</Label>
            <Input type="number" disabled={!canManage}
              value={contract.deposit_refund_amount ?? ""}
              onChange={(e) => setContract({ ...contract, deposit_refund_amount: Number(e.target.value) })}
              onBlur={(e) => saveContractDeposit({ deposit_refund_amount: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="md:col-span-1">
            <Label>ملاحظات</Label>
            <Input disabled={!canManage}
              value={contract.deposit_notes ?? ""}
              onChange={(e) => setContract({ ...contract, deposit_notes: e.target.value })}
              onBlur={(e) => saveContractDeposit({ deposit_notes: e.target.value || null })} />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">لا توجد خصومات</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>السبب</TableHead>
                {canManage && <TableHead className="w-16" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.deduction_date}</TableCell>
                  <TableCell>{Number(d.amount).toLocaleString("en-US")} ر.س</TableCell>
                  <TableCell>{d.reason}</TableCell>
                  {canManage && (
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeDeduction(d.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة خصم على التأمين</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>التاريخ</Label>
              <Input type="date" value={form.deduction_date} onChange={(e) => setForm({ ...form, deduction_date: e.target.value })} />
            </div>
            <div>
              <Label>القيمة *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>السبب *</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={addDeduction} className="bg-primary text-primary-foreground">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function PaymentScheduleCard({ contractId, canManage }: { contractId: string; canManage: boolean }) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState({ installment_number: "", due_date: "", amount: "", status: "مجدول" as SchedStatus, paid_date: "", notes: "" });
  const [genOpen, setGenOpen] = useState(false);
  const [gen, setGen] = useState({ count: "12", start_date: "", amount: "", frequency: "monthly" as "monthly" | "quarterly" | "yearly" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contract_payment_schedule")
      .select("*").eq("contract_id", contractId).order("installment_number");
    if (error) toast.error(error.message);
    setItems((data as ScheduleItem[]) ?? []);
    setLoading(false);
  }, [contractId]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({
      installment_number: String((items[items.length - 1]?.installment_number ?? 0) + 1),
      due_date: "", amount: "", status: "مجدول", paid_date: "", notes: "",
    });
    setOpen(true);
  };
  const openEdit = (it: ScheduleItem) => {
    setEditing(it);
    setForm({
      installment_number: String(it.installment_number),
      due_date: it.due_date, amount: String(it.amount),
      status: it.status, paid_date: it.paid_date ?? "", notes: it.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.installment_number || !form.due_date || !form.amount) {
      toast.error("الحقول المطلوبة ناقصة"); return;
    }
    const payload = {
      contract_id: contractId,
      installment_number: Number(form.installment_number),
      due_date: form.due_date,
      amount: Number(form.amount),
      status: form.status,
      paid_date: form.paid_date || null,
      notes: form.notes || null,
    };
    const { error } = editing
      ? await supabase.from("contract_payment_schedule").update(payload).eq("id", editing.id)
      : await supabase.from("contract_payment_schedule").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("contract_payment_schedule").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); load();
  };

  const generate = async () => {
    const count = Number(gen.count);
    const amount = Number(gen.amount);
    if (!count || !gen.start_date || !amount) { toast.error("املأ كل الحقول"); return; }
    const start = new Date(gen.start_date);
    const startNum = (items[items.length - 1]?.installment_number ?? 0);
    const rows = Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      if (gen.frequency === "monthly") d.setMonth(d.getMonth() + i);
      else if (gen.frequency === "quarterly") d.setMonth(d.getMonth() + i * 3);
      else d.setFullYear(d.getFullYear() + i);
      return {
        contract_id: contractId,
        installment_number: startNum + i + 1,
        due_date: d.toISOString().slice(0, 10),
        amount,
        status: "مجدول" as SchedStatus,
      };
    });
    const { error } = await supabase.from("contract_payment_schedule").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`تم توليد ${count} دفعة`);
    setGenOpen(false);
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> جدول الدفعات</CardTitle>
        {canManage && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setGenOpen(true)}>توليد تلقائي</Button>
            <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 ms-1" /> دفعة
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">لا توجد دفعات مجدولة</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ السداد</TableHead>
                {canManage && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell>{it.installment_number}</TableCell>
                  <TableCell>{it.due_date}</TableCell>
                  <TableCell>{Number(it.amount).toLocaleString("en-US")} ر.س</TableCell>
                  <TableCell><Badge className={SCHED_BADGE[it.status]}>{it.status}</Badge></TableCell>
                  <TableCell>{it.paid_date ?? "—"}</TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(it)}>تعديل</Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل دفعة" : "دفعة جديدة"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>رقم القسط *</Label>
              <Input type="number" value={form.installment_number} onChange={(e) => setForm({ ...form, installment_number: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ الاستحقاق *</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <Label>القيمة *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SchedStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SCHED_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ السداد</Label>
              <Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>توليد جدول دفعات تلقائياً</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>عدد الدفعات</Label>
              <Input type="number" value={gen.count} onChange={(e) => setGen({ ...gen, count: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ بداية أول دفعة</Label>
              <Input type="date" value={gen.start_date} onChange={(e) => setGen({ ...gen, start_date: e.target.value })} />
            </div>
            <div>
              <Label>قيمة كل دفعة</Label>
              <Input type="number" value={gen.amount} onChange={(e) => setGen({ ...gen, amount: e.target.value })} />
            </div>
            <div>
              <Label>التكرار</Label>
              <Select value={gen.frequency} onValueChange={(v) => setGen({ ...gen, frequency: v as typeof gen.frequency })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  <SelectItem value="yearly">سنوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>إلغاء</Button>
            <Button onClick={generate} className="bg-primary text-primary-foreground">توليد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
