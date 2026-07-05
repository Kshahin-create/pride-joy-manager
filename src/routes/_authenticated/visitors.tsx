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
import { Plus, LogOut, Users, UserCheck, Search, Download } from "lucide-react";
import { DeleteArchiveMenu } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/visitors")({
  component: VisitorsPage,
});

type Visitor = {
  id: string; visitor_number: string; full_name: string; national_id: string | null;
  phone: string | null; office_id: string | null; company_visiting: string | null;
  host_name: string | null; visitor_type: string; purpose: string | null;
  vehicle_plate: string | null; badge_number: string | null;
  check_in_at: string; check_out_at: string | null;
  status: "داخل" | "خرج" | "ملغي"; notes: string | null;
};
type Office = { id: string; code: string; floor: number };
type CompanyOnFloor = { company_id: string; company_name: string; office_id: string; code: string; floor: number };

function VisitorsPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "receptionist", "security_supervisor"]);
  const [items, setItems] = useState<Visitor[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [companiesByFloor, setCompaniesByFloor] = useState<CompanyOnFloor[]>([]);
  const [tab, setTab] = useState<"داخل" | "اليوم" | "الكل">("داخل");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>({
    full_name: "", phone: "", floor: "", company_key: "",
  });

  const load = async () => {
    const [v, o, contractsRes] = await Promise.all([
      scoped(supabase.from("visitors").select("*"), activePropertyId).order("check_in_at", { ascending: false }).limit(500),
      supabase.from("offices").select("id,code,floor").order("code"),
      supabase
        .from("contracts")
        .select("status, company:companies(id, company_name), office:offices(id, code, floor)")
        .in("status", ["ساري", "مجدد", "تحت التجديد"]),
    ]);
    if (v.error) toast.error(v.error.message); else setItems((v.data ?? []) as Visitor[]);
    if (!o.error) setOffices((o.data ?? []) as Office[]);
    if (!contractsRes.error) {
      const seen = new Set<string>();
      const list: CompanyOnFloor[] = [];
      for (const row of (contractsRes.data ?? []) as Array<{
        company: { id: string; company_name: string } | null;
        office: { id: string; code: string; floor: number } | null;
      }>) {
        if (!row.company || !row.office) continue;
        const key = `${row.company.id}|${row.office.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({
          company_id: row.company.id,
          company_name: row.company.company_name,
          office_id: row.office.id,
          code: row.office.code,
          floor: row.office.floor,
        });
      }
      setCompaniesByFloor(list);
    }
  };
  useEffect(() => { load(); }, []);

  const officeMap = useMemo(() => new Map(offices.map((o) => [o.id, o])), [offices]);

  const floorOptions = useMemo(() => {
    const set = new Set<number>();
    companiesByFloor.forEach((c) => set.add(c.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [companiesByFloor]);

  const companiesOnFloor = useMemo(() => {
    if (!form.floor) return [];
    return companiesByFloor
      .filter((c) => c.floor === Number(form.floor))
      .sort((a, b) => a.company_name.localeCompare(b.company_name, "ar"));
  }, [form.floor, companiesByFloor]);

  useEffect(() => {
    setForm((f: any) => ({ ...f, company_key: "" }));
  }, [form.floor]);

  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let arr = items;
    if (tab === "داخل") arr = arr.filter((v) => v.status === "داخل");
    else if (tab === "اليوم") arr = arr.filter((v) => new Date(v.check_in_at) >= today);
    const s = q.trim();
    if (s) arr = arr.filter((v) =>
      v.full_name.includes(s) || v.visitor_number?.includes(s) ||
      v.national_id?.includes(s) || v.phone?.includes(s) ||
      (v.office_id && officeMap.get(v.office_id)?.code.includes(s))
    );
    return arr;
  }, [items, tab, q, officeMap]);

  const inside = items.filter((v) => v.status === "داخل").length;
  const todayCount = items.filter((v) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return new Date(v.check_in_at) >= t;
  }).length;

  const checkIn = async () => {
    if (!form.full_name.trim()) return toast.error("اسم الزائر مطلوب");
    if (!form.phone.trim()) return toast.error("رقم الهاتف مطلوب");
    if (!form.floor) return toast.error("اختر الدور");
    const selected = companiesOnFloor.find((c) => `${c.company_id}|${c.office_id}` === form.company_key);
    if (!selected) return toast.error("اختر الشركة");
    setBusy(true);
    const payload: any = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      office_id: selected.office_id,
      company_id: selected.company_id,
      company_visiting: selected.company_name,
      visitor_type: "زائر",
    };
    const { error } = await supabase.from("visitors").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل دخول الزائر");
    setOpen(false);
    setForm({ full_name: "", phone: "", floor: "", company_key: "" });
    await load();
  };

  const checkOut = async (id: string) => {
    const { error } = await supabase.from("visitors").update({ status: "خرج" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الخروج");
    await load();
  };

  const fmt = (s: string | null) => s ? new Date(s).toLocaleString("en-US", { hour12: false }) : "—";

  const exportCsv = () => {
    if (filtered.length === 0) return toast.error("لا توجد سجلات للتصدير");
    const headers = ["visitor_number","full_name","national_id","phone","visitor_type","office","host_name","purpose","vehicle_plate","badge_number","check_in_at","check_out_at","status","notes"];
    const esc = (v: any) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = filtered.map((v) => [
      v.visitor_number, v.full_name, v.national_id, v.phone, v.visitor_type,
      v.office_id ? officeMap.get(v.office_id)?.code : "",
      v.host_name, v.purpose, v.vehicle_plate, v.badge_number,
      v.check_in_at, v.check_out_at, v.status, v.notes,
    ].map(esc).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `visitors-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة الزوار</h1>
          <p className="text-sm text-muted-foreground">تسجيل دخول وخروج الزوار في البرج</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 ml-1" /> تصدير CSV</Button>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ml-1" /> تسجيل دخول زائر</Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>تسجيل دخول زائر جديد</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>الرقم القومي</Label><Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} /></div>
                <div><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div>
                  <Label>نوع الزائر</Label>
                  <Select value={form.visitor_type} onValueChange={(v) => setForm({ ...form, visitor_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المكتب المُزار</Label>
                  <Select value={form.office_id} onValueChange={(v) => setForm({ ...form, office_id: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر مكتباً" /></SelectTrigger>
                    <SelectContent>{offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code} (طابق {o.floor})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>اسم المضيف</Label><Input value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} /></div>
                <div><Label>رقم الباج</Label><Input value={form.badge_number} onChange={(e) => setForm({ ...form, badge_number: e.target.value })} /></div>
                <div><Label>لوحة السيارة</Label><Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} /></div>
                <div><Label>المدة المتوقعة (دقيقة)</Label><Input type="number" value={form.expected_duration_minutes} onChange={(e) => setForm({ ...form, expected_duration_minutes: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>الغرض</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={checkIn} disabled={busy}>تسجيل الدخول</Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-600" /> داخل البرج الآن</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{inside}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> زوار اليوم</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{todayCount}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">إجمالي السجل</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{items.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {(["داخل", "اليوم", "الكل"] as const).map((t) => (
                <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}</Button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="h-4 w-4 absolute right-2 top-2.5 text-muted-foreground" />
              <Input className="pr-8" placeholder="بحث بالاسم/الرقم/الهاتف" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المكتب</TableHead>
                <TableHead>المضيف</TableHead>
                <TableHead>الدخول</TableHead>
                <TableHead>الخروج</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">لا توجد سجلات</TableCell></TableRow>
              ) : filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.visitor_number}</TableCell>
                  <TableCell className="font-medium">{v.full_name}{v.phone && <div className="text-xs text-muted-foreground">{v.phone}</div>}</TableCell>
                  <TableCell><Badge variant="outline">{v.visitor_type}</Badge></TableCell>
                  <TableCell>{v.office_id ? officeMap.get(v.office_id)?.code : "—"}</TableCell>
                  <TableCell>{v.host_name || "—"}</TableCell>
                  <TableCell className="text-xs">{fmt(v.check_in_at)}</TableCell>
                  <TableCell className="text-xs">{fmt(v.check_out_at)}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "داخل" ? "default" : v.status === "خرج" ? "secondary" : "destructive"}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      {v.status === "داخل" && canManage && (
                        <Button size="sm" variant="outline" onClick={() => checkOut(v.id)}>
                          <LogOut className="h-3 w-3 ml-1" /> خروج
                        </Button>
                      )}
                      <DeleteArchiveMenu table="visitors" id={v.id} entityLabel={v.full_name} onDone={load} compact />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
