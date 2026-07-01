import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Download, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit-log")({
  component: AuditLogPage,
});

type Row = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  action: "archive" | "restore" | "delete";
  actor_id: string | null;
  actor_name?: string | null;
  reason: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<Row["action"], string> = {
  archive: "أرشفة",
  restore: "استعادة",
  delete: "حذف نهائي",
};
const ACTION_STYLE: Record<Row["action"], string> = {
  archive: "bg-warning/20 text-warning-foreground",
  restore: "bg-success/20 text-success-foreground",
  delete: "bg-destructive/20 text-destructive",
};

function AuditLogPage() {
  const { hasRole } = useAuth();
  const isSuper = hasRole("super_admin");
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [action, setAction] = useState<"all" | Row["action"]>("all");
  const [entity, setEntity] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Row[];
    // enrich actor names
    const actorIds = Array.from(new Set(list.map((r) => r.actor_id).filter(Boolean))) as string[];
    if (actorIds.length) {
      const { data: profs } = await (supabase as any)
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
      list.forEach((r) => {
        r.actor_name = r.actor_id ? (map.get(r.actor_id) as string) ?? null : null;
      });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuper) load();
  }, [isSuper]);

  const entityTypes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.entity_type))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim();
    return rows.filter((r) => {
      if (action !== "all" && r.action !== action) return false;
      if (entity !== "all" && r.entity_type !== entity) return false;
      if (
        term &&
        !`${r.entity_name ?? ""} ${r.entity_type} ${r.actor_name ?? ""} ${r.reason ?? ""}`.includes(term)
      )
        return false;
      return true;
    });
  }, [rows, q, action, entity]);

  const exportCsv = () => {
    const header = ["التاريخ", "الإجراء", "نوع العنصر", "اسم العنصر", "المستخدم", "السبب"];
    const body = filtered.map((r) => [
      new Date(r.created_at).toLocaleString("en-US"),
      ACTION_LABEL[r.action],
      r.entity_type,
      r.entity_name ?? "",
      r.actor_name ?? "",
      r.reason ?? "",
    ]);
    const csv = [header, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isSuper) {
    return (
      <div className="p-8 text-center text-muted-foreground" dir="rtl">
        <ShieldAlert className="mx-auto h-8 w-8 mb-2" />
        هذه الصفحة متاحة للمدير العام فقط.
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" /> سجل التدقيق
          </h1>
          <p className="text-sm text-muted-foreground">
            كل عمليات الأرشفة والاستعادة والحذف النهائي في النظام
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 ml-2" /> تصدير CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">تصفية</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="بحث…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={action} onValueChange={(v) => setAction(v as typeof action)}>
            <SelectTrigger>
              <SelectValue placeholder="الإجراء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الإجراءات</SelectItem>
              <SelectItem value="archive">أرشفة</SelectItem>
              <SelectItem value="restore">استعادة</SelectItem>
              <SelectItem value="delete">حذف نهائي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger>
              <SelectValue placeholder="نوع العنصر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>نوع العنصر</TableHead>
                <TableHead>اسم العنصر</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>السبب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    جاري التحميل…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell dir="ltr" className="text-start whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("en-US")}
                    </TableCell>
                    <TableCell>
                      <Badge className={ACTION_STYLE[r.action]}>{ACTION_LABEL[r.action]}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.entity_type}</TableCell>
                    <TableCell className="font-medium">{r.entity_name ?? "—"}</TableCell>
                    <TableCell>{r.actor_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reason ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
