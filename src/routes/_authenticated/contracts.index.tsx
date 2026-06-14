import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, AlertTriangle, FileSignature } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contracts/")({
  component: ContractsPage,
});

export type ContractStatus = "ساري" | "منتهي" | "مجدد" | "ملغي";
export const CONTRACT_STATUSES: ContractStatus[] = ["ساري", "منتهي", "مجدد", "ملغي"];
export const CONTRACT_STATUS_STYLE: Record<ContractStatus, string> = {
  "ساري": "bg-success text-success-foreground",
  "منتهي": "bg-muted-foreground/40 text-background",
  "مجدد": "bg-primary/15 text-primary",
  "ملغي": "bg-destructive/20 text-destructive",
};

export interface Contract {
  id: string;
  contract_number: string;
  company_id: string;
  office_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  service_fees: number;
  status: ContractStatus;
  notes: string | null;
  renewed_from_id: string | null;
}

type ContractWithRefs = Contract & {
  companies?: { id: string; company_name: string } | null;
  offices?: { id: string; code: string } | null;
};

export function daysBetween(a: string, b: Date = new Date()) {
  const d1 = new Date(a).getTime();
  return Math.ceil((d1 - b.getTime()) / 86400000);
}

function ContractsPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole("super_admin") || hasRole("accountant");
  const navigate = useNavigate();

  const [rows, setRows] = useState<ContractWithRefs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<"all" | string>("all");
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select("*, companies(id, company_name), offices(id, code)")
      .order("created_at", { ascending: false });
    if (error) toast.error("فشل تحميل العقود: " + error.message);
    setRows((data as ContractWithRefs[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.from("companies").select("id, company_name").order("company_name")
      .then(({ data }) => setCompanies((data as { id: string; company_name: string }[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (companyFilter !== "all" && r.company_id !== companyFilter) return false;
      if (search) {
        const q = search.trim().toLowerCase();
        const m = `${r.contract_number} ${r.companies?.company_name ?? ""} ${r.offices?.code ?? ""}`.toLowerCase();
        if (!m.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, companyFilter, search]);

  const expiringSoon = useMemo(() => {
    return rows.filter(r => {
      if (r.status !== "ساري") return false;
      const d = daysBetween(r.end_date);
      return d >= 0 && d <= 90;
    });
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileSignature className="h-6 w-6" /> العقود
          </h1>
          <p className="text-sm text-muted-foreground">إدارة عقود الإيجار وتجديداتها</p>
        </div>
        {canCreate && (
          <Button onClick={() => setFormOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" /> عقد جديد
          </Button>
        )}
      </div>

      {expiringSoon.length > 0 && (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">
            تنبيه: {expiringSoon.length} عقد تنتهي خلال 90 يومًا
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc pe-5 mt-2 space-y-1 text-sm">
              {expiringSoon.slice(0, 8).map(c => {
                const d = daysBetween(c.end_date);
                return (
                  <li key={c.id}>
                    <Link to="/contracts/$id" params={{ id: c.id }} className="hover:underline">
                      {c.contract_number}
                    </Link>
                    {" — "}
                    {c.companies?.company_name} / {c.offices?.code} — متبقي {d} يوم
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم العقد، اسم العميل، رقم المكتب" className="pe-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {CONTRACT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger><SelectValue placeholder="المستأجر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المستأجرين</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم العقد</TableHead>
                    <TableHead>المستأجر</TableHead>
                    <TableHead>المكتب</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>إلى</TableHead>
                    <TableHead>الإيجار</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">لا توجد عقود</TableCell></TableRow>
                  ) : filtered.map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate({ to: "/contracts/$id", params: { id: c.id } })}>
                      <TableCell className="font-medium">{c.contract_number}</TableCell>
                      <TableCell>{c.companies?.company_name ?? "—"}</TableCell>
                      <TableCell>{c.offices?.code ?? "—"}</TableCell>
                      <TableCell>{c.start_date}</TableCell>
                      <TableCell>{c.end_date}</TableCell>
                      <TableCell>{Number(c.rent_amount).toLocaleString("ar-EG")}</TableCell>
                      <TableCell><Badge className={CONTRACT_STATUS_STYLE[c.status]}>{c.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ContractFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load(); }} />
    </div>
  );
}

type PendingFile = { file: File; type: ContractAttachmentType };
export type ContractAttachmentType = "نسخة العقد" | "الهوية" | "السجل التجاري" | "سند دفع";
export const CONTRACT_ATTACHMENT_TYPES: ContractAttachmentType[] = [
  "نسخة العقد", "الهوية", "السجل التجاري", "سند دفع",
];

export function ContractFormDialog({
  open, onClose, onSaved, defaultCompanyId, defaultOfficeId, contractId,
}: {
  open: boolean; onClose: () => void; onSaved: () => void;
  defaultCompanyId?: string; defaultOfficeId?: string;
  contractId?: string;
}) {
  const isEdit = !!contractId;
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [offices, setOffices] = useState<{ id: string; code: string; status: string }[]>([]);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [form, setForm] = useState({
    company_id: defaultCompanyId ?? "",
    office_id: defaultOfficeId ?? "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    rent_amount: "0",
    deposit_amount: "0",
    service_fees: "0",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setPending([]);
    supabase.from("companies").select("id, company_name").order("company_name")
      .then(({ data }) => setCompanies((data as { id: string; company_name: string }[]) ?? []));
    supabase.from("offices").select("id, code, status").order("code")
      .then(({ data }) => setOffices((data as { id: string; code: string; status: string }[]) ?? []));
    if (contractId) {
      supabase.from("contracts").select("*").eq("id", contractId).maybeSingle().then(({ data }) => {
        if (!data) return;
        const c = data as Contract;
        setForm({
          company_id: c.company_id, office_id: c.office_id,
          start_date: c.start_date, end_date: c.end_date,
          rent_amount: String(c.rent_amount), deposit_amount: String(c.deposit_amount),
          service_fees: String(c.service_fees), notes: c.notes ?? "",
        });
      });
    } else {
      setForm(f => ({
        ...f,
        company_id: defaultCompanyId ?? f.company_id,
        office_id: defaultOfficeId ?? f.office_id,
      }));
    }
  }, [open, defaultCompanyId, defaultOfficeId, contractId]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setPending(p => [
      ...p,
      ...Array.from(files).map(f => ({ file: f, type: "نسخة العقد" as ContractAttachmentType })),
    ]);
  };

  const submit = async () => {
    if (!form.company_id || !form.office_id || !form.start_date || !form.end_date) {
      toast.error("الرجاء تعبئة الحقول المطلوبة");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      company_id: form.company_id,
      office_id: form.office_id,
      start_date: form.start_date,
      end_date: form.end_date,
      rent_amount: Number(form.rent_amount) || 0,
      deposit_amount: Number(form.deposit_amount) || 0,
      service_fees: Number(form.service_fees) || 0,
      notes: form.notes || null,
    };

    let targetId = contractId ?? null;
    if (isEdit && contractId) {
      const { data, error } = await supabase.from("contracts").update(payload).eq("id", contractId).select("id");
      if (error) { setSaving(false); toast.error("فشل التعديل: " + error.message); return; }
      if (!data || data.length === 0) { setSaving(false); toast.error("لا تملك صلاحية تعديل هذا العقد"); return; }
    } else {
      const { data, error } = await supabase.from("contracts").insert({
        ...payload, status: "ساري", contract_number: "", created_by: u.user?.id,
      }).select("id").single();
      if (error || !data) { setSaving(false); toast.error("فشل الحفظ: " + (error?.message ?? "")); return; }
      targetId = data.id;
    }

    // Upload pending attachments
    if (targetId && pending.length > 0) {
      for (const p of pending) {
        const path = `${targetId}/${Date.now()}_${p.file.name}`;
        const up = await supabase.storage.from("contracts").upload(path, p.file, { upsert: false });
        if (up.error) { toast.error("فشل رفع " + p.file.name + ": " + up.error.message); continue; }
        await supabase.from("contract_attachments").insert({
          contract_id: targetId, attachment_type: p.type, file_name: p.file.name,
          storage_path: path, mime_type: p.file.type, size_bytes: p.file.size, created_by: u.user?.id,
        });
      }
    }

    setSaving(false);
    toast.success(isEdit ? "تم تحديث العقد" : "تم إنشاء العقد");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "تعديل العقد" : "عقد جديد"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>المستأجر *</Label>
            <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر المستأجر" /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>المكتب *</Label>
            <Select value={form.office_id} onValueChange={(v) => setForm({ ...form, office_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر المكتب" /></SelectTrigger>
              <SelectContent>{offices.map(o => <SelectItem key={o.id} value={o.id}>{o.code} — {o.status}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>من تاريخ *</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <Label>إلى تاريخ *</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div>
            <Label>قيمة الإيجار</Label>
            <Input type="number" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} />
          </div>
          <div>
            <Label>التأمين</Label>
            <Input type="number" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
          </div>
          <div>
            <Label>رسوم الخدمات</Label>
            <Input type="number" value={form.service_fees} onChange={(e) => setForm({ ...form, service_fees: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="md:col-span-2 border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label>المرفقات</Label>
              <label className="cursor-pointer">
                <input type="file" multiple className="hidden"
                  onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
                <Button asChild variant="outline" size="sm" type="button">
                  <span>+ إضافة ملفات</span>
                </Button>
              </label>
            </div>
            {pending.length === 0 ? (
              <p className="text-xs text-muted-foreground">يمكنك إرفاق نسخ العقد والهويات والمستندات الداعمة.</p>
            ) : (
              <div className="space-y-2">
                {pending.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded-md">
                    <span className="flex-1 text-sm truncate">{p.file.name}</span>
                    <Select value={p.type} onValueChange={(v) => setPending(arr => arr.map((x, idx) => idx === i ? { ...x, type: v as ContractAttachmentType } : x))}>
                      <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTRACT_ATTACHMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" type="button"
                      onClick={() => setPending(arr => arr.filter((_, idx) => idx !== i))}>إزالة</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />}حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


