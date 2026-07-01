import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { DeleteArchiveMenu } from "@/components/delete-archive-menu";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight, Loader2, RotateCw, Ban, Upload, Download, Trash2, FileText, Receipt, Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DocumentsTab } from "@/components/documents-tab";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CONTRACT_STATUS_STYLE, type ContractStatus, ContractFormDialog } from "./contracts.index";
import { DelegatesCard, LinkedOfficesCard, LinkedParkingCard } from "@/components/contract-relations";
import { TaxFeesCard, DepositCard, PaymentScheduleCard } from "@/components/contract-financials";

export const Route = createFileRoute("/_authenticated/contracts/$id")({
  component: ContractDetailsPage,
});

type AttachmentType = "نسخة العقد" | "الهوية" | "السجل التجاري" | "سند دفع";
const ATTACHMENT_TYPES: AttachmentType[] = ["نسخة العقد", "الهوية", "السجل التجاري", "سند دفع"];

interface Contract {
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
  companies?: { id: string; company_name: string } | null;
  offices?: { id: string; code: string } | null;
}

interface Attachment {
  id: string;
  contract_id: string;
  attachment_type: AttachmentType;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
}

function ContractDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/contracts/$id" });
  const { hasRole } = useAuth();
  const isAdmin = hasRole("super_admin");
  const canUpload = isAdmin || hasRole("accountant");

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewOpen, setRenewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateInvoices = async () => {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-rent-invoices", {
      body: { contract_id: id },
    });
    setGenerating(false);
    if (error) { toast.error("فشل التوليد: " + error.message); return; }
    const n = (data as { generated?: number; message?: string } | null)?.generated ?? 0;
    if (n > 0) toast.success(`تم توليد ${n} فاتورة`);
    else toast.info((data as { message?: string } | null)?.message ?? "لا توجد فواتير جديدة");
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select("*, companies(id, company_name), offices(id, code)")
      .eq("id", id).maybeSingle();
    if (error) toast.error(error.message);
    setContract(data as Contract | null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const cancelContract = async () => {
    const { error } = await supabase.from("contracts").update({ status: "ملغي" }).eq("id", id);
    if (error) { toast.error("فشل الإلغاء: " + error.message); return; }
    toast.success("تم إلغاء العقد");
    setCancelOpen(false);
    load();
  };

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!contract) {
    return <div className="py-20 text-center text-muted-foreground">العقد غير موجود</div>;
  }

  const canManage = isAdmin && (contract.status === "ساري");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/contracts">
            <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4 ms-1" />العقود</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-6 w-6" /> {contract.contract_number}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contract.companies?.company_name} — مكتب {contract.offices?.code}
            </p>
          </div>
          <Badge className={CONTRACT_STATUS_STYLE[contract.status]}>{contract.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || hasRole("accountant")) && (
            <Button variant="outline" onClick={generateInvoices} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 ms-1 animate-spin" /> : <Receipt className="h-4 w-4 ms-1" />}
              توليد الفواتير
            </Button>
          )}
          {(isAdmin || hasRole("accountant")) && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 ms-1" /> تعديل
            </Button>
          )}
          {canManage && (
            <Button onClick={() => setRenewOpen(true)} className="bg-primary text-primary-foreground">
              <RotateCw className="h-4 w-4 ms-1" /> تجديد
            </Button>
          )}
          {canManage && (
            <Button variant="destructive" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4 ms-1" /> إلغاء
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>بيانات العقد</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Info label="المستأجر" value={
            <Link to="/tenants/$id" params={{ id: contract.company_id }} className="text-primary hover:underline">
              {contract.companies?.company_name}
            </Link>
          } />
          <Info label="المكتب" value={
            <Link to="/offices/$id" params={{ id: contract.office_id }} className="text-primary hover:underline">
              {contract.offices?.code}
            </Link>
          } />
          <Info label="الحالة" value={<Badge className={CONTRACT_STATUS_STYLE[contract.status]}>{contract.status}</Badge>} />
          <Info label="من" value={contract.start_date} />
          <Info label="إلى" value={contract.end_date} />
          <Info label="الإيجار" value={Number(contract.rent_amount).toLocaleString("en-US") + " ر.س"} />
          <Info label="التأمين" value={Number(contract.deposit_amount).toLocaleString("en-US") + " ر.س"} />
          <Info label="رسوم الخدمات" value={Number(contract.service_fees).toLocaleString("en-US") + " ر.س"} />
          {contract.renewed_from_id && (
            <Info label="مُجدد من" value={
              <Link to="/contracts/$id" params={{ id: contract.renewed_from_id }} className="text-primary hover:underline">
                عرض العقد السابق
              </Link>
            } />
          )}
          {contract.notes && <div className="col-span-full"><Info label="ملاحظات" value={contract.notes} /></div>}
        </CardContent>
      </Card>

      <DelegatesCard contractId={contract.id} canManage={canUpload} />
      <LinkedOfficesCard contractId={contract.id} canManage={canUpload} />
      <LinkedParkingCard contractId={contract.id} canManage={canUpload} />
      <TaxFeesCard contractId={contract.id} canManage={canUpload} />
      <DepositCard contractId={contract.id} canManage={canUpload} />
      <PaymentScheduleCard contractId={contract.id} canManage={canUpload} />
      <AttachmentsCard contractId={contract.id} canUpload={canUpload} canDelete={isAdmin} />

      <Card>
        <CardHeader><CardTitle>مستندات العقد</CardTitle></CardHeader>
        <CardContent>
          <DocumentsTab entityType="contract" entityId={contract.id} />
        </CardContent>
      </Card>

      <RenewDialog
        open={renewOpen} onClose={() => setRenewOpen(false)}
        contract={contract} onDone={() => { setRenewOpen(false); load(); }}
      />

      <ContractFormDialog
        open={editOpen} onClose={() => setEditOpen(false)}
        contractId={contract.id}
        onSaved={() => { setEditOpen(false); load(); }}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إلغاء العقد</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إلغاء العقد {contract.contract_number} وإعادة المكتب إلى حالة "متاح". هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={cancelContract} className="bg-destructive text-destructive-foreground">
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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

function RenewDialog({
  open, onClose, contract, onDone,
}: { open: boolean; onClose: () => void; contract: Contract; onDone: () => void; }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    start_date: contract.end_date,
    end_date: "",
    rent_amount: String(contract.rent_amount),
  });
  useEffect(() => {
    if (open) setForm({ start_date: contract.end_date, end_date: "", rent_amount: String(contract.rent_amount) });
  }, [open, contract]);

  const submit = async () => {
    if (!form.start_date || !form.end_date) { toast.error("الرجاء إدخال التواريخ"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("renew_contract", {
      _contract_id: contract.id,
      _new_start: form.start_date,
      _new_end: form.end_date,
      _new_rent: Number(form.rent_amount) || undefined,
    });
    setSaving(false);
    if (error) { toast.error("فشل التجديد: " + error.message); return; }
    toast.success("تم تجديد العقد");
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>تجديد العقد {contract.contract_number}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>تاريخ بداية العقد الجديد *</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <Label>تاريخ نهاية العقد الجديد *</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div>
            <Label>الإيجار الجديد</Label>
            <Input type="number" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">
            سيتم إغلاق هذا العقد كـ"مجدد" وإنشاء عقد جديد ساري بنفس البيانات.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />} تأكيد التجديد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentsCard({
  contractId, canUpload, canDelete,
}: { contractId: string; canUpload: boolean; canDelete: boolean }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<AttachmentType>("نسخة العقد");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contract_attachments")
      .select("*").eq("contract_id", contractId).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Attachment[]) ?? []);
    setLoading(false);
  }, [contractId]);
  useEffect(() => { load(); }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    for (const f of Array.from(files)) {
      const path = `${contractId}/${Date.now()}_${f.name}`;
      const up = await supabase.storage.from("contracts").upload(path, f, { upsert: false });
      if (up.error) { toast.error("فشل رفع " + f.name + ": " + up.error.message); continue; }
      const { error } = await supabase.from("contract_attachments").insert({
        contract_id: contractId, attachment_type: type, file_name: f.name,
        storage_path: path, mime_type: f.type, size_bytes: f.size, created_by: u.user?.id,
      });
      if (error) toast.error(error.message);
    }
    setUploading(false);
    toast.success("تم رفع الملفات");
    load();
  };

  const download = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from("contracts").createSignedUrl(a.storage_path, 300);
    if (error || !data) { toast.error("فشل تحميل الملف"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (a: Attachment) => {
    await supabase.storage.from("contracts").remove([a.storage_path]);
    const { error } = await supabase.from("contract_attachments").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>المرفقات</CardTitle>
        {canUpload && (
          <div className="flex items-center gap-2">
            <Select value={type} onValueChange={(v) => setType(v as AttachmentType)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{ATTACHMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <label className="cursor-pointer">
              <Input type="file" multiple className="hidden" disabled={uploading}
                onChange={(e) => { onFiles(e.target.files); e.currentTarget.value = ""; }} />
              <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
                <span><Upload className="h-4 w-4 ms-1" /> رفع</span>
              </Button>
            </label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">لا توجد مرفقات</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الملف</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحجم</TableHead>
                <TableHead className="w-32">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.file_name}</TableCell>
                  <TableCell><Badge variant="outline">{a.attachment_type}</Badge></TableCell>
                  <TableCell>{a.size_bytes ? `${(a.size_bytes / 1024).toFixed(1)} KB` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => download(a)}><Download className="h-4 w-4" /></Button>
                      {canDelete && (
                        <Button size="icon" variant="ghost" onClick={() => remove(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
