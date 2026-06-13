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
import { Plus, AlertTriangle, Upload, Play, Pause, CheckCircle2, ShieldCheck, RotateCcw, Trash2 } from "lucide-react";

type Status =
  | "جديد"
  | "معلّق للتعيين"
  | "جاري التنفيذ"
  | "بانتظار قطع غيار"
  | "معلّق"
  | "مكتمل مبدئياً"
  | "مغلق";

// Columns shown on the kanban (in order)
const COLUMNS: { key: Status; label: string; aliases?: Status[] }[] = [
  { key: "جديد", label: "مفتوح" },
  { key: "معلّق للتعيين", label: "معلّق للتعيين" },
  { key: "جاري التنفيذ", label: "جاري العمل" },
  { key: "معلّق", label: "معلّق", aliases: ["بانتظار قطع غيار"] },
  { key: "مكتمل مبدئياً", label: "مكتمل مبدئياً" },
  { key: "مغلق", label: "مغلق" },
];

const STATUS_STYLE: Record<Status, string> = {
  "جديد": "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-300",
  "معلّق للتعيين": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  "جاري التنفيذ": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
  "بانتظار قطع غيار": "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300",
  "معلّق": "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300",
  "مكتمل مبدئياً": "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  "مغلق": "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300",
};

type Priority = "طارئة" | "عالية" | "متوسطة" | "منخفضة";
const PRIORITIES: Priority[] = ["طارئة", "عالية", "متوسطة", "منخفضة"];
const PRIORITY_RANK: Record<Priority, number> = { "طارئة": 0, "عالية": 1, "متوسطة": 2, "منخفضة": 3 };
const PRIORITY_STYLE: Record<Priority, string> = {
  "طارئة": "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300",
  "عالية": "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300",
  "متوسطة": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
  "منخفضة": "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-300",
};

type Source = "مستأجر" | "صيانة وقائية" | "جولة تفتيش" | "حادث أمني" | "إدارة";
const SOURCES: Source[] = ["مستأجر", "صيانة وقائية", "جولة تفتيش", "حادث أمني", "إدارة"];

type Material = { name: string; qty: number; unit_cost: number };

type Asset = { id: string; asset_name: string; asset_code: string; criticality: "حرج" | "عادي" };
type Office = { id: string; code: string; floor: number; space_id: string | null };
type Space = { id: string; space_code: string; space_name: string; space_type: string; floor: number | null };
type Vendor = { id: string; company_name: string };

type MR = {
  id: string; request_number: string | null; request_date: string;
  location: string | null; request_type: string | null; description: string | null;
  asset_id: string | null; office_id: string | null; space_id: string | null;
  status: Status; assigned_technician: string | null; assigned_vendor_id: string | null;
  cost: number | null; parts_cost: number; labor_cost: number; labor_hours: number | null;
  materials_used: Material[];
  before_photo_url: string | null; after_photo_url: string | null;
  notes: string | null; hold_reason: string | null;
  request_source: Source | null;
  priority: Priority;
  started_at: string | null; completed_at: string | null;
  closed_at: string | null; approved_at: string | null; approved_by: string | null;
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

async function uploadPhoto(file: File, prefix: string): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("maintenance-photos").upload(path, file, { upsert: false });
  if (error) { toast.error(error.message); return null; }
  const { data } = supabase.storage.from("maintenance-photos").getPublicUrl(path);
  return data.publicUrl;
}

function MaintenancePage() {
  const { user, hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "maintenance_supervisor"]);
  const [items, setItems] = useState<MR[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // create dialog
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<MR>>({ request_date: new Date().toISOString().slice(0, 10), priority: "متوسطة", request_source: "مستأجر" });
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [targetKind, setTargetKind] = useState<TargetKind>("office");
  const [targetOfficeId, setTargetOfficeId] = useState<string>("");
  const [targetSpaceId, setTargetSpaceId] = useState<string>("");
  const [targetFloor, setTargetFloor] = useState<string>("");

  // assign dialog (open → معلّق للتعيين / جاري التنفيذ)
  const [assignFor, setAssignFor] = useState<MR | null>(null);
  const [assignTech, setAssignTech] = useState("");
  const [assignVendor, setAssignVendor] = useState<string>("none");
  const [assignPriority, setAssignPriority] = useState<Priority>("متوسطة");
  const [assignStart, setAssignStart] = useState(true);

  // hold dialog
  const [holdFor, setHoldFor] = useState<MR | null>(null);
  const [holdReason, setHoldReason] = useState("");

  // complete dialog (جاري → مكتمل مبدئياً)
  const [completeFor, setCompleteFor] = useState<MR | null>(null);
  const [completeAfterFile, setCompleteAfterFile] = useState<File | null>(null);
  const [completeAfterUrl, setCompleteAfterUrl] = useState<string>("");
  const [completeMaterials, setCompleteMaterials] = useState<Material[]>([]);
  const [completeLaborHours, setCompleteLaborHours] = useState<string>("");
  const [completeLaborCost, setCompleteLaborCost] = useState<string>("");
  const [completeNotes, setCompleteNotes] = useState("");

  // approve dialog (مكتمل مبدئياً → مغلق / إرجاع)
  const [approveFor, setApproveFor] = useState<MR | null>(null);
  const [approveNote, setApproveNote] = useState("");

  const load = async () => {
    const [m, a, o, s, v] = await Promise.all([
      supabase.from("maintenance_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("assets").select("id,asset_name,asset_code,criticality").order("asset_code"),
      supabase.from("offices").select("id,code,floor,space_id").order("floor").order("code"),
      supabase.from("spaces").select("id,space_code,space_name,space_type,floor").order("floor").order("space_code"),
      supabase.from("vendors").select("id,company_name").order("company_name"),
    ]);
    if (m.error) toast.error(m.error.message);
    else setItems(((m.data ?? []) as any[]).map((r) => ({ ...r, materials_used: Array.isArray(r.materials_used) ? r.materials_used : [] })) as MR[]);
    if (!a.error) setAssets((a.data ?? []) as Asset[]);
    if (!o.error) setOffices((o.data ?? []) as Office[]);
    if (!s.error) setSpaces((s.data ?? []) as Space[]);
    if (!v.error) setVendors((v.data ?? []) as Vendor[]);
  };
  useEffect(() => { load(); }, []);

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const vendorMap = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);

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
    setForm({ request_date: new Date().toISOString().slice(0, 10), priority: "متوسطة", request_source: "مستأجر" });
    setBeforeFile(null);
    setTargetKind("office"); setTargetOfficeId(""); setTargetSpaceId(""); setTargetFloor("");
  };

  const create = async () => {
    let office_id: string | null = null;
    let space_id: string | null = null;
    let location: string | null = null;

    if (targetKind === "office") {
      if (!targetOfficeId) return toast.error("اختر المكتب");
      const o = offices.find((x) => x.id === targetOfficeId);
      if (!o) return toast.error("المكتب غير موجود");
      office_id = o.id; space_id = o.space_id;
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
    if (!form.request_source) return toast.error("اختر مصدر الطلب");

    let before_photo_url: string | null = null;
    if (beforeFile) {
      before_photo_url = await uploadPhoto(beforeFile, "before");
      if (!before_photo_url) return;
    }

    const { error } = await supabase.from("maintenance_requests").insert({
      request_date: form.request_date!,
      location,
      request_type: form.request_type ?? null,
      description: form.description ?? null,
      asset_id: form.asset_id || null,
      office_id, space_id,
      status: "جديد",
      priority: (form.priority ?? "متوسطة") as Priority,
      request_source: form.request_source,
      before_photo_url,
      reported_by: user?.id ?? null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء البلاغ");
    setOpen(false); resetForm(); load();
  };

  // direct status moves (drag-drop or buttons)
  const moveTo = async (r: MR, target: Status) => {
    if (target === "معلّق للتعيين" || target === "جاري التنفيذ") {
      if (target === "جاري التنفيذ" && !r.assigned_technician && !r.assigned_vendor_id) {
        openAssign(r, true); return;
      }
      openAssign(r, target === "جاري التنفيذ"); return;
    }
    if (target === "معلّق") { openHold(r); return; }
    if (target === "مكتمل مبدئياً") { openComplete(r); return; }
    if (target === "مغلق") { openApprove(r); return; }
    // جديد (re-open) — super_admin only enforced by trigger
    const { error } = await supabase.from("maintenance_requests").update({ status: target }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  // assign
  const openAssign = (r: MR, start: boolean) => {
    setAssignFor(r);
    setAssignTech(r.assigned_technician ?? "");
    setAssignVendor(r.assigned_vendor_id ?? "none");
    setAssignPriority(r.priority);
    setAssignStart(start);
  };
  const saveAssign = async () => {
    if (!assignFor) return;
    if (!assignTech && assignVendor === "none") return toast.error("اختر فني أو مورد");
    const { error } = await supabase.from("maintenance_requests").update({
      assigned_technician: assignTech || null,
      assigned_vendor_id: assignVendor === "none" ? null : assignVendor,
      priority: assignPriority,
      status: assignStart ? "جاري التنفيذ" : "معلّق للتعيين",
    }).eq("id", assignFor.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setAssignFor(null); load();
  };

  // hold
  const openHold = (r: MR) => { setHoldFor(r); setHoldReason(r.hold_reason ?? ""); };
  const saveHold = async () => {
    if (!holdFor) return;
    if (!holdReason.trim()) return toast.error("اكتب سبب التعليق");
    const { error } = await supabase.from("maintenance_requests").update({
      status: "معلّق", hold_reason: holdReason.trim(),
    }).eq("id", holdFor.id);
    if (error) return toast.error(error.message);
    toast.success("تم التعليق");
    setHoldFor(null); load();
  };

  // complete
  const openComplete = (r: MR) => {
    setCompleteFor(r);
    setCompleteAfterFile(null);
    setCompleteAfterUrl(r.after_photo_url ?? "");
    setCompleteMaterials(r.materials_used?.length ? r.materials_used : []);
    setCompleteLaborHours(r.labor_hours ? String(r.labor_hours) : "");
    setCompleteLaborCost(r.labor_cost ? String(r.labor_cost) : "");
    setCompleteNotes(r.notes ?? "");
  };
  const partsCost = useMemo(
    () => completeMaterials.reduce((s, m) => s + (Number(m.qty) || 0) * (Number(m.unit_cost) || 0), 0),
    [completeMaterials]
  );
  const addMaterial = () => setCompleteMaterials((m) => [...m, { name: "", qty: 1, unit_cost: 0 }]);
  const updMaterial = (i: number, patch: Partial<Material>) =>
    setCompleteMaterials((m) => m.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const rmMaterial = (i: number) => setCompleteMaterials((m) => m.filter((_, idx) => idx !== i));

  const saveComplete = async () => {
    if (!completeFor) return;
    let after = completeAfterUrl;
    if (completeAfterFile) {
      const url = await uploadPhoto(completeAfterFile, "after");
      if (!url) return;
      after = url;
    }
    if (!after) return toast.error("صورة \"بعد\" مطلوبة");
    if (!completeNotes.trim()) return toast.error("ملاحظات الإنجاز مطلوبة");
    const labor_cost = Number(completeLaborCost || 0);
    if (partsCost + labor_cost <= 0) return toast.error("أدخل تكلفة مواد أو عمالة");

    const { error } = await supabase.from("maintenance_requests").update({
      status: "مكتمل مبدئياً",
      after_photo_url: after,
      materials_used: completeMaterials,
      parts_cost: partsCost,
      labor_cost,
      labor_hours: completeLaborHours ? Number(completeLaborHours) : null,
      notes: completeNotes.trim(),
    } as any).eq("id", completeFor.id);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الإنجاز — بانتظار الاعتماد");
    setCompleteFor(null); load();
  };

  // approve
  const openApprove = (r: MR) => {
    if (r.status !== "مكتمل مبدئياً" && !hasAnyRole(["super_admin"])) {
      return toast.error("يجب إنهاء العمل أولاً قبل الاعتماد");
    }
    setApproveFor(r); setApproveNote("");
  };
  const saveApprove = async () => {
    if (!approveFor) return;
    const { error } = await supabase.from("maintenance_requests").update({ status: "مغلق" }).eq("id", approveFor.id);
    if (error) return toast.error(error.message);
    toast.success("تم الاعتماد والإغلاق");
    setApproveFor(null); load();
  };
  const sendBack = async () => {
    if (!approveFor) return;
    if (!approveNote.trim()) return toast.error("اكتب سبب الإرجاع");
    const newNotes = `${approveFor.notes ?? ""}\n\n[إرجاع من المشرف]: ${approveNote.trim()}`.trim();
    const { error } = await supabase.from("maintenance_requests").update({
      status: "جاري التنفيذ", notes: newNotes,
    }).eq("id", approveFor.id);
    if (error) return toast.error(error.message);
    toast.success("تم إرجاع الأمر للفني");
    setApproveFor(null); load();
  };

  const elapsed = (since: string | null) => {
    if (!since) return null;
    const m = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 60000));
    if (m < 60) return `${m}د`;
    const h = Math.floor(m / 60); const r = m % 60;
    if (h < 24) return `${h}س ${r}د`;
    return `${Math.floor(h / 24)}ي ${h % 24}س`;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">أوامر العمل</h1>
          <p className="text-sm text-muted-foreground">دورة العمل: مفتوح ← معلّق للتعيين ← جاري العمل ← مكتمل مبدئياً ← مغلق (مع إمكانية التعليق)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />بلاغ جديد</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>إنشاء بلاغ صيانة</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="التاريخ"><Input type="date" value={form.request_date ?? ""} onChange={(e) => setForm({ ...form, request_date: e.target.value })} /></Field>
              <Field label="مصدر الطلب">
                <Select value={form.request_source ?? "مستأجر"} onValueChange={(v) => setForm({ ...form, request_source: v as Source })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="نوع الموقع">
                <Select value={targetKind} onValueChange={(v) => { setTargetKind(v as TargetKind); setTargetOfficeId(""); setTargetSpaceId(""); setTargetFloor(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TARGET_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="الأولوية">
                <Select value={form.priority ?? "متوسطة"} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <div className="col-span-2">
                {targetKind === "office" ? (
                  <Field label="المكتب">
                    <Select value={targetOfficeId} onValueChange={setTargetOfficeId}>
                      <SelectTrigger><SelectValue placeholder="اختر المكتب" /></SelectTrigger>
                      <SelectContent>{offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code} — دور {o.floor}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                ) : targetKind === "floor" ? (
                  <Field label="الدور">
                    <Select value={targetFloor} onValueChange={setTargetFloor}>
                      <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                      <SelectContent>{floors.map((f) => <SelectItem key={f} value={String(f)}>دور {f}</SelectItem>)}</SelectContent>
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
              <Field label="الأصل (اختياري)">
                <Select value={form.asset_id ?? "none"} onValueChange={(v) => setForm({ ...form, asset_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— لا يوجد —</SelectItem>
                    {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="col-span-2"><Field label="الوصف"><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
              <div className="col-span-2">
                <Field label="صورة قبل الإصلاح (اختياري)">
                  <Input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)} />
                </Field>
              </div>
            </div>
            <DialogFooter><Button onClick={create}>إنشاء</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList><TabsTrigger value="kanban">Kanban</TabsTrigger><TabsTrigger value="table">جدول</TabsTrigger></TabsList>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {COLUMNS.map((col) => {
              const matches = (r: MR) => r.status === col.key || (col.aliases ?? []).includes(r.status);
              const items_ = filtered.filter(matches);
              return (
                <Card key={col.key}
                  onDragOver={(e) => { if (canManage) e.preventDefault(); }}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/plain");
                    const r = items.find((x) => x.id === id);
                    if (r) moveTo(r, col.key);
                  }}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{col.label}</span>
                      <Badge variant="secondary">{items_.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[200px]">
                    {items_.map((r) => {
                      const a = r.asset_id ? assetMap.get(r.asset_id) : null;
                      const critical = a?.criticality === "حرج";
                      return (
                        <div key={r.id}
                          draggable={canManage}
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                          className={`rounded-md border p-3 text-sm bg-card ${critical ? "border-destructive" : ""} ${canManage ? "cursor-grab active:cursor-grabbing" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{r.request_number}</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</Badge>
                              {r.request_source && <Badge variant="outline" className="text-[10px]">{r.request_source}</Badge>}
                              {critical && <Badge variant="destructive" className="gap-1 text-[10px]"><AlertTriangle className="h-3 w-3" />حرج</Badge>}
                            </div>
                          </div>
                          <div className="font-medium">{r.request_type ?? "بلاغ"}</div>
                          <div className="text-xs text-muted-foreground">{r.location ?? "—"}</div>
                          {a && <div className="text-xs mt-1">الأصل: {a.asset_name}</div>}
                          {r.assigned_technician && <div className="text-xs">الفني: {r.assigned_technician}</div>}
                          {r.assigned_vendor_id && <div className="text-xs">المورد: {vendorMap.get(r.assigned_vendor_id)?.company_name}</div>}
                          {r.status === "جاري التنفيذ" && r.started_at && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">⏱ منذ {elapsed(r.started_at)}</div>
                          )}
                          {r.status === "معلّق" && r.hold_reason && (
                            <div className="text-xs text-orange-600 dark:text-orange-400">⏸ {r.hold_reason}</div>
                          )}
                          {(r.before_photo_url || r.after_photo_url) && (
                            <div className="flex gap-1 mt-2">
                              {r.before_photo_url && <img src={r.before_photo_url} alt="قبل" className="h-12 w-12 object-cover rounded border" />}
                              {r.after_photo_url && <img src={r.after_photo_url} alt="بعد" className="h-12 w-12 object-cover rounded border" />}
                            </div>
                          )}
                          {canManage && <CardActions r={r} moveTo={moveTo} />}
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
                    {COLUMNS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأولويات</SelectItem>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الموقع</TableHead>
                    <TableHead>المُسنَد إليه</TableHead>
                    <TableHead>التكلفة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.request_number}</TableCell>
                      <TableCell>{r.request_date}</TableCell>
                      <TableCell><Badge variant="outline" className={PRIORITY_STYLE[r.priority]}>{r.priority}</Badge></TableCell>
                      <TableCell>{r.request_source ?? "—"}</TableCell>
                      <TableCell>{r.request_type ?? "—"}</TableCell>
                      <TableCell>{r.location ?? "—"}</TableCell>
                      <TableCell>{r.assigned_technician ?? (r.assigned_vendor_id ? vendorMap.get(r.assigned_vendor_id)?.company_name : "—")}</TableCell>
                      <TableCell>{(r.parts_cost || r.labor_cost) ? Number((r.parts_cost || 0) + (r.labor_cost || 0)).toLocaleString() : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_STYLE[r.status]}>{r.status}</Badge></TableCell>
                      <TableCell>{canManage && <CardActions r={r} moveTo={moveTo} compact />}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-6">لا توجد طلبات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign dialog */}
      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعيين أمر العمل {assignFor?.request_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="الأولوية">
              <Select value={assignPriority} onValueChange={(v) => setAssignPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="الفني المسؤول"><Input value={assignTech} onChange={(e) => setAssignTech(e.target.value)} /></Field>
            <Field label="أو مورد خارجي">
              <Select value={assignVendor} onValueChange={setAssignVendor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— لا يوجد —</SelectItem>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={assignStart} onChange={(e) => setAssignStart(e.target.checked)} />
              بدء العمل فوراً (الانتقال إلى "جاري العمل")
            </label>
          </div>
          <DialogFooter><Button onClick={saveAssign}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold dialog */}
      <Dialog open={!!holdFor} onOpenChange={(o) => !o && setHoldFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعليق أمر العمل {holdFor?.request_number}</DialogTitle></DialogHeader>
          <Field label="سبب التعليق">
            <Textarea rows={3} value={holdReason} onChange={(e) => setHoldReason(e.target.value)}
              placeholder="بانتظار قطع غيار / موافقة الإدارة / وصول المورد…" />
          </Field>
          <DialogFooter><Button onClick={saveHold}>تعليق</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete dialog */}
      <Dialog open={!!completeFor} onOpenChange={(o) => !o && setCompleteFor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>إنهاء العمل — {completeFor?.request_number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="صورة بعد الإصلاح *">
              {completeAfterUrl && !completeAfterFile && (
                <img src={completeAfterUrl} alt="بعد" className="h-24 w-24 object-cover rounded border mb-2" />
              )}
              <Input type="file" accept="image/*" onChange={(e) => setCompleteAfterFile(e.target.files?.[0] ?? null)} />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">المواد المستخدمة</Label>
                <Button size="sm" variant="outline" onClick={addMaterial}><Plus className="h-3 w-3 ml-1" />إضافة مادة</Button>
              </div>
              <div className="space-y-2">
                {completeMaterials.map((m, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-6" placeholder="اسم المادة" value={m.name} onChange={(e) => updMaterial(i, { name: e.target.value })} />
                    <Input className="col-span-2" type="number" placeholder="كمية" value={m.qty} onChange={(e) => updMaterial(i, { qty: Number(e.target.value) })} />
                    <Input className="col-span-3" type="number" placeholder="سعر الوحدة" value={m.unit_cost} onChange={(e) => updMaterial(i, { unit_cost: Number(e.target.value) })} />
                    <Button size="icon" variant="ghost" className="col-span-1" onClick={() => rmMaterial(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                {completeMaterials.length === 0 && <div className="text-xs text-muted-foreground">لا توجد مواد</div>}
              </div>
              <div className="text-xs text-muted-foreground mt-2">إجمالي تكلفة المواد: <b>{partsCost.toLocaleString()}</b></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ساعات العمل"><Input type="number" step="0.5" value={completeLaborHours} onChange={(e) => setCompleteLaborHours(e.target.value)} /></Field>
              <Field label="تكلفة العمالة"><Input type="number" value={completeLaborCost} onChange={(e) => setCompleteLaborCost(e.target.value)} /></Field>
            </div>
            <Field label="ملاحظات الإنجاز *"><Textarea rows={3} value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} /></Field>
          </div>
          <DialogFooter><Button onClick={saveComplete}>إنهاء وإرسال للاعتماد</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve dialog */}
      <Dialog open={!!approveFor} onOpenChange={(o) => !o && setApproveFor(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>اعتماد وإغلاق — {approveFor?.request_number}</DialogTitle></DialogHeader>
          {approveFor && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">الفني:</span> {approveFor.assigned_technician ?? "—"}</div>
                <div><span className="text-muted-foreground">المورد:</span> {approveFor.assigned_vendor_id ? vendorMap.get(approveFor.assigned_vendor_id)?.company_name : "—"}</div>
                <div><span className="text-muted-foreground">ساعات العمل:</span> {approveFor.labor_hours ?? "—"}</div>
                <div><span className="text-muted-foreground">تكلفة المواد:</span> {Number(approveFor.parts_cost || 0).toLocaleString()}</div>
                <div><span className="text-muted-foreground">تكلفة العمالة:</span> {Number(approveFor.labor_cost || 0).toLocaleString()}</div>
                <div><span className="text-muted-foreground">الإجمالي:</span> <b>{Number((approveFor.parts_cost || 0) + (approveFor.labor_cost || 0)).toLocaleString()}</b></div>
              </div>
              {approveFor.notes && <div className="bg-muted p-2 rounded text-xs whitespace-pre-wrap">{approveFor.notes}</div>}
              <div className="flex gap-2">
                {approveFor.before_photo_url && <div><div className="text-xs mb-1">قبل</div><img src={approveFor.before_photo_url} className="h-32 rounded border" /></div>}
                {approveFor.after_photo_url && <div><div className="text-xs mb-1">بعد</div><img src={approveFor.after_photo_url} className="h-32 rounded border" /></div>}
              </div>
              <Field label="ملاحظة الإرجاع (إن لزم)">
                <Textarea rows={2} value={approveNote} onChange={(e) => setApproveNote(e.target.value)} placeholder="إن كانت هناك ملاحظات للفني…" />
              </Field>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={sendBack}><RotateCcw className="h-4 w-4 ml-1" />إرجاع للفني</Button>
            <Button onClick={saveApprove}><ShieldCheck className="h-4 w-4 ml-1" />اعتماد وإغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardActions({ r, moveTo, compact }: { r: MR; moveTo: (r: MR, t: Status) => void; compact?: boolean }) {
  const s = r.status;
  const btn = (icon: React.ReactNode, label: string, target: Status, variant: "default" | "outline" | "secondary" = "outline") => (
    <Button size="sm" variant={variant} onClick={() => moveTo(r, target)} className={compact ? "h-7 px-2 text-xs" : ""}>
      {icon}<span className={compact ? "" : "mr-1"}>{label}</span>
    </Button>
  );
  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-2"}`}>
      {(s === "جديد") && btn(<Play className="h-3 w-3" />, "تعيين", "معلّق للتعيين", "default")}
      {(s === "معلّق للتعيين") && btn(<Play className="h-3 w-3" />, "بدء", "جاري التنفيذ", "default")}
      {(s === "جاري التنفيذ" || s === "بانتظار قطع غيار") && (
        <>
          {btn(<Pause className="h-3 w-3" />, "تعليق", "معلّق")}
          {btn(<CheckCircle2 className="h-3 w-3" />, "إنهاء", "مكتمل مبدئياً", "default")}
        </>
      )}
      {(s === "معلّق") && btn(<Play className="h-3 w-3" />, "استئناف", "جاري التنفيذ", "default")}
      {(s === "مكتمل مبدئياً") && btn(<ShieldCheck className="h-3 w-3" />, "اعتماد", "مغلق", "default")}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
