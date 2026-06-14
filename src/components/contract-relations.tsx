import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UserPlus, Building2, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Delegate {
  id: string; contract_id: string; full_name: string;
  phone: string | null; email: string | null; position: string | null; id_number: string | null;
}

export function DelegatesCard({ contractId, canManage }: { contractId: string; canManage: boolean }) {
  const [items, setItems] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Delegate | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", position: "", id_number: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contract_delegates")
      .select("*").eq("contract_id", contractId).order("created_at");
    if (error) toast.error(error.message);
    setItems((data as Delegate[]) ?? []);
    setLoading(false);
  }, [contractId]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: "", phone: "", email: "", position: "", id_number: "" });
    setOpen(true);
  };
  const openEdit = (d: Delegate) => {
    setEditing(d);
    setForm({
      full_name: d.full_name, phone: d.phone ?? "", email: d.email ?? "",
      position: d.position ?? "", id_number: d.id_number ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name.trim()) { toast.error("الاسم مطلوب"); return; }
    const payload = {
      contract_id: contractId,
      full_name: form.full_name,
      phone: form.phone || null, email: form.email || null,
      position: form.position || null, id_number: form.id_number || null,
    };
    const { error } = editing
      ? await supabase.from("contract_delegates").update(payload).eq("id", editing.id)
      : await supabase.from("contract_delegates").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "تم التحديث" : "تم الإضافة");
    setOpen(false); load();
  };

  const remove = async (d: Delegate) => {
    if (!confirm(`حذف المفوض "${d.full_name}"؟`)) return;
    const { error } = await supabase.from("contract_delegates").delete().eq("id", d.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> المفوضون</CardTitle>
        {canManage && <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 ms-1" />إضافة مفوض</Button>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">لا يوجد مفوضون</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead><TableHead>المنصب</TableHead>
                <TableHead>الجوال</TableHead><TableHead>البريد</TableHead>
                <TableHead>الهوية</TableHead><TableHead className="w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.full_name}</TableCell>
                  <TableCell>{d.position ?? "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{d.phone ?? "—"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{d.email ?? "—"}</TableCell>
                  <TableCell>{d.id_number ?? "—"}</TableCell>
                  <TableCell>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>تعديل</Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل المفوض" : "مفوض جديد"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><Label>الاسم *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>المنصب</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><Label>رقم الهوية</Label><Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} /></div>
            <div><Label>الجوال</Label><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>البريد الإلكتروني</Label><Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface ContractOffice {
  id: string; office_id: string; is_primary: boolean; rent_share: number | null; notes: string | null;
  offices?: { id: string; code: string; floor: number | string | null } | null;
}

export function LinkedOfficesCard({ contractId, canManage }: { contractId: string; canManage: boolean }) {
  const [items, setItems] = useState<ContractOffice[]>([]);
  const [offices, setOffices] = useState<{ id: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ office_id: "", rent_share: "", is_primary: false, notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contract_offices")
      .select("*, offices(id, code, floor)").eq("contract_id", contractId).order("created_at");
    if (error) toast.error(error.message);
    setItems((data as ContractOffice[]) ?? []);
    setLoading(false);
  }, [contractId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.from("offices").select("id, code").order("code")
      .then(({ data }) => setOffices((data as { id: string; code: string }[]) ?? []));
  }, []);

  const add = async () => {
    if (!form.office_id) { toast.error("اختر مكتب"); return; }
    const { error } = await supabase.from("contract_offices").insert({
      contract_id: contractId, office_id: form.office_id,
      rent_share: form.rent_share ? Number(form.rent_share) : null,
      is_primary: form.is_primary, notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم الربط"); setOpen(false);
    setForm({ office_id: "", rent_share: "", is_primary: false, notes: "" });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("إزالة المكتب من العقد؟")) return;
    const { error } = await supabase.from("contract_offices").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> المكاتب المرتبطة</CardTitle>
        {canManage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 ms-1" />ربط مكتب</Button>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">لم يتم ربط مكاتب إضافية</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المكتب</TableHead><TableHead>الدور</TableHead>
                <TableHead>حصة الإيجار</TableHead><TableHead>ملاحظات</TableHead>
                <TableHead className="w-20">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    {o.offices?.code} {o.is_primary && <Badge className="ms-2">رئيسي</Badge>}
                  </TableCell>
                  <TableCell>{o.offices?.floor ?? "—"}</TableCell>
                  <TableCell>{o.rent_share != null ? Number(o.rent_share).toLocaleString("ar-EG") : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.notes ?? "—"}</TableCell>
                  <TableCell>
                    {canManage && <Button size="icon" variant="ghost" onClick={() => remove(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>ربط مكتب بالعقد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>المكتب *</Label>
              <Select value={form.office_id} onValueChange={(v) => setForm({ ...form, office_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر مكتب" /></SelectTrigger>
                <SelectContent>{offices.map(o => <SelectItem key={o.id} value={o.id}>{o.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>حصة الإيجار (اختياري)</Label><Input type="number" value={form.rent_share} onChange={(e) => setForm({ ...form, rent_share: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <input id="is_primary" type="checkbox" className="h-4 w-4" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
              <Label htmlFor="is_primary" className="cursor-pointer">مكتب رئيسي</Label>
            </div>
            <div><Label>ملاحظات</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={add} className="bg-primary text-primary-foreground">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface ContractParking {
  id: string; parking_spot_id: string; notes: string | null;
  parking_spots?: { id: string; spot_number: string; floor: string } | null;
}

export function LinkedParkingCard({ contractId, canManage }: { contractId: string; canManage: boolean }) {
  const [items, setItems] = useState<ContractParking[]>([]);
  const [spots, setSpots] = useState<{ id: string; spot_number: string; floor: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ parking_spot_id: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contract_parking_spots")
      .select("*, parking_spots(id, spot_number, floor)").eq("contract_id", contractId).order("created_at");
    if (error) toast.error(error.message);
    setItems((data as ContractParking[]) ?? []);
    setLoading(false);
  }, [contractId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.from("parking_spots").select("id, spot_number, floor").order("floor").order("spot_number")
      .then(({ data }) => setSpots((data as { id: string; spot_number: string; floor: string }[]) ?? []));
  }, []);

  const add = async () => {
    if (!form.parking_spot_id) { toast.error("اختر موقف"); return; }
    const { error } = await supabase.from("contract_parking_spots").insert({
      contract_id: contractId, parking_spot_id: form.parking_spot_id, notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("تم الربط"); setOpen(false); setForm({ parking_spot_id: "", notes: "" }); load();
  };
  const remove = async (id: string) => {
    if (!confirm("إزالة الموقف من العقد؟")) return;
    const { error } = await supabase.from("contract_parking_spots").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> المواقف المرتبطة ({items.length})</CardTitle>
        {canManage && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 ms-1" />ربط موقف</Button>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">لا توجد مواقف مرتبطة</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map(p => (
              <div key={p.id} className="flex items-center gap-2 border rounded-md px-3 py-1.5">
                <Badge variant="outline">دور {p.parking_spots?.floor}</Badge>
                <span className="font-medium">موقف {p.parking_spots?.spot_number}</span>
                {p.notes && <span className="text-xs text-muted-foreground">— {p.notes}</span>}
                {canManage && (
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>ربط موقف بالعقد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>الموقف *</Label>
              <Select value={form.parking_spot_id} onValueChange={(v) => setForm({ ...form, parking_spot_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر موقف" /></SelectTrigger>
                <SelectContent>{spots.map(s => <SelectItem key={s.id} value={s.id}>دور {s.floor} — موقف {s.spot_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ملاحظات</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={add} className="bg-primary text-primary-foreground">إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
