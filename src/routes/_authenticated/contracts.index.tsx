import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, AlertTriangle, FileSignature } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
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
import { CompanyFormDialog } from "./tenants";
import { DeleteArchiveMenu, ArchivedFilterToggle } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/contracts/")({
  component: ContractsPage,
});

export type ContractStatus =
  | "مسودة" | "قيد المراجعة" | "بانتظار المستندات" | "بانتظار الاعتماد"
  | "ساري" | "موقوف" | "متعثر" | "تحت التجديد"
  | "مجدد" | "منتهي" | "مخلى" | "ملغي";

export const CONTRACT_STATUSES: ContractStatus[] = [
  "مسودة", "قيد المراجعة", "بانتظار المستندات", "بانتظار الاعتماد",
  "ساري", "موقوف", "متعثر", "تحت التجديد",
  "مجدد", "منتهي", "مخلى", "ملغي",
];

export const CONTRACT_STATUS_STYLE: Record<ContractStatus, string> = {
  "مسودة": "bg-muted text-foreground",
  "قيد المراجعة": "bg-secondary text-secondary-foreground",
  "بانتظار المستندات": "bg-warning/20 text-warning-foreground",
  "بانتظار الاعتماد": "bg-warning/20 text-warning-foreground",
  "ساري": "bg-success text-success-foreground",
  "موقوف": "bg-muted-foreground/40 text-background",
  "متعثر": "bg-destructive/20 text-destructive",
  "تحت التجديد": "bg-primary/15 text-primary",
  "مجدد": "bg-primary/15 text-primary",
  "منتهي": "bg-muted-foreground/40 text-background",
  "مخلى": "bg-muted-foreground/40 text-background",
  "ملغي": "bg-destructive/20 text-destructive",
};

export type ContractType =
  | "عقد إيجار مكتب" | "عقد إيجار عدة مكاتب" | "عقد حجز" | "عقد تجديد" | "ملحق عقد";
export const CONTRACT_TYPES: ContractType[] = [
  "عقد إيجار مكتب", "عقد إيجار عدة مكاتب", "عقد حجز", "عقد تجديد", "ملحق عقد",
];

export const ALERT_THRESHOLD_OPTIONS = [180, 90, 60, 30, 15, 7] as const;

export interface Contract {
  id: string;
  contract_number: string;
  contract_type: ContractType;
  contract_name: string | null;
  company_id: string;
  office_id: string;
  lessor_name: string | null;
  lessor_cr: string | null;
  lessor_id_number: string | null;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  service_fees: number;
  status: ContractStatus;
  notes: string | null;
  renewed_from_id: string | null;
  alert_thresholds_days: number[] | null;
  auto_renew: boolean | null;
  notice_period_days: number | null;
  annual_increase_pct: number | null;
  evacuation_date: string | null;
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
  const { activePropertyId } = useActiveProperty();
  const { hasAnyPermission, isSuperAdmin } = useAuth();
  const canCreate = isSuperAdmin || hasAnyPermission(["contracts.create"]);
  const navigate = useNavigate();

  const initialSearch = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialStatus = (initialSearch?.get("status") as ContractStatus | null) ?? "all";

  const [rows, setRows] = useState<ContractWithRefs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch?.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>(initialStatus as any);
  const [companyFilter, setCompanyFilter] = useState<"all" | string>("all");
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("contracts")
      .select("*, companies(id, company_name), offices(id, code)");
    q = (showArchived ? q.not("archived_at", "is", null) : q.is("archived_at", null)) as typeof q;
    const { data, error } = await scoped(q, activePropertyId)
      .order("created_at", { ascending: false });
    if (error) toast.error("فشل تحميل العقود: " + error.message);
    setRows((data as ContractWithRefs[]) ?? []);
    setLoading(false);
  }, [showArchived, activePropertyId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {scoped(supabase.from("companies").select("id, company_name"), activePropertyId).order("company_name")
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
        <div className="flex items-center gap-2">
          <ArchivedFilterToggle value={showArchived} onChange={setShowArchived} />
          {canCreate && (
            <Button onClick={() => setFormOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="h-4 w-4 ms-1" /> عقد جديد
            </Button>
          )}
        </div>
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
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">لا توجد عقود</TableCell></TableRow>
                  ) : filtered.map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate({ to: "/contracts/$id", params: { id: c.id } })}>
                      <TableCell className="font-medium">{c.contract_number}</TableCell>
                      <TableCell>{c.companies?.company_name ?? "—"}</TableCell>
                      <TableCell>{c.offices?.code ?? "—"}</TableCell>
                      <TableCell>{c.start_date}</TableCell>
                      <TableCell>{c.end_date}</TableCell>
                      <TableCell>{Number(c.rent_amount).toLocaleString("en-US")}</TableCell>
                      <TableCell><Badge className={CONTRACT_STATUS_STYLE[c.status]}>{c.status}</Badge></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DeleteArchiveMenu
                          table="contracts"
                          id={c.id}
                          isArchived={!!(c as any).archived_at}
                          entityLabel={c.contract_number}
                          onDone={load}
                          compact
                        />
                      </TableCell>
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
export type ContractAttachmentType =
  | "نسخة العقد" | "الهوية" | "السجل التجاري" | "سند دفع"
  | "التفويض" | "السندات" | "الشيكات" | "الفواتير" | "الملاحق";
export const CONTRACT_ATTACHMENT_TYPES: ContractAttachmentType[] = [
  "نسخة العقد", "الهوية", "السجل التجاري", "سند دفع",
  "التفويض", "السندات", "الشيكات", "الفواتير", "الملاحق",
];

export function ContractFormDialog({
  open, onClose, onSaved, defaultCompanyId, defaultOfficeId, contractId,
}: {
  open: boolean; onClose: () => void; onSaved: () => void;
  defaultCompanyId?: string; defaultOfficeId?: string;
  contractId?: string;
}) {
  const { activePropertyId } = useActiveProperty();
  const isEdit = !!contractId;
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [offices, setOffices] = useState<{ id: string; code: string; status: string }[]>([]);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [tenantAddOpen, setTenantAddOpen] = useState(false);
  const reloadCompanies = useCallback(async () => {
    const { data } = await scoped(supabase.from("companies").select("id, company_name"), activePropertyId).order("company_name");
    setCompanies((data as { id: string; company_name: string }[]) ?? []);
  }, [activePropertyId]);
  const [form, setForm] = useState({
    contract_type: "عقد إيجار مكتب" as ContractType,
    contract_name: "",
    status: "مسودة" as ContractStatus,
    company_id: defaultCompanyId ?? "",
    office_id: defaultOfficeId ?? "",
    lessor_name: "",
    lessor_cr: "",
    lessor_id_number: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    rent_amount: "0",
    deposit_amount: "0",
    service_fees: "0",
    auto_renew: false,
    notice_period_days: "",
    annual_increase_pct: "",
    alert_thresholds_days: [90, 30] as number[],
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setPending([]);scoped(supabase.from("companies").select("id, company_name"), activePropertyId).order("company_name")
      .then(({ data }) => setCompanies((data as { id: string; company_name: string }[]) ?? []));
    supabase.from("offices").select("id, code, status").order("code")
      .then(({ data }) => setOffices((data as { id: string; code: string; status: string }[]) ?? []));
    if (contractId) {scoped(supabase.from("contracts").select("*"), activePropertyId).eq("id", contractId).maybeSingle().then(({ data }) => {
        if (!data) return;
        const c = data as Contract;
        setForm({
          contract_type: (c.contract_type ?? "عقد إيجار مكتب") as ContractType,
          contract_name: c.contract_name ?? "",
          status: c.status,
          company_id: c.company_id, office_id: c.office_id,
          lessor_name: c.lessor_name ?? "",
          lessor_cr: c.lessor_cr ?? "",
          lessor_id_number: c.lessor_id_number ?? "",
          start_date: c.start_date, end_date: c.end_date,
          rent_amount: String(c.rent_amount), deposit_amount: String(c.deposit_amount),
          service_fees: String(c.service_fees),
          auto_renew: !!c.auto_renew,
          notice_period_days: c.notice_period_days != null ? String(c.notice_period_days) : "",
          annual_increase_pct: c.annual_increase_pct != null ? String(c.annual_increase_pct) : "",
          alert_thresholds_days: c.alert_thresholds_days ?? [90, 30],
          notes: c.notes ?? "",
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

  const toggleThreshold = (d: number) => {
    setForm(f => ({
      ...f,
      alert_thresholds_days: f.alert_thresholds_days.includes(d)
        ? f.alert_thresholds_days.filter(x => x !== d)
        : [...f.alert_thresholds_days, d].sort((a, b) => b - a),
    }));
  };

  const submit = async () => {
    if (!form.company_id || !form.office_id || !form.start_date || !form.end_date) {
      toast.error("الرجاء تعبئة الحقول المطلوبة");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      contract_type: form.contract_type,
      contract_name: form.contract_name || null,
      company_id: form.company_id,
      office_id: form.office_id,
      lessor_name: form.lessor_name || null,
      lessor_cr: form.lessor_cr || null,
      lessor_id_number: form.lessor_id_number || null,
      start_date: form.start_date,
      end_date: form.end_date,
      rent_amount: Number(form.rent_amount) || 0,
      deposit_amount: Number(form.deposit_amount) || 0,
      service_fees: Number(form.service_fees) || 0,
      auto_renew: form.auto_renew,
      notice_period_days: form.notice_period_days ? Number(form.notice_period_days) : null,
      annual_increase_pct: form.annual_increase_pct ? Number(form.annual_increase_pct) : null,
      alert_thresholds_days: form.alert_thresholds_days,
      notes: form.notes || null,
    };

    let targetId = contractId ?? null;
    if (isEdit && contractId) {
      const { data, error } = await supabase.from("contracts")
        .update({ ...payload, status: form.status }).eq("id", contractId).select("id");
      if (error) { setSaving(false); toast.error("فشل التعديل: " + error.message); return; }
      if (!data || data.length === 0) { setSaving(false); toast.error("لا تملك صلاحية تعديل هذا العقد"); return; }
    } else {
      const { data, error } = await supabase.from("contracts").insert({
        ...payload, status: form.status, contract_number: "", created_by: u.user?.id,
      }).select("id").single();
      if (error || !data) { setSaving(false); toast.error("فشل الحفظ: " + (error?.message ?? "")); return; }
      targetId = data.id;
    }

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
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "تعديل العقد" : "عقد جديد"}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>نوع العقد *</Label>
              <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v as ContractType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>اسم العقد</Label>
              <Input value={form.contract_name} onChange={(e) => setForm({ ...form, contract_name: e.target.value })} placeholder="اختياري — مثلاً: عقد شركة الفجر 2026" />
            </div>
            <div>
              <Label>حالة العقد</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContractStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRACT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </section>

          <section className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">المؤجر</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>اسم الجهة المالكة</Label>
                <Input value={form.lessor_name} onChange={(e) => setForm({ ...form, lessor_name: e.target.value })} />
              </div>
              <div>
                <Label>السجل التجاري</Label>
                <Input value={form.lessor_cr} onChange={(e) => setForm({ ...form, lessor_cr: e.target.value })} />
              </div>
              <div>
                <Label>رقم الهوية / السجل</Label>
                <Input value={form.lessor_id_number} onChange={(e) => setForm({ ...form, lessor_id_number: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">المستأجر والوحدة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>المستأجر *</Label>
                <div className="flex gap-2">
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="اختر المستأجر" /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setTenantAddOpen(true)} title="إضافة مستأجر جديد">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>المكتب *</Label>
                <Select value={form.office_id} onValueChange={(v) => setForm({ ...form, office_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المكتب" /></SelectTrigger>
                  <SelectContent>{offices.map(o => <SelectItem key={o.id} value={o.id}>{o.code} — {o.status}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">المدة والبيانات المالية</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>من تاريخ *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>إلى تاريخ *</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div>
                <Label>نسبة الزيادة السنوية (%)</Label>
                <Input type="number" step="0.01" value={form.annual_increase_pct} onChange={(e) => setForm({ ...form, annual_increase_pct: e.target.value })} />
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
            </div>
          </section>

          <section className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">شروط التجديد والإخلاء</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="flex items-center gap-2 pt-6">
                <input id="auto_renew" type="checkbox" className="h-4 w-4"
                  checked={form.auto_renew}
                  onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })} />
                <Label htmlFor="auto_renew" className="cursor-pointer">تجديد تلقائي</Label>
              </div>
              <div>
                <Label>مدة الإشعار قبل الإخلاء (أيام)</Label>
                <Input type="number" value={form.notice_period_days}
                  onChange={(e) => setForm({ ...form, notice_period_days: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">تنبيهات قبل انتهاء العقد</h3>
            <div className="flex flex-wrap gap-3">
              {ALERT_THRESHOLD_OPTIONS.map(d => (
                <label key={d} className="flex items-center gap-2 border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" className="h-4 w-4"
                    checked={form.alert_thresholds_days.includes(d)}
                    onChange={() => toggleThreshold(d)} />
                  <span className="text-sm">{d} يوم</span>
                </label>
              ))}
            </div>
          </section>

          <div>
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <section className="border-t pt-3 space-y-2">
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
              <p className="text-xs text-muted-foreground">يمكنك إرفاق نسخ العقد والهويات والتفويضات والشيكات والملاحق.</p>
            ) : (
              <div className="space-y-2">
                {pending.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded-md">
                    <span className="flex-1 text-sm truncate">{p.file.name}</span>
                    <Select value={p.type} onValueChange={(v) => setPending(arr => arr.map((x, idx) => idx === i ? { ...x, type: v as ContractAttachmentType } : x))}>
                      <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTRACT_ATTACHMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" type="button"
                      onClick={() => setPending(arr => arr.filter((_, idx) => idx !== i))}>إزالة</Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />}حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <CompanyFormDialog
      open={tenantAddOpen}
      company={null}
      onClose={() => setTenantAddOpen(false)}
      onSaved={async (newId) => {
        await reloadCompanies();
        if (newId) setForm((f) => ({ ...f, company_id: newId }));
        setTenantAddOpen(false);
      }}
    />
    </>
  );
}


