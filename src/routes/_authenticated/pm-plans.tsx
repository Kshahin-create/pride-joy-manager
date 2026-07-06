import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Wand2, CalendarClock, Search } from "lucide-react";
import { DeleteArchiveMenu } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/pm-plans")({
  component: PmPlansPage,
});

type Plan = {
  id: string; plan_name: string; asset_id: string | null;
  frequency: string; checklist_items: string[]; assigned_to: string | null;
  default_priority: string; last_executed_at: string | null;
  next_due_at: string; is_active: boolean; notes: string | null;
};
type Asset = { id: string; asset_name: string; asset_code: string };

const FREQS = ["أسبوعي","شهري","ربع سنوي","نصف سنوي","سنوي"] as const;
const PRIORITIES = ["طارئة","عالية","متوسطة","منخفضة"] as const;

function PmPlansPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyPermission, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin || hasAnyPermission(["pm_plans.manage"]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>({
    plan_name: "", asset_id: "", frequency: "شهري", default_priority: "متوسطة",
    assigned_to: "", checklist_text: "", notes: "",
  });

  const load = async () => {
    const [p, a] = await Promise.all([scoped(supabase.from("pm_plans").select("*"), activePropertyId).order("next_due_at"),scoped(supabase.from("assets").select("id,asset_name,asset_code"), activePropertyId).order("asset_code"),
    ]);
    if (p.error) toast.error(p.error.message); else setPlans((p.data ?? []) as Plan[]);
    if (!a.error) setAssets((a.data ?? []) as Asset[]);
  };
  useEffect(() => { load(); }, []);

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return plans;
    return plans.filter((p) =>
      p.plan_name.includes(s) ||
      (p.asset_id && assetMap.get(p.asset_id)?.asset_name.includes(s))
    );
  }, [plans, q, assetMap]);

  const dueToday = plans.filter((p) => p.is_active && new Date(p.next_due_at) <= new Date()).length;
  const active = plans.filter((p) => p.is_active).length;

  const generate = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_due_pm_work_orders");
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`تم توليد ${data ?? 0} أمر صيانة وقائية`);
    await load();
  };

  const save = async () => {
    if (!form.plan_name || !form.asset_id) return toast.error("اسم الخطة والأصل مطلوبان");
    const items = (form.checklist_text || "")
      .split("\n").map((s: string) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("pm_plans").insert({
      plan_name: form.plan_name,
      asset_id: form.asset_id,
      frequency: form.frequency,
      default_priority: form.default_priority,
      assigned_to: form.assigned_to || null,
      checklist_items: items,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("تمت إضافة الخطة");
    setOpen(false);
    setForm({ plan_name: "", asset_id: "", frequency: "شهري", default_priority: "متوسطة",
      assigned_to: "", checklist_text: "", notes: "" });
    await load();
  };

  const toggleActive = async (p: Plan) => {
    const { error } = await supabase.from("pm_plans").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await load();
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">الصيانة الوقائية</h1>
          <p className="text-sm text-muted-foreground mt-1">خطط الصيانة المجدولة وتوليد أوامر العمل تلقائيًا</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={generate} disabled={busy} variant="outline">
              <Wand2 className="h-4 w-4 ml-2" />
              {busy ? "جارٍ التوليد..." : "توليد أوامر اليوم"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ml-2" />خطة جديدة</Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إضافة خطة صيانة وقائية</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>اسم الخطة</Label>
                    <Input value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} /></div>
                  <div><Label>الأصل</Label>
                    <Select value={form.asset_id} onValueChange={(v) => setForm({ ...form, asset_id: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر أصلاً" /></SelectTrigger>
                      <SelectContent>
                        {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.asset_code} — {a.asset_name}</SelectItem>)}
                      </SelectContent>
                    </Select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>التكرار</Label>
                      <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{FREQS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div><Label>الأولوية الافتراضية</Label>
                      <Select value={form.default_priority} onValueChange={(v) => setForm({ ...form, default_priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select></div>
                  </div>
                  <div><Label>المسؤول (اختياري)</Label>
                    <Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} /></div>
                  <div><Label>قائمة الفحص (بند في كل سطر)</Label>
                    <Textarea rows={4} value={form.checklist_text} onChange={(e) => setForm({ ...form, checklist_text: e.target.value })} /></div>
                  <div><Label>ملاحظات</Label>
                    <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={save}>حفظ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="إجمالي الخطط" value={plans.length} />
        <Stat label="نشطة" value={active} color="emerald" />
        <Stat label="مستحقة اليوم" value={dueToday} color="amber" />
        <Stat label="أصول مغطاة" value={new Set(plans.filter((p) => p.asset_id).map((p) => p.asset_id)).size} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> خطط الصيانة الوقائية
          </CardTitle>
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث..." className="pr-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الخطة</TableHead>
                <TableHead>الأصل</TableHead>
                <TableHead>التكرار</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الاستحقاق التالي</TableHead>
                <TableHead>آخر تنفيذ</TableHead>
                <TableHead>الحالة</TableHead>
                {canManage && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const overdue = p.is_active && new Date(p.next_due_at) <= new Date();
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.plan_name}</TableCell>
                    <TableCell className="text-xs">
                      {p.asset_id ? (assetMap.get(p.asset_id)?.asset_name ?? "—") : "—"}
                    </TableCell>
                    <TableCell><Badge variant="outline">{p.frequency}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{p.default_priority}</Badge></TableCell>
                    <TableCell>
                      <span className={overdue ? "text-red-600 font-semibold" : ""}>
                        {new Date(p.next_due_at).toLocaleDateString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.last_executed_at ? new Date(p.last_executed_at).toLocaleDateString("en-US") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "outline"}>
                        {p.is_active ? "نشطة" : "متوقفة"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                            {p.is_active ? "إيقاف" : "تفعيل"}
                          </Button>
                          <DeleteArchiveMenu table="pm_plans" id={p.id} entityLabel={p.plan_name} onDone={load} compact />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground py-8">لا توجد خطط</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  const cls = color === "emerald" ? "text-emerald-600" : color === "amber" ? "text-amber-600" : "text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${cls}`}>{value.toLocaleString("en-US")}</p>
      </CardContent>
    </Card>
  );
}
