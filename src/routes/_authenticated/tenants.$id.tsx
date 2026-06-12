import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight, Loader2, Plus, Pencil, Trash2, Phone, MapPin, FileText, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  CLIENT_STATUSES, STATUS_STYLE, CompanyFormDialog,
  type ClientStatus, type Company,
} from "./tenants";

export const Route = createFileRoute("/_authenticated/tenants/$id")({
  component: ClientDetailsPage,
});

type InteractionType = "مكالمة" | "زيارة" | "ملاحظة";
const INTERACTION_TYPES: InteractionType[] = ["مكالمة","زيارة","ملاحظة"];

interface Contact {
  id: string; company_id: string; name: string;
  mobile: string | null; email: string | null; position: string | null; notes: string | null;
}
interface Interaction {
  id: string; company_id: string; interaction_type: InteractionType;
  interaction_date: string; details: string | null;
}
interface UnitView {
  id: string; company_id: string; office_id: string;
  view_date: string; notes: string | null;
}
interface OfficeMini {
  id: string; code: string; floor: number; status: string;
}

function ClientDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/tenants/$id" });
  const { hasRole } = useAuth();
  const canEdit = hasRole("super_admin") || hasRole("receptionist");

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
    if (error || !data) { toast.error("تعذّر التحميل"); setLoading(false); return; }
    setCompany(data as Company);
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (s: ClientStatus) => {
    if (!canEdit || !company || s === company.status) return;
    const { error } = await supabase.from("companies").update({ status: s }).eq("id", company.id);
    if (error) return toast.error("تعذّر تغيير الحالة");
    setCompany({ ...company, status: s });
    toast.success("تم تحديث الحالة");
  };

  if (loading) {
    return <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-muted-foreground" /></div>;
  }
  if (!company) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        لم يتم العثور على العميل.
        <div className="mt-4"><Link to="/tenants"><Button variant="outline">العودة للعملاء</Button></Link></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/tenants">
            <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4 ms-1" />العملاء</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">{company.company_name}</h1>
            <p className="text-sm text-muted-foreground">{company.activity ?? "—"}</p>
          </div>
          <Badge className={STATUS_STYLE[company.status]}>{company.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Select value={company.status} onValueChange={(v) => changeStatus(v as ClientStatus)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{CLIENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {canEdit && (
            <Button onClick={() => setEditOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Pencil className="h-4 w-4 ms-1" />تعديل
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic" dir="rtl">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          <TabsTrigger value="basic"><Building2 className="h-4 w-4 ms-1" />البيانات</TabsTrigger>
          <TabsTrigger value="contacts"><Phone className="h-4 w-4 ms-1" />المسؤولون</TabsTrigger>
          <TabsTrigger value="interactions"><MapPin className="h-4 w-4 ms-1" />التفاعلات</TabsTrigger>
          <TabsTrigger value="views"><Building2 className="h-4 w-4 ms-1" />الوحدات المُشاهدة</TabsTrigger>
          <TabsTrigger value="contracts"><FileText className="h-4 w-4 ms-1" />العقود</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <Card><CardContent className="pt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label="اسم الشركة" value={company.company_name} />
            <Info label="النشاط" value={company.activity ?? "—"} />
            <Info label="السجل التجاري" value={company.commercial_register ?? "—"} />
            <Info label="الرقم الضريبي" value={company.tax_number ?? "—"} />
            <Info label="الحالة" value={<Badge className={STATUS_STYLE[company.status]}>{company.status}</Badge>} />
            {company.notes && (<div className="col-span-full"><Info label="ملاحظات" value={company.notes} /></div>)}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <ContactsTab companyId={company.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="interactions" className="mt-4">
          <InteractionsTab companyId={company.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="views" className="mt-4">
          <UnitViewsTab companyId={company.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <Card><CardHeader><CardTitle>العقود</CardTitle></CardHeader>
            <CardContent className="py-10 text-center text-muted-foreground">
              سيتم عرض عقود هذا العميل هنا بعد تنفيذ موديول العقود.
            </CardContent></Card>
        </TabsContent>
      </Tabs>

      <CompanyFormDialog
        open={editOpen} company={company}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); load(); }}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

/* ===================== Contacts ===================== */
function ContactsTab({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [del, setDel] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("contact_persons").select("*").eq("company_id", companyId).order("created_at");
    setRows((data ?? []) as Contact[]);
    setLoading(false);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">المسؤولون</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => setCreating(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" />إضافة مسؤول
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
         rows.length === 0 ? <p className="text-center text-muted-foreground py-6">لا يوجد مسؤولون مسجّلون.</p> :
         <Table>
           <TableHeader><TableRow>
             <TableHead>الاسم</TableHead><TableHead>المنصب</TableHead>
             <TableHead>الجوال</TableHead><TableHead>البريد</TableHead>
             {canEdit && <TableHead className="text-end">إجراءات</TableHead>}
           </TableRow></TableHeader>
           <TableBody>
             {rows.map(c => (
               <TableRow key={c.id}>
                 <TableCell className="font-medium">{c.name}</TableCell>
                 <TableCell>{c.position ?? "—"}</TableCell>
                 <TableCell dir="ltr" className="text-start">{c.mobile ?? "—"}</TableCell>
                 <TableCell dir="ltr" className="text-start">{c.email ?? "—"}</TableCell>
                 {canEdit && (
                   <TableCell className="text-end">
                     <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                     <Button size="sm" variant="ghost" onClick={() => setDel(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                   </TableCell>
                 )}
               </TableRow>
             ))}
           </TableBody>
         </Table>
        }
      </CardContent>

      <ContactFormDialog
        open={creating || !!editing} contact={editing} companyId={companyId}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { setCreating(false); setEditing(null); load(); }}
      />
      <ConfirmDelete open={!!del} title="حذف المسؤول"
        message={`سيتم حذف "${del?.name}". هل أنت متأكد؟`}
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          const { error } = await supabase.from("contact_persons").delete().eq("id", del.id);
          if (error) return toast.error("تعذّر الحذف");
          toast.success("تم الحذف"); setDel(null); load();
        }}
      />
    </Card>
  );
}

function ContactFormDialog({ open, contact, companyId, onClose, onSaved }: {
  open: boolean; contact: Contact | null; companyId: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState({ name:"", mobile:"", email:"", position:"", notes:"" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setF(contact ? {
      name: contact.name, mobile: contact.mobile ?? "", email: contact.email ?? "",
      position: contact.position ?? "", notes: contact.notes ?? "",
    } : { name:"", mobile:"", email:"", position:"", notes:"" });
  }, [open, contact]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("الاسم مطلوب");
    setBusy(true);
    const payload = {
      company_id: companyId,
      name: f.name.trim(),
      mobile: f.mobile.trim() || null,
      email: f.email.trim() || null,
      position: f.position.trim() || null,
      notes: f.notes.trim() || null,
    };
    const { error } = contact
      ? await supabase.from("contact_persons").update(payload).eq("id", contact.id)
      : await supabase.from("contact_persons").insert(payload);
    setBusy(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ"); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>{contact ? "تعديل مسؤول" : "إضافة مسؤول"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>الاسم</Label>
              <Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>المنصب</Label>
              <Input value={f.position} onChange={e => setF({ ...f, position: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>الجوال</Label>
              <Input dir="ltr" value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>البريد الإلكتروني</Label>
              <Input dir="ltr" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label>
              <Textarea rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
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

/* ===================== Interactions ===================== */
function InteractionsTab({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const [rows, setRows] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<InteractionType>("مكالمة");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Interaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("client_interactions").select("*")
      .eq("company_id", companyId).order("interaction_date", { ascending: false });
    setRows((data ?? []) as Interaction[]);
    setLoading(false);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  const quickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("client_interactions").insert({
      company_id: companyId, interaction_type: type, details: details.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error("تعذّر التسجيل");
    toast.success("تم التسجيل");
    setDetails("");
    load();
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <Card><CardContent className="pt-6">
          <form onSubmit={quickAdd} className="flex flex-col sm:flex-row gap-2">
            <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{INTERACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="تفاصيل سريعة (اختياري)…" className="flex-1" />
            <Button type="submit" disabled={busy} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}<Plus className="h-4 w-4 ms-1" />تسجيل
            </Button>
          </form>
        </CardContent></Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">سجل التفاعلات</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
           rows.length === 0 ? <p className="text-center text-muted-foreground py-6">لا توجد تفاعلات.</p> :
           <div className="space-y-3">
             {rows.map(r => (
               <div key={r.id} className="border rounded-lg p-3 flex items-start gap-3">
                 <Badge variant="outline" className="shrink-0">{r.interaction_type}</Badge>
                 <div className="flex-1">
                   <div className="text-xs text-muted-foreground">{new Date(r.interaction_date).toLocaleString("ar-EG")}</div>
                   {r.details && <div className="text-sm mt-1">{r.details}</div>}
                 </div>
                 {canEdit && (
                   <Button size="sm" variant="ghost" onClick={() => setDel(r)}>
                     <Trash2 className="h-4 w-4 text-destructive" />
                   </Button>
                 )}
               </div>
             ))}
           </div>
          }
        </CardContent>
      </Card>

      <ConfirmDelete open={!!del} title="حذف التفاعل" message="هل أنت متأكد من حذف هذا التفاعل؟"
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          const { error } = await supabase.from("client_interactions").delete().eq("id", del.id);
          if (error) return toast.error("تعذّر الحذف");
          toast.success("تم الحذف"); setDel(null); load();
        }}
      />
    </div>
  );
}

/* ===================== Unit views ===================== */
function UnitViewsTab({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const [rows, setRows] = useState<(UnitView & { office: OfficeMini | null })[]>([]);
  const [offices, setOffices] = useState<OfficeMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<UnitView | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: vs }, { data: os }] = await Promise.all([
      supabase.from("client_unit_views").select("*, office:offices(id,code,floor,status)")
        .eq("company_id", companyId).order("view_date", { ascending: false }),
      supabase.from("offices").select("id,code,floor,status").order("floor").order("office_number"),
    ]);
    setRows((vs ?? []) as (UnitView & { office: OfficeMini | null })[]);
    setOffices((os ?? []) as OfficeMini[]);
    setLoading(false);
  }, [companyId]);
  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">الوحدات المُشاهدة</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => setCreating(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" />إضافة معاينة
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
         rows.length === 0 ? <p className="text-center text-muted-foreground py-6">لم يُسجَّل أي معاينة لهذا العميل.</p> :
         <Table>
           <TableHeader><TableRow>
             <TableHead>المكتب</TableHead><TableHead>الدور</TableHead>
             <TableHead>تاريخ المعاينة</TableHead><TableHead>ملاحظات</TableHead>
             {canEdit && <TableHead className="text-end">إجراءات</TableHead>}
           </TableRow></TableHeader>
           <TableBody>
             {rows.map(v => (
               <TableRow key={v.id}>
                 <TableCell className="font-semibold text-primary">
                   {v.office ? (
                     <Link to="/offices/$id" params={{ id: v.office_id }} className="hover:underline">
                       {v.office.code}
                     </Link>
                   ) : "—"}
                 </TableCell>
                 <TableCell>{v.office?.floor ?? "—"}</TableCell>
                 <TableCell>{v.view_date}</TableCell>
                 <TableCell className="text-xs text-muted-foreground">{v.notes ?? "—"}</TableCell>
                 {canEdit && (
                   <TableCell className="text-end">
                     <Button size="sm" variant="ghost" onClick={() => setDel(v)}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                   </TableCell>
                 )}
               </TableRow>
             ))}
           </TableBody>
         </Table>
        }
      </CardContent>

      <UnitViewFormDialog
        open={creating} offices={offices} companyId={companyId}
        onClose={() => setCreating(false)}
        onSaved={() => { setCreating(false); load(); }}
      />
      <ConfirmDelete open={!!del} title="حذف المعاينة" message="هل أنت متأكد من حذف هذه المعاينة؟"
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          const { error } = await supabase.from("client_unit_views").delete().eq("id", del.id);
          if (error) return toast.error("تعذّر الحذف");
          toast.success("تم الحذف"); setDel(null); load();
        }}
      />
    </Card>
  );
}

function UnitViewFormDialog({ open, offices, companyId, onClose, onSaved }: {
  open: boolean; offices: OfficeMini[]; companyId: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [officeId, setOfficeId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) { setOfficeId(""); setDate(new Date().toISOString().slice(0, 10)); setNotes(""); }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeId) return toast.error("اختر مكتبًا");
    setBusy(true);
    const { error } = await supabase.from("client_unit_views").insert({
      company_id: companyId, office_id: officeId, view_date: date, notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ"); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <form onSubmit={submit}>
          <DialogHeader><DialogTitle>تسجيل معاينة مكتب</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>المكتب</Label>
              <Select value={officeId} onValueChange={setOfficeId}>
                <SelectTrigger><SelectValue placeholder="اختر مكتبًا…" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {offices.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.code} — الدور {o.floor} ({o.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select></div>
            <div className="space-y-1.5"><Label>تاريخ المعاينة</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>ملاحظات</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
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

/* ===================== Confirm ===================== */
function ConfirmDelete({ open, title, message, onCancel, onConfirm }: {
  open: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>حذف</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
