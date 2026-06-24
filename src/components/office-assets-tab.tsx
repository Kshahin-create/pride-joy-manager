import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Eye, Pencil, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AssetFormDialog } from "@/components/asset-form-dialog";

interface AssetRow {
  id: string;
  asset_name: string;
  asset_code: string;
  asset_type: string | null;
  current_status: string | null;
  manufacturer: string | null;
  maintenance_company: string | null;
  install_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  warranty_status: string | null;
  warranty_end_date: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  "يعمل": "bg-success text-success-foreground",
  "يعمل مع ملاحظات": "bg-info text-info-foreground",
  "يحتاج صيانة": "bg-warning text-warning-foreground",
  "تحت الصيانة": "bg-warning/80 text-warning-foreground",
  "معطل": "bg-destructive text-destructive-foreground",
  "مستبدل": "bg-muted-foreground/70 text-background",
  "خارج الخدمة": "bg-muted text-muted-foreground",
};

export function OfficeAssetsTab({ officeId }: { officeId: string }) {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "maintenance_supervisor"]);
  const [items, setItems] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("assets").select("*").eq("office_id", officeId).order("asset_code");
    if (error) toast.error(error.message);
    setItems((data ?? []) as AssetRow[]);
    setLoading(false);
  }, [officeId]);

  useEffect(() => { load(); }, [load]);

  const createMaintReq = async (asset: AssetRow) => {
    if (!canManage) return;
    const desc = prompt(`وصف طلب الصيانة للأصل "${asset.asset_name}":`);
    if (!desc) return;
    const { error } = await (supabase as any).from("maintenance_requests").insert({
      request_date: new Date().toISOString().slice(0, 10),
      request_type: "صيانة تصحيحية",
      description: desc,
      asset_id: asset.id,
      office_id: officeId,
      status: "جديد",
    });
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء طلب الصيانة");
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">أصول المكتب</h2>
        {canManage && (
          <Button size="sm" onClick={() => setOpenCreate(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="h-4 w-4 ms-1" /> إضافة أصل جديد
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 inline animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card className="py-10 text-center text-muted-foreground">لا توجد أصول مرتبطة بهذا المكتب.</Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الكود</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الشركة المصنعة</TableHead>
                  <TableHead>شركة الصيانة</TableHead>
                  <TableHead>التركيب</TableHead>
                  <TableHead>آخر صيانة</TableHead>
                  <TableHead>الصيانة القادمة</TableHead>
                  <TableHead>الضمان</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                    <TableCell className="font-medium">{a.asset_name}</TableCell>
                    <TableCell>{a.asset_type ?? "—"}</TableCell>
                    <TableCell>
                      {a.current_status ? <Badge className={STATUS_COLOR[a.current_status] ?? ""}>{a.current_status}</Badge> : "—"}
                    </TableCell>
                    <TableCell>{a.manufacturer ?? "—"}</TableCell>
                    <TableCell>{a.maintenance_company ?? "—"}</TableCell>
                    <TableCell>{a.install_date ?? "—"}</TableCell>
                    <TableCell>{a.last_maintenance_date ?? "—"}</TableCell>
                    <TableCell>{a.next_maintenance_date ?? "—"}</TableCell>
                    <TableCell>
                      {a.warranty_status ? <Badge variant="outline">{a.warranty_status}</Badge> : "—"}
                      {a.warranty_end_date && <div className="text-xs text-muted-foreground">{a.warranty_end_date}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to="/assets/$id" params={{ id: a.id }}>
                          <Button size="sm" variant="ghost" title="عرض التفاصيل"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        {canManage && (
                          <>
                            <Button size="sm" variant="ghost" title="تعديل" onClick={() => setEditing(a)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="إضافة حدث صيانة" onClick={() => createMaintReq(a)}>
                              <Wrench className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AssetFormDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSaved={() => { setOpenCreate(false); load(); }}
        defaultOfficeId={officeId}
        defaultLocationType="مكتب"
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
