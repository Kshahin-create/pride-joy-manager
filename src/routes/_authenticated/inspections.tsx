import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ClipboardCheck, Play, AlertTriangle, CheckCircle2, Wrench, Eye, FileText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/inspections")({
  component: InspectionsPage,
});

type Frequency = "يومي" | "أسبوعي" | "شهري";
type Overall = "مطابق" | "ملاحظات" | "غير مطابق";
type ItemResult = "سليم" | "يحتاج إجراء";

interface Template {
  id: string;
  template_name: string;
  frequency: Frequency;
  items: string[];
  active: boolean;
}

interface Inspection {
  id: string;
  template_id: string;
  inspection_date: string;
  inspector_name: string | null;
  overall_result: Overall;
  notes: string | null;
  created_at: string;
  inspection_templates?: { template_name: string; frequency: Frequency } | null;
}

interface InspectionResult {
  id: string;
  inspection_id: string;
  item_name: string;
  result: ItemResult;
  notes: string | null;
  corrective_action: string | null;
  photo_urls: string[] | null;
  maintenance_request_id: string | null;
}

interface ItemDraft {
  item_name: string;
  result: ItemResult;
  notes: string;
  corrective_action: string;
  file: File | null;
}

const FREQ_DAYS: Record<Frequency, number> = { "يومي": 1, "أسبوعي": 7, "شهري": 30 };

function overallBadge(o: Overall) {
  if (o === "مطابق") return <Badge className="bg-green-600 text-white">مطابق</Badge>;
  if (o === "ملاحظات") return <Badge className="bg-amber-500 text-white">ملاحظات</Badge>;
  return <Badge variant="destructive">غير مطابق</Badge>;
}

function InspectionsPage() {
  const { user, hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "maintenance_supervisor", "security_supervisor"]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [fTpl, setFTpl] = useState("all");
  const [fFreq, setFFreq] = useState<string>("all");
  const [fInspector, setFInspector] = useState("");
  const [fDate, setFDate] = useState("");

  // start dialog
  const [startOpen, setStartOpen] = useState(false);
  const [startTplId, setStartTplId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemDraft[]>([]);
  const [draftMeta, setDraftMeta] = useState({
    inspection_date: new Date().toISOString().slice(0, 10),
    inspector_name: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsInsp, setDetailsInsp] = useState<Inspection | null>(null);
  const [detailsResults, setDetailsResults] = useState<InspectionResult[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, i] = await Promise.all([
      (supabase as any).from("inspection_templates").select("*").eq("active", true).order("frequency"),
      (supabase as any)
        .from("inspections")
        .select("*, inspection_templates(template_name, frequency)")
        .order("inspection_date", { ascending: false })
        .limit(200),
    ]);
    if (t.error) toast.error(t.error.message);
    if (i.error) toast.error(i.error.message);
    setTemplates((t.data ?? []).map((x: any) => ({ ...x, items: Array.isArray(x.items) ? x.items : [] })));
    setInspections((i.data ?? []) as Inspection[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // last inspection date per template
  const lastByTpl = useMemo(() => {
    const m = new Map<string, string>();
    for (const ins of inspections) {
      const prev = m.get(ins.template_id);
      if (!prev || ins.inspection_date > prev) m.set(ins.template_id, ins.inspection_date);
    }
    return m;
  }, [inspections]);

  const dueToday = useMemo(() => {
    const today = new Date();
    return templates.filter((tpl) => {
      const last = lastByTpl.get(tpl.id);
      if (!last) return true;
      const diff = Math.floor((today.getTime() - new Date(last).getTime()) / 86400000);
      return diff >= FREQ_DAYS[tpl.frequency];
    });
  }, [templates, lastByTpl]);

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      if (fTpl !== "all" && i.template_id !== fTpl) return false;
      if (fFreq !== "all" && i.inspection_templates?.frequency !== fFreq) return false;
      if (fInspector && !(i.inspector_name ?? "").toLowerCase().includes(fInspector.toLowerCase())) return false;
      if (fDate && i.inspection_date !== fDate) return false;
      return true;
    });
  }, [inspections, fTpl, fFreq, fInspector, fDate]);

  const openStart = (tpl: Template) => {
    setStartTplId(tpl.id);
    setDraft(
      tpl.items.map((name) => ({
        item_name: name, result: "سليم", notes: "", corrective_action: "", file: null,
      })),
    );
    setDraftMeta({
      inspection_date: new Date().toISOString().slice(0, 10),
      inspector_name: user?.email?.split("@")[0] ?? "",
      notes: "",
    });
    setStartOpen(true);
  };

  const uploadPhoto = async (inspectionId: string, file: File) => {
    const path = `${inspectionId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { error } = await (supabase as any).storage.from("inspection-photos").upload(path, file);
    if (error) throw error;
    return path;
  };

  const submitInspection = async () => {
    if (!startTplId) return;
    setSaving(true);
    try {
      const needsAction = draft.some((d) => d.result === "يحتاج إجراء");
      const overall: Overall = !needsAction
        ? "مطابق"
        : draft.filter((d) => d.result === "يحتاج إجراء").length >= Math.ceil(draft.length / 2)
          ? "غير مطابق" : "ملاحظات";

      const { data: ins, error: insErr } = await (supabase as any)
        .from("inspections")
        .insert({
          template_id: startTplId,
          inspection_date: draftMeta.inspection_date,
          inspector_id: user?.id ?? null,
          inspector_name: draftMeta.inspector_name || null,
          overall_result: overall,
          notes: draftMeta.notes || null,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      const rows: any[] = [];
      for (const d of draft) {
        let photo_urls: string[] = [];
        if (d.file) {
          try { photo_urls = [await uploadPhoto(ins.id, d.file)]; } catch (e: any) { toast.error(e.message); }
        }
        rows.push({
          inspection_id: ins.id,
          item_name: d.item_name,
          result: d.result,
          notes: d.notes || null,
          corrective_action: d.corrective_action || null,
          photo_urls,
        });
      }
      const { error: rErr } = await (supabase as any).from("inspection_results").insert(rows);
      if (rErr) throw rErr;

      toast.success("تم حفظ التفتيش");
      setStartOpen(false);
      void load();
    } catch (e: any) {
      toast.error(e.message ?? "تعذّر حفظ التفتيش");
    } finally { setSaving(false); }
  };

  const openDetails = async (ins: Inspection) => {
    setDetailsInsp(ins);
    setDetailsOpen(true);
    const { data } = await (supabase as any)
      .from("inspection_results").select("*").eq("inspection_id", ins.id);
    setDetailsResults((data ?? []) as InspectionResult[]);
  };

  const createMaintenanceRequest = async (r: InspectionResult) => {
    const tpl = templates.find((t) => detailsInsp?.template_id === t.id);
    const { data, error } = await (supabase as any)
      .from("maintenance_requests")
      .insert({
        request_date: new Date().toISOString().slice(0, 10),
        reporter_name: detailsInsp?.inspector_name ?? "تفتيش",
        location: r.item_name,
        request_type: tpl?.template_name ?? "تفتيش",
        description: `بند "${r.item_name}" يحتاج إجراء${r.notes ? `: ${r.notes}` : ""}${r.corrective_action ? ` — مقترح: ${r.corrective_action}` : ""}`,
        status: "جديد",
        inspection_id: detailsInsp?.id,
        reported_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    const { error: uErr } = await (supabase as any)
      .from("inspection_results").update({ maintenance_request_id: data.id }).eq("id", r.id);
    if (uErr) { toast.error(uErr.message); return; }
    toast.success(`تم إنشاء طلب صيانة ${data.request_number ?? ""}`);
    setDetailsResults((prev) => prev.map((x) => x.id === r.id ? { ...x, maintenance_request_id: data.id } : x));
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">التفتيشات</h1>
      </div>

      {/* Due today */}
      <Card className={dueToday.length ? "border-amber-300" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${dueToday.length ? "text-amber-600" : "text-green-600"}`} />
            تفتيشات اليوم المستحقة ({dueToday.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dueToday.length === 0 ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> لا توجد تفتيشات مستحقة الآن.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dueToday.map((tpl) => {
                const last = lastByTpl.get(tpl.id);
                return (
                  <div key={tpl.id} className="flex items-center justify-between border rounded-md p-3 bg-card">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{tpl.template_name}</div>
                      <div className="text-xs text-muted-foreground">
                        <Badge variant="secondary" className="me-1">{tpl.frequency}</Badge>
                        آخر تنفيذ: {last ?? "لم يُنفّذ"}
                      </div>
                    </div>
                    {canManage && (
                      <Button size="sm" onClick={() => openStart(tpl)}>
                        <Play className="h-4 w-4 ms-1" /> بدء
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All templates */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">القوالب المتاحة</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center justify-between border rounded-md p-3">
                <div className="min-w-0">
                  <div className="font-medium">{tpl.template_name}</div>
                  <div className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="me-1">{tpl.frequency}</Badge>
                    {tpl.items.length} بند
                  </div>
                </div>
                {canManage && (
                  <Button size="sm" variant="outline" onClick={() => openStart(tpl)}>
                    <Play className="h-4 w-4 ms-1" /> بدء تفتيش
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">سجل التفتيشات</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label className="text-xs">القالب</Label>
              <Select value={fTpl} onValueChange={setFTpl}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل القوالب</SelectItem>
                  {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">التكرار</Label>
              <Select value={fFreq} onValueChange={setFFreq}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="يومي">يومي</SelectItem>
                  <SelectItem value="أسبوعي">أسبوعي</SelectItem>
                  <SelectItem value="شهري">شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">المسؤول</Label>
              <Input value={fInspector} onChange={(e) => setFInspector(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs">التاريخ</Label>
              <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className="w-40" />
            </div>
            {(fTpl !== "all" || fFreq !== "all" || fInspector || fDate) && (
              <Button variant="ghost" onClick={() => { setFTpl("all"); setFFreq("all"); setFInspector(""); setFDate(""); }}>مسح</Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>القالب</TableHead>
                <TableHead>التكرار</TableHead>
                <TableHead>المسؤول</TableHead>
                <TableHead>النتيجة</TableHead>
                <TableHead className="text-left">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-1 opacity-40" /> لا توجد تفتيشات
                </TableCell></TableRow>
              )}
              {filtered.map((ins) => (
                <TableRow key={ins.id}>
                  <TableCell>{ins.inspection_date}</TableCell>
                  <TableCell>{ins.inspection_templates?.template_name ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{ins.inspection_templates?.frequency ?? "—"}</Badge></TableCell>
                  <TableCell>{ins.inspector_name ?? "—"}</TableCell>
                  <TableCell>{overallBadge(ins.overall_result)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openDetails(ins)}>
                      <Eye className="h-4 w-4 ms-1" /> عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Start dialog */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              تفتيش جديد — {templates.find((t) => t.id === startTplId)?.template_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>التاريخ</Label>
                <Input type="date" value={draftMeta.inspection_date}
                  onChange={(e) => setDraftMeta({ ...draftMeta, inspection_date: e.target.value })} />
              </div>
              <div>
                <Label>المسؤول</Label>
                <Input value={draftMeta.inspector_name}
                  onChange={(e) => setDraftMeta({ ...draftMeta, inspector_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>ملاحظات عامة</Label>
              <Textarea value={draftMeta.notes}
                onChange={(e) => setDraftMeta({ ...draftMeta, notes: e.target.value })} />
            </div>

            <div className="space-y-2">
              {draft.map((d, idx) => (
                <div key={idx} className={`border rounded-md p-3 space-y-2 ${d.result === "يحتاج إجراء" ? "border-amber-400 bg-amber-50/40" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{idx + 1}. {d.item_name}</div>
                    <Select value={d.result}
                      onValueChange={(v) => setDraft((prev) => prev.map((x, i) => i === idx ? { ...x, result: v as ItemResult } : x))}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="سليم">سليم</SelectItem>
                        <SelectItem value="يحتاج إجراء">يحتاج إجراء</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="ملاحظة" value={d.notes}
                      onChange={(e) => setDraft((prev) => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))} />
                    {d.result === "يحتاج إجراء" && (
                      <Input placeholder="الإجراء التصحيحي" value={d.corrective_action}
                        onChange={(e) => setDraft((prev) => prev.map((x, i) => i === idx ? { ...x, corrective_action: e.target.value } : x))} />
                    )}
                  </div>
                  <Input type="file" accept="image/*"
                    onChange={(e) => setDraft((prev) => prev.map((x, i) => i === idx ? { ...x, file: e.target.files?.[0] ?? null } : x))} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>إلغاء</Button>
            <Button onClick={submitInspection} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ التفتيش"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              تفاصيل التفتيش — {detailsInsp?.inspection_templates?.template_name} ({detailsInsp?.inspection_date})
            </DialogTitle>
          </DialogHeader>
          {detailsInsp && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                <span>المسؤول: <b>{detailsInsp.inspector_name ?? "—"}</b></span>
                <span>•</span>
                <span>النتيجة: {overallBadge(detailsInsp.overall_result)}</span>
              </div>
              {detailsInsp.notes && <div className="text-muted-foreground">{detailsInsp.notes}</div>}

              <div className="space-y-2">
                {detailsResults.map((r) => (
                  <div key={r.id} className={`border rounded-md p-3 ${r.result === "يحتاج إجراء" ? "border-amber-400" : ""}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-medium">{r.item_name}</div>
                      <Badge className={r.result === "سليم" ? "bg-green-600 text-white" : "bg-amber-500 text-white"}>
                        {r.result}
                      </Badge>
                    </div>
                    {r.notes && <div className="text-xs text-muted-foreground mt-1">ملاحظة: {r.notes}</div>}
                    {r.corrective_action && <div className="text-xs mt-1">إجراء مقترح: {r.corrective_action}</div>}
                    {r.result === "يحتاج إجراء" && canManage && (
                      <div className="mt-2">
                        {r.maintenance_request_id ? (
                          <Badge variant="outline" className="text-green-700 border-green-400">
                            <CheckCircle2 className="h-3 w-3 ms-1" /> طلب صيانة تم إنشاؤه
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => createMaintenanceRequest(r)}>
                            <Wrench className="h-4 w-4 ms-1" /> إنشاء طلب صيانة
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
