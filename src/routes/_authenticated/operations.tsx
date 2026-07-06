import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Camera, AlertTriangle, Wrench, ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeePicker } from "@/components/employee-picker";
import { toast } from "sonner";
import { DeleteArchiveMenu } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/operations")({
  component: OperationsPage,
});

type Frequency = "يومي" | "أسبوعي" | "شهري";
type CameraStatus = "تعمل" | "معطلة" | "تحت الصيانة";

const FREQS: Frequency[] = ["يومي", "أسبوعي", "شهري"];
const CAM_STATUS: CameraStatus[] = ["تعمل", "معطلة", "تحت الصيانة"];

const CAM_STATUS_STYLE: Record<CameraStatus, string> = {
  "تعمل": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "معطلة": "bg-red-100 text-red-800 border-red-200",
  "تحت الصيانة": "bg-amber-100 text-amber-800 border-amber-200",
};

function OperationsPage() {
  const { activePropertyId } = useActiveProperty();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">التشغيل</h1>
        <p className="text-sm text-muted-foreground">إدارة عمليات التشغيل اليومية</p>
      </div>
      <Tabs defaultValue="cleaning" dir="rtl">
        <TabsList>
          <TabsTrigger value="cleaning"><Sparkles className="h-4 w-4 ms-1" /> النظافة</TabsTrigger>
          <TabsTrigger value="cameras"><Camera className="h-4 w-4 ms-1" /> الكاميرات</TabsTrigger>
        </TabsList>
        <TabsContent value="cleaning" className="mt-4"><CleaningTab /></TabsContent>
        <TabsContent value="cameras" className="mt-4"><CamerasTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------- CLEANING ------------------------------- */

interface CleaningPlan {
  id: string;
  area: string;
  frequency: Frequency;
  contractor_company: string | null;
  supervisor: string | null;
  notes: string | null;
}

interface CleaningLog {
  id: string;
  plan_id: string;
  execution_date: string;
  executed_by: string | null;
  notes: string | null;
  before_photo_path: string | null;
  after_photo_path: string | null;
}

function CleaningTab() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyPermission, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin || hasAnyPermission(["cleaning.manage"]);
  const [plans, setPlans] = useState<CleaningPlan[]>([]);
  const [logs, setLogs] = useState<CleaningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [planOpen, setPlanOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, l] = await Promise.all([scoped(supabase.from("cleaning_plans").select("*"), activePropertyId).order("created_at", { ascending: false }),
      supabase.from("cleaning_logs").select("*").order("execution_date", { ascending: false }).limit(100),
    ]);
    if (p.error) toast.error(p.error.message);
    if (l.error) toast.error(l.error.message);
    setPlans((p.data as CleaningPlan[]) ?? []);
    setLogs((l.data as CleaningLog[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>خطط النظافة</CardTitle>
          {canManage && (
            <Button onClick={() => setPlanOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 ms-1" /> إضافة خطة
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : plans.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">لا توجد خطط</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنطقة</TableHead>
                  <TableHead>التكرار</TableHead>
                  <TableHead>شركة المقاول</TableHead>
                  <TableHead>المشرف</TableHead>
                  <TableHead className="w-32">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.area}</TableCell>
                    <TableCell><Badge variant="outline">{p.frequency}</Badge></TableCell>
                    <TableCell>{p.contractor_company || "—"}</TableCell>
                    <TableCell>{p.supervisor || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {canManage && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedPlanId(p.id); setLogOpen(true); }}>
                            + تنفيذ
                          </Button>
                        )}
                        <DeleteArchiveMenu table="cleaning_plans" id={p.id} entityLabel={p.area} onDone={load} compact />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>سجلات التنفيذ (قبل / بعد)</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">لا توجد سجلات</div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => {
                const plan = plans.find(p => p.id === log.plan_id);
                return (
                  <div key={log.id} className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <div>
                        <div className="font-medium">{plan?.area ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.execution_date} · {log.executed_by || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <PhotoSlot label="قبل" path={log.before_photo_path} />
                      <PhotoSlot label="بعد" path={log.after_photo_path} />
                    </div>
                    {log.notes && <p className="text-sm mt-2 text-muted-foreground">{log.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PlanDialog open={planOpen} onClose={() => setPlanOpen(false)} onSaved={() => { setPlanOpen(false); load(); }} />
      <LogDialog
        open={logOpen} onClose={() => setLogOpen(false)} plans={plans} initialPlanId={selectedPlanId}
        onSaved={() => { setLogOpen(false); load(); }}
      />
    </div>
  );
}

function PhotoSlot({ label, path }: { label: string; path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let active = true;
    supabase.storage.from("cleaning-photos").createSignedUrl(path, 600).then(({ data }) => {
      if (active && data) setUrl(data.signedUrl);
    });
    return () => { active = false; };
  }, [path]);
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {url ? (
        <img src={url} alt={label} className="w-full h-40 object-cover rounded-md border" />
      ) : (
        <div className="w-full h-40 rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-xs">
          لا توجد صورة
        </div>
      )}
    </div>
  );
}

type CleaningContractOpt = { id: string; vendor_name: string | null; contract_number: string | null };

function PlanDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ area: "", frequency: "يومي" as Frequency, contractor_company: "", supervisor: "", notes: "" });
  const [contracts, setContracts] = useState<CleaningContractOpt[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [supervisorEmpId, setSupervisorEmpId] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({ vendor_name: "", contract_number: "", start_date: "", end_date: "" });

  const loadContracts = async () => {
    const { data } = await (supabase as any)
      .from("cleaning_contracts")
      .select("id, vendor_name, contract_number, status")
      .in("status", ["ساري", "مسودة", "قيد المراجعة", "بانتظار الاعتماد", "تحت التجديد"])
      .order("vendor_name");
    setContracts((data ?? []) as CleaningContractOpt[]);
  };

  useEffect(() => {
    if (open) {
      setForm({ area: "", frequency: "يومي", contractor_company: "", supervisor: "", notes: "" });
      setSelectedContractId("");
      setSupervisorEmpId(null);
      loadContracts();
    }
  }, [open]);

  const submit = async () => {
    if (!form.area.trim()) { toast.error("الرجاء إدخال المنطقة"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("cleaning_plans").insert({
      area: form.area, frequency: form.frequency,
      contractor_company: form.contractor_company || null,
      supervisor: form.supervisor || null, notes: form.notes || null,
      created_by: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة الخطة");
    onSaved();
  };

  const quickAddContract = async () => {
    if (!quickForm.vendor_name.trim()) { toast.error("اسم شركة النظافة مطلوب"); return; }
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await (supabase as any).from("cleaning_contracts").insert({
      vendor_name: quickForm.vendor_name.trim(),
      contract_number: quickForm.contract_number || null,
      start_date: quickForm.start_date || null,
      end_date: quickForm.end_date || null,
      cleaning_type: "عقد خدمات نظافة",
      status: "مسودة",
      created_by: u.user?.id,
    }).select("id, vendor_name, contract_number").single();
    if (error) { toast.error(error.message); return; }
    toast.success("تم إنشاء العقد");
    setContracts((p) => [...p, data as CleaningContractOpt]);
    setSelectedContractId(data.id);
    setForm((f) => ({ ...f, contractor_company: data.vendor_name ?? "" }));
    setQuickOpen(false);
    setQuickForm({ vendor_name: "", contract_number: "", start_date: "", end_date: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>إضافة خطة نظافة</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>المنطقة *</Label><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
          <div>
            <Label>التكرار</Label>
            <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as Frequency })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FREQS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>شركة النظافة (من العقود)</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={selectedContractId}
                  onValueChange={(v) => {
                    setSelectedContractId(v);
                    const c = contracts.find((x) => x.id === v);
                    setForm((f) => ({ ...f, contractor_company: c?.vendor_name ?? "" }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="اختر عقد نظافة" /></SelectTrigger>
                  <SelectContent>
                    {contracts.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">لا توجد عقود</div>
                    ) : contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.vendor_name ?? "—"} {c.contract_number ? `(${c.contract_number})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setQuickOpen(true)} title="إضافة عقد جديد">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>المشرف (من الموظفين)</Label>
            <EmployeePicker
              value={supervisorEmpId}
              onChange={(empId, emp) => {
                setSupervisorEmpId(empId);
                setForm((f) => ({ ...f, supervisor: emp?.full_name ?? "" }));
              }}
              defaultDepartment="النظافة"
              defaultEmployer="شركة نظافة"
              placeholder="اختر مشرف نظافة"
            />
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

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>إضافة عقد نظافة سريع</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>اسم شركة النظافة *</Label><Input value={quickForm.vendor_name} onChange={(e) => setQuickForm({ ...quickForm, vendor_name: e.target.value })} /></div>
            <div><Label>رقم العقد</Label><Input value={quickForm.contract_number} onChange={(e) => setQuickForm({ ...quickForm, contract_number: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>تاريخ البداية</Label><Input type="date" value={quickForm.start_date} onChange={(e) => setQuickForm({ ...quickForm, start_date: e.target.value })} /></div>
              <div><Label>تاريخ النهاية</Label><Input type="date" value={quickForm.end_date} onChange={(e) => setQuickForm({ ...quickForm, end_date: e.target.value })} /></div>
            </div>
            <p className="text-xs text-muted-foreground">
              سيتم حفظ العقد بحالة "مسودة" في صفحة عقود النظافة لاستكمال بياناته لاحقًا.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickOpen(false)}>إلغاء</Button>
            <Button onClick={quickAddContract}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function LogDialog({
  open, onClose, plans, initialPlanId, onSaved,
}: { open: boolean; onClose: () => void; plans: CleaningPlan[]; initialPlanId: string | null; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState<string>("");
  const [executionDate, setExecutionDate] = useState(new Date().toISOString().slice(0, 10));
  const [executedBy, setExecutedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setPlanId(initialPlanId ?? "");
      setExecutionDate(new Date().toISOString().slice(0, 10));
      setExecutedBy(""); setNotes(""); setBeforeFile(null); setAfterFile(null);
    }
  }, [open, initialPlanId]);

  const uploadOne = async (file: File, kind: "before" | "after"): Promise<string | null> => {
    const path = `${planId}/${Date.now()}_${kind}_${file.name}`;
    const { error } = await supabase.storage.from("cleaning-photos").upload(path, file);
    if (error) { toast.error("فشل رفع صورة " + kind + ": " + error.message); return null; }
    return path;
  };

  const submit = async () => {
    if (!planId) { toast.error("اختر الخطة"); return; }
    setSaving(true);
    let beforePath: string | null = null;
    let afterPath: string | null = null;
    if (beforeFile) beforePath = await uploadOne(beforeFile, "before");
    if (afterFile) afterPath = await uploadOne(afterFile, "after");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("cleaning_logs").insert({
      plan_id: planId, execution_date: executionDate,
      executed_by: executedBy || null, notes: notes || null,
      before_photo_path: beforePath, after_photo_path: afterPath,
      created_by: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تسجيل التنفيذ");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>تسجيل تنفيذ نظافة</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>الخطة *</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="اختر خطة" /></SelectTrigger>
              <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.area} ({p.frequency})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>التاريخ</Label><Input type="date" value={executionDate} onChange={(e) => setExecutionDate(e.target.value)} /></div>
            <div><Label>المنفذ</Label><Input value={executedBy} onChange={(e) => setExecutedBy(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>صورة قبل</Label>
              <Input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label>صورة بعد</Label>
              <Input type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div><Label>ملاحظات</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
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

/* ------------------------------- CAMERAS ------------------------------- */

interface CameraRow {
  id: string;
  camera_number: string;
  location: string;
  camera_type: string | null;
  status: CameraStatus;
  next_maintenance_date: string | null;
  notes: string | null;
}

interface MaintLog {
  id: string;
  camera_id: string;
  maintenance_date: string;
  next_maintenance_date: string | null;
  issue_description: string | null;
  notes: string | null;
}

function CamerasTab() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyPermission, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin || hasAnyPermission(["patrols.create","incidents.create","guards.manage_attendance"]);
  const [cameras, setCameras] = useState<CameraRow[]>([]);
  const [logs, setLogs] = useState<MaintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [camOpen, setCamOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [selectedCam, setSelectedCam] = useState<CameraRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, m] = await Promise.all([scoped(supabase.from("cameras").select("*"), activePropertyId).order("camera_number"),
      supabase.from("camera_maintenance_logs").select("*").order("maintenance_date", { ascending: false }).limit(100),
    ]);
    if (c.error) toast.error(c.error.message);
    if (m.error) toast.error(m.error.message);
    setCameras((c.data as CameraRow[]) ?? []);
    setLogs((m.data as MaintLog[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const broken = useMemo(() => cameras.filter(c => c.status === "معطلة"), [cameras]);
  const dueMaint = useMemo(() => cameras.filter(c => c.next_maintenance_date && c.next_maintenance_date <= today), [cameras, today]);

  return (
    <div className="space-y-4">
      {(broken.length > 0 || dueMaint.length > 0) && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> تنبيهات الكاميرات
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold mb-2">معطلة ({broken.length})</div>
              {broken.length === 0 ? <div className="text-muted-foreground">لا يوجد</div> :
                broken.map(c => <div key={c.id}>• {c.camera_number} — {c.location}</div>)}
            </div>
            <div>
              <div className="font-semibold mb-2">حان موعد صيانتها ({dueMaint.length})</div>
              {dueMaint.length === 0 ? <div className="text-muted-foreground">لا يوجد</div> :
                dueMaint.map(c => <div key={c.id}>• {c.camera_number} — {c.location} ({c.next_maintenance_date})</div>)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الكاميرات</CardTitle>
          {canManage && (
            <Button onClick={() => setCamOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 ms-1" /> إضافة كاميرا
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : cameras.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">لا توجد كاميرات</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الصيانة القادمة</TableHead>
                  <TableHead className="w-40">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cameras.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.camera_number}</TableCell>
                    <TableCell>{c.location}</TableCell>
                    <TableCell>{c.camera_type || "—"}</TableCell>
                    <TableCell><Badge className={CAM_STATUS_STYLE[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>{c.next_maintenance_date || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {canManage && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedCam(c); setMaintOpen(true); }}>
                            <Wrench className="h-3 w-3 ms-1" /> صيانة
                          </Button>
                        )}
                        <DeleteArchiveMenu table="cameras" id={c.id} entityLabel={c.camera_number} onDone={load} compact />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>سجل الصيانة</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">لا يوجد سجل</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكاميرا</TableHead>
                  <TableHead>تاريخ الصيانة</TableHead>
                  <TableHead>الصيانة القادمة</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(l => {
                  const cam = cameras.find(c => c.id === l.camera_id);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>{cam?.camera_number ?? "—"}</TableCell>
                      <TableCell>{l.maintenance_date}</TableCell>
                      <TableCell>{l.next_maintenance_date || "—"}</TableCell>
                      <TableCell>{l.issue_description || "—"}</TableCell>
                      <TableCell>{l.notes || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CameraDialog open={camOpen} onClose={() => setCamOpen(false)} onSaved={() => { setCamOpen(false); load(); }} />
      <MaintenanceDialog
        open={maintOpen} onClose={() => setMaintOpen(false)} camera={selectedCam}
        onSaved={() => { setMaintOpen(false); load(); }}
      />
    </div>
  );
}

function CameraDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    camera_number: "", location: "", camera_type: "",
    status: "تعمل" as CameraStatus, next_maintenance_date: "", notes: "",
  });
  useEffect(() => {
    if (open) setForm({ camera_number: "", location: "", camera_type: "", status: "تعمل", next_maintenance_date: "", notes: "" });
  }, [open]);
  const submit = async () => {
    if (!form.camera_number.trim() || !form.location.trim()) { toast.error("الرقم والموقع مطلوبان"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("cameras").insert({
      camera_number: form.camera_number, location: form.location,
      camera_type: form.camera_type || null, status: form.status,
      next_maintenance_date: form.next_maintenance_date || null,
      notes: form.notes || null, created_by: u.user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة الكاميرا");
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>إضافة كاميرا</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>رقم الكاميرا *</Label><Input value={form.camera_number} onChange={(e) => setForm({ ...form, camera_number: e.target.value })} /></div>
            <div><Label>الموقع *</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>النوع</Label><Input value={form.camera_type} onChange={(e) => setForm({ ...form, camera_type: e.target.value })} /></div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CameraStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAM_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>تاريخ الصيانة القادمة</Label><Input type="date" value={form.next_maintenance_date} onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })} /></div>
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

function MaintenanceDialog({
  open, onClose, camera, onSaved,
}: { open: boolean; onClose: () => void; camera: CameraRow | null; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    maintenance_date: new Date().toISOString().slice(0, 10),
    next_maintenance_date: "", issue_description: "", notes: "",
    new_status: "تعمل" as CameraStatus,
  });
  useEffect(() => {
    if (open && camera) setForm({
      maintenance_date: new Date().toISOString().slice(0, 10),
      next_maintenance_date: "", issue_description: "", notes: "",
      new_status: camera.status,
    });
  }, [open, camera]);

  const submit = async () => {
    if (!camera) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("camera_maintenance_logs").insert({
      camera_id: camera.id,
      maintenance_date: form.maintenance_date,
      next_maintenance_date: form.next_maintenance_date || null,
      issue_description: form.issue_description || null,
      notes: form.notes || null,
      created_by: u.user?.id,
    });
    if (!error && form.new_status !== camera.status) {
      await supabase.from("cameras").update({ status: form.new_status }).eq("id", camera.id);
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تسجيل الصيانة");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>صيانة الكاميرا {camera?.camera_number}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>تاريخ الصيانة</Label><Input type="date" value={form.maintenance_date} onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })} /></div>
            <div><Label>الصيانة القادمة</Label><Input type="date" value={form.next_maintenance_date} onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })} /></div>
          </div>
          <div>
            <Label>الحالة الجديدة</Label>
            <Select value={form.new_status} onValueChange={(v) => setForm({ ...form, new_status: v as CameraStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CAM_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>وصف العطل</Label><Textarea value={form.issue_description} onChange={(e) => setForm({ ...form, issue_description: e.target.value })} /></div>
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
