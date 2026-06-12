import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Plus, AlertTriangle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/security/guards/$id")({
  component: GuardDetailsPage,
});

type TrainingType = "أمن" | "سلامة" | "إسعافات أولية";
type EvalType = "شهري" | "ربع سنوي";
type PRType = "مخالفة" | "إنذار" | "مكافأة";
type LeaveStatus = "قيد المراجعة" | "معتمدة" | "مرفوضة";

const TRAININGS: TrainingType[] = ["أمن", "سلامة", "إسعافات أولية"];
const EVAL_TYPES: EvalType[] = ["شهري", "ربع سنوي"];
const PR_TYPES: PRType[] = ["مخالفة", "إنذار", "مكافأة"];
const LEAVE_STATUSES: LeaveStatus[] = ["قيد المراجعة", "معتمدة", "مرفوضة"];

interface Guard {
  id: string;
  full_name: string;
  national_id: string | null;
  nationality: string | null;
  mobile: string | null;
  employee_number: string | null;
  security_company: string | null;
  job_title: string | null;
  start_date: string | null;
  contract_end_date: string | null;
  salary: number | null;
  direct_supervisor: string | null;
  shift_type: string | null;
  working_hours: string | null;
  working_days: string | null;
  photo_url: string | null;
}

function GuardDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/security/guards/$id" });
  const { hasRole } = useAuth();
  const isAdmin = hasRole("super_admin");
  const [guard, setGuard] = useState<Guard | null>(null);
  const [photoSigned, setPhotoSigned] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = isAdmin
      ? await supabase.from("guards").select("*").eq("id", id).maybeSingle()
      : await supabase.from("guards_safe").select("*").eq("id", id).maybeSingle();
    setGuard((q.data as unknown as Guard) ?? null);
    setLoading(false);
  }, [id, isAdmin]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!guard?.photo_url) { setPhotoSigned(null); return; }
    let active = true;
    supabase.storage.from("guards-photos").createSignedUrl(guard.photo_url, 600).then(({ data }) => {
      if (active && data) setPhotoSigned(data.signedUrl);
    });
    return () => { active = false; };
  }, [guard?.photo_url]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!guard) return <div className="py-20 text-center text-muted-foreground">الحارس غير موجود</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/security">
          <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4 ms-1" /> الأمن</Button>
        </Link>
        {photoSigned ? (
          <img src={photoSigned} alt={guard.full_name} className="h-12 w-12 rounded-full object-cover border" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><ShieldCheck className="h-6 w-6 text-muted-foreground" /></div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-primary">{guard.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {guard.employee_number ?? "—"} · {guard.security_company ?? "—"}
            {guard.shift_type && <> · <Badge variant="outline">{guard.shift_type}</Badge></>}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>البيانات الأساسية</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Info label="رقم الهوية" value={guard.national_id ?? "—"} />
          <Info label="الجنسية" value={guard.nationality ?? "—"} />
          <Info label="الجوال" value={guard.mobile ?? "—"} />
          <Info label="المسمى الوظيفي" value={guard.job_title ?? "—"} />
          <Info label="المشرف المباشر" value={guard.direct_supervisor ?? "—"} />
          <Info label="المباشرة" value={guard.start_date ?? "—"} />
          <Info label="نهاية العقد" value={guard.contract_end_date ?? "—"} />
          <Info label="ساعات العمل" value={guard.working_hours ?? "—"} />
          <Info label="أيام العمل" value={guard.working_days ?? "—"} />
          {isAdmin && <Info label="الراتب" value={guard.salary != null ? Number(guard.salary).toLocaleString("ar-EG") + " ر.س" : "—"} />}
        </CardContent>
      </Card>

      <Tabs defaultValue="attendance" dir="rtl">
        <TabsList>
          <TabsTrigger value="attendance">الحضور</TabsTrigger>
          <TabsTrigger value="leaves">الإجازات</TabsTrigger>
          <TabsTrigger value="trainings">الدورات</TabsTrigger>
          <TabsTrigger value="evaluations">التقييمات</TabsTrigger>
          <TabsTrigger value="pr">العقوبات والمكافآت</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance" className="mt-4"><AttendanceList guardId={id} /></TabsContent>
        <TabsContent value="leaves" className="mt-4"><LeavesList guardId={id} /></TabsContent>
        <TabsContent value="trainings" className="mt-4"><TrainingsList guardId={id} /></TabsContent>
        <TabsContent value="evaluations" className="mt-4"><EvaluationsList guardId={id} /></TabsContent>
        <TabsContent value="pr" className="mt-4"><PRList guardId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function useCanManage() {
  const { hasRole } = useAuth();
  return hasRole("super_admin") || hasRole("security_supervisor");
}

/* ============================ ATTENDANCE ============================ */
interface Attendance { id: string; attendance_date: string; check_in: string | null; check_out: string | null; notes: string | null; }
function AttendanceList({ guardId }: { guardId: string }) {
  const canManage = useCanManage();
  const [items, setItems] = useState<Attendance[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ attendance_date: new Date().toISOString().slice(0,10), check_in: "", check_out: "", notes: "" });
  const load = useCallback(async () => {
    const { data } = await supabase.from("guard_attendance").select("*").eq("guard_id", guardId).order("attendance_date", { ascending: false });
    setItems((data as Attendance[]) ?? []);
  }, [guardId]);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("guard_attendance").insert({
      guard_id: guardId, attendance_date: form.attendance_date,
      check_in: form.check_in || null, check_out: form.check_out || null,
      notes: form.notes || null, created_by: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setForm({ attendance_date: new Date().toISOString().slice(0,10), check_in: "", check_out: "", notes: "" });
    load();
  };
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>سجل الحضور</CardTitle>
        {canManage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 ms-1" /> تسجيل</Button>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا يوجد سجل</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>التاريخ</TableHead><TableHead>الحضور</TableHead><TableHead>الانصراف</TableHead><TableHead>ملاحظات</TableHead>
            </TableRow></TableHeader>
            <TableBody>{items.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.attendance_date}</TableCell><TableCell>{a.check_in ?? "—"}</TableCell>
                <TableCell>{a.check_out ?? "—"}</TableCell><TableCell>{a.notes ?? "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تسجيل حضور</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>التاريخ</Label><Input type="date" value={form.attendance_date} onChange={(e) => setForm({...form, attendance_date: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الحضور</Label><Input type="time" value={form.check_in} onChange={(e) => setForm({...form, check_in: e.target.value})} /></div>
              <div><Label>الانصراف</Label><Input type="time" value={form.check_out} onChange={(e) => setForm({...form, check_out: e.target.value})} /></div>
            </div>
            <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={submit}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============================ LEAVES ============================ */
interface Leave { id: string; leave_type: string; from_date: string; to_date: string; status: LeaveStatus; notes: string | null; }
function LeavesList({ guardId }: { guardId: string }) {
  const canManage = useCanManage();
  const [items, setItems] = useState<Leave[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: "", from_date: "", to_date: "", status: "قيد المراجعة" as LeaveStatus, notes: "" });
  const load = useCallback(async () => {
    const { data } = await supabase.from("guard_leaves").select("*").eq("guard_id", guardId).order("from_date", { ascending: false });
    setItems((data as Leave[]) ?? []);
  }, [guardId]);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    if (!form.leave_type || !form.from_date || !form.to_date) { toast.error("الحقول المطلوبة"); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("guard_leaves").insert({
      guard_id: guardId, leave_type: form.leave_type, from_date: form.from_date, to_date: form.to_date,
      status: form.status, notes: form.notes || null, created_by: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); load();
  };
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>الإجازات</CardTitle>
        {canManage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 ms-1" /> إضافة</Button>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا توجد إجازات</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>النوع</TableHead><TableHead>من</TableHead><TableHead>إلى</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>{items.map(l => (
              <TableRow key={l.id}>
                <TableCell>{l.leave_type}</TableCell><TableCell>{l.from_date}</TableCell><TableCell>{l.to_date}</TableCell>
                <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إضافة إجازة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>النوع *</Label><Input value={form.leave_type} onChange={(e) => setForm({...form, leave_type: e.target.value})} placeholder="سنوية / مرضية..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>من *</Label><Input type="date" value={form.from_date} onChange={(e) => setForm({...form, from_date: e.target.value})} /></div>
              <div><Label>إلى *</Label><Input type="date" value={form.to_date} onChange={(e) => setForm({...form, to_date: e.target.value})} /></div>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v as LeaveStatus})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={submit}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============================ TRAININGS ============================ */
interface Training { id: string; training_type: TrainingType; issue_date: string | null; expiry_date: string | null; notes: string | null; }
function TrainingsList({ guardId }: { guardId: string }) {
  const canManage = useCanManage();
  const [items, setItems] = useState<Training[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ training_type: "أمن" as TrainingType, issue_date: "", expiry_date: "", notes: "" });
  const load = useCallback(async () => {
    const { data } = await supabase.from("guard_trainings").select("*").eq("guard_id", guardId).order("expiry_date", { ascending: true });
    setItems((data as Training[]) ?? []);
  }, [guardId]);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("guard_trainings").insert({
      guard_id: guardId, training_type: form.training_type,
      issue_date: form.issue_date || null, expiry_date: form.expiry_date || null,
      notes: form.notes || null, created_by: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); load();
  };
  const today = new Date(); const limit = new Date(); limit.setDate(today.getDate() + 60);
  const expiring = items.filter(t => t.expiry_date && new Date(t.expiry_date) <= limit);
  return (
    <div className="space-y-3">
      {expiring.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-3 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">{expiring.length} دورة منتهية أو تنتهي خلال 60 يومًا</span>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>الدورات التدريبية</CardTitle>
          {canManage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 ms-1" /> إضافة</Button>}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا توجد دورات</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>النوع</TableHead><TableHead>تاريخ الحصول</TableHead><TableHead>تاريخ الانتهاء</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>{items.map(t => {
                const exp = t.expiry_date ? new Date(t.expiry_date) : null;
                const isExpiring = exp && exp <= limit;
                return (
                  <TableRow key={t.id} className={isExpiring ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                    <TableCell><Badge variant="outline">{t.training_type}</Badge></TableCell>
                    <TableCell>{t.issue_date ?? "—"}</TableCell>
                    <TableCell>{t.expiry_date ?? "—"}</TableCell>
                    <TableCell>{isExpiring ? <Badge className="bg-red-100 text-red-800">تحتاج تجديد</Badge> : <Badge className="bg-emerald-100 text-emerald-800">سارية</Badge>}</TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          )}
        </CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إضافة دورة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>النوع</Label>
                <Select value={form.training_type} onValueChange={(v) => setForm({...form, training_type: v as TrainingType})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRAININGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ الحصول</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({...form, issue_date: e.target.value})} /></div>
                <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({...form, expiry_date: e.target.value})} /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={submit}>حفظ</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}

/* ============================ EVALUATIONS ============================ */
interface Evaluation { id: string; evaluation_type: EvalType; evaluation_date: string; score: number | null; notes: string | null; }
function EvaluationsList({ guardId }: { guardId: string }) {
  const canManage = useCanManage();
  const [items, setItems] = useState<Evaluation[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ evaluation_type: "شهري" as EvalType, evaluation_date: new Date().toISOString().slice(0,10), score: "", notes: "" });
  const load = useCallback(async () => {
    const { data } = await supabase.from("guard_evaluations").select("*").eq("guard_id", guardId).order("evaluation_date", { ascending: false });
    setItems((data as Evaluation[]) ?? []);
  }, [guardId]);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    const s = Number(form.score);
    if (form.score && (s < 0 || s > 10)) { toast.error("الدرجة بين 0 و 10"); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("guard_evaluations").insert({
      guard_id: guardId, evaluation_type: form.evaluation_type,
      evaluation_date: form.evaluation_date,
      score: form.score ? s : null, notes: form.notes || null, created_by: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); load();
  };
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>التقييمات</CardTitle>
        {canManage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 ms-1" /> إضافة</Button>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا توجد تقييمات</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>النوع</TableHead><TableHead>التاريخ</TableHead><TableHead>الدرجة /10</TableHead><TableHead>ملاحظات</TableHead>
            </TableRow></TableHeader>
            <TableBody>{items.map(e => (
              <TableRow key={e.id}>
                <TableCell><Badge variant="outline">{e.evaluation_type}</Badge></TableCell>
                <TableCell>{e.evaluation_date}</TableCell>
                <TableCell className="font-semibold">{e.score ?? "—"}</TableCell>
                <TableCell>{e.notes ?? "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تقييم</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>النوع</Label>
              <Select value={form.evaluation_type} onValueChange={(v) => setForm({...form, evaluation_type: v as EvalType})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>التاريخ</Label><Input type="date" value={form.evaluation_date} onChange={(e) => setForm({...form, evaluation_date: e.target.value})} /></div>
              <div><Label>الدرجة /10</Label><Input type="number" min="0" max="10" step="0.5" value={form.score} onChange={(e) => setForm({...form, score: e.target.value})} /></div>
            </div>
            <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={submit}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ============================ PENALTIES / REWARDS ============================ */
interface PR { id: string; pr_type: PRType; pr_date: string; details: string | null; }
const PR_STYLE: Record<PRType, string> = {
  "مخالفة": "bg-red-100 text-red-800",
  "إنذار": "bg-amber-100 text-amber-800",
  "مكافأة": "bg-emerald-100 text-emerald-800",
};
function PRList({ guardId }: { guardId: string }) {
  const canManage = useCanManage();
  const [items, setItems] = useState<PR[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ pr_type: "مخالفة" as PRType, pr_date: new Date().toISOString().slice(0,10), details: "" });
  const load = useCallback(async () => {
    const { data } = await supabase.from("guard_penalties_rewards").select("*").eq("guard_id", guardId).order("pr_date", { ascending: false });
    setItems((data as PR[]) ?? []);
  }, [guardId]);
  useEffect(() => { load(); }, [load]);
  const submit = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("guard_penalties_rewards").insert({
      guard_id: guardId, pr_type: form.pr_type, pr_date: form.pr_date,
      details: form.details || null, created_by: u.user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); load();
  };
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>العقوبات والمكافآت</CardTitle>
        {canManage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3 w-3 ms-1" /> إضافة</Button>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا يوجد سجل</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>النوع</TableHead><TableHead>التاريخ</TableHead><TableHead>التفاصيل</TableHead></TableRow></TableHeader>
            <TableBody>{items.map(p => (
              <TableRow key={p.id}>
                <TableCell><Badge className={PR_STYLE[p.pr_type]}>{p.pr_type}</Badge></TableCell>
                <TableCell>{p.pr_date}</TableCell><TableCell>{p.details ?? "—"}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>عقوبة / مكافأة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>النوع</Label>
              <Select value={form.pr_type} onValueChange={(v) => setForm({...form, pr_type: v as PRType})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>التاريخ</Label><Input type="date" value={form.pr_date} onChange={(e) => setForm({...form, pr_date: e.target.value})} /></div>
            <div><Label>التفاصيل</Label><Textarea value={form.details} onChange={(e) => setForm({...form, details: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={submit}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
