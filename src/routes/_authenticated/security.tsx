import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, ShieldCheck, Footprints, AlertTriangle, X, Upload, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/security")({
  component: SecurityPage,
});

type ShiftType = "صباحي" | "مسائي" | "ليلي";
type IncidentStatus = "مفتوح" | "مغلق";
const SHIFTS: ShiftType[] = ["صباحي", "مسائي", "ليلي"];

interface Guard {
  id: string;
  full_name: string;
  national_id: string | null;
  nationality: string | null;
  birth_date: string | null;
  mobile: string | null;
  address: string | null;
  photo_url: string | null;
  employee_number: string | null;
  security_company: string | null;
  job_title: string | null;
  start_date: string | null;
  contract_end_date: string | null;
  salary: number | null;
  direct_supervisor: string | null;
  shift_type: ShiftType | null;
  working_hours: string | null;
  working_days: string | null;
  notes: string | null;
}

function SecurityPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">الأمن</h1>
        <p className="text-sm text-muted-foreground">إدارة الحراس والجولات والحوادث الأمنية</p>
      </div>
      <Tabs defaultValue="guards" dir="rtl">
        <TabsList>
          <TabsTrigger value="guards"><ShieldCheck className="h-4 w-4 ms-1" /> الحراس</TabsTrigger>
          <TabsTrigger value="patrols"><Footprints className="h-4 w-4 ms-1" /> الجولات</TabsTrigger>
          <TabsTrigger value="incidents"><AlertTriangle className="h-4 w-4 ms-1" /> الحوادث</TabsTrigger>
        </TabsList>
        <TabsContent value="guards" className="mt-4"><GuardsTab /></TabsContent>
        <TabsContent value="patrols" className="mt-4"><PatrolsTab /></TabsContent>
        <TabsContent value="incidents" className="mt-4"><IncidentsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================== GUARDS ============================== */

function GuardsTab() {
  const { hasRole } = useAuth();
  const canManage = hasRole("super_admin") || hasRole("security_supervisor");
  const isAdmin = hasRole("super_admin");
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    // Use safe view for non-admins (no salary), full table for admins
    const q = isAdmin
      ? await supabase.from("guards").select("*").order("full_name")
      : await supabase.from("guards_safe").select("*").order("full_name");
    if (q.error) toast.error(q.error.message);
    setGuards((q.data as unknown as Guard[]) ?? []);
    setLoading(false);
  }, [isAdmin]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return guards;
    return guards.filter(g =>
      g.full_name.toLowerCase().includes(s) ||
      (g.employee_number ?? "").toLowerCase().includes(s) ||
      (g.national_id ?? "").includes(s),
    );
  }, [guards, search]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>الحراس ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="بحث بالاسم أو الرقم" value={search}
              onChange={(e) => setSearch(e.target.value)} className="w-56" />
            {canManage && (
              <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 ms-1" /> إضافة حارس
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">لا يوجد حراس</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم الوظيفي</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الشركة</TableHead>
                  <TableHead>الوردية</TableHead>
                  <TableHead>الجوال</TableHead>
                  {isAdmin && <TableHead>الراتب</TableHead>}
                  <TableHead className="w-24">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.employee_number ?? "—"}</TableCell>
                    <TableCell>{g.full_name}</TableCell>
                    <TableCell>{g.security_company ?? "—"}</TableCell>
                    <TableCell>{g.shift_type ? <Badge variant="outline">{g.shift_type}</Badge> : "—"}</TableCell>
                    <TableCell>{g.mobile ?? "—"}</TableCell>
                    {isAdmin && <TableCell>{g.salary != null ? Number(g.salary).toLocaleString("ar-EG") : "—"}</TableCell>}
                    <TableCell>
                      <Link to="/security/guards/$id" params={{ id: g.id }}>
                        <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <GuardDialog open={open} onClose={() => setOpen(false)} isAdmin={isAdmin}
        onSaved={() => { setOpen(false); load(); }} />
    </div>
  );
}

function GuardDialog({
  open, onClose, isAdmin, onSaved,
}: { open: boolean; onClose: () => void; isAdmin: boolean; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: "", national_id: "", nationality: "", birth_date: "",
    mobile: "", address: "",
    employee_number: "", security_company: "", job_title: "",
    start_date: "", contract_end_date: "", salary: "",
    direct_supervisor: "",
    shift_type: "" as ShiftType | "", working_hours: "", working_days: "",
    notes: "",
  });
  useEffect(() => {
    if (open) {
      setPhotoFile(null);
      setForm({
        full_name: "", national_id: "", nationality: "", birth_date: "",
        mobile: "", address: "",
        employee_number: "", security_company: "", job_title: "",
        start_date: "", contract_end_date: "", salary: "",
        direct_supervisor: "",
        shift_type: "", working_hours: "", working_days: "",
        notes: "",
      });
    }
  }, [open]);

  const submit = async () => {
    if (!form.full_name.trim()) { toast.error("الاسم الكامل مطلوب"); return; }
    setSaving(true);
    let photo_url: string | null = null;
    if (photoFile) {
      const path = `${Date.now()}_${photoFile.name}`;
      const up = await supabase.storage.from("guards-photos").upload(path, photoFile);
      if (up.error) { toast.error("فشل رفع الصورة: " + up.error.message); }
      else photo_url = path;
    }
    const { data: u } = await supabase.auth.getUser();
    const insert: Record<string, unknown> = {
      full_name: form.full_name,
      national_id: form.national_id || null,
      nationality: form.nationality || null,
      birth_date: form.birth_date || null,
      mobile: form.mobile || null,
      address: form.address || null,
      photo_url,
      employee_number: form.employee_number || null,
      security_company: form.security_company || null,
      job_title: form.job_title || null,
      start_date: form.start_date || null,
      contract_end_date: form.contract_end_date || null,
      direct_supervisor: form.direct_supervisor || null,
      shift_type: form.shift_type || null,
      working_hours: form.working_hours || null,
      working_days: form.working_days || null,
      notes: form.notes || null,
      created_by: u.user?.id,
    };
    if (isAdmin && form.salary) insert.salary = Number(form.salary);
    const { error } = await supabase.from("guards").insert(insert as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة الحارس");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>إضافة حارس</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="text-sm font-semibold text-primary">البيانات الشخصية</div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>رقم الهوية</Label><Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} /></div>
            <div><Label>الجنسية</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
            <div><Label>تاريخ الميلاد</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
            <div><Label>الجوال</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
            <div><Label>الصورة الشخصية</Label><Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} /></div>
            <div className="col-span-2"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>

          <div className="text-sm font-semibold text-primary">بيانات العمل</div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الرقم الوظيفي</Label><Input value={form.employee_number} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} /></div>
            <div><Label>شركة الأمن</Label><Input value={form.security_company} onChange={(e) => setForm({ ...form, security_company: e.target.value })} /></div>
            <div><Label>المسمى الوظيفي</Label><Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
            <div><Label>المشرف المباشر</Label><Input value={form.direct_supervisor} onChange={(e) => setForm({ ...form, direct_supervisor: e.target.value })} /></div>
            <div><Label>تاريخ المباشرة</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>نهاية العقد</Label><Input type="date" value={form.contract_end_date} onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })} /></div>
            {isAdmin && (
              <div><Label>الراتب</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
            )}
          </div>

          <div className="text-sm font-semibold text-primary">الدوام</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>الوردية</Label>
              <Select value={form.shift_type} onValueChange={(v) => setForm({ ...form, shift_type: v as ShiftType })}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ساعات العمل</Label><Input value={form.working_hours} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} placeholder="8:00 - 16:00" /></div>
            <div><Label>أيام العمل</Label><Input value={form.working_days} onChange={(e) => setForm({ ...form, working_days: e.target.value })} placeholder="السبت - الخميس" /></div>
          </div>
          <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />} حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================== PATROLS ============================== */

interface Patrol {
  id: string;
  patrol_number: string;
  guard_id: string | null;
  start_time: string;
  end_time: string | null;
  notes: string | null;
}
interface Checkpoint {
  id: string;
  patrol_id: string;
  checkpoint_name: string;
  visit_time: string;
  photo_path: string | null;
  notes: string | null;
}

function PatrolsTab() {
  const { hasRole } = useAuth();
  const canManage = hasRole("super_admin") || hasRole("security_supervisor");
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [checkpoints, setCheckpoints] = useState<Record<string, Checkpoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, g] = await Promise.all([
      supabase.from("patrols").select("*").order("start_time", { ascending: false }).limit(50),
      supabase.from("guards_safe").select("id, full_name, employee_number").order("full_name"),
    ]);
    setPatrols((p.data as Patrol[]) ?? []);
    setGuards((g.data as Guard[]) ?? []);
    const ids = (p.data ?? []).map((x: { id: string }) => x.id);
    if (ids.length > 0) {
      const { data: ch } = await supabase.from("patrol_checkpoints").select("*").in("patrol_id", ids).order("visit_time");
      const map: Record<string, Checkpoint[]> = {};
      (ch as Checkpoint[] ?? []).forEach(c => {
        (map[c.patrol_id] ??= []).push(c);
      });
      setCheckpoints(map);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الجولات الأمنية</CardTitle>
          {canManage && (
            <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 ms-1" /> جولة جديدة
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : patrols.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">لا توجد جولات</div>
          ) : (
            <div className="space-y-3">
              {patrols.map(p => {
                const g = guards.find(x => x.id === p.guard_id);
                const cps = checkpoints[p.id] ?? [];
                return (
                  <div key={p.id} className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="font-medium">{p.patrol_number} — {g?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.start_time).toLocaleString("ar-EG")}
                          {p.end_time && " → " + new Date(p.end_time).toLocaleString("ar-EG")}
                        </div>
                      </div>
                      <Badge variant="outline">{cps.length} نقطة</Badge>
                    </div>
                    {cps.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {cps.map(c => (
                          <li key={c.id} className="flex justify-between border-t pt-1">
                            <span>• {c.checkpoint_name}</span>
                            <span className="text-muted-foreground text-xs">{new Date(c.visit_time).toLocaleString("ar-EG")}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.notes && <p className="text-sm mt-2 text-muted-foreground">{p.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PatrolDialog open={open} onClose={() => setOpen(false)} guards={guards}
        onSaved={() => { setOpen(false); load(); }} />
    </div>
  );
}

function PatrolDialog({
  open, onClose, guards, onSaved,
}: { open: boolean; onClose: () => void; guards: Guard[]; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [guardId, setGuardId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [cps, setCps] = useState<{ name: string; time: string; file: File | null }[]>([]);

  useEffect(() => {
    if (open) {
      const now = new Date().toISOString().slice(0, 16);
      setGuardId(""); setStartTime(now); setEndTime(""); setNotes("");
      setCps([{ name: "", time: now, file: null }]);
    }
  }, [open]);

  const submit = async () => {
    if (!startTime) { toast.error("وقت بدء الجولة مطلوب"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: p, error } = await supabase.from("patrols").insert({
      patrol_number: "",
      guard_id: guardId || null,
      start_time: new Date(startTime).toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : null,
      notes: notes || null,
      created_by: u.user?.id,
    }).select("id").single();
    if (error || !p) { setSaving(false); toast.error(error?.message ?? "فشل"); return; }
    const validCps = cps.filter(c => c.name.trim());
    for (const c of validCps) {
      let photo_path: string | null = null;
      if (c.file) {
        const path = `${p.id}/${Date.now()}_${c.file.name}`;
        const up = await supabase.storage.from("patrol-photos").upload(path, c.file);
        if (!up.error) photo_path = path;
      }
      await supabase.from("patrol_checkpoints").insert({
        patrol_id: p.id, checkpoint_name: c.name,
        visit_time: new Date(c.time).toISOString(),
        photo_path, created_by: u.user?.id,
      });
    }
    setSaving(false);
    toast.success("تم تسجيل الجولة");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تسجيل جولة أمنية</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الحارس</Label>
              <Select value={guardId} onValueChange={setGuardId}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{guards.map(g => <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>من</Label><Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
            <div><Label>إلى</Label><Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
          </div>
          <div><Label>ملاحظات الجولة</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

          <div className="flex justify-between items-center">
            <Label>نقاط التفتيش</Label>
            <Button size="sm" variant="outline" onClick={() => setCps([...cps, { name: "", time: new Date().toISOString().slice(0, 16), file: null }])}>
              <Plus className="h-3 w-3 ms-1" /> نقطة
            </Button>
          </div>
          {cps.map((c, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end border-t pt-2">
              <div className="col-span-4"><Label className="text-xs">اسم النقطة</Label><Input value={c.name} onChange={(e) => { const n = [...cps]; n[i].name = e.target.value; setCps(n); }} /></div>
              <div className="col-span-4"><Label className="text-xs">الوقت</Label><Input type="datetime-local" value={c.time} onChange={(e) => { const n = [...cps]; n[i].time = e.target.value; setCps(n); }} /></div>
              <div className="col-span-3"><Label className="text-xs">صورة</Label><Input type="file" accept="image/*" onChange={(e) => { const n = [...cps]; n[i].file = e.target.files?.[0] ?? null; setCps(n); }} /></div>
              <Button size="icon" variant="ghost" onClick={() => setCps(cps.filter((_, x) => x !== i))}><X className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />} حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================ INCIDENTS ============================ */

interface Incident {
  id: string;
  incident_number: string;
  incident_date: string;
  location: string;
  incident_type: string;
  description: string | null;
  actions_taken: string | null;
  status: IncidentStatus;
  closure_report: string | null;
  closed_at: string | null;
  photos: string[];
}

function IncidentsTab() {
  const { hasRole } = useAuth();
  const canManage = hasRole("super_admin") || hasRole("security_supervisor");
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [closeIncident, setCloseIncident] = useState<Incident | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("security_incidents")
      .select("*").order("incident_date", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Incident[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCount = items.filter(i => i.status === "مفتوح").length;

  return (
    <div className="space-y-4">
      {openCount > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{openCount} حادث مفتوح يحتاج إجراء</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الحوادث الأمنية</CardTitle>
          {canManage && (
            <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 ms-1" /> حادث جديد
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">لا توجد حوادث</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-32">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.incident_number}</TableCell>
                    <TableCell>{new Date(i.incident_date).toLocaleDateString("ar-EG")}</TableCell>
                    <TableCell>{i.location}</TableCell>
                    <TableCell>{i.incident_type}</TableCell>
                    <TableCell>
                      <Badge className={i.status === "مفتوح" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}>
                        {i.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canManage && i.status === "مفتوح" && (
                        <Button size="sm" variant="outline" onClick={() => setCloseIncident(i)}>
                          إغلاق
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IncidentDialog open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
      <CloseIncidentDialog incident={closeIncident} onClose={() => setCloseIncident(null)}
        onSaved={() => { setCloseIncident(null); load(); }} />
    </div>
  );
}

function IncidentDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    incident_date: new Date().toISOString().slice(0, 16),
    location: "", incident_type: "",
    description: "", actions_taken: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      setForm({
        incident_date: new Date().toISOString().slice(0, 16),
        location: "", incident_type: "", description: "", actions_taken: "",
      });
      setFiles([]);
    }
  }, [open]);

  const submit = async () => {
    if (!form.location.trim() || !form.incident_type.trim()) {
      toast.error("الموقع والنوع مطلوبان"); return;
    }
    setSaving(true);
    const photos: string[] = [];
    for (const f of files) {
      const path = `${Date.now()}_${f.name}`;
      const up = await supabase.storage.from("incident-photos").upload(path, f);
      if (!up.error) photos.push(path);
    }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("security_incidents").insert({
      incident_number: "",
      incident_date: new Date(form.incident_date).toISOString(),
      location: form.location, incident_type: form.incident_type,
      description: form.description || null,
      actions_taken: form.actions_taken || null,
      photos, created_by: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تسجيل الحادث");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تسجيل حادث أمني</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>التاريخ والوقت</Label><Input type="datetime-local" value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} /></div>
            <div><Label>الموقع *</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="col-span-2"><Label>نوع الحادث *</Label><Input value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value })} /></div>
          </div>
          <div><Label>وصف الحادث</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>الإجراءات المتخذة</Label><Textarea value={form.actions_taken} onChange={(e) => setForm({ ...form, actions_taken: e.target.value })} /></div>
          <div>
            <Label>صور</Label>
            <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            {files.length > 0 && <p className="text-xs text-muted-foreground mt-1">{files.length} ملف محدد</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />} حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseIncidentDialog({
  incident, onClose, onSaved,
}: { incident: Incident | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState("");
  useEffect(() => { if (incident) setReport(""); }, [incident]);
  if (!incident) return null;
  const submit = async () => {
    if (!report.trim()) { toast.error("تقرير الإغلاق إلزامي"); return; }
    setSaving(true);
    const { error } = await supabase.from("security_incidents").update({
      status: "مغلق", closure_report: report,
    }).eq("id", incident.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إغلاق الحادث");
    onSaved();
  };
  return (
    <Dialog open={!!incident} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>إغلاق الحادث {incident.incident_number}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">يجب كتابة تقرير الإغلاق قبل تأكيد العملية.</p>
          <div>
            <Label>تقرير الإغلاق *</Label>
            <Textarea rows={5} value={report} onChange={(e) => setReport(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>تراجع</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 ms-1 animate-spin" />} تأكيد الإغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
