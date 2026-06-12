import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Asset = {
  id: string; asset_name: string; asset_code: string; location: string | null;
  manufacturer: string | null; supplier: string | null; serial_number: string | null;
  install_date: string | null; warranty_end_date: string | null;
  expected_lifespan_years: number | null; responsible_person: string | null;
  criticality: "حرج" | "عادي"; notes: string | null;
};

type MR = {
  id: string; request_number: string | null; request_date: string;
  status: string; assigned_technician: string | null; cost: number | null;
  request_type: string | null; description: string | null;
};

export const Route = createFileRoute("/_authenticated/assets/$id")({
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<MR[]>([]);

  useEffect(() => {
    (async () => {
      const [a, h] = await Promise.all([
        supabase.from("assets").select("*").eq("id", id).maybeSingle(),
        supabase.from("maintenance_requests").select("id,request_number,request_date,status,assigned_technician,cost,request_type,description").eq("asset_id", id).order("request_date", { ascending: false }),
      ]);
      if (a.error) toast.error(a.error.message); else setAsset(a.data as Asset);
      if (!h.error) setHistory((h.data ?? []) as MR[]);
    })();
  }, [id]);

  if (!asset) return <div className="p-6" dir="rtl">جارٍ التحميل…</div>;

  const warrantyDays = asset.warranty_end_date
    ? Math.floor((new Date(asset.warranty_end_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground font-mono">{asset.asset_code}</div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {asset.asset_name}
            {asset.criticality === "حرج" && <Badge variant="destructive">حرج</Badge>}
          </h1>
        </div>
        <Link to="/assets"><Button variant="outline"><ArrowRight className="ml-2 h-4 w-4" />رجوع</Button></Link>
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
          <CardHeader><CardTitle>البيانات</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row k="الموقع" v={asset.location} />
            <Row k="المسؤول" v={asset.responsible_person} />
            <Row k="الشركة المصنعة" v={asset.manufacturer} />
            <Row k="المورد" v={asset.supplier} />
            <Row k="الرقم التسلسلي" v={asset.serial_number} />
            <Row k="تاريخ التركيب" v={asset.install_date} />
            <Row k="انتهاء الضمان" v={asset.warranty_end_date} />
            <Row k="العمر المتوقع" v={asset.expected_lifespan_years ? `${asset.expected_lifespan_years} سنوات` : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>إحصائيات الصيانة</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row k="إجمالي الطلبات" v={String(history.length)} />
            <Row k="مغلقة" v={String(history.filter((r) => r.status === "مغلق").length)} />
            <Row k="جارية" v={String(history.filter((r) => r.status !== "مغلق").length)} />
            <Row k="إجمالي التكلفة" v={`${history.reduce((s, r) => s + Number(r.cost ?? 0), 0).toLocaleString()} ر.س`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>سجل الصيانة</CardTitle></CardHeader>
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
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex justify-between border-b last:border-0 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v ?? "—"}</span>
    </div>
  );
}
