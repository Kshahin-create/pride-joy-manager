import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollText, Plus, Download, Filter } from "lucide-react";
import { EVENT_TYPES, Timeline, useBuildingLog } from "@/components/building-log-timeline";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/building-log")({
  component: BuildingLogPage,
});

const MANUAL_TYPES = ["زيارة جهة حكومية","دخول مقاول","خروج مقاول","حدث يدوي"] as const;

function BuildingLogPage() {
  const { user, hasAnyRole } = useAuth();
  const canCreate = hasAnyRole(["super_admin", "security_supervisor"]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("all");
  const [location, setLocation] = useState("");
  const [q, setQ] = useState("");

  const { items, loading, reload } = useBuildingLog({ from, to, type, location, q });

  // manual entry
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    event_type: "حدث يدوي" as (typeof MANUAL_TYPES)[number],
    description: "",
    location: "",
    vendor_id: "" as string,
  });
  const [vendors, setVendors] = useState<{ id: string; company_name: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await (supabase as any).from("vendors").select("id, company_name").order("company_name");
      setVendors((data ?? []) as any);
    })();
  }, []);

  const needsVendor = form.event_type === "دخول مقاول" || form.event_type === "خروج مقاول";

  const submit = async () => {
    if (!form.description.trim()) { toast.error("الوصف مطلوب"); return; }
    if (needsVendor && !form.vendor_id) { toast.error("اختر المقاول"); return; }
    const vendor = vendors.find((v) => v.id === form.vendor_id);
    const desc = needsVendor && vendor
      ? `${form.event_type === "دخول مقاول" ? "دخول" : "خروج"} المقاول "${vendor.company_name}"${form.description ? ` — ${form.description}` : ""}`
      : form.description;
    const { error } = await (supabase as any).from("building_log").insert({
      event_type: form.event_type,
      module: needsVendor ? "vendors" : "manual",
      entity_id: needsVendor ? form.vendor_id : null,
      description: desc,
      location: form.location || null,
      metadata: needsVendor ? { vendor_id: form.vendor_id, vendor_name: vendor?.company_name } : {},
      actor_id: user?.id ?? null,
      created_by: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم تسجيل الحدث");
    setOpen(false);
    setForm({ event_type: "حدث يدوي", description: "", location: "", vendor_id: "" });
    void reload();
  };

  const exportCsv = () => {
    const header = ["التاريخ","النوع","الموقع","الوصف","الوحدة"].join(",");
    const lines = items.map((r) =>
      [r.created_at, r.event_type, r.location ?? "", `"${(r.description ?? "").replace(/"/g, '""')}"`, r.module].join(","),
    );
    const csv = "\uFEFF" + [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `building-log-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const summary = useMemo(() => `${items.length} حدث`, [items.length]);

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">سجل البرج</h1>
          <span className="text-sm text-muted-foreground">— {summary}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 ms-1" /> تصدير CSV</Button>
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ms-1" /> تسجيل حدث يدوي</Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>تسجيل حدث يدوي</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>نوع الحدث</Label>
                    <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MANUAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {needsVendor && (
                    <div>
                      <Label>المقاول/المورد *</Label>
                      <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                        <SelectTrigger><SelectValue placeholder="اختر المقاول" /></SelectTrigger>
                        <SelectContent>
                          {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>الموقع</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div>
                    <Label>الوصف *</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={submit}>حفظ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" /> فلاتر</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 md:grid-cols-5 items-end">
          <div><Label className="text-xs">من تاريخ</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">إلى تاريخ</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div>
            <Label className="text-xs">نوع الحدث</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">الموقع</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="بحث بالموقع" /></div>
          <div><Label className="text-xs">بحث نصي</Label><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في الوصف" /></div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">جارٍ التحميل...</CardContent></Card>
      ) : (
        <Timeline items={items} />
      )}
    </div>
  );
}
