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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Check, X, Banknote, TrendingUp, TrendingDown, Wallet, Paperclip, Download, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

type Expense = {
  id: string; expense_number: string; expense_date: string; category: string;
  description: string; amount: number; vendor_id: string | null;
  status: "معلّق" | "معتمد" | "مرفوض" | "مدفوع"; notes: string | null;
  paid_at: string | null; approved_at: string | null; rejection_reason: string | null;
};
type Vendor = { id: string; company_name: string };
type VendorPayment = {
  id: string; payment_number: string; vendor_id: string; payment_date: string;
  amount: number; payment_method: string | null; reference_number: string | null;
  expense_id: string | null; notes: string | null;
};

const CATEGORIES = ["صيانة","نظافة","أمن","كهرباء","مياه","مكتبية","مرافق","مقاولين","رواتب","تأمين","ضرائب ورسوم","أخرى"];
const METHODS = ["نقدي","تحويل بنكي","شيك","بطاقة"];
const fmt = (n: number) => Number(n || 0).toLocaleString("ar-EG") + " ر.س";

function ExpensesPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyRole } = useAuth();
  const canCreate = hasAnyRole(["super_admin","accountant","maintenance_supervisor"]);
  const canApprove = hasAnyRole(["super_admin","accountant"]);
  const canPay = hasAnyRole(["super_admin","accountant"]);

  const [tab, setTab] = useState<"expenses" | "payments" | "report">("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("الكل");
  const [open, setOpen] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>({
    category: "أخرى", description: "", amount: "", vendor_id: "",
    expense_date: new Date().toISOString().slice(0, 10), payment_method: "", notes: "",
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [attachOpen, setAttachOpen] = useState<Expense | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [payForm, setPayForm] = useState<any>({
    vendor_id: "", amount: "", payment_method: "تحويل بنكي",
    reference_number: "", expense_id: "", notes: "",
    payment_date: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    const [e, v, p, inv] = await Promise.all([scoped(supabase.from("expenses").select("*"), activePropertyId).order("expense_date", { ascending: false }).limit(500),
      supabase.from("vendors").select("id,company_name").order("company_name"),scoped(supabase.from("vendor_payments").select("*"), activePropertyId).order("payment_date", { ascending: false }).limit(200),scoped(supabase.from("payments").select("amount_paid"), activePropertyId),
    ]);
    if (e.error) toast.error(e.error.message); else setExpenses((e.data ?? []) as Expense[]);
    if (!v.error) setVendors((v.data ?? []) as Vendor[]);
    if (!p.error) setPayments((p.data ?? []) as VendorPayment[]);
    if (!inv.error) setRevenue((inv.data ?? []).reduce((s: number, x: any) => s + Number(x.amount_paid || 0), 0));
  };
  useEffect(() => { load(); }, []);

  const vendorMap = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);

  const filtered = useMemo(() => {
    if (statusFilter === "الكل") return expenses;
    return expenses.filter((e) => e.status === statusFilter);
  }, [expenses, statusFilter]);

  const totals = useMemo(() => ({
    pending: expenses.filter((e) => e.status === "معلّق").reduce((s, e) => s + Number(e.amount), 0),
    approved: expenses.filter((e) => e.status === "معتمد").reduce((s, e) => s + Number(e.amount), 0),
    paid: expenses.filter((e) => e.status === "مدفوع").reduce((s, e) => s + Number(e.amount), 0),
    all: expenses.reduce((s, e) => s + Number(e.amount), 0),
  }), [expenses]);

  const uploadFilesFor = async (expenseId: string, files: File[]) => {
    for (const f of files) {
      const path = `${expenseId}/${Date.now()}-${f.name}`;
      const up = await supabase.storage.from("expense-attachments").upload(path, f, { upsert: false });
      if (up.error) { toast.error(`فشل رفع ${f.name}: ${up.error.message}`); continue; }
      const ins = await supabase.from("expense_attachments").insert({
        expense_id: expenseId, file_name: f.name, storage_path: path,
        mime_type: f.type || null, size_bytes: f.size,
      });
      if (ins.error) toast.error(ins.error.message);
    }
  };

  const createExpense = async () => {
    if (!form.description || !form.amount) return toast.error("الوصف والمبلغ مطلوبان");
    setBusy(true);
    const { data, error } = await supabase.from("expenses").insert({
      category: form.category, description: form.description, amount: Number(form.amount),
      vendor_id: form.vendor_id || null, expense_date: form.expense_date,
      payment_method: form.payment_method || null, notes: form.notes || null,
    }).select("id").single();
    if (error) { setBusy(false); return toast.error(error.message); }
    if (pendingFiles.length > 0 && data?.id) {
      await uploadFilesFor(data.id, pendingFiles);
    }
    setBusy(false);
    toast.success("تم تسجيل المصروف");
    setOpen(false);
    setPendingFiles([]);
    setForm({ category: "أخرى", description: "", amount: "", vendor_id: "",
      expense_date: new Date().toISOString().slice(0, 10), payment_method: "", notes: "" });
    await load();
  };

  const openAttachments = async (e: Expense) => {
    setAttachOpen(e);
    const { data } = await supabase.from("expense_attachments").select("*").eq("expense_id", e.id).order("created_at", { ascending: false });
    setAttachments(data ?? []);
  };

  const addAttachmentsToExisting = async (files: FileList | null) => {
    if (!files || !attachOpen) return;
    setBusy(true);
    await uploadFilesFor(attachOpen.id, Array.from(files));
    setBusy(false);
    await openAttachments(attachOpen);
  };

  const downloadAttachment = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("expense-attachments").createSignedUrl(path, 60);
    if (error || !data) return toast.error(error?.message || "تعذّر التحميل");
    const a = document.createElement("a");
    a.href = data.signedUrl; a.download = name; a.target = "_blank"; a.click();
  };

  const deleteAttachment = async (att: any) => {
    if (!confirm("حذف المرفق؟")) return;
    await supabase.storage.from("expense-attachments").remove([att.storage_path]);
    const { error } = await supabase.from("expense_attachments").delete().eq("id", att.id);
    if (error) return toast.error(error.message);
    if (attachOpen) await openAttachments(attachOpen);
  };


  const changeStatus = async (id: string, status: string, reason?: string) => {
    const patch: any = { status };
    if (status === "مرفوض" && reason) patch.rejection_reason = reason;
    const { error } = await supabase.from("expenses").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`تم: ${status}`);
    await load();
  };

  const createPayment = async () => {
    if (!payForm.vendor_id || !payForm.amount) return toast.error("المورد والمبلغ مطلوبان");
    setBusy(true);
    const { error } = await supabase.from("vendor_payments").insert({
      vendor_id: payForm.vendor_id, amount: Number(payForm.amount),
      payment_method: payForm.payment_method, reference_number: payForm.reference_number || null,
      expense_id: payForm.expense_id || null, notes: payForm.notes || null,
      payment_date: payForm.payment_date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل سداد المورد");
    setOpenPay(false);
    setPayForm({ vendor_id: "", amount: "", payment_method: "تحويل بنكي",
      reference_number: "", expense_id: "", notes: "",
      payment_date: new Date().toISOString().slice(0, 10) });
    await load();
  };

  const net = revenue - totals.paid;
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const STATUS_STYLE: Record<string, string> = {
    "معلّق": "bg-amber-500/15 text-amber-700",
    "معتمد": "bg-blue-500/15 text-blue-700",
    "مرفوض": "bg-destructive/20 text-destructive",
    "مدفوع": "bg-emerald-500/15 text-emerald-700",
  };

  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">المصروفات وسداد الموردين</h1>
          <p className="text-sm text-muted-foreground">تسجيل المصروفات، الموافقات، والمدفوعات للموردين</p>
        </div>
        <div className="flex gap-2">
          {canPay && (
            <Dialog open={openPay} onOpenChange={setOpenPay}>
              <DialogTrigger asChild>
                <Button variant="outline"><Banknote className="h-4 w-4 ml-1" /> سداد مورد</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>تسجيل سداد لمورد</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>المورد *</Label>
                    <Select value={payForm.vendor_id} onValueChange={(v) => setPayForm({ ...payForm, vendor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر مورداً" /></SelectTrigger>
                      <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>المبلغ *</Label><Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
                  <div><Label>التاريخ</Label><Input type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} /></div>
                  <div>
                    <Label>طريقة الدفع</Label>
                    <Select value={payForm.payment_method} onValueChange={(v) => setPayForm({ ...payForm, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>رقم المرجع</Label><Input value={payForm.reference_number} onChange={(e) => setPayForm({ ...payForm, reference_number: e.target.value })} /></div>
                  <div className="col-span-2">
                    <Label>المصروف المرتبط (اختياري)</Label>
                    <Select value={payForm.expense_id} onValueChange={(v) => setPayForm({ ...payForm, expense_id: v })}>
                      <SelectTrigger><SelectValue placeholder="ربط بمصروف معتمد" /></SelectTrigger>
                      <SelectContent>
                        {expenses.filter((e) => e.status === "معتمد").map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.expense_number} — {fmt(e.amount)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>ملاحظات</Label><Textarea rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenPay(false)}>إلغاء</Button>
                  <Button onClick={createPayment} disabled={busy}>حفظ السداد</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-1" /> مصروف جديد</Button></DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>تسجيل مصروف جديد</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>الفئة</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>التاريخ</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
                  <div className="col-span-2"><Label>الوصف *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <div><Label>المبلغ *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div>
                    <Label>المورد</Label>
                    <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                      <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>طريقة السداد</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر طريقة" /></SelectTrigger>
                      <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={createExpense} disabled={busy}>حفظ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">معلّقة</CardTitle></CardHeader><CardContent className="text-xl font-bold text-amber-600">{fmt(totals.pending)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">معتمدة</CardTitle></CardHeader><CardContent className="text-xl font-bold text-blue-600">{fmt(totals.approved)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">مدفوعة</CardTitle></CardHeader><CardContent className="text-xl font-bold text-emerald-600">{fmt(totals.paid)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">الإجمالي</CardTitle></CardHeader><CardContent className="text-xl font-bold">{fmt(totals.all)}</CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="payments">سدادات الموردين</TabsTrigger>
          <TabsTrigger value="report">الإيرادات مقابل المصروفات</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {["الكل", "معلّق", "معتمد", "مدفوع", "مرفوض"].map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>{s}</Button>
            ))}
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الرقم</TableHead><TableHead>التاريخ</TableHead><TableHead>الفئة</TableHead>
                <TableHead>الوصف</TableHead><TableHead>المورد</TableHead><TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد مصروفات</TableCell></TableRow>
                ) : filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.expense_number}</TableCell>
                    <TableCell className="text-xs">{e.expense_date}</TableCell>
                    <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{e.description}</TableCell>
                    <TableCell className="text-xs">{e.vendor_id ? vendorMap.get(e.vendor_id)?.company_name : "—"}</TableCell>
                    <TableCell className="font-semibold">{fmt(e.amount)}</TableCell>
                    <TableCell><Badge className={STATUS_STYLE[e.status]}>{e.status}</Badge></TableCell>
                    <TableCell>
                      {e.status === "معلّق" && canApprove && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => changeStatus(e.id, "معتمد")}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const r = prompt("سبب الرفض:");
                            if (r) changeStatus(e.id, "مرفوض", r);
                          }}>
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                      {e.status === "معتمد" && canPay && (
                        <Button size="sm" variant="outline" onClick={() => changeStatus(e.id, "مدفوع")}>
                          تأكيد الدفع
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>السند</TableHead><TableHead>التاريخ</TableHead><TableHead>المورد</TableHead>
                <TableHead>المبلغ</TableHead><TableHead>طريقة</TableHead><TableHead>المرجع</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد سدادات</TableCell></TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.payment_number}</TableCell>
                    <TableCell className="text-xs">{p.payment_date}</TableCell>
                    <TableCell>{vendorMap.get(p.vendor_id)?.company_name ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{fmt(p.amount)}</TableCell>
                    <TableCell>{p.payment_method || "—"}</TableCell>
                    <TableCell className="text-xs">{p.reference_number || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> الإيرادات (محصّلة)</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-600">{fmt(revenue)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-rose-600" /> المصروفات (مدفوعة)</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-rose-600">{fmt(totals.paid)}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" /> صافي الربح</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(net)}</CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">توزيع المصروفات حسب الفئة</CardTitle></CardHeader>
            <CardContent>
              {byCategory.length === 0 ? <p className="text-muted-foreground text-center py-4">لا توجد بيانات</p> : (
                <div className="space-y-2">
                  {byCategory.map(([cat, sum]) => {
                    const pct = totals.all > 0 ? (sum / totals.all) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{cat}</span>
                          <span className="font-mono">{fmt(sum)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
