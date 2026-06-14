import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Wrench, AlertTriangle } from "lucide-react";

type Asset = {
  id: string;
  asset_name: string;
  asset_code: string;
  location: string | null;
  manufacturer: string | null;
  supplier: string | null;
  serial_number: string | null;
  install_date: string | null;
  warranty_end_date: string | null;
  expected_lifespan_years: number | null;
  responsible_person: string | null;
  criticality: "حرج" | "عادي";
};

export const Route = createFileRoute("/_authenticated/assets")({
  component: AssetsPage,
});

function AssetsPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "maintenance_supervisor"]);
  const [items, setItems] = useState<Asset[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Asset>>({ criticality: "عادي" });

  const load = async () => {
    const { data, error } = scoped(await supabase
      .from("assets")
      .select("*"), activePropertyId)
      .order("criticality", { ascending: true })
      .order("asset_code");
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Asset[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim();
    const sorted = [...items].sort((a, b) => {
      if (a.criticality !== b.criticality) return a.criticality === "حرج" ? -1 : 1;
      return a.asset_code.localeCompare(b.asset_code);
    });
    if (!s) return sorted;
    return sorted.filter((a) =>
      [a.asset_name, a.asset_code, a.location, a.responsible_person]
        .filter(Boolean).some((v) => String(v).includes(s))
    );
  }, [items, q]);

  const submit = async () => {
    if (!form.asset_name || !form.asset_code) return toast.error("الاسم والكود مطلوبان");
    const { error } = await supabase.from("assets").insert({
      asset_name: form.asset_name!,
      asset_code: form.asset_code!,
      location: form.location ?? null,
      manufacturer: form.manufacturer ?? null,
      supplier: form.supplier ?? null,
      serial_number: form.serial_number ?? null,
      install_date: form.install_date || null,
      warranty_end_date: form.warranty_end_date || null,
      expected_lifespan_years: form.expected_lifespan_years ?? null,
      responsible_person: form.responsible_person ?? null,
      criticality: (form.criticality as "حرج" | "عادي") ?? "عادي",
    });
    if (error) return toast.error(error.message);
    toast.success("تم إضافة الأصل");
    setOpen(false);
    setForm({ criticality: "عادي" });
    load();
  };

  const warrantyExpiringSoon = (d: string | null) => {
    if (!d) return false;
    const days = (new Date(d).getTime() - Date.now()) / 86400000;
    return days < 60;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">الأصول</h1>
          <p className="text-sm text-muted-foreground">إدارة أصول البرج وتتبع الضمانات والمسؤولين</p>
        </div>
        <div className="flex gap-2">
          <Link to="/maintenance"><Button variant="outline"><Wrench className="ml-2 h-4 w-4" />طلبات الصيانة</Button></Link>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />إضافة أصل</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>إضافة أصل جديد</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="اسم الأصل *"><Input value={form.asset_name ?? ""} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} /></Field>
                  <Field label="كود الأصل *"><Input value={form.asset_code ?? ""} onChange={(e) => setForm({ ...form, asset_code: e.target.value })} /></Field>
                  <Field label="الموقع"><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
                  <Field label="المسؤول"><Input value={form.responsible_person ?? ""} onChange={(e) => setForm({ ...form, responsible_person: e.target.value })} /></Field>
                  <Field label="الشركة المصنعة"><Input value={form.manufacturer ?? ""} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></Field>
                  <Field label="المورد"><Input value={form.supplier ?? ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
                  <Field label="الرقم التسلسلي"><Input value={form.serial_number ?? ""} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></Field>
                  <Field label="العمر المتوقع (سنوات)"><Input type="number" value={form.expected_lifespan_years ?? ""} onChange={(e) => setForm({ ...form, expected_lifespan_years: Number(e.target.value) || null })} /></Field>
                  <Field label="تاريخ التركيب"><Input type="date" value={form.install_date ?? ""} onChange={(e) => setForm({ ...form, install_date: e.target.value })} /></Field>
                  <Field label="انتهاء الضمان"><Input type="date" value={form.warranty_end_date ?? ""} onChange={(e) => setForm({ ...form, warranty_end_date: e.target.value })} /></Field>
                  <Field label="التصنيف">
                    <Select value={form.criticality ?? "عادي"} onValueChange={(v) => setForm({ ...form, criticality: v as "حرج" | "عادي" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="عادي">عادي</SelectItem><SelectItem value="حرج">حرج</SelectItem></SelectContent>
                    </Select>
                  </Field>
                </div>
                <DialogFooter><Button onClick={submit}>حفظ</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>قائمة الأصول</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="بحث بالاسم أو الكود أو الموقع…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm mb-3" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>المسؤول</TableHead>
                <TableHead>انتهاء الضمان</TableHead>
                <TableHead>التصنيف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => window.location.assign(`/assets/${a.id}`)}>
                  <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                  <TableCell className="font-medium">{a.asset_name}</TableCell>
                  <TableCell>{a.location ?? "—"}</TableCell>
                  <TableCell>{a.responsible_person ?? "—"}</TableCell>
                  <TableCell>
                    {a.warranty_end_date ? (
                      <span className={warrantyExpiringSoon(a.warranty_end_date) ? "text-destructive font-medium" : ""}>
                        {a.warranty_end_date}
                        {warrantyExpiringSoon(a.warranty_end_date) && <AlertTriangle className="inline mr-1 h-3.5 w-3.5" />}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {a.criticality === "حرج"
                      ? <Badge variant="destructive">حرج</Badge>
                      : <Badge variant="secondary">عادي</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد أصول</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
