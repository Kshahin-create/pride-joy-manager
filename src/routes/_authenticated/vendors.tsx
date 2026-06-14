import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Truck, Star, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendors")({
  component: VendorsPage,
});

type Vendor = {
  id: string;
  company_name: string;
  activity: string | null;
  contact_person: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

function StarRating({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ms-1 text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </span>
  );
}

function VendorsPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasRole } = useAuth();
  const canManage = hasRole("super_admin");
  const [items, setItems] = useState<Vendor[]>([]);
  const [averages, setAverages] = useState<Record<string, number>>({});
  const [expiringCount, setExpiringCount] = useState(0);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>({});

  const load = async () => {
    const { data: vs, error } = await (supabase as any).from("vendors").select("*").order("company_name");
    if (error) return toast.error(error.message);
    setItems((vs ?? []) as Vendor[]);

    const { data: evs } = await (supabase as any)
      .from("vendor_evaluations")
      .select("vendor_id, quality_score, commitment_score, speed_score");
    const map: Record<string, { sum: number; n: number }> = {};
    (evs ?? []).forEach((e: any) => {
      const avg = (e.quality_score + e.commitment_score + e.speed_score) / 3;
      if (!map[e.vendor_id]) map[e.vendor_id] = { sum: 0, n: 0 };
      map[e.vendor_id].sum += avg;
      map[e.vendor_id].n += 1;
    });
    const out: Record<string, number> = {};
    Object.entries(map).forEach(([k, v]) => (out[k] = v.sum / v.n));
    setAverages(out);

    const in60 = new Date();
    in60.setDate(in60.getDate() + 60);
    const { data: cs } = await (supabase as any)
      .from("vendor_contracts")
      .select("id")
      .lte("end_date", in60.toISOString().slice(0, 10))
      .gte("end_date", new Date().toISOString().slice(0, 10));
    setExpiringCount((cs ?? []).length);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return items;
    return items.filter(
      (v) =>
        v.company_name.includes(s) ||
        (v.activity ?? "").includes(s) ||
        (v.contact_person ?? "").includes(s) ||
        (v.mobile ?? "").includes(s),
    );
  }, [items, q]);

  const create = async () => {
    if (!form.company_name) return toast.error("اسم الشركة مطلوب");
    const { error } = await (supabase as any).from("vendors").insert({
      company_name: form.company_name,
      activity: form.activity ?? null,
      contact_person: form.contact_person ?? null,
      mobile: form.mobile ?? null,
      email: form.email ?? null,
      address: form.address ?? null,
      notes: form.notes ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إضافة المورد");
    setOpen(false);
    setForm({});
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-gold" /> الموردون
          </h1>
          <p className="text-sm text-muted-foreground">إدارة الموردين والعقود والتقييمات</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-1" /> إضافة مورد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مورد جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>اسم الشركة *</Label>
                  <Input value={form.company_name ?? ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                </div>
                <div>
                  <Label>النشاط</Label>
                  <Input value={form.activity ?? ""} onChange={(e) => setForm({ ...form, activity: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>مسؤول التواصل</Label>
                    <Input value={form.contact_person ?? ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                  </div>
                  <div>
                    <Label>الجوال</Label>
                    <Input value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>العنوان</Label>
                  <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {expiringCount > 0 && (
        <Card className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>
              يوجد <b>{expiringCount}</b> عقد مورد سينتهي خلال 60 يوماً.
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>قائمة الموردين</span>
            <Input
              placeholder="بحث..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-56"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>النشاط</TableHead>
                <TableHead>مسؤول التواصل</TableHead>
                <TableHead>الجوال</TableHead>
                <TableHead>متوسط التقييم</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.company_name}</TableCell>
                  <TableCell>{v.activity ?? "—"}</TableCell>
                  <TableCell>{v.contact_person ?? "—"}</TableCell>
                  <TableCell>{v.mobile ?? "—"}</TableCell>
                  <TableCell>
                    {averages[v.id] != null ? <StarRating value={averages[v.id]} /> : <Badge variant="secondary">لا يوجد</Badge>}
                  </TableCell>
                  <TableCell>
                    <Link to="/vendors/$id" params={{ id: v.id }}>
                      <Button variant="outline" size="sm">تفاصيل</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا يوجد موردون.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
