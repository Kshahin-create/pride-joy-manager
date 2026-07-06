import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Car, Plus, ClipboardCheck, Sparkles, AlertOctagon, LayoutGrid, Table as TableIcon } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import { DeleteArchiveMenu } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/parking")({ component: ParkingPage });

type SpotStatus = "متاح" | "مخصص" | "مشغول" | "صيانة";
type SpotType = "عادي" | "VIP" | "ذوي احتياجات";
type Spot = {
  id: string;
  spot_number: string;
  floor: string;
  location_description: string | null;
  spot_type: SpotType;
  office_id: string | null;
  camera_id: string | null;
  coverage_notes: string | null;
  status: SpotStatus;
  notes: string | null;
};
type Office = { id: string; code: string };
type Camera = { id: string; camera_number: string; location: string | null };
type Check = any;
type Cleaning = any;
type Violation = any;

const STATUS_COLORS: Record<SpotStatus, string> = {
  "متاح": "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  "مخصص": "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300",
  "مشغول": "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300",
  "صيانة": "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300",
};

const CHECK_ITEMS = [
  ["floors_status", "الأرضيات"],
  ["paint_status", "الدهانات"],
  ["signage_status", "اللوحات الإرشادية"],
  ["bumpers_status", "مصدات السيارات"],
  ["gates_status", "البوابات"],
  ["fire_pipes_status", "مواسير الدفاع المدني"],
  ["fire_hoses_status", "خراطيم الحريق"],
] as const;

function ParkingPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyPermission, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin || hasAnyPermission(["parking.manage","parking.violations"]);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [view, setView] = useState<"grid" | "table">("grid");

  const [assignSpot, setAssignSpot] = useState<Spot | null>(null);
  const [assignForm, setAssignForm] = useState<{ office_id?: string; camera_id?: string; status?: SpotStatus; coverage_notes?: string }>({});

  const [checkOpen, setCheckOpen] = useState(false);
  const [checkForm, setCheckForm] = useState<any>({ check_date: new Date().toISOString().slice(0, 10) });

  const [cleanOpen, setCleanOpen] = useState(false);
  const [cleanForm, setCleanForm] = useState<any>({ cleaning_date: new Date().toISOString().slice(0, 10) });
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  const [violOpen, setViolOpen] = useState(false);
  const [violForm, setViolForm] = useState<any>({ violation_date: new Date().toISOString().slice(0, 10) });
  const [violFiles, setViolFiles] = useState<FileList | null>(null);

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const load = async () => {
    const [s, o, c, mc, cl, vi] = await Promise.all([scoped((supabase as any).from("parking_spots").select("*"), activePropertyId).order("floor").order("spot_number"),
      (supabase as any).from("offices").select("id, code").order("code"),scoped((supabase as any).from("cameras").select("id, camera_number, location"), activePropertyId).order("camera_number"),
      (supabase as any).from("parking_maintenance_checks").select("*").order("check_date", { ascending: false }),
      (supabase as any).from("parking_cleaning_logs").select("*").order("cleaning_date", { ascending: false }),
      (supabase as any).from("parking_violations").select("*, parking_spots(spot_number, floor)").order("violation_date", { ascending: false }),
    ]);
    if (s.error) toast.error(s.error.message);
    setSpots((s.data ?? []) as Spot[]);
    setOffices((o.data ?? []) as Office[]);
    setCameras((c.data ?? []) as Camera[]);
    setChecks(mc.data ?? []);
    setCleanings(cl.data ?? []);
    setViolations(vi.data ?? []);

    // sign cleaning photos
    const urls: Record<string, string> = {};
    for (const log of (cl.data ?? []) as any[]) {
      for (const k of ["before_photo_url", "after_photo_url"] as const) {
        if (log[k]) {
          const { data } = await (supabase as any).storage.from("parking-photos").createSignedUrl(log[k], 3600);
          if (data?.signedUrl) urls[log[k]] = data.signedUrl;
        }
      }
    }
    for (const v of (vi.data ?? []) as any[]) {
      for (const p of v.photo_urls ?? []) {
        const { data } = await (supabase as any).storage.from("parking-photos").createSignedUrl(p, 3600);
        if (data?.signedUrl) urls[p] = data.signedUrl;
      }
    }
    setSignedUrls(urls);
  };
  useEffect(() => { load(); }, []);

  const allFloors = ["P1","P2","P3","P4","P5","P6","P7","P8","P9"] as const;
  const byFloor = useMemo(() => {
    const g: Record<string, Spot[]> = Object.fromEntries(allFloors.map((f) => [f, []]));
    spots.forEach((s) => { if (g[s.floor]) g[s.floor].push(s); });
    return g;
  }, [spots]);
  const activeFloors = useMemo(() => allFloors.filter((f) => byFloor[f].length > 0), [byFloor]);

  const counts = useMemo(() => {
    const c: Record<SpotStatus, number> = { "متاح": 0, "مخصص": 0, "مشغول": 0, "صيانة": 0 };
    spots.forEach((s) => (c[s.status] = (c[s.status] ?? 0) + 1));
    return c;
  }, [spots]);

  const openAssign = (s: Spot) => {
    if (!canManage) return;
    setAssignSpot(s);
    setAssignForm({
      office_id: s.office_id ?? undefined,
      camera_id: s.camera_id ?? undefined,
      status: s.status,
      coverage_notes: s.coverage_notes ?? "",
    });
  };
  const saveAssign = async () => {
    if (!assignSpot) return;
    const patch: any = {
      office_id: assignForm.office_id || null,
      camera_id: assignForm.camera_id || null,
      status: assignForm.status,
      coverage_notes: assignForm.coverage_notes || null,
    };
    if (assignForm.office_id && assignSpot.status === "متاح") patch.status = "مخصص";
    const { error } = await (supabase as any).from("parking_spots").update(patch).eq("id", assignSpot.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setAssignSpot(null); load();
  };

  const saveCheck = async () => {
    const payload: any = { check_date: checkForm.check_date, next_check_date: checkForm.next_check_date || null, notes: checkForm.notes || null };
    for (const [k] of CHECK_ITEMS) payload[k] = checkForm[k] || "سليم";
    const { error } = await (supabase as any).from("parking_maintenance_checks").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الفحص"); setCheckOpen(false); setCheckForm({ check_date: new Date().toISOString().slice(0, 10) }); load();
  };

  const uploadOne = async (f: File) => {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`;
    const { error } = await (supabase as any).storage.from("parking-photos").upload(path, f);
    if (error) throw error;
    return path;
  };
  const saveCleaning = async () => {
    try {
      const before = beforeFile ? await uploadOne(beforeFile) : null;
      const after = afterFile ? await uploadOne(afterFile) : null;
      const { error } = await (supabase as any).from("parking_cleaning_logs").insert({
        cleaning_date: cleanForm.cleaning_date,
        responsible: cleanForm.responsible || null,
        notes: cleanForm.notes || null,
        before_photo_url: before, after_photo_url: after,
      });
      if (error) throw error;
      toast.success("تم التسجيل");
      setCleanOpen(false); setCleanForm({ cleaning_date: new Date().toISOString().slice(0, 10) }); setBeforeFile(null); setAfterFile(null); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const saveViolation = async () => {
    try {
      const paths: string[] = [];
      if (violFiles) for (const f of Array.from(violFiles)) paths.push(await uploadOne(f));
      const { error } = await (supabase as any).from("parking_violations").insert({
        violation_date: violForm.violation_date,
        spot_id: violForm.spot_id || null,
        violation_type: violForm.violation_type,
        description: violForm.description || null,
        status: "مفتوحة",
        photo_urls: paths,
      });
      if (error) throw error;
      toast.success("تم تسجيل المخالفة");
      setViolOpen(false); setViolForm({ violation_date: new Date().toISOString().slice(0, 10) }); setViolFiles(null); load();
    } catch (e: any) { toast.error(e.message); }
  };

  const resolveViolation = async (id: string) => {
    const { error } = await (supabase as any).from("parking_violations").update({ status: "محلولة", resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الإغلاق"); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Car className="h-6 w-6 text-gold" /> المواقف</h1>
        <p className="text-sm text-muted-foreground">إدارة مواقف السيارات والفحص الدوري والنظافة والمخالفات</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["متاح", "مخصص", "مشغول", "صيانة"] as SpotStatus[]).map((s) => (
          <Card key={s}><CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">{s}</div>
            <div className="text-2xl font-bold mt-1">{counts[s]}</div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="spots">
        <TabsList>
          <TabsTrigger value="spots">المواقف</TabsTrigger>
          <TabsTrigger value="checks">الفحص الدوري</TabsTrigger>
          <TabsTrigger value="cleaning">النظافة</TabsTrigger>
          <TabsTrigger value="violations">المخالفات</TabsTrigger>
        </TabsList>

        <TabsContent value="spots">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>عرض المواقف حسب الدور</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")}>
                  <LayoutGrid className="h-4 w-4 me-1" /> شبكي
                </Button>
                <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
                  <TableIcon className="h-4 w-4 me-1" /> جدول
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {view === "grid" ? (
                <div className="space-y-6">
                  {activeFloors.map((f) => (
                    <div key={f}>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-base px-3 py-1">{f}</Badge>
                        <span className="text-sm text-muted-foreground">{byFloor[f].length} موقف</span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {byFloor[f].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openAssign(s)}
                            disabled={!canManage}
                            className={`border rounded-md p-2 text-center transition hover:scale-105 ${STATUS_COLORS[s.status]} ${canManage ? "cursor-pointer" : "cursor-default"}`}
                            title={`${s.spot_type} - ${s.status}`}
                          >
                            <div className="text-xs font-bold">{s.spot_number}</div>
                            {s.spot_type !== "عادي" && (
                              <div className="text-[10px] opacity-80 mt-0.5">{s.spot_type === "VIP" ? "VIP" : "♿"}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>الدور</TableHead><TableHead>الرقم</TableHead><TableHead>النوع</TableHead>
                    <TableHead>المكتب</TableHead><TableHead>الكاميرا</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {spots.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.floor}</TableCell>
                        <TableCell className="font-medium">{s.spot_number}</TableCell>
                        <TableCell>{s.spot_type}</TableCell>
                        <TableCell>{offices.find((o) => o.id === s.office_id)?.code ?? "—"}</TableCell>
                        <TableCell>{cameras.find((c) => c.id === s.camera_id)?.camera_number ?? "—"}</TableCell>
                        <TableCell><Badge className={STATUS_COLORS[s.status]} variant="outline">{s.status}</Badge></TableCell>
                        <TableCell>{canManage && <Button size="sm" variant="outline" onClick={() => openAssign(s)}>تخصيص</Button>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> الفحص الدوري</CardTitle>
              {canManage && (
                <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 me-1" /> فحص جديد</Button></DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>تسجيل فحص دوري</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>تاريخ الفحص</Label><Input type="date" value={checkForm.check_date ?? ""} onChange={(e) => setCheckForm({ ...checkForm, check_date: e.target.value })} /></div>
                        <div><Label>تاريخ الفحص القادم</Label><Input type="date" value={checkForm.next_check_date ?? ""} onChange={(e) => setCheckForm({ ...checkForm, next_check_date: e.target.value })} /></div>
                      </div>
                      <div className="space-y-2">
                        {CHECK_ITEMS.map(([k, label]) => (
                          <div key={k} className="grid grid-cols-2 items-center gap-2">
                            <Label>{label}</Label>
                            <Select value={checkForm[k] ?? "سليم"} onValueChange={(v) => setCheckForm({ ...checkForm, [k]: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="سليم">سليم</SelectItem>
                                <SelectItem value="يحتاج صيانة">يحتاج صيانة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <div><Label>ملاحظات</Label><Textarea value={checkForm.notes ?? ""} onChange={(e) => setCheckForm({ ...checkForm, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button onClick={saveCheck}>حفظ</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>التاريخ</TableHead>
                  {CHECK_ITEMS.map(([k, l]) => <TableHead key={k}>{l}</TableHead>)}
                  <TableHead>القادم</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {checks.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.check_date}</TableCell>
                      {CHECK_ITEMS.map(([k]) => (
                        <TableCell key={k}>
                          <Badge variant={c[k] === "سليم" ? "secondary" : "destructive"}>{c[k]}</Badge>
                        </TableCell>
                      ))}
                      <TableCell>{c.next_check_date ?? "—"}</TableCell>
                      <TableCell><DeleteArchiveMenu table="parking_maintenance_checks" id={c.id} entityLabel={c.check_date} onDone={load} compact /></TableCell>
                    </TableRow>
                  ))}
                  {checks.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-6">لا توجد فحوصات.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> سجل النظافة</CardTitle>
              {canManage && (
                <Dialog open={cleanOpen} onOpenChange={setCleanOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 me-1" /> تسجيل نظافة</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>سجل نظافة جديد</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div><Label>التاريخ</Label><Input type="date" value={cleanForm.cleaning_date ?? ""} onChange={(e) => setCleanForm({ ...cleanForm, cleaning_date: e.target.value })} /></div>
                      <div><Label>المسؤول</Label><Input value={cleanForm.responsible ?? ""} onChange={(e) => setCleanForm({ ...cleanForm, responsible: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>صورة قبل</Label><Input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)} /></div>
                        <div><Label>صورة بعد</Label><Input type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)} /></div>
                      </div>
                      <div><Label>ملاحظات</Label><Textarea value={cleanForm.notes ?? ""} onChange={(e) => setCleanForm({ ...cleanForm, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button onClick={saveCleaning}>حفظ</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {cleanings.map((c: any) => (
                <div key={c.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div><b>{c.cleaning_date}</b> — {c.responsible ?? "—"}</div>
                    <DeleteArchiveMenu table="parking_cleaning_logs" id={c.id} entityLabel={c.cleaning_date} onDone={load} compact />
                  </div>
                  {c.notes && <div className="text-sm text-muted-foreground mt-1">{c.notes}</div>}
                  {(c.before_photo_url || c.after_photo_url) && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {(["before_photo_url", "after_photo_url"] as const).map((k) => (
                        <div key={k}>
                          <div className="text-xs text-muted-foreground mb-1">{k === "before_photo_url" ? "قبل" : "بعد"}</div>
                          {c[k] && signedUrls[c[k]] ? (
                            <SafeImage src={signedUrls[c[k]]} alt="" className="rounded-md border w-full h-40 object-cover" />
                          ) : <div className="h-40 border rounded-md grid place-items-center text-xs text-muted-foreground">لا توجد صورة</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {cleanings.length === 0 && <div className="text-center text-muted-foreground py-6">لا توجد سجلات.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><AlertOctagon className="h-5 w-5" /> المخالفات</CardTitle>
              {canManage && (
                <Dialog open={violOpen} onOpenChange={setViolOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 me-1" /> تسجيل مخالفة</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>مخالفة جديدة</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>التاريخ</Label><Input type="date" value={violForm.violation_date ?? ""} onChange={(e) => setViolForm({ ...violForm, violation_date: e.target.value })} /></div>
                        <div>
                          <Label>الموقف</Label>
                          <Select value={violForm.spot_id ?? ""} onValueChange={(v) => setViolForm({ ...violForm, spot_id: v })}>
                            <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                            <SelectContent>
                              {spots.map((s) => <SelectItem key={s.id} value={s.id}>{s.floor}-{s.spot_number}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label>نوع المخالفة *</Label><Input value={violForm.violation_type ?? ""} onChange={(e) => setViolForm({ ...violForm, violation_type: e.target.value })} /></div>
                      <div><Label>الوصف</Label><Textarea value={violForm.description ?? ""} onChange={(e) => setViolForm({ ...violForm, description: e.target.value })} /></div>
                      <div><Label>صور</Label><Input type="file" accept="image/*" multiple onChange={(e) => setViolFiles(e.target.files)} /></div>
                    </div>
                    <DialogFooter><Button onClick={saveViolation}>حفظ</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>التاريخ</TableHead><TableHead>الموقف</TableHead><TableHead>النوع</TableHead>
                  <TableHead>الوصف</TableHead><TableHead>الصور</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {violations.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.violation_date}</TableCell>
                      <TableCell>{v.parking_spots ? `${v.parking_spots.floor}-${v.parking_spots.spot_number}` : "—"}</TableCell>
                      <TableCell>{v.violation_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{v.description ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(v.photo_urls ?? []).slice(0, 3).map((p: string) => (
                            signedUrls[p] && <SafeImage key={p} src={signedUrls[p]} className="h-10 w-10 rounded object-cover border" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={v.status === "محلولة" ? "secondary" : "destructive"}>{v.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          {canManage && v.status === "مفتوحة" && (
                            <Button size="sm" variant="outline" onClick={() => resolveViolation(v.id)}>إغلاق</Button>
                          )}
                          <DeleteArchiveMenu table="parking_violations" id={v.id} entityLabel={v.violation_type} onDone={load} compact />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {violations.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">لا توجد مخالفات.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign dialog */}
      <Dialog open={!!assignSpot} onOpenChange={(o) => !o && setAssignSpot(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تخصيص الموقف {assignSpot?.floor}-{assignSpot?.spot_number}</DialogTitle></DialogHeader>
          {assignSpot && (
            <div className="grid gap-3">
              <div>
                <Label>المكتب المخصص له</Label>
                <Select value={assignForm.office_id ?? "__none__"} onValueChange={(v) => setAssignForm({ ...assignForm, office_id: v === "__none__" ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون</SelectItem>
                    {offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الكاميرا المرتبطة</Label>
                <Select value={assignForm.camera_id ?? "__none__"} onValueChange={(v) => setAssignForm({ ...assignForm, camera_id: v === "__none__" ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون</SelectItem>
                    {cameras.map((c) => <SelectItem key={c.id} value={c.id}>{c.camera_number}{c.location ? ` - ${c.location}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={assignForm.status} onValueChange={(v) => setAssignForm({ ...assignForm, status: v as SpotStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["متاح", "مخصص", "مشغول", "صيانة"] as SpotStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ملاحظات التغطية بالكاميرا</Label>
                <Textarea value={assignForm.coverage_notes ?? ""} onChange={(e) => setAssignForm({ ...assignForm, coverage_notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={saveAssign}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
