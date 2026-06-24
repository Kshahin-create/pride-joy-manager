import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  Gauge,
  Snowflake,
  Network,
  FolderOpen,
  History,
  Info as InfoIcon,
  Building2,
  Phone,
  Mail,
  Calendar,
  Wallet,
  Wrench,
  Car,
  Receipt,
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { X, UploadCloud } from "lucide-react";
import { DOC_UPLOAD_CATEGORIES, type DocCategory } from "@/components/documents-tab";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Timeline, useBuildingLog } from "@/components/building-log-timeline";
import { OfficeAssetsTab } from "@/components/office-assets-tab";

export const Route = createFileRoute("/_authenticated/offices/$id")({
  component: OfficeDetailsPage,
});

type OfficeStatus = "متاح" | "محجوز" | "مؤجر" | "تحت الصيانة" | "غير متاح";
const STATUSES: OfficeStatus[] = ["متاح", "محجوز", "مؤجر", "تحت الصيانة", "غير متاح"];

interface Office {
  id: string;
  code: string;
  office_number: string;
  floor: number;
  area_sqm: number | null;
  parking_count: number;
  view_type: string | null;
  status: OfficeStatus;
  management_entity: string | null;
  notes: string | null;
}

interface Meter {
  id: string;
  office_id: string;
  meter_number: string;
  utility_account_number: string | null;
  meter_status: string;
  is_independent: boolean;
  notes: string | null;
}
interface Reading {
  id: string;
  meter_id: string;
  reading_value: number;
  reading_date: string;
  notes: string | null;
}
interface AcUnit {
  id: string;
  office_id: string;
  unit_number: string;
  ac_type: string | null;
  manufacturer: string | null;
  capacity: string | null;
  install_date: string | null;
  warranty_end_date: string | null;
  maintenance_company: string | null;
  current_status: string;
  notes: string | null;
}
interface AcLog {
  id: string;
  ac_unit_id: string;
  maintenance_date: string;
  next_maintenance_date: string | null;
  technician: string | null;
  notes: string | null;
}
interface NetPoint {
  id: string;
  office_id: string;
  network_point: string | null;
  phone_point: string | null;
  service_provider: string | null;
  notes: string | null;
}
interface OfficeFile {
  id: string;
  office_id: string;
  file_type: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const STATUS_BADGE: Record<OfficeStatus, string> = {
  "متاح": "bg-success text-success-foreground",
  "محجوز": "bg-warning text-warning-foreground",
  "مؤجر": "bg-info text-info-foreground",
  "تحت الصيانة": "bg-destructive/80 text-destructive-foreground",
  "غير متاح": "bg-muted-foreground/70 text-background",
};

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function OfficeDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/offices/$id" });
  const { hasRole } = useAuth();
  const isAdmin = hasRole("super_admin");
  const isMaint = hasRole("maintenance_supervisor");
  const canEditUtility = isAdmin || isMaint;

  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("offices").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      toast.error("تعذّر تحميل المكتب");
      setLoading(false);
      return;
    }
    setOffice(data as Office);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (status: OfficeStatus) => {
    if (!isAdmin || !office || status === office.status) return;
    const { error } = await supabase.from("offices").update({ status }).eq("id", office.id);
    if (error) return toast.error("تعذّر تغيير الحالة");
    setOffice({ ...office, status });
    toast.success("تم تحديث الحالة");
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin inline text-muted-foreground" />
      </div>
    );
  }
  if (!office) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        لم يتم العثور على المكتب.
        <div className="mt-4">
          <Link to="/offices"><Button variant="outline">العودة للمكاتب</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/offices">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 ms-1" />
              المكاتب
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">المكتب {office.code}</h1>
            <p className="text-sm text-muted-foreground">الدور {office.floor} — رقم {office.office_number}</p>
          </div>
          <Badge className={STATUS_BADGE[office.status]}>{office.status}</Badge>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Select value={office.status} onValueChange={(v) => changeStatus(v as OfficeStatus)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setEditOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Pencil className="h-4 w-4 ms-1" /> تعديل
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="basic" dir="rtl">
        <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1">
          <TabsTrigger value="basic"><InfoIcon className="h-4 w-4 ms-1" />البيانات</TabsTrigger>
          <TabsTrigger value="tenant"><Building2 className="h-4 w-4 ms-1" />المستأجر</TabsTrigger>
          <TabsTrigger value="finance"><Receipt className="h-4 w-4 ms-1" />الفواتير والمدفوعات</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 ms-1" />الصيانة</TabsTrigger>
          <TabsTrigger value="assets"><Gauge className="h-4 w-4 ms-1" />الأصول</TabsTrigger>
          <TabsTrigger value="files"><FolderOpen className="h-4 w-4 ms-1" />الملفات</TabsTrigger>
          <TabsTrigger value="tickets"><History className="h-4 w-4 ms-1" />التذاكر</TabsTrigger>
          <TabsTrigger value="log"><History className="h-4 w-4 ms-1" />السجل</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <BasicTab office={office} />
        </TabsContent>
        <TabsContent value="tenant" className="mt-4">
          <TenantTab officeId={office.id} />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <FinanceTab officeId={office.id} />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceTab officeId={office.id} />
        </TabsContent>
        <TabsContent value="assets" className="mt-4">
          <OfficeAssetsTab officeId={office.id} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FilesTab officeId={office.id} canEdit={isAdmin} />
        </TabsContent>
        <TabsContent value="log" className="mt-4">
          <OfficeBuildingLogTab officeId={office.id} />
        </TabsContent>
        <TabsContent value="tickets" className="mt-4">
          <OfficeTicketsTab officeId={office.id} />
        </TabsContent>
      </Tabs>

      <OfficeEditDialog
        open={editOpen}
        office={office}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); load(); }}
      />
    </div>
  );
}

/* ===================== Basic ===================== */
function BasicTab({ office }: { office: Office }) {
  return (
    <Card>
      <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <Info label="الكود" value={office.code} />
        <Info label="رقم المكتب" value={office.office_number} />
        <Info label="الدور" value={office.floor} />
        <Info label="المساحة" value={office.area_sqm ? `${office.area_sqm} م²` : "—"} />
        <Info label="عدد المواقف" value={office.parking_count} />
        <Info label="نوع الإطلالة" value={office.view_type ?? "—"} />
        <Info label="الجهة المشرفة" value={office.management_entity ?? "—"} />
        <Info label="الحالة" value={<Badge className={STATUS_BADGE[office.status]}>{office.status}</Badge>} />
        {office.notes && (
          <div className="col-span-full">
            <Info label="ملاحظات" value={office.notes} />
          </div>
        )}
      </CardContent>
    </Card>
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

/* ===================== Electricity ===================== */
function ElectricityTab({ officeId, canEdit }: { officeId: string; canEdit: boolean }) {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [readings, setReadings] = useState<Record<string, Reading[]>>({});
  const [loading, setLoading] = useState(true);
  const [meterForm, setMeterForm] = useState<Meter | null>(null);
  const [createMeter, setCreateMeter] = useState(false);
  const [delMeter, setDelMeter] = useState<Meter | null>(null);
  const [readingFor, setReadingFor] = useState<Meter | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: ms } = await supabase.from("electricity_meters").select("*").eq("office_id", officeId).order("created_at");
    const list = (ms ?? []) as Meter[];
    setMeters(list);
    if (list.length) {
      const { data: rs } = await supabase.from("electricity_readings")
        .select("*").in("meter_id", list.map(m => m.id))
        .order("reading_date", { ascending: false });
      const map: Record<string, Reading[]> = {};
      ((rs ?? []) as Reading[]).forEach(r => {
        (map[r.meter_id] ||= []).push(r);
      });
      setReadings(map);
    } else setReadings({});
    setLoading(false);
  }, [officeId]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">عدّادات الكهرباء</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateMeter(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" /> إضافة عدّاد
          </Button>
        )}
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : meters.length === 0 ? (
        <Card className="py-10 text-center text-muted-foreground">لا توجد عدّادات مسجّلة.</Card>
      ) : meters.map((m) => {
        const rs = readings[m.id] ?? [];
        const last = rs[0];
        return (
          <Card key={m.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base">عدّاد رقم {m.meter_number}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <Badge variant="outline">{m.is_independent ? "مستقل" : "مشترك"}</Badge>
                    <Badge variant="outline">{m.meter_status}</Badge>
                    {m.utility_account_number && <Badge variant="outline">حساب: {m.utility_account_number}</Badge>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setReadingFor(m)}>
                      <Plus className="h-4 w-4 ms-1" /> قراءة جديدة
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMeterForm(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDelMeter(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {last ? (
                <div className="mb-3 p-3 rounded-md bg-muted/40 text-sm">
                  <span className="text-muted-foreground">آخر قراءة: </span>
                  <span className="font-bold text-primary">{Number(last.reading_value).toLocaleString("en-US")}</span>
                  <span className="text-muted-foreground"> — بتاريخ </span>
                  <span className="font-medium">{last.reading_date}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">لا توجد قراءات بعد.</p>
              )}
              {rs.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.reading_date}</TableCell>
                        <TableCell className="font-medium">{Number(r.reading_value).toLocaleString("en-US")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      <MeterFormDialog
        open={createMeter || !!meterForm}
        meter={meterForm}
        officeId={officeId}
        onClose={() => { setCreateMeter(false); setMeterForm(null); }}
        onSaved={() => { setCreateMeter(false); setMeterForm(null); load(); }}
      />
      <ReadingFormDialog
        meter={readingFor}
        onClose={() => setReadingFor(null)}
        onSaved={() => { setReadingFor(null); load(); }}
      />
      <ConfirmDelete
        open={!!delMeter}
        title="حذف العدّاد"
        message={`سيتم حذف العدّاد ${delMeter?.meter_number} وجميع قراءاته. هل أنت متأكد؟`}
        onCancel={() => setDelMeter(null)}
        onConfirm={async () => {
          if (!delMeter) return;
          const { error } = await supabase.from("electricity_meters").delete().eq("id", delMeter.id);
          if (error) return toast.error("تعذّر الحذف");
          toast.success("تم الحذف");
          setDelMeter(null);
          load();
        }}
      />
    </div>
  );
}

function MeterFormDialog({ open, meter, officeId, onClose, onSaved }: {
  open: boolean; meter: Meter | null; officeId: string; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    meter_number: "", utility_account_number: "", meter_status: "يعمل",
    is_independent: true, notes: "",
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(meter ? {
        meter_number: meter.meter_number,
        utility_account_number: meter.utility_account_number ?? "",
        meter_status: meter.meter_status,
        is_independent: meter.is_independent,
        notes: meter.notes ?? "",
      } : { meter_number: "", utility_account_number: "", meter_status: "يعمل", is_independent: true, notes: "" });
    }
  }, [open, meter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meter_number.trim()) return toast.error("رقم العدّاد مطلوب");
    setBusy(true);
    const payload = {
      office_id: officeId,
      meter_number: form.meter_number.trim(),
      utility_account_number: form.utility_account_number.trim() || null,
      meter_status: form.meter_status,
      is_independent: form.is_independent,
      notes: form.notes.trim() || null,
    };
    const { error } = meter
      ? await supabase.from("electricity_meters").update(payload).eq("id", meter.id)
      : await supabase.from("electricity_meters").insert(payload);
    setBusy(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{meter ? "تعديل العدّاد" : "إضافة عدّاد كهرباء"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label>رقم العدّاد</Label>
              <Input value={form.meter_number} onChange={(e) => setForm({ ...form, meter_number: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>رقم حساب الكهرباء</Label>
              <Input value={form.utility_account_number} onChange={(e) => setForm({ ...form, utility_account_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الحالة</Label>
              <Select value={form.meter_status} onValueChange={(v) => setForm({ ...form, meter_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["يعمل", "معطّل", "تحت الصيانة", "غير مفعّل"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <Select value={form.is_independent ? "ind" : "shared"} onValueChange={(v) => setForm({ ...form, is_independent: v === "ind" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ind">مستقل</SelectItem>
                  <SelectItem value="shared">مشترك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

function ReadingFormDialog({ meter, onClose, onSaved }: {
  meter: Meter | null; onClose: () => void; onSaved: () => void;
}) {
  const [val, setVal] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (meter) { setVal(""); setDate(new Date().toISOString().slice(0, 10)); setNotes(""); }
  }, [meter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meter) return;
    const n = Number(val);
    if (!val || isNaN(n) || n < 0) return toast.error("أدخل قيمة قراءة صحيحة");
    setBusy(true);
    const { error } = await supabase.from("electricity_readings").insert({
      meter_id: meter.id, reading_value: n, reading_date: date, notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error("تعذّر التسجيل");
    toast.success("تم تسجيل القراءة");
    onSaved();
  };

  return (
    <Dialog open={!!meter} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>تسجيل قراءة جديدة</DialogTitle>
            <DialogDescription>عدّاد {meter?.meter_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>قيمة القراءة</Label>
              <Input type="number" step="0.01" value={val} onChange={(e) => setVal(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ القراءة</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={busy} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}تسجيل
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== AC ===================== */
function AcTab({ officeId, canEdit }: { officeId: string; canEdit: boolean }) {
  const [units, setUnits] = useState<AcUnit[]>([]);
  const [logs, setLogs] = useState<Record<string, AcLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [unitForm, setUnitForm] = useState<AcUnit | null>(null);
  const [createUnit, setCreateUnit] = useState(false);
  const [delUnit, setDelUnit] = useState<AcUnit | null>(null);
  const [logFor, setLogFor] = useState<AcUnit | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: us } = await supabase.from("ac_units").select("*").eq("office_id", officeId).order("created_at");
    const list = (us ?? []) as AcUnit[];
    setUnits(list);
    if (list.length) {
      const { data: ls } = await supabase.from("ac_maintenance_logs")
        .select("*").in("ac_unit_id", list.map(u => u.id))
        .order("maintenance_date", { ascending: false });
      const map: Record<string, AcLog[]> = {};
      ((ls ?? []) as AcLog[]).forEach(l => (map[l.ac_unit_id] ||= []).push(l));
      setLogs(map);
    } else setLogs({});
    setLoading(false);
  }, [officeId]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">وحدات التكييف</h2>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateUnit(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" /> إضافة وحدة
          </Button>
        )}
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : units.length === 0 ? (
        <Card className="py-10 text-center text-muted-foreground">لا توجد وحدات تكييف مسجّلة.</Card>
      ) : units.map((u) => {
        const ls = logs[u.id] ?? [];
        const lastLog = ls[0];
        const nextDays = daysUntil(lastLog?.next_maintenance_date ?? null);
        const warrantyDays = daysUntil(u.warranty_end_date);
        const alerts: string[] = [];
        if (nextDays !== null && nextDays <= 30) {
          alerts.push(nextDays < 0
            ? `الصيانة القادمة متأخّرة بـ ${Math.abs(nextDays)} يوم`
            : `الصيانة القادمة خلال ${nextDays} يوم`);
        }
        if (warrantyDays !== null && warrantyDays <= 30) {
          alerts.push(warrantyDays < 0
            ? `الضمان انتهى منذ ${Math.abs(warrantyDays)} يوم`
            : `الضمان ينتهي خلال ${warrantyDays} يوم`);
        }

        return (
          <Card key={u.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base">وحدة {u.unit_number}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {u.ac_type && <Badge variant="outline">{u.ac_type}</Badge>}
                    {u.manufacturer && <Badge variant="outline">{u.manufacturer}</Badge>}
                    {u.capacity && <Badge variant="outline">{u.capacity}</Badge>}
                    <Badge variant="outline">{u.current_status}</Badge>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setLogFor(u)}>
                      <Plus className="h-4 w-4 ms-1" /> سجل صيانة
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setUnitForm(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDelUnit(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length > 0 && (
                <Alert className="border-warning/50 bg-warning/10 text-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertTitle>تنبيه</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc ps-5 mt-1">
                      {alerts.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Info label="تاريخ التركيب" value={u.install_date ?? "—"} />
                <Info label="انتهاء الضمان" value={u.warranty_end_date ?? "—"} />
                <Info label="شركة الصيانة" value={u.maintenance_company ?? "—"} />
                <Info label="الصيانة القادمة" value={lastLog?.next_maintenance_date ?? "—"} />
              </div>
              {ls.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاريخ الصيانة</TableHead>
                      <TableHead>الفنّي</TableHead>
                      <TableHead>الصيانة القادمة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ls.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.maintenance_date}</TableCell>
                        <TableCell>{l.technician ?? "—"}</TableCell>
                        <TableCell>{l.next_maintenance_date ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      <AcUnitFormDialog
        open={createUnit || !!unitForm}
        unit={unitForm}
        officeId={officeId}
        onClose={() => { setCreateUnit(false); setUnitForm(null); }}
        onSaved={() => { setCreateUnit(false); setUnitForm(null); load(); }}
      />
      <AcLogFormDialog
        unit={logFor}
        onClose={() => setLogFor(null)}
        onSaved={() => { setLogFor(null); load(); }}
      />
      <ConfirmDelete
        open={!!delUnit}
        title="حذف وحدة التكييف"
        message={`سيتم حذف وحدة ${delUnit?.unit_number} وسجلات صيانتها. هل أنت متأكد؟`}
        onCancel={() => setDelUnit(null)}
        onConfirm={async () => {
          if (!delUnit) return;
          const { error } = await supabase.from("ac_units").delete().eq("id", delUnit.id);
          if (error) return toast.error("تعذّر الحذف");
          toast.success("تم الحذف");
          setDelUnit(null);
          load();
        }}
      />
    </div>
  );
}

function AcUnitFormDialog({ open, unit, officeId, onClose, onSaved }: {
  open: boolean; unit: AcUnit | null; officeId: string; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState({
    unit_number: "", ac_type: "", manufacturer: "", capacity: "",
    install_date: "", warranty_end_date: "", maintenance_company: "",
    current_status: "يعمل", notes: "",
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setF(unit ? {
        unit_number: unit.unit_number,
        ac_type: unit.ac_type ?? "",
        manufacturer: unit.manufacturer ?? "",
        capacity: unit.capacity ?? "",
        install_date: unit.install_date ?? "",
        warranty_end_date: unit.warranty_end_date ?? "",
        maintenance_company: unit.maintenance_company ?? "",
        current_status: unit.current_status,
        notes: unit.notes ?? "",
      } : {
        unit_number: "", ac_type: "سبليت", manufacturer: "", capacity: "",
        install_date: "", warranty_end_date: "", maintenance_company: "",
        current_status: "يعمل", notes: "",
      });
    }
  }, [open, unit]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.unit_number.trim()) return toast.error("رقم الوحدة مطلوب");
    setBusy(true);
    const payload = {
      office_id: officeId,
      unit_number: f.unit_number.trim(),
      ac_type: f.ac_type.trim() || null,
      manufacturer: f.manufacturer.trim() || null,
      capacity: f.capacity.trim() || null,
      install_date: f.install_date || null,
      warranty_end_date: f.warranty_end_date || null,
      maintenance_company: f.maintenance_company.trim() || null,
      current_status: f.current_status,
      notes: f.notes.trim() || null,
    };
    const { error } = unit
      ? await supabase.from("ac_units").update(payload).eq("id", unit.id)
      : await supabase.from("ac_units").insert(payload);
    setBusy(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{unit ? "تعديل الوحدة" : "إضافة وحدة تكييف"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>رقم الوحدة</Label>
              <Input value={f.unit_number} onChange={(e) => setF({ ...f, unit_number: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>النوع</Label>
              <Input value={f.ac_type} onChange={(e) => setF({ ...f, ac_type: e.target.value })} placeholder="سبليت / مركزي / كاسيت" /></div>
            <div className="space-y-1.5"><Label>الشركة المصنّعة</Label>
              <Input value={f.manufacturer} onChange={(e) => setF({ ...f, manufacturer: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>السعة</Label>
              <Input value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} placeholder="مثال: 24,000 BTU" /></div>
            <div className="space-y-1.5"><Label>تاريخ التركيب</Label>
              <Input type="date" value={f.install_date} onChange={(e) => setF({ ...f, install_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>انتهاء الضمان</Label>
              <Input type="date" value={f.warranty_end_date} onChange={(e) => setF({ ...f, warranty_end_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>شركة الصيانة</Label>
              <Input value={f.maintenance_company} onChange={(e) => setF({ ...f, maintenance_company: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>الحالة الحالية</Label>
              <Select value={f.current_status} onValueChange={(v) => setF({ ...f, current_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["يعمل", "معطّل", "تحت الصيانة", "خارج الخدمة"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select></div>
            <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label>
              <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
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

function AcLogFormDialog({ unit, onClose, onSaved }: {
  unit: AcUnit | null; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState({
    maintenance_date: new Date().toISOString().slice(0, 10),
    next_maintenance_date: "",
    technician: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (unit) setF({
      maintenance_date: new Date().toISOString().slice(0, 10),
      next_maintenance_date: "", technician: "", notes: "",
    });
  }, [unit]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    setBusy(true);
    const { error } = await supabase.from("ac_maintenance_logs").insert({
      ac_unit_id: unit.id,
      maintenance_date: f.maintenance_date,
      next_maintenance_date: f.next_maintenance_date || null,
      technician: f.technician.trim() || null,
      notes: f.notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error("تعذّر التسجيل");
    toast.success("تم تسجيل الصيانة");
    onSaved();
  };

  return (
    <Dialog open={!!unit} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>تسجيل صيانة</DialogTitle>
            <DialogDescription>وحدة {unit?.unit_number}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>تاريخ الصيانة</Label>
              <Input type="date" value={f.maintenance_date} onChange={(e) => setF({ ...f, maintenance_date: e.target.value })} required /></div>
            <div className="space-y-1.5"><Label>الصيانة القادمة</Label>
              <Input type="date" value={f.next_maintenance_date} onChange={(e) => setF({ ...f, next_maintenance_date: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>الفنّي</Label>
              <Input value={f.technician} onChange={(e) => setF({ ...f, technician: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label>
              <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
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

/* ===================== Network ===================== */
function NetworkTab({ officeId, canEdit }: { officeId: string; canEdit: boolean }) {
  const [points, setPoints] = useState<NetPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NetPoint | null>(null);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<NetPoint | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("network_points").select("*").eq("office_id", officeId).order("created_at");
    setPoints((data ?? []) as NetPoint[]);
    setLoading(false);
  }, [officeId]);
  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">الشبكات والاتصالات</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => setCreating(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" /> إضافة نقطة
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : points.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">لا توجد نقاط مسجّلة.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نقطة شبكة</TableHead>
                <TableHead>نقطة هاتف</TableHead>
                <TableHead>مزوّد الخدمة</TableHead>
                <TableHead>ملاحظات</TableHead>
                {canEdit && <TableHead className="text-end">إجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.network_point ?? "—"}</TableCell>
                  <TableCell>{p.phone_point ?? "—"}</TableCell>
                  <TableCell>{p.service_provider ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.notes ?? "—"}</TableCell>
                  {canEdit && (
                    <TableCell className="text-end">
                      <Button size="sm" variant="ghost" onClick={() => setForm(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDel(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <NetFormDialog
        open={creating || !!form}
        point={form}
        officeId={officeId}
        onClose={() => { setCreating(false); setForm(null); }}
        onSaved={() => { setCreating(false); setForm(null); load(); }}
      />
      <ConfirmDelete
        open={!!del}
        title="حذف النقطة"
        message="هل أنت متأكد من حذف هذه النقطة؟"
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          const { error } = await supabase.from("network_points").delete().eq("id", del.id);
          if (error) return toast.error("تعذّر الحذف");
          toast.success("تم الحذف");
          setDel(null);
          load();
        }}
      />
    </Card>
  );
}

function NetFormDialog({ open, point, officeId, onClose, onSaved }: {
  open: boolean; point: NetPoint | null; officeId: string; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState({ network_point: "", phone_point: "", service_provider: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setF(point ? {
      network_point: point.network_point ?? "",
      phone_point: point.phone_point ?? "",
      service_provider: point.service_provider ?? "",
      notes: point.notes ?? "",
    } : { network_point: "", phone_point: "", service_provider: "", notes: "" });
  }, [open, point]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      office_id: officeId,
      network_point: f.network_point.trim() || null,
      phone_point: f.phone_point.trim() || null,
      service_provider: f.service_provider.trim() || null,
      notes: f.notes.trim() || null,
    };
    const { error } = point
      ? await supabase.from("network_points").update(payload).eq("id", point.id)
      : await supabase.from("network_points").insert(payload);
    setBusy(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{point ? "تعديل النقطة" : "إضافة نقطة شبكة/هاتف"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>نقطة الشبكة</Label>
              <Input value={f.network_point} onChange={(e) => setF({ ...f, network_point: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>نقطة الهاتف</Label>
              <Input value={f.phone_point} onChange={(e) => setF({ ...f, phone_point: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>مزوّد الخدمة</Label>
              <Input value={f.service_provider} onChange={(e) => setF({ ...f, service_provider: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label>
              <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
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

/* ===================== Files ===================== */
const FILE_TYPES: DocCategory[] = DOC_UPLOAD_CATEGORIES;

function FilesTab({ officeId, canEdit }: { officeId: string; canEdit: boolean }) {
  const [files, setFiles] = useState<OfficeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [del, setDel] = useState<OfficeFile | null>(null);
  const [open, setOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<DocCategory>("صورة");
  const [fileItems, setFileItems] = useState<Array<{ file: File; title: string; category: DocCategory; description: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("office_files")
      .select("*").eq("office_id", officeId).order("created_at", { ascending: false });
    const list = (data ?? []) as OfficeFile[];
    setFiles(list);
    const imgs = list.filter(f => (f.mime_type ?? "").startsWith("image/"));
    if (imgs.length) {
      const urls: Record<string, string> = {};
      await Promise.all(imgs.map(async (f) => {
        const { data: s } = await supabase.storage.from("office-files").createSignedUrl(f.storage_path, 3600);
        if (s?.signedUrl) urls[f.id] = s.signedUrl;
      }));
      setSignedUrls(urls);
    } else setSignedUrls({});
    setLoading(false);
  }, [officeId]);
  useEffect(() => { load(); }, [load]);

  const stripExt = (name: string) => { const i = name.lastIndexOf("."); return i > 0 ? name.slice(0, i) : name; };
  const getExt = (name: string) => { const i = name.lastIndexOf("."); return i > 0 ? name.slice(i) : ""; };

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    setFileItems((prev) => [
      ...prev,
      ...Array.from(list).map((f) => ({ file: f, title: stripExt(f.name), category: defaultCategory, description: "" })),
    ]);
  };

  const submit = async () => {
    if (fileItems.length === 0) { toast.error("اختر ملفًا واحدًا على الأقل"); return; }
    for (const it of fileItems) {
      if (!it.title.trim()) { toast.error("كل ملف يجب أن يكون له اسم"); return; }
    }
    setUploading(true);
    let ok = 0, fail = 0;
    for (const it of fileItems) {
      const ext = getExt(it.file.name) || ("." + (it.file.name.split(".").pop() ?? "bin"));
      const path = `${officeId}/${crypto.randomUUID()}${ext}`;
      const up = await supabase.storage.from("office-files").upload(path, it.file, {
        contentType: it.file.type || undefined,
      });
      if (up.error) { fail++; continue; }
      const { error: insErr } = await supabase.from("office_files").insert({
        office_id: officeId,
        file_type: it.category,
        file_name: it.title.trim() + getExt(it.file.name),
        storage_path: path,
        mime_type: it.file.type || null,
        size_bytes: it.file.size,
        notes: it.description.trim() || null,
      });
      if (insErr) { fail++; await supabase.storage.from("office-files").remove([path]); }
      else ok++;
    }
    setUploading(false);
    if (ok) toast.success(`تم رفع ${ok} ملف`);
    if (fail) toast.error(`فشل ${fail} ملف`);
    setFileItems([]);
    setOpen(false);
    load();
  };

  const download = async (f: OfficeFile) => {
    const { data, error } = await supabase.storage.from("office-files").createSignedUrl(f.storage_path, 60, { download: f.file_name });
    if (error || !data) return toast.error("تعذّر التحميل");
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (f: OfficeFile) => {
    await supabase.storage.from("office-files").remove([f.storage_path]);
    const { error } = await supabase.from("office_files").delete().eq("id", f.id);
    if (error) return toast.error("تعذّر الحذف");
    toast.success("تم الحذف");
    setDel(null);
    load();
  };

  const images = useMemo(() => files.filter(f => (f.mime_type ?? "").startsWith("image/")), [files]);
  const others = useMemo(() => files.filter(f => !(f.mime_type ?? "").startsWith("image/")), [files]);

  return (
    <div className="space-y-4" dir="rtl">
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setFileItems([]); }}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Upload className="h-4 w-4 ms-1" /> رفع ملفات
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader><DialogTitle>رفع ملفات للمكتب</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>التصنيف الافتراضي (يُطبَّق على الملفات الجديدة)</Label>
                  <Select value={defaultCategory} onValueChange={(v) => setDefaultCategory(v as DocCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FILE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الملفات</Label>
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); onPickFiles(e.dataTransfer.files); }}
                    className={`mt-1 flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
                  >
                    <UploadCloud className="h-7 w-7 text-muted-foreground" />
                    <div className="text-sm">اسحب وأفلِت الملفات هنا أو اضغط للاختيار</div>
                    <div className="text-xs text-muted-foreground">يمكن اختيار عدة ملفات بأي صيغة</div>
                    <input type="file" multiple className="hidden"
                      onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }} />
                  </label>
                  {fileItems.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-72 overflow-auto">
                      {fileItems.map((it, i) => (
                        <div key={i} className="border rounded-md p-2 bg-muted/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs truncate">
                              {it.file.name} <span className="text-muted-foreground">({(it.file.size / 1024).toFixed(1)} KB)</span>
                            </span>
                            <button type="button" onClick={() => setFileItems((p) => p.filter((_, k) => k !== i))} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">اسم الملف</Label>
                              <Input value={it.title}
                                onChange={(e) => setFileItems((p) => p.map((x, k) => k === i ? { ...x, title: e.target.value } : x))} />
                            </div>
                            <div>
                              <Label className="text-xs">التصنيف</Label>
                              <Select value={it.category}
                                onValueChange={(v) => setFileItems((p) => p.map((x, k) => k === i ? { ...x, category: v as DocCategory } : x))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {FILE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                          </div>
                          <div>
                            <Label className="text-xs">وصف (اختياري)</Label>
                            <Input
                              placeholder="وصف مختصر للملف"
                              value={it.description}
                              onChange={(e) => setFileItems((p) => p.map((x, k) => k === i ? { ...x, description: e.target.value } : x))}
                            />
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={submit} disabled={uploading}>
                  {uploading ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
                  رفع {fileItems.length > 0 ? `(${fileItems.length})` : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : files.length === 0 ? (
        <Card className="py-10 text-center text-muted-foreground">لا توجد ملفات.</Card>
      ) : (
        <>
          {images.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" />الصور والمخططات</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((f) => (
                    <div key={f.id} className="border rounded-lg overflow-hidden group relative">
                      {signedUrls[f.id] ? (
                        <a href={signedUrls[f.id]} target="_blank" rel="noreferrer">
                          <img src={signedUrls[f.id]} alt={f.file_name} className="w-full h-32 object-cover" />
                        </a>
                      ) : (
                        <div className="w-full h-32 bg-muted animate-pulse" />
                      )}
                      <div className="p-2 text-xs">
                        <div className="truncate font-medium">{f.file_name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="outline" className="text-[10px]">{f.file_type}</Badge>
                          {canEdit && (
                            <Button size="sm" variant="ghost" onClick={() => setDel(f)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {others.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />المرفقات</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead className="text-end">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {others.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.file_name}</TableCell>
                        <TableCell><Badge variant="outline">{f.file_type}</Badge></TableCell>
                        <TableCell>{f.size_bytes ? `${Math.round(f.size_bytes / 1024)} KB` : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("en-US")}</TableCell>
                        <TableCell className="text-end">
                          <Button size="sm" variant="ghost" onClick={() => download(f)}><Download className="h-4 w-4" /></Button>
                          {canEdit && (
                            <Button size="sm" variant="ghost" onClick={() => setDel(f)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ConfirmDelete
        open={!!del}
        title="حذف الملف"
        message={`سيتم حذف الملف "${del?.file_name}" نهائيًا.`}
        onCancel={() => setDel(null)}
        onConfirm={() => del && remove(del)}
      />
    </div>
  );
}

/* ===================== Office edit dialog (re-uses inline form) ===================== */
function OfficeEditDialog({ open, office, onClose, onSaved }: {
  open: boolean; office: Office; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState({
    area_sqm: "", parking_count: 0, view_type: "", management_entity: "", notes: "",
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setF({
      area_sqm: office.area_sqm?.toString() ?? "",
      parking_count: office.parking_count,
      view_type: office.view_type ?? "",
      management_entity: office.management_entity ?? "",
      notes: office.notes ?? "",
    });
  }, [open, office]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("offices").update({
      area_sqm: f.area_sqm.trim() === "" ? null : Number(f.area_sqm),
      parking_count: Number(f.parking_count),
      view_type: f.view_type.trim() || null,
      management_entity: f.management_entity.trim() || null,
      notes: f.notes.trim() || null,
    }).eq("id", office.id);
    setBusy(false);
    if (error) return toast.error("تعذّر الحفظ");
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المكتب {office.code}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>المساحة (م²)</Label>
              <Input type="number" step="0.1" value={f.area_sqm} onChange={(e) => setF({ ...f, area_sqm: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>عدد المواقف</Label>
              <Input type="number" min={0} value={f.parking_count} onChange={(e) => setF({ ...f, parking_count: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>نوع الإطلالة</Label>
              <Input value={f.view_type} onChange={(e) => setF({ ...f, view_type: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>الجهة المشرفة</Label>
              <Input value={f.management_entity} onChange={(e) => setF({ ...f, management_entity: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label>
              <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
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

/* ===================== Confirm delete ===================== */
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
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function OfficeTicketsTab({ officeId }: { officeId: string }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("tickets")
        .select("id, ticket_number, ticket_type, priority, status, description, created_at")
        .eq("office_id", officeId)
        .order("created_at", { ascending: false });
      setItems(data ?? []);
    })();
  }, [officeId]);
  return (
    <Card>
      <CardHeader><CardTitle>تذاكر هذا المكتب</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>الرقم</TableHead><TableHead>النوع</TableHead><TableHead>الأولوية</TableHead>
            <TableHead>الوصف</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id} className={t.priority === "طارئة" && t.status !== "مغلق" ? "bg-red-500/5" : ""}>
                <TableCell className="font-medium">{t.ticket_number}</TableCell>
                <TableCell>{t.ticket_type}</TableCell>
                <TableCell>
                  {t.priority === "طارئة"
                    ? <Badge className="bg-red-600 text-white animate-pulse">طارئة</Badge>
                    : <Badge variant="outline">{t.priority}</Badge>}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{t.description}</TableCell>
                <TableCell><Badge variant={t.status === "مغلق" ? "secondary" : "default"}>{t.status}</Badge></TableCell>
                <TableCell>
                  <Link to="/complaints/$id" params={{ id: t.id }}>
                    <Button size="sm" variant="outline">فتح</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">لا توجد تذاكر.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OfficeBuildingLogTab({ officeId }: { officeId: string }) {
  const { items, loading } = useBuildingLog({ officeId });
  if (loading) return <Card><CardContent className="py-8 text-center text-muted-foreground">جارٍ التحميل...</CardContent></Card>;
  return <Timeline items={items} />;
}

/* ===================== Tenant / Contract Tab ===================== */
interface ContractRow {
  id: string;
  contract_number: string;
  status: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  service_fees: number;
  notes: string | null;
  company_id: string;
  companies: {
    id: string;
    company_name: string;
    activity: string | null;
    commercial_register: string | null;
    tax_number: string | null;
    status: string;
  } | null;
}
interface ContactRow {
  id: string;
  name: string;
  position: string | null;
  mobile: string | null;
  email: string | null;
}

const CONTRACT_BADGE: Record<string, string> = {
  "ساري": "bg-success text-success-foreground",
  "منتهي": "bg-muted text-muted-foreground",
  "ملغي": "bg-destructive text-destructive-foreground",
  "مجدد": "bg-info text-info-foreground",
};

function TenantTab({ officeId }: { officeId: string }) {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [contacts, setContacts] = useState<Record<string, ContactRow[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, contract_number, status, start_date, end_date, rent_amount, deposit_amount, service_fees, notes, company_id, companies(id, company_name, activity, commercial_register, tax_number, status)")
        .eq("office_id", officeId)
        .order("start_date", { ascending: false });
      if (error) {
        toast.error("تعذّر تحميل العقود");
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as ContractRow[];
      setContracts(rows);
      const companyIds = Array.from(new Set(rows.map((r) => r.company_id).filter(Boolean)));
      if (companyIds.length) {
        const { data: cps } = await (supabase as any)
          .from("contact_persons")
          .select("id, company_id, name, position, mobile, email")
          .in("company_id", companyIds);
        const map: Record<string, ContactRow[]> = {};
        ((cps ?? []) as any[]).forEach((c) => {
          (map[c.company_id] ||= []).push(c);
        });
        setContacts(map);
      } else setContacts({});
      setLoading(false);
    })();
  }, [officeId]);

  if (loading) {
    return <Card><CardContent className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></CardContent></Card>;
  }
  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground space-y-3">
          <Building2 className="h-10 w-10 mx-auto opacity-40" />
          <p>لا يوجد عقد إيجار مرتبط بهذا المكتب.</p>
          <Link to="/contracts">
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 ms-1" /> إنشاء عقد جديد</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const active = contracts.filter((c) => c.status === "ساري");
  const history = contracts.filter((c) => c.status !== "ساري");

  return (
    <div className="space-y-4">
      {active.map((c) => (
        <ContractCard key={c.id} contract={c} contacts={contacts[c.company_id] ?? []} />
      ))}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground mt-6">سجل العقود السابقة</h3>
          {history.map((c) => (
            <ContractCard key={c.id} contract={c} contacts={contacts[c.company_id] ?? []} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function ContractCard({ contract, contacts, compact }: { contract: ContractRow; contacts: ContactRow[]; compact?: boolean }) {
  const co = contract.companies;
  const days = daysUntil(contract.end_date);
  const expiring = contract.status === "ساري" && days !== null && days <= 60;
  return (
    <Card className={compact ? "opacity-80" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {co?.company_name ?? "—"}
              </CardTitle>
              <Badge className={CONTRACT_BADGE[contract.status] ?? "bg-muted"}>{contract.status}</Badge>
              {expiring && <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="h-3 w-3 ms-1" />ينتهي خلال {days} يوم</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">عقد رقم {contract.contract_number}{co?.activity ? ` — ${co.activity}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/contracts/$id" params={{ id: contract.id }}>
              <Button size="sm" variant="outline">فتح العقد</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Info label="بداية" value={<span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{contract.start_date}</span>} />
          <Info label="نهاية" value={<span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{contract.end_date}</span>} />
          <Info label="الإيجار الشهري" value={<span className="flex items-center gap-1"><Wallet className="h-3 w-3 text-muted-foreground" />{Number(contract.rent_amount).toLocaleString("en-US")} ج.م</span>} />
          <Info label="الضمان" value={`${Number(contract.deposit_amount).toLocaleString("en-US")} ج.م`} />
        </div>

        {co && (
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">بيانات الشركة</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="السجل التجاري" value={co.commercial_register ?? "—"} />
              <Info label="الرقم الضريبي" value={co.tax_number ?? "—"} />
              <Info label="حالة العميل" value={<Badge variant="outline">{co.status}</Badge>} />
            </div>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">جهات الاتصال</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {contacts.map((p) => (
                <div key={p.id} className="rounded-md border border-border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                  </div>
                  {p.position && <div className="text-xs text-muted-foreground">{p.position}</div>}
                  {p.mobile && (
                    <a href={`tel:${p.mobile}`} className="flex items-center gap-1 text-xs text-primary hover:underline" dir="ltr">
                      <Phone className="h-3 w-3" />{p.mobile}
                    </a>
                  )}
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline" dir="ltr">
                      <Mail className="h-3 w-3" />{p.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {contract.notes && (
          <div className="text-xs text-muted-foreground border-t border-border pt-2">
            <span className="font-semibold">ملاحظات: </span>{contract.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ===================== Finance ===================== */
const INVOICE_TYPES = ["إيجار", "تأمين", "رسوم تشغيل", "رسوم خدمات", "غرامات"] as const;
const PAYMENT_METHODS = ["نقدي", "تحويل بنكي", "شيك"] as const;
const INV_STATUS_STYLE: Record<string, string> = {
  "مستحق": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "مدفوع جزئي": "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "مدفوع": "bg-success text-success-foreground",
  "متأخر": "bg-destructive/20 text-destructive",
};

function FinanceTab({ officeId }: { officeId: string }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invDlg, setInvDlg] = useState(false);
  const [payDlg, setPayDlg] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: ct } = await supabase
      .from("contracts")
      .select("id, contract_number, company_id, status, rent_amount, companies(company_name)")
      .eq("office_id", officeId)
      .order("created_at", { ascending: false });
    const list = ct ?? [];
    setContracts(list);
    const ids = list.map((c: any) => c.id);
    if (ids.length === 0) { setInvoices([]); setPayments([]); setLoading(false); return; }
    const [inv, pay] = await Promise.all([
      supabase.from("invoices").select("*").in("contract_id", ids).order("due_date", { ascending: false }),
      supabase.from("payments").select("*, invoices!inner(invoice_number, contract_id)")
        .in("invoices.contract_id", ids).order("payment_date", { ascending: false }),
    ]);
    setInvoices(inv.data ?? []);
    setPayments(pay.data ?? []);
    setLoading(false);
  }, [officeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Card><CardContent className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>;

  const totalDue = invoices.reduce((s, i) => s + Number(i.amount_due ?? 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid ?? 0), 0);
  const outstanding = totalDue - totalPaid;
  const overdue = invoices.filter((i) => i.status === "متأخر").length;
  const hasContract = contracts.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">إجمالي المستحق</div><div className="text-xl font-bold">{totalDue.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">إجمالي المحصّل</div><div className="text-xl font-bold text-green-600">{totalPaid.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">المتبقي</div><div className="text-xl font-bold text-amber-600">{outstanding.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">فواتير متأخرة</div><div className="text-xl font-bold text-red-600">{overdue}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الفواتير</CardTitle>
          <Button size="sm" onClick={() => setInvDlg(true)} disabled={!hasContract}>
            <Plus className="h-4 w-4 ms-1" />فاتورة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          {!hasContract ? (
            <p className="text-sm text-muted-foreground">يجب وجود عقد لهذا المكتب قبل إضافة فواتير</p>
          ) : invoices.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد فواتير</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>رقم</TableHead><TableHead>النوع</TableHead><TableHead>المستحق</TableHead>
                <TableHead>المدفوع</TableHead><TableHead>المتبقي</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {invoices.map((i: any) => {
                  const rem = Number(i.amount_due) - Number(i.amount_paid);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                      <TableCell>{i.invoice_type}</TableCell>
                      <TableCell>{Number(i.amount_due).toLocaleString()}</TableCell>
                      <TableCell>{Number(i.amount_paid).toLocaleString()}</TableCell>
                      <TableCell className={rem > 0 ? "text-destructive font-semibold" : ""}>{rem.toLocaleString()}</TableCell>
                      <TableCell>{i.due_date}</TableCell>
                      <TableCell><Badge className={INV_STATUS_STYLE[i.status] ?? ""}>{i.status}</Badge></TableCell>
                      <TableCell>
                        {i.status !== "مدفوع" && (
                          <Button size="sm" variant="outline" onClick={() => setPayDlg(i)}>
                            <Plus className="h-3 w-3 ms-1" />دفعة
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>سندات القبض</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مدفوعات</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>رقم السند</TableHead><TableHead>الفاتورة</TableHead><TableHead>التاريخ</TableHead>
                <TableHead>المبلغ</TableHead><TableHead>الطريقة</TableHead><TableHead>ملاحظات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                    <TableCell className="font-mono text-xs">{p.invoices?.invoice_number ?? "-"}</TableCell>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{Number(p.amount_paid ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{p.payment_method ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.notes ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InvoiceDialog open={invDlg} onClose={() => setInvDlg(false)} contracts={contracts} onSaved={() => { setInvDlg(false); load(); }} />
      <PayDialog invoice={payDlg} onClose={() => setPayDlg(null)} onSaved={() => { setPayDlg(null); load(); }} />
    </div>
  );
}

function InvoiceDialog({ open, onClose, contracts, onSaved }: { open: boolean; onClose: () => void; contracts: any[]; onSaved: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [contractId, setContractId] = useState<string>("");
  const [type, setType] = useState<string>("إيجار");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      const active = contracts.find((c: any) => c.status === "ساري") ?? contracts[0];
      setContractId(active?.id ?? "");
      setType("إيجار");
      setAmount(active?.rent_amount ? String(active.rent_amount) : "");
      setIssueDate(today);
      setDueDate(today);
      setNotes("");
    }
  }, [open, contracts]);

  const save = async () => {
    const ct = contracts.find((c: any) => c.id === contractId);
    if (!ct) { toast.error("اختر عقدًا"); return; }
    const amt = Number(amount);
    if (!(amt > 0)) { toast.error("أدخل مبلغًا صحيحًا"); return; }
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("invoices").insert({
      invoice_number: "",
      contract_id: ct.id,
      company_id: ct.company_id,
      invoice_type: type as any,
      amount_due: amt,
      amount_paid: 0,
      issue_date: issueDate,
      due_date: dueDate,
      status: "مستحق" as any,
      notes: notes || null,
      created_by: userRes.user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error("فشل الإنشاء: " + error.message); return; }
    toast.success("تم إنشاء الفاتورة");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>فاتورة جديدة</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>العقد</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger><SelectValue placeholder="اختر العقد" /></SelectTrigger>
              <SelectContent>
                {contracts.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.contract_number} — {c.companies?.company_name ?? ""} ({c.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>النوع</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المبلغ</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>تاريخ الإصدار</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div>
              <Label>تاريخ الاستحقاق</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 ms-1 animate-spin" />}حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayDialog({ invoice, onClose, onSaved }: { invoice: any | null; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("نقدي");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (invoice) {
      const rem = Number(invoice.amount_due) - Number(invoice.amount_paid);
      setAmount(String(rem > 0 ? rem : ""));
      setMethod("نقدي");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [invoice]);

  const rem = invoice ? Number(invoice.amount_due) - Number(invoice.amount_paid) : 0;

  const save = async () => {
    if (!invoice) return;
    const amt = Number(amount);
    if (!(amt > 0)) { toast.error("أدخل مبلغًا صحيحًا"); return; }
    if (amt > rem + 0.001) { toast.error("المبلغ يتجاوز المتبقي"); return; }
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({
      invoice_id: invoice.id,
      amount_paid: amt,
      payment_date: date,
      payment_method: method as any,
      receipt_number: "",
      notes: notes || null,
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
              <div><div className="text-muted-foreground text-xs">المستحق</div><div>{Number(invoice.amount_due).toLocaleString()}</div></div>
              <div><div className="text-muted-foreground text-xs">المتبقي</div><div className="font-semibold text-destructive">{rem.toLocaleString()}</div></div>
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
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={save} disabled={busy}>{busy && <Loader2 className="h-4 w-4 ms-1 animate-spin" />}حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== Maintenance ===================== */
function MaintenanceTab({ officeId }: { officeId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("maintenance_requests").select("*").eq("office_id", officeId).order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [officeId]);

  if (loading) return <Card><CardContent className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>;

  const open = items.filter((i: any) => i.status !== "completed" && i.status !== "closed").length;
  const closed = items.length - open;
  const totalCost = items.reduce((s, i) => s + Number(i.cost ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">مفتوحة</div><div className="text-xl font-bold text-amber-600">{open}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">مغلقة</div><div className="text-xl font-bold text-green-600">{closed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">إجمالي التكلفة</div><div className="text-xl font-bold">{totalCost.toLocaleString()}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>طلبات الصيانة</CardTitle></CardHeader>
        <CardContent>
          {items.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد طلبات</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>الوصف</TableHead><TableHead>الأولوية</TableHead><TableHead>الحالة</TableHead><TableHead>التكلفة</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((i: any) => (
                  <TableRow key={i.id} className={i.priority === "طارئة" || i.priority === "emergency" ? "bg-red-50 dark:bg-red-950/20" : ""}>
                    <TableCell>{i.created_at?.slice(0, 10) ?? "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{i.description ?? i.title ?? "-"}</TableCell>
                    <TableCell><Badge variant={i.priority === "طارئة" || i.priority === "emergency" ? "destructive" : "outline"}>{i.priority ?? "-"}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{i.status ?? "-"}</Badge></TableCell>
                    <TableCell>{Number(i.cost ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ===================== Parking ===================== */
function ParkingTab({ officeId }: { officeId: string }) {
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("parking_spots").select("*").eq("office_id", officeId);
      setSpots(data ?? []);
      setLoading(false);
    })();
  }, [officeId]);

  if (loading) return <Card><CardContent className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle><Car className="h-4 w-4 inline ms-1" />المواقف المخصصة ({spots.length})</CardTitle></CardHeader>
      <CardContent>
        {spots.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مواقف مخصصة</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>رقم الموقف</TableHead><TableHead>الطابق</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {spots.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold">{s.spot_number ?? "-"}</TableCell>
                  <TableCell>{s.floor ?? s.level ?? "-"}</TableCell>
                  <TableCell><Badge variant={s.is_occupied ? "default" : "outline"}>{s.is_occupied ? "مشغول" : "متاح"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
