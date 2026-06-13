import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, AlertTriangle } from "lucide-react";

type Status = "جديد" | "جاري التنفيذ" | "بانتظار قطع غيار" | "مغلق";
const STATUSES: Status[] = ["جديد", "جاري التنفيذ", "بانتظار قطع غيار", "مغلق"];

type Priority = "طارئة" | "عالية" | "متوسطة" | "منخفضة";
const PRIORITIES: Priority[] = ["طارئة", "عالية", "متوسطة", "منخفضة"];
const PRIORITY_RANK: Record<Priority, number> = { "طارئة": 0, "عالية": 1, "متوسطة": 2, "منخفضة": 3 };
const PRIORITY_STYLE: Record<Priority, string> = {
  "طارئة": "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300",
  "عالية": "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300",
  "متوسطة": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
  "منخفضة": "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-300",
};

type Asset = { id: string; asset_name: string; asset_code: string; criticality: "حرج" | "عادي" };
type Office = { id: string; code: string; floor: number; space_id: string | null };
type Space = { id: string; space_code: string; space_name: string; space_type: string; floor: number | null };
type MR = {
  id: string; request_number: string | null; request_date: string;
  location: string | null; request_type: string | null; description: string | null;
  asset_id: string | null; office_id: string | null; space_id: string | null; status: Status;
  assigned_technician: string | null; cost: number | null; notes: string | null;
  priority: Priority;
};

type TargetKind = "office" | "floor" | "لوبي" | "سطح" | "موقف سيارة" | "غرفة كهرباء" | "غرفة كاميرات" | "مخزن" | "مصعد" | "سلم" | "دورة مياه" | "ممر" | "أخرى";
const TARGET_KINDS: { value: TargetKind; label: string }[] = [
  { value: "office", label: "مكتب" },
  { value: "floor", label: "دور كامل" },
  { value: "لوبي", label: "اللوبي" },
  { value: "سطح", label: "السطح (الرووف)" },
  { value: "موقف سيارة", label: "موقف سيارات" },
  { value: "غرفة كهرباء", label: "غرفة كهرباء" },
  { value: "غرفة كاميرات", label: "غرفة كاميرات" },
  { value: "مخزن", label: "مخزن" },
  { value: "مصعد", label: "مصعد" },
  { value: "سلم", label: "سلم" },
  { value: "دورة مياه", label: "دورة مياه" },
  { value: "ممر", label: "ممر" },
  { value: "أخرى", label: "أخرى" },
];

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const { user, hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "maintenance_supervisor"]);
  const [items, setItems] = useState<MR[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<MR>>({ request_date: new Date().toISOString().slice(0, 10), priority: "متوسطة" });

  // target picker
  const [targetKind, setTargetKind] = useState<TargetKind>("office");
  const [targetOfficeId, setTargetOfficeId] = useState<string>("");
  const [targetSpaceId, setTargetSpaceId] = useState<string>("");
  const [targetFloor, setTargetFloor] = useState<string>("");

  // assign dialog
  const [assignFor, setAssignFor] = useState<MR | null>(null);
  const [assignTech, setAssignTech] = useState("");
  const [assignCost, setAssignCost] = useState<string>("");
  const [assignStatus, setAssignStatus] = useState<Status>("جاري التنفيذ");

  const load = async () => {
    const [m, a, o, s] = await Promise.all([
      supabase.from("maintenance_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("assets").select("id,asset_name,asset_code,criticality").order("asset_code"),
      supabase.from("offices").select("id,code,floor,space_id").order("floor").order("code"),
      supabase.from("spaces").select("id,space_code,space_name,space_type,floor").order("floor").order("space_code"),
    ]);
    if (m.error) toast.error(m.error.message); else setItems((m.data ?? []) as MR[]);
    if (!a.error) setAssets((a.data ?? []) as Asset[]);
    if (!o.error) setOffices((o.data ?? []) as Office[]);
    if (!s.error) setSpaces((s.data ?? []) as Space[]);
  };
  useEffect(() => { load(); }, []);

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const filtered = useMemo(() => {
    let arr = items;
    if (statusFilter !== "all") arr = arr.filter((r) => r.status === statusFilter);
    if (priorityFilter !== "all") arr = arr.filter((r) => r.priority === priorityFilter);
    if (q.trim()) {
      const s = q.trim();
      arr = arr.filter((r) =>
        [r.request_number, r.location, r.request_type, r.description, r.assigned_technician]
          .filter(Boolean).some((v) => String(v).includes(s))
      );
    }
    // sort: priority (urgent first), then critical assets, then date desc
    return [...arr].sort((a, b) => {
      const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      if (pr !== 0) return pr;
      const ac = a.asset_id && assetMap.get(a.asset_id)?.criticality === "حرج" ? 0 : 1;
      const bc = b.asset_id && assetMap.get(b.asset_id)?.criticality === "حرج" ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return b.request_date.localeCompare(a.request_date);
    });
  }, [items, q, statusFilter, priorityFilter, assetMap]);

  const floors = useMemo(() => {
    const set = new Set<number>();
    offices.forEach((o) => set.add(o.floor));
    spaces.forEach((s) => { if (s.floor != null) set.add(s.floor); });
    return Array.from(set).sort((a, b) => a - b);
  }, [offices, spaces]);

  const resetForm = () => {
    setForm({ request_date: new Date().toISOString().slice(0, 10), priority: "متوسطة" });
    setTargetKind("office");
    setTargetOfficeId("");
    setTargetSpaceId("");
    setTargetFloor("");
  };

  const create = async () => {
    let office_id: string | null = null;
    let space_id: string | null = null;
    let location: string | null = null;

    if (targetKind === "office") {
      if (!targetOfficeId) return toast.error("اختر المكتب");
      const o = offices.find((x) => x.id === targetOfficeId);
      if (!o) return toast.error("المكتب غير موجود");
      office_id = o.id;
      space_id = o.space_id;
      location = `مكتب ${o.code} — دور ${o.floor}`;
    } else if (targetKind === "floor") {
      if (!targetFloor) return toast.error("اختر الدور");
      location = `دور ${targetFloor}`;
    } else {
      if (!targetSpaceId) return toast.error("اختر الموقع");
      const sp = spaces.find((x) => x.id === targetSpaceId);
      if (!sp) return toast.error("الموقع غير موجود");
      space_id = sp.id;
      location = `${sp.space_name}${sp.floor != null ? ` — دور ${sp.floor}` : ""}`;
    }

    if (!form.description) return toast.error("أدخل وصف البلاغ");

    const { error } = await supabase.from("maintenance_requests").insert({
      request_date: form.request_date!,
      location,
      request_type: form.request_type ?? null,
      description: form.description ?? null,
      asset_id: form.asset_id || null,
      office_id,
      space_id,
      status: "جديد",
      priority: (form.priority ?? "متوسطة") as Priority,
      reported_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء البلاغ");
    setOpen(false);
    resetForm();
    load();
  };

  const updateStatus = async (id: string, status: Status) => {
    if (!canManage) return;
    if (status === "مغلق") {
      const r = items.find((i) => i.id === id);
      if (r) openAssign(r, "مغلق");
      return;
    }
    const { error } = await supabase.from("maintenance_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const openAssign = (r: MR, status: Status = "جاري التنفيذ") => {
    setAssignFor(r);
    setAssignTech(r.assigned_technician ?? "");
    setAssignCost(r.cost ? String(r.cost) : "");
    setAssignStatus(status);
  };

  const saveAssign = async () => {
    if (!assignFor) return;
    if (assignStatus === "مغلق" && !assignCost) return toast.error("التكلفة مطلوبة عند الإغلاق");
    const { error } = await supabase.from("maintenance_requests").update({
      assigned_technician: assignTech || null,
      cost: assignCost ? Number(assignCost) : null,
      status: assignStatus,
    }).eq("id", assignFor.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setAssignFor(null);
    load();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">أوامر العمل</h1>
          <p className="text-sm text-muted-foreground">سير العمل: جديد ← جاري التنفيذ ← بانتظار قطع غيار ← مغلق</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />بلاغ جديد</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>إنشاء بلاغ صيانة</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="التاريخ"><Input type="date" value={form.request_date ?? ""} onChange={(e) => setForm({ ...form, request_date: e.target.value })} /></Field>
              <Field label="نوع الموقع">
                <Select value={targetKind} onValueChange={(v) => { setTargetKind(v as TargetKind); setTargetOfficeId(""); setTargetSpaceId(""); setTargetFloor(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TARGET_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="col-span-2">
                {targetKind === "office" ? (
                  <Field label="المكتب">
                    <Select value={targetOfficeId} onValueChange={setTargetOfficeId}>
                      <SelectTrigger><SelectValue placeholder="اختر المكتب" /></SelectTrigger>
                      <SelectContent>
                        {offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code} — دور {o.floor}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : targetKind === "floor" ? (
                  <Field label="الدور">
                    <Select value={targetFloor} onValueChange={setTargetFloor}>
                      <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                      <SelectContent>
                        {floors.map((f) => <SelectItem key={f} value={String(f)}>دور {f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : (
                  <Field label="الموقع المحدد">
                    <Select value={targetSpaceId} onValueChange={setTargetSpaceId}>
                      <SelectTrigger><SelectValue placeholder="اختر الموقع" /></SelectTrigger>
                      <SelectContent>
                        {spaces.filter((s) => s.space_type === targetKind).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.space_name} ({s.space_code}){s.floor != null ? ` — دور ${s.floor}` : ""}</SelectItem>
                        ))}
                        {spaces.filter((s) => s.space_type === targetKind).length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">لا توجد مواقع من هذا النوع</div>
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
              <Field label="نوع الطلب"><Input placeholder="كهرباء، سباكة، تكييف…" value={form.request_type ?? ""} onChange={(e) => setForm({ ...form, request_type: e.target.value })} /></Field>
              <Field label="الأولوية">
                <Select value={form.priority ?? "متوسطة"} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="col-span-2">
                <Field label="الأصل (اختياري)">
                  <Select value={form.asset_id ?? "none"} onValueChange={(v) => setForm({ ...form, asset_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— لا يوجد —</SelectItem>
                      {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="col-span-2"><Field label="الوصف"><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
            </div>
            <DialogFooter><Button onClick={create}>إنشاء</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList><TabsTrigger value="kanban">Kanban</TabsTrigger><TabsTrigger value="table">جدول</TabsTrigger></TabsList>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {STATUSES.map((st) => {
              const col = filtered.filter((r) => r.status === st);
              return (
                <Card
                  key={st}
                  onDragOver={(e) => { if (canManage) e.preventDefault(); }}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) updateStatus(id, st);
                  }}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{st}</span>
                      <Badge variant="secondary">{col.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[200px]">
                    {col.map((r) => {
                      const a = r.asset_id ? assetMap.get(r.asset_id) : null;
                      const critical = a?.criticality === "حرج";
                      return (
                        <div
                          key={r.id}
                          draggable={canManage}
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                          className={`rounded-md border p-3 text-sm bg-card ${critical ? "border-destructive" : ""} ${canManage ? "cursor-grab active:cursor-grabbing" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{r.request_number}</span>
                            {critical && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />حرج</Badge>}
                          </div>
                          <div className="font-medium">{r.request_type ?? "بلاغ"}</div>
                          <div className="text-xs text-muted-foreground">{r.location ?? "—"}</div>
                          {a && <div className="text-xs mt-1">الأصل: {a.asset_name}</div>}
                          {r.assigned_technician && <div className="text-xs">الفني: {r.assigned_technician}</div>}
                          {canManage && (
                            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => openAssign(r)}>
                              {r.status === "مغلق" ? "تعديل" : "إسناد/إغلاق"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 mb-3 flex-wrap">
                <Input placeholder="بحث…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الموقع</TableHead>
                    <TableHead>الأصل</TableHead>
                    <TableHead>الفني</TableHead>
                    <TableHead>التكلفة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const a = r.asset_id ? assetMap.get(r.asset_id) : null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.request_number}</TableCell>
                        <TableCell>{r.request_date}</TableCell>
                        <TableCell>{r.request_type ?? "—"}</TableCell>
                        <TableCell>{r.location ?? "—"}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          {a?.asset_name ?? "—"}
                          {a?.criticality === "حرج" && <Badge variant="destructive" className="text-[10px]">حرج</Badge>}
                        </TableCell>
                        <TableCell>{r.assigned_technician ?? "—"}</TableCell>
                        <TableCell>{r.cost ? Number(r.cost).toLocaleString() : "—"}</TableCell>
                        <TableCell><Badge variant={r.status === "مغلق" ? "secondary" : "default"}>{r.status}</Badge></TableCell>
                        <TableCell>
                          {canManage && <Button size="sm" variant="ghost" onClick={() => openAssign(r)}>إسناد</Button>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">لا توجد طلبات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>إسناد الطلب {assignFor?.request_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="الفني المسؤول"><Input value={assignTech} onChange={(e) => setAssignTech(e.target.value)} /></Field>
            <Field label="الحالة">
              <Select value={assignStatus} onValueChange={(v) => setAssignStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={`التكلفة (ر.س) ${assignStatus === "مغلق" ? "*" : ""}`}>
              <Input type="number" value={assignCost} onChange={(e) => setAssignCost(e.target.value)} />
            </Field>
          </div>
          <DialogFooter><Button onClick={saveAssign}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
