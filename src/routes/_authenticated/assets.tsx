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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Wrench, AlertTriangle, Eye, Pencil } from "lucide-react";
import { AssetFormDialog } from "@/components/asset-form-dialog";

type Asset = {
  id: string;
  asset_name: string;
  asset_code: string;
  asset_type: string | null;
  location: string | null;
  manufacturer: string | null;
  supplier: string | null;
  install_date: string | null;
  warranty_end_date: string | null;
  warranty_status: string | null;
  current_status: string | null;
  expected_lifespan_years: number | null;
  responsible_person: string | null;
  criticality: "حرج" | "عادي";
  space_id: string | null;
  office_id: string | null;
  maintenance_company: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
};
type AssetType = { id: string; name: string };
type OfficeOpt = { id: string; code: string };

export const Route = createFileRoute("/_authenticated/assets")({
  component: AssetsPage,
});

const STATUS_COLOR: Record<string, string> = {
  "يعمل": "bg-success text-success-foreground",
  "يعمل مع ملاحظات": "bg-info text-info-foreground",
  "يحتاج صيانة": "bg-warning text-warning-foreground",
  "تحت الصيانة": "bg-warning/80 text-warning-foreground",
  "معطل": "bg-destructive text-destructive-foreground",
  "مستبدل": "bg-muted-foreground/70 text-background",
  "خارج الخدمة": "bg-muted text-muted-foreground",
};

function AssetsPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "maintenance_supervisor"]);
  const [items, setItems] = useState<Asset[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [offices, setOffices] = useState<OfficeOpt[]>([]);
  const [q, setQ] = useState("");
  const [fType, setFType] = useState<string>("all");
  const [fOffice, setFOffice] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fMfr, setFMfr] = useState<string>("all");
  const [fMaint, setFMaint] = useState<string>("all");
  const [fWarranty, setFWarranty] = useState<string>("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  const load = async () => {
    const { data, error } = await scoped(
      (supabase as any).from("assets").select("*"),
      activePropertyId
    ).order("criticality", { ascending: true }).order("asset_code");
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Asset[]);
  };
  const loadTypes = async () => {
    const { data } = await (supabase as any).from("asset_types").select("id,name").order("name");
    setTypes((data ?? []) as AssetType[]);
  };
  const loadOffices = async () => {
    const { data } = await scoped(
      (supabase as any).from("offices").select("id, code"),
      activePropertyId
    ).order("code");
    setOffices((data ?? []) as OfficeOpt[]);
  };
  useEffect(() => { load(); loadTypes(); loadOffices(); }, [activePropertyId]);

  const manufacturers = useMemo(
    () => Array.from(new Set(items.map((i) => i.manufacturer).filter(Boolean))) as string[],
    [items]
  );
  const maintCompanies = useMemo(
    () => Array.from(new Set(items.map((i) => i.maintenance_company).filter(Boolean))) as string[],
    [items]
  );

  const filtered = useMemo(() => {
    const s = q.trim();
    return items.filter((a) => {
      if (fType !== "all" && a.asset_type !== fType) return false;
      if (fOffice !== "all" && a.office_id !== fOffice) return false;
      if (fStatus !== "all" && a.current_status !== fStatus) return false;
      if (fMfr !== "all" && a.manufacturer !== fMfr) return false;
      if (fMaint !== "all" && a.maintenance_company !== fMaint) return false;
      if (fWarranty !== "all" && a.warranty_status !== fWarranty) return false;
      if (s && ![a.asset_name, a.asset_code, a.location, a.responsible_person, a.asset_type]
        .filter(Boolean).some((v) => String(v).includes(s))) return false;
      return true;
    });
  }, [items, q, fType, fOffice, fStatus, fMfr, fMaint, fWarranty]);

  const warrantyExpiringSoon = (d: string | null) => {
    if (!d) return false;
    return (new Date(d).getTime() - Date.now()) / 86400000 < 60;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">الأصول</h1>
          <p className="text-sm text-muted-foreground">السجل المركزي لجميع أصول المشروع</p>
        </div>
        <div className="flex gap-2">
          <Link to="/maintenance"><Button variant="outline"><Wrench className="ml-2 h-4 w-4" />طلبات الصيانة</Button></Link>
          {canManage && (
            <Button onClick={() => setOpenCreate(true)}><Plus className="ml-2 h-4 w-4" />إضافة أصل</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>قائمة الأصول ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="بحث…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={fType} onValueChange={setFType}>
              <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {types.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fOffice} onValueChange={setFOffice}>
              <SelectTrigger><SelectValue placeholder="المكتب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المكاتب</SelectItem>
                {offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.keys(STATUS_COLOR).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fMfr} onValueChange={setFMfr}>
              <SelectTrigger><SelectValue placeholder="الشركة المصنعة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المصنعين</SelectItem>
                {manufacturers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fMaint} onValueChange={setFMaint}>
              <SelectTrigger><SelectValue placeholder="شركة الصيانة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل شركات الصيانة</SelectItem>
                {maintCompanies.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fWarranty} onValueChange={setFWarranty}>
              <SelectTrigger><SelectValue placeholder="حالة الضمان" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل حالات الضمان</SelectItem>
                {["ساري", "على وشك الانتهاء", "منتهي", "لا يوجد ضمان", "غير معروف"].map((s) =>
                  <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المكتب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المصنعة</TableHead>
                <TableHead>شركة الصيانة</TableHead>
                <TableHead>الضمان</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                  <TableCell className="font-medium">{a.asset_name}</TableCell>
                  <TableCell>{a.asset_type ?? "—"}</TableCell>
                  <TableCell>{offices.find((o) => o.id === a.office_id)?.code ?? "—"}</TableCell>
                  <TableCell>
                    {a.current_status
                      ? <Badge className={STATUS_COLOR[a.current_status] ?? ""}>{a.current_status}</Badge>
                      : "—"}
                  </TableCell>
                  <TableCell>{a.manufacturer ?? "—"}</TableCell>
                  <TableCell>{a.maintenance_company ?? "—"}</TableCell>
                  <TableCell>
                    {a.warranty_end_date ? (
                      <span className={warrantyExpiringSoon(a.warranty_end_date) ? "text-destructive font-medium" : ""}>
                        {a.warranty_end_date}
                        {warrantyExpiringSoon(a.warranty_end_date) && <AlertTriangle className="inline mr-1 h-3.5 w-3.5" />}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link to="/assets/$id" params={{ id: a.id }}>
                        <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {canManage && (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">لا توجد أصول</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AssetFormDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSaved={() => { setOpenCreate(false); load(); }}
      />
      <AssetFormDialog
        open={!!editing}
        asset={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
    </div>
  );
}
