import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, AlertTriangle, Pencil, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DocumentsTab } from "@/components/documents-tab";
import { AssetFormDialog } from "@/components/asset-form-dialog";
import { Timeline, useBuildingLog } from "@/components/building-log-timeline";
import { DeleteArchiveMenu } from "@/components/delete-archive-menu";
import { useNavigate } from "@tanstack/react-router";

type Asset = {
  id: string; asset_name: string; asset_code: string; asset_type: string | null;
  location: string | null; manufacturer: string | null; supplier: string | null;
  serial_number: string | null; install_date: string | null;
  warranty_start_date: string | null; warranty_end_date: string | null; warranty_status: string | null;
  expected_lifespan_years: number | null; responsible_person: string | null;
  criticality: "حرج" | "عادي"; notes: string | null;
  capacity: string | null; current_status: string | null;
  maintenance_company: string | null; maintenance_company_phone: string | null;
  maintenance_frequency: string | null; custom_frequency_days: number | null;
  last_maintenance_date: string | null; next_maintenance_date: string | null;
  office_id: string | null; location_type: string | null; space_id: string | null;
  specs: Record<string, any> | null;
};

type MR = {
  id: string; request_number: string | null; request_date: string;
  status: string; assigned_technician: string | null; cost: number | null;
  request_type: string | null; description: string | null;
};

type Attachment = {
  id: string; attachment_name: string | null; file_name: string;
  storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string;
};

export const Route = createFileRoute("/_authenticated/assets/$id")({
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useParams();
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["super_admin", "maintenance_supervisor"]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<MR[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [officeCode, setOfficeCode] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { items: logItems } = useBuildingLog({});
  const assetEvents = logItems.filter((e) => e.module === "assets" && e.entity_id === id);

  const load = useCallback(async () => {
    const [a, h, att] = await Promise.all([
      (supabase as any).from("assets").select("*").eq("id", id).maybeSingle(),
      (supabase as any).from("maintenance_requests")
        .select("id,request_number,request_date,status,assigned_technician,cost,request_type,description")
        .eq("asset_id", id).order("request_date", { ascending: false }),
      (supabase as any).from("asset_attachments").select("*").eq("asset_id", id).order("created_at", { ascending: false }),
    ]);
    if (a.error) toast.error(a.error.message);
    else {
      setAsset(a.data as Asset);
      if (a.data?.office_id) {
        const { data: o } = await (supabase as any).from("offices").select("code").eq("id", a.data.office_id).maybeSingle();
        setOfficeCode(o?.code ?? null);
      } else setOfficeCode(null);
    }
    if (!h.error) setHistory((h.data ?? []) as MR[]);
    if (!att.error) setAttachments((att.data ?? []) as Attachment[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const downloadAtt = async (a: Attachment) => {
    const { data, error } = await (supabase as any).storage.from("asset-photos")
      .createSignedUrl(a.storage_path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };
  const deleteAtt = async (a: Attachment) => {
    if (!confirm(`حذف المرفق "${a.attachment_name || a.file_name}"؟`)) return;
    await (supabase as any).storage.from("asset-photos").remove([a.storage_path]).catch(() => {});
    const { error } = await (supabase as any).from("asset_attachments").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  if (!asset) return <div className="p-6" dir="rtl">جارٍ التحميل…</div>;

  const warrantyDays = asset.warranty_end_date
    ? Math.floor((new Date(asset.warranty_end_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-sm text-muted-foreground font-mono">{asset.asset_code}</div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {asset.asset_name}
            {asset.criticality === "حرج" && <Badge variant="destructive">حرج</Badge>}
            {asset.current_status && <Badge variant="outline">{asset.current_status}</Badge>}
          </h1>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button onClick={() => setEditOpen(true)}><Pencil className="ml-2 h-4 w-4" />تعديل</Button>
          )}
          <Link to="/assets"><Button variant="outline"><ArrowRight className="ml-2 h-4 w-4" />رجوع</Button></Link>
        </div>
      </div>

      {warrantyDays !== null && warrantyDays < 60 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-5 w-5" />
            {warrantyDays < 0
              ? `انتهى الضمان منذ ${Math.abs(warrantyDays)} يومًا`
              : `الضمان ينتهي خلال ${warrantyDays} يومًا (${asset.warranty_end_date})`}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>البيانات الأساسية</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row k="النوع" v={asset.asset_type} />
            <Row k="المكتب" v={officeCode ? <Link to="/offices/$id" params={{ id: asset.office_id! }} className="text-primary underline">{officeCode}</Link> : "—"} />
            <Row k="الموقع المرتبط" v={asset.location_type} />
            <Row k="موقع نصي" v={asset.location} />
            <Row k="المسؤول" v={asset.responsible_person} />
            <Row k="الشركة المصنعة" v={asset.manufacturer} />
            <Row k="السعة" v={asset.capacity} />
            <Row k="الرقم التسلسلي" v={asset.serial_number} />
            <Row k="تاريخ التركيب" v={asset.install_date} />
            <Row k="العمر الافتراضي" v={asset.expected_lifespan_years ? `${asset.expected_lifespan_years} سنوات` : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>الضمان وشركة الصيانة</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row k="بداية الضمان" v={asset.warranty_start_date} />
            <Row k="نهاية الضمان" v={asset.warranty_end_date} />
            <Row k="حالة الضمان" v={asset.warranty_status} />
            <Row k="شركة الصيانة" v={asset.maintenance_company} />
            <Row k="جوال شركة الصيانة" v={asset.maintenance_company_phone} />
            <Row k="دورية الصيانة" v={asset.maintenance_frequency === "مدة مخصصة" && asset.custom_frequency_days
              ? `كل ${asset.custom_frequency_days} يوم` : asset.maintenance_frequency} />
            <Row k="آخر صيانة" v={asset.last_maintenance_date} />
            <Row k="الصيانة القادمة" v={asset.next_maintenance_date} />
          </CardContent>
        </Card>
      </div>

      {asset.specs && Object.keys(asset.specs).length > 0 && (
        <Card>
          <CardHeader><CardTitle>مواصفات فنية تفصيلية</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-x-6 text-sm">
            {Object.entries(asset.specs).map(([k, v]) => (
              <Row key={k} k={k} v={typeof v === "boolean" ? (v ? "نعم" : "لا") : (v ?? "—")} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>المرفقات ({attachments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد مرفقات.</p>
          ) : (
            <div className="border rounded-md divide-y">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="truncate">
                      <div className="font-medium truncate">{a.attachment_name || a.file_name}</div>
                      {a.attachment_name && <div className="text-xs text-muted-foreground truncate">{a.file_name}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => downloadAtt(a)}><Download className="h-4 w-4" /></Button>
                    {canManage && (
                      <Button size="sm" variant="ghost" onClick={() => deleteAtt(a)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>سجل الأصل</CardTitle></CardHeader>
        <CardContent>
          <Timeline items={assetEvents} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>سجل الصيانة ({history.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الفني</TableHead>
                <TableHead>التكلفة</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.request_number}</TableCell>
                  <TableCell>{r.request_date}</TableCell>
                  <TableCell>{r.request_type ?? "—"}</TableCell>
                  <TableCell>{r.assigned_technician ?? "—"}</TableCell>
                  <TableCell>{r.cost ? Number(r.cost).toLocaleString() : "—"}</TableCell>
                  <TableCell><Badge variant={r.status === "مغلق" ? "secondary" : "default"}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">لا توجد طلبات صيانة</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>مستندات الأصل</CardTitle></CardHeader>
        <CardContent>
          <DocumentsTab entityType="asset" entityId={asset.id} />
        </CardContent>
      </Card>

      <AssetFormDialog
        open={editOpen}
        asset={asset}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); load(); }}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b last:border-0 py-1.5 gap-2">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="font-medium text-right">{v ?? "—"}</span>
    </div>
  );
}
