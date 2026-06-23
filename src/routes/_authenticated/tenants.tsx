import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tenants")({
  component: ClientsPage,
});

export type ClientStatus =
  | "استفسار" | "مهتم" | "معاينة" | "تفاوض" | "حجز" | "تعاقد" | "غير مهتم";
export const CLIENT_STATUSES: ClientStatus[] = [
  "استفسار","مهتم","معاينة","تفاوض","حجز","تعاقد","غير مهتم",
];
export const STATUS_STYLE: Record<ClientStatus, string> = {
  "استفسار": "bg-muted text-foreground",
  "مهتم": "bg-primary/15 text-primary",
  "معاينة": "bg-warning/20 text-[oklch(0.45_0.13_75)]",
  "تفاوض": "bg-warning text-warning-foreground",
  "حجز": "bg-gold/30 text-[oklch(0.4_0.12_85)]",
  "تعاقد": "bg-success text-success-foreground",
  "غير مهتم": "bg-muted-foreground/40 text-background",
};

export interface Company {
  id: string;
  company_name: string;
  activity: string | null;
  commercial_register: string | null;
  tax_number: string | null;
  status: ClientStatus;
  notes: string | null;
  delegate_name?: string | null;
  phone?: string | null;
}

const ATTACHMENT_TYPES = ["السجل التجاري","الهوية","الرقم الضريبي","عقد","أخرى"];
type PendingFile = { file: File; type: string };

function ClientsPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasRole } = useAuth();
  const canEdit = hasRole("super_admin") || hasRole("receptionist");
  const navigate = useNavigate();

  const [rows, setRows] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await scoped(supabase
      .from("companies").select("*"), activePropertyId).order("created_at", { ascending: false });
    if (error) { toast.error("تعذّر التحميل"); setLoading(false); return; }
    setRows((data ?? []) as Company[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const m: Record<ClientStatus, number> = {
      "استفسار":0,"مهتم":0,"معاينة":0,"تفاوض":0,"حجز":0,"تعاقد":0,"غير مهتم":0,
    };
    rows.forEach(r => { m[r.status] = (m[r.status] ?? 0) + 1; });
    return m;
  }, [rows]);

  const filtered = useMemo(() => {
    let rs = rows.slice();
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rs = rs.filter(r =>
        r.company_name.toLowerCase().includes(s) ||
        (r.commercial_register ?? "").toLowerCase().includes(s) ||
        (r.activity ?? "").toLowerCase().includes(s));
    }
    if (statusFilter !== "all") rs = rs.filter(r => r.status === statusFilter);
    return rs;
  }, [rows, q, statusFilter]);

  const remove = async (c: Company) => {
    const { error } = await supabase.from("companies").delete().eq("id", c.id);
    if (error) return toast.error("تعذّر الحذف");
    toast.success("تم الحذف");
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">العملاء</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة العملاء عبر مراحل الـ Pipeline.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreating(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" /> إضافة عميل
          </Button>
        )}
      </div>

      {/* Pipeline */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CLIENT_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`p-3 rounded-lg border text-center transition ${
                  statusFilter === s ? "border-primary ring-2 ring-primary/30" : "hover:bg-accent"
                }`}
              >
                <div className="text-2xl font-bold text-primary">{counts[s] ?? 0}</div>
                <div className={`mt-1 inline-block text-[11px] px-1.5 py-0.5 rounded ${STATUS_STYLE[s]}`}>{s}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="p-3 border-b flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute top-1/2 -translate-y-1/2 start-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم أو السجل التجاري أو النشاط…"
              className="ps-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {CLIENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin inline text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الشركة</TableHead>
                <TableHead>النشاط</TableHead>
                <TableHead>السجل التجاري</TableHead>
                <TableHead>الرقم الضريبي</TableHead>
                <TableHead>الحالة</TableHead>
                {canEdit && <TableHead className="text-end">إجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    لا يوجد عملاء مطابقون
                  </TableCell>
                </TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer"
                  onClick={() => navigate({ to: "/tenants/$id", params: { id: c.id } })}>
                  <TableCell className="font-semibold text-primary">{c.company_name}</TableCell>
                  <TableCell>{c.activity ?? "—"}</TableCell>
                  <TableCell>{c.commercial_register ?? "—"}</TableCell>
                  <TableCell>{c.tax_number ?? "—"}</TableCell>
                  <TableCell><Badge className={STATUS_STYLE[c.status]}>{c.status}</Badge></TableCell>
                  {canEdit && (
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CompanyFormDialog
        open={creating || !!editing}
        company={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { setCreating(false); setEditing(null); load(); }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف العميل <span className="font-semibold">{deleting?.company_name}</span> وكل بياناته المرتبطة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && remove(deleting)}
            >حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CompanyFormDialog({ open, company, onClose, onSaved }: {
  open: boolean; company: Company | null; onClose: () => void; onSaved: (id?: string) => void;
}) {
  const [f, setF] = useState({
    company_name: "", activity: "", commercial_register: "", tax_number: "",
    status: "استفسار" as ClientStatus, notes: "",
    delegate_name: "", phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [fileType, setFileType] = useState<string>("السجل التجاري");

  useEffect(() => {
    if (open) {
      setPending([]);
      setF(company ? {
        company_name: company.company_name,
        activity: company.activity ?? "",
        commercial_register: company.commercial_register ?? "",
        tax_number: company.tax_number ?? "",
        status: company.status,
        notes: company.notes ?? "",
        delegate_name: company.delegate_name ?? "",
        phone: company.phone ?? "",
      } : { company_name:"", activity:"", commercial_register:"", tax_number:"", status:"استفسار", notes:"", delegate_name:"", phone:"" });
    }
  }, [open, company]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setPending((p) => [...p, ...Array.from(files).map((file) => ({ file, type: fileType }))]);
  };

  const uploadAttachments = async (companyId: string) => {
    if (pending.length === 0) return;
    const { data: u } = await supabase.auth.getUser();
    for (const it of pending) {
      const path = `${companyId}/${Date.now()}_${it.file.name}`;
      const up = await supabase.storage.from("companies").upload(path, it.file, { upsert: false });
      if (up.error) { toast.error("فشل رفع " + it.file.name); continue; }
      await supabase.from("company_attachments").insert({
        company_id: companyId, attachment_type: it.type, file_name: it.file.name,
        storage_path: path, mime_type: it.file.type, size_bytes: it.file.size,
        created_by: u.user?.id,
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.company_name.trim()) return toast.error("اسم الشركة مطلوب");
    setBusy(true);
    const payload = {
      company_name: f.company_name.trim(),
      activity: f.activity.trim() || null,
      commercial_register: f.commercial_register.trim() || null,
      tax_number: f.tax_number.trim() || null,
      status: f.status,
      notes: f.notes.trim() || null,
      delegate_name: f.delegate_name.trim() || null,
      phone: f.phone.trim() || null,
    };
    let companyId = company?.id;
    if (company) {
      const { error } = await supabase.from("companies").update(payload).eq("id", company.id);
      if (error) { setBusy(false); return toast.error("تعذّر الحفظ"); }
    } else {
      const { data, error } = await supabase.from("companies").insert(payload).select("id").single();
      if (error || !data) { setBusy(false); return toast.error("تعذّر الحفظ"); }
      companyId = data.id;
    }
    if (companyId) await uploadAttachments(companyId);
    setBusy(false);
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{company ? "تعديل عميل" : "إضافة عميل جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[70vh] overflow-y-auto">
            <div className="col-span-2 space-y-1.5"><Label>اسم الشركة *</Label>
              <Input value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>اسم المفوض</Label>
              <Input value={f.delegate_name} onChange={(e) => setF({ ...f, delegate_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>رقم الجوال</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>النشاط</Label>
              <Input value={f.activity} onChange={(e) => setF({ ...f, activity: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>الحالة</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as ClientStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CLIENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-1.5"><Label>السجل التجاري</Label>
              <Input value={f.commercial_register} onChange={(e) => setF({ ...f, commercial_register: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>الرقم الضريبي</Label>
              <Input value={f.tax_number} onChange={(e) => setF({ ...f, tax_number: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label>
              <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>

            <div className="col-span-2 space-y-2 border-t pt-3">
              <Label>مرفقات</Label>
              <div className="flex items-center gap-2">
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{ATTACHMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="file" multiple onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
              </div>
              {pending.length > 0 && (
                <ul className="text-xs space-y-1 mt-2">
                  {pending.map((p, i) => (
                    <li key={i} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1">
                      <span>{p.file.name} <Badge variant="outline" className="ms-1">{p.type}</Badge></span>
                      <button type="button" className="text-destructive" onClick={() => setPending(pending.filter((_, j) => j !== i))}>
                        إزالة
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-muted-foreground">ستُرفع المرفقات بعد حفظ بيانات العميل.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={busy} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
