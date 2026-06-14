import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Receipt, AlertTriangle, Wallet, CalendarClock, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance")({
  component: FinancePage,
});

type InvoiceType = "إيجار" | "تأمين" | "رسوم تشغيل" | "رسوم خدمات" | "غرامات";
type InvoiceStatus = "مستحق" | "مدفوع جزئي" | "مدفوع" | "متأخر";
type PaymentMethod = "نقدي" | "تحويل بنكي" | "شيك";

const INVOICE_TYPES: InvoiceType[] = ["إيجار", "تأمين", "رسوم تشغيل", "رسوم خدمات", "غرامات"];
const INVOICE_STATUSES: InvoiceStatus[] = ["مستحق", "مدفوع جزئي", "مدفوع", "متأخر"];
const PAYMENT_METHODS: PaymentMethod[] = ["نقدي", "تحويل بنكي", "شيك"];

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  "مستحق": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "مدفوع جزئي": "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "مدفوع": "bg-success text-success-foreground",
  "متأخر": "bg-destructive/20 text-destructive",
};

interface Invoice {
  id: string;
  invoice_number: string;
  contract_id: string | null;
  company_id: string;
  invoice_type: InvoiceType;
  amount_due: number;
  amount_paid: number;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  notes: string | null;
  companies?: { id: string; company_name: string } | null;
  contracts?: { id: string; contract_number: string } | null;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: PaymentMethod;
  receipt_number: string;
  notes: string | null;
  receipt_file_url: string | null;
  invoices?: { invoice_number: string; companies?: { company_name: string } | null } | null;
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("ar-EG") + " ر.س";
}

function FinancePage() {
  const { hasRole } = useAuth();
  const canView = hasRole("super_admin") || hasRole("accountant") || hasRole("owner");
  const canManage = hasRole("super_admin") || hasRole("accountant");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | InvoiceType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<"all" | string>("all");
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, payRes, coRes] = await Promise.all([
      supabase.from("invoices").select("*, companies(id, company_name), contracts(id, contract_number)").order("due_date", { ascending: false }),
      supabase.from("payments").select("*, invoices(invoice_number, companies(company_name))").order("payment_date", { ascending: false }),
      supabase.from("companies").select("id, company_name").order("company_name"),
    ]);
    if (invRes.error) toast.error(invRes.error.message);
    setInvoices((invRes.data as Invoice[]) ?? []);
    setPayments((payRes.data as Payment[]) ?? []);
    setCompanies((coRes.data as { id: string; company_name: string }[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (canView) load(); }, [load, canView]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (typeFilter !== "all" && i.invoice_type !== typeFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (companyFilter !== "all" && i.company_id !== companyFilter) return false;
      if (!q) return true;
      return (
        i.invoice_number.toLowerCase().includes(q) ||
        (i.companies?.company_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [invoices, search, typeFilter, statusFilter, companyFilter]);

  const overdue = useMemo(() => invoices.filter((i) => i.status === "متأخر"), [invoices]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
    const collectedThisMonth = payments
      .filter((p) => new Date(p.payment_date) >= monthStart)
      .reduce((s, p) => s + Number(p.amount_paid), 0);
    const totalOverdue = overdue.reduce((s, i) => s + (Number(i.amount_due) - Number(i.amount_paid)), 0);
    const dueThisWeek = invoices.filter((i) => {
      const d = new Date(i.due_date);
      return d >= now && d <= weekEnd && i.status !== "مدفوع";
    });
    return { collectedThisMonth, totalOverdue, dueThisWeekCount: dueThisWeek.length };
  }, [invoices, payments, overdue]);

  if (!canView) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
        <p className="text-muted-foreground">ليس لديك صلاحية الوصول إلى الموديول المالي</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">المالية</h1>
        <p className="text-sm text-muted-foreground">الفواتير، المتأخرات، وسندات القبض</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="المحصل هذا الشهر" value={fmt(stats.collectedThisMonth)} color="bg-success/10 text-success" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="إجمالي المتأخرات" value={fmt(stats.totalOverdue)} color="bg-destructive/10 text-destructive" />
        <StatCard icon={<CalendarClock className="h-5 w-5" />} label="مستحقة هذا الأسبوع" value={String(stats.dueThisWeekCount)} color="bg-primary/10 text-primary" />
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices"><Receipt className="h-4 w-4 ms-1" />الفواتير</TabsTrigger>
          <TabsTrigger value="overdue"><AlertTriangle className="h-4 w-4 ms-1" />المتأخرات{overdue.length > 0 ? ` (${overdue.length})` : ""}</TabsTrigger>
          <TabsTrigger value="receipts"><Wallet className="h-4 w-4 ms-1" />سندات القبض</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label>بحث</Label>
                  <div className="relative">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="رقم الفاتورة أو اسم العميل" className="pe-9" />
                  </div>
                </div>
                <div>
                  <Label>النوع</Label>
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {INVOICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {INVOICE_STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المستأجر</Label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InvoicesTable rows={filtered} loading={loading} canManage={canManage} onPay={setPayInvoice} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card className="border-destructive/40">
            <CardHeader className="bg-destructive/5">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> فواتير متأخرة — إجمالي {fmt(stats.totalOverdue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoicesTable rows={overdue} loading={loading} canManage={canManage} onPay={setPayInvoice} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader><CardTitle>سندات القبض</CardTitle></CardHeader>
            <CardContent>
              <ReceiptsTable rows={payments} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentDialog
        invoice={payInvoice}
        onClose={() => setPayInvoice(null)}
        onSaved={() => { setPayInvoice(null); load(); }}
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoicesTable({
  rows, loading, canManage, onPay,
}: { rows: Invoice[]; loading: boolean; canManage: boolean; onPay: (i: Invoice) => void }) {
  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (rows.length === 0) return <p className="text-center text-muted-foreground py-8">لا توجد فواتير</p>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم الفاتورة</TableHead>
            <TableHead>المستأجر</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead>المستحق</TableHead>
            <TableHead>المدفوع</TableHead>
            <TableHead>المتبقي</TableHead>
            <TableHead>الاستحقاق</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((i) => {
            const remaining = Number(i.amount_due) - Number(i.amount_paid);
            return (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                <TableCell>
                  {i.companies ? (
                    <Link to="/tenants/$id" params={{ id: i.company_id }} className="text-primary hover:underline">
                      {i.companies.company_name}
                    </Link>
                  ) : "—"}
                </TableCell>
                <TableCell>{i.invoice_type}</TableCell>
                <TableCell>{fmt(Number(i.amount_due))}</TableCell>
                <TableCell>{fmt(Number(i.amount_paid))}</TableCell>
                <TableCell className={remaining > 0 ? "text-destructive font-semibold" : ""}>{fmt(remaining)}</TableCell>
                <TableCell>{i.due_date}</TableCell>
                <TableCell><Badge className={STATUS_STYLE[i.status]}>{i.status}</Badge></TableCell>
                <TableCell>
                  {canManage && i.status !== "مدفوع" && (
                    <Button size="sm" variant="outline" onClick={() => onPay(i)}>
                      <Plus className="h-3 w-3 ms-1" />دفعة
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ReceiptsTable({ rows, loading }: { rows: Payment[]; loading: boolean }) {
  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (rows.length === 0) return <p className="text-center text-muted-foreground py-8">لا توجد سندات قبض</p>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم السند</TableHead>
            <TableHead>الفاتورة</TableHead>
            <TableHead>المستأجر</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>طريقة الدفع</TableHead>
            <TableHead>ملاحظات</TableHead>
            <TableHead>المرفق</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
              <TableCell className="font-mono text-xs">{p.invoices?.invoice_number ?? "—"}</TableCell>
              <TableCell>{p.invoices?.companies?.company_name ?? "—"}</TableCell>
              <TableCell>{fmt(Number(p.amount_paid))}</TableCell>
              <TableCell>{p.payment_date}</TableCell>
              <TableCell>{p.payment_method}</TableCell>
              <TableCell className="text-muted-foreground text-xs">{p.notes ?? "—"}</TableCell>
              <TableCell>
                {p.receipt_file_url ? (
                  <Button size="sm" variant="outline" onClick={() => openReceipt(p.receipt_file_url!)}>
                    عرض
                  </Button>
                ) : <span className="text-muted-foreground text-xs">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PaymentDialog({
  invoice, onClose, onSaved,
}: { invoice: Invoice | null; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("نقدي");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (invoice) {
      const remaining = Number(invoice.amount_due) - Number(invoice.amount_paid);
      setAmount(String(remaining > 0 ? remaining : ""));
      setMethod("نقدي");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setFile(null);
    }
  }, [invoice]);

  const remaining = invoice ? Number(invoice.amount_due) - Number(invoice.amount_paid) : 0;

  const save = async () => {
    if (!invoice) return;
    const amt = Number(amount);
    if (!(amt > 0)) { toast.error("أدخل مبلغًا صحيحًا"); return; }
    if (amt > remaining + 0.001) { toast.error("المبلغ يتجاوز المتبقي"); return; }
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();

    let receipt_file_url: string | null = null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setBusy(false);
        toast.error("حجم الملف يتجاوز 10 ميغابايت");
        return;
      }
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${invoice.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("payment-receipts").upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (up.error) {
        setBusy(false);
        toast.error("فشل رفع الملف: " + up.error.message);
        return;
      }
      receipt_file_url = up.data.path;
    }

    const { error } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      amount_paid: amt,
      payment_date: date,
      payment_method: method,
      receipt_number: "",
      notes: notes || null,
      receipt_file_url,
      created_by: userRes.user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error("فشل التسجيل: " + error.message); return; }
    toast.success("تم تسجيل الدفعة");
    onSaved();
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>تسجيل دفعة — {invoice?.invoice_number}</DialogTitle></DialogHeader>
        {invoice && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-md p-3">
              <div><div className="text-muted-foreground text-xs">المستحق</div><div>{fmt(Number(invoice.amount_due))}</div></div>
              <div><div className="text-muted-foreground text-xs">المتبقي</div><div className="font-semibold text-destructive">{fmt(remaining)}</div></div>
            </div>
            <div>
              <Label>المبلغ المدفوع</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التاريخ</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>طريقة الدفع</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>مرفق الإيصال (اختياري)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {file.name} — {(file.size / 1024).toFixed(0)} KB
                </p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 ms-1 animate-spin" />}حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
