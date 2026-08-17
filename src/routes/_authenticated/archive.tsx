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
import { FolderArchive, RotateCcw, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/archive")({
  component: ArchivePage,
});

type ArchivableTable = {
  key: string;
  label: string;
  nameField: string;
  codeField?: string;
  route?: (id: string) => { to: string; params?: any };
  scoped?: boolean;
};

const TABLES: ArchivableTable[] = [
  { key: "assets", label: "الأصول", nameField: "asset_name", codeField: "asset_code", route: (id) => ({ to: "/assets/$id", params: { id } }), scoped: true },
  { key: "vendors", label: "الموردون", nameField: "company_name", route: (id) => ({ to: "/vendors/$id", params: { id } }) },
  { key: "employees", label: "الموظفون", nameField: "full_name", route: (id) => ({ to: "/employees/$id", params: { id } }) },
  { key: "contracts", label: "العقود", nameField: "contract_number", codeField: "contract_number", route: (id) => ({ to: "/contracts/$id", params: { id } }), scoped: true },
  { key: "offices", label: "المكاتب", nameField: "code", codeField: "code", route: (id) => ({ to: "/offices/$id", params: { id } }), scoped: true },
  { key: "parking_spots", label: "المواقف", nameField: "spot_number", codeField: "spot_number", scoped: true },
  { key: "tickets", label: "الشكاوى والطلبات", nameField: "description", codeField: "ticket_number", scoped: true },
  { key: "maintenance_requests", label: "طلبات الصيانة", nameField: "description", codeField: "request_number", scoped: true },
  { key: "ac_contracts", label: "عقود التكييف", nameField: "contract_number", codeField: "contract_number", scoped: true },
  { key: "cleaning_contracts", label: "عقود النظافة", nameField: "contract_number", codeField: "contract_number", scoped: true },
  { key: "elevator_contracts", label: "عقود المصاعد", nameField: "contract_number", codeField: "contract_number", scoped: true },
  { key: "fire_contracts", label: "عقود الحريق", nameField: "contract_number", codeField: "contract_number", scoped: true },
  { key: "supply_contracts", label: "عقود التوريد", nameField: "contract_number", codeField: "contract_number", scoped: true },
  { key: "companies", label: "المستأجرون/الشركات", nameField: "company_name", scoped: true },
  { key: "invoices", label: "الفواتير", nameField: "invoice_number", codeField: "invoice_number", scoped: true },
  { key: "documents", label: "المستندات", nameField: "title", scoped: true },
  { key: "spaces", label: "المساحات", nameField: "space_name", codeField: "space_code", scoped: true },
  { key: "asset_types", label: "أنواع الأصول", nameField: "name" },
  { key: "employee_departments", label: "الأقسام", nameField: "name" },
  { key: "employee_employers", label: "جهات العمل", nameField: "name" },
  { key: "cleaning_plans", label: "خطط النظافة", nameField: "area", scoped: true },
  { key: "cameras", label: "الكاميرات", nameField: "location", codeField: "camera_number", scoped: true },
  { key: "guards", label: "الحراس", nameField: "full_name", codeField: "employee_number", scoped: true },
  { key: "patrols", label: "الجولات الأمنية", nameField: "patrol_number", codeField: "patrol_number", scoped: true },
  { key: "security_incidents", label: "الحوادث الأمنية", nameField: "incident_number", codeField: "incident_number", scoped: true },
  { key: "pm_plans", label: "خطط الصيانة الوقائية", nameField: "plan_name", scoped: true },
  { key: "parking_maintenance_checks", label: "فحوصات المواقف", nameField: "check_date" },
  { key: "parking_cleaning_logs", label: "سجل نظافة المواقف", nameField: "cleaning_date" },
  { key: "parking_violations", label: "مخالفات المواقف", nameField: "violation_type" },
  { key: "visitors", label: "الزوار", nameField: "full_name", codeField: "visitor_number", scoped: true },
];

type Row = {
  table: string;
  tableLabel: string;
  id: string;
  name: string;
  code: string | null;
  archived_at: string;
  archived_by: string | null;
  archive_reason: string | null;
  route?: { to: string; params?: any };
};

function ArchivePage() {
  const { activePropertyId } = useActiveProperty();
  const { hasPermission } = useAuth();
  const canRestore = hasPermission("records.restore");
  const canDelete = hasPermission("records.purge");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");

  const [confirm, setConfirm] = useState<{ mode: "restore" | "delete"; row: Row } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const results: Row[] = [];
    await Promise.all(
      TABLES.map(async (t) => {
        try {
          const cols = ["id", t.nameField, ...(t.codeField && t.codeField !== t.nameField ? [t.codeField] : []), "archived_at", "archived_by", "archive_reason"];
          let query = (supabase as any).from(t.key).select(cols.join(",")).not("archived_at", "is", null);
          if (t.scoped && activePropertyId) query = scoped(query, activePropertyId);
          const { data, error } = await query.order("archived_at", { ascending: false }).limit(200);
          if (error || !data) return;
          for (const r of data as any[]) {
            results.push({
              table: t.key,
              tableLabel: t.label,
              id: r.id,
              name: r[t.nameField] ?? "—",
              code: t.codeField ? (r[t.codeField] ?? null) : null,
              archived_at: r.archived_at,
              archived_by: r.archived_by,
              archive_reason: r.archive_reason,
              route: t.route?.(r.id),
            });
          }
        } catch {
          /* skip inaccessible */
        }
      })
    );
    results.sort((a, b) => (a.archived_at < b.archived_at ? 1 : -1));
    setRows(results);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activePropertyId]);

  const filtered = useMemo(() => {
    const s = q.trim();
    return rows.filter((r) => {
      if (tableFilter !== "all" && r.table !== tableFilter) return false;
      if (s && !`${r.name} ${r.code ?? ""} ${r.archive_reason ?? ""}`.includes(s)) return false;
      return true;
    });
  }, [rows, q, tableFilter]);

  const runOp = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const rpc = confirm.mode === "restore" ? "restore_record" : "delete_record";
      const args: any = { _table: confirm.row.table, _id: confirm.row.id };
      if (confirm.mode === "delete") args._reason = reason || undefined;
      const { error } = await supabase.rpc(rpc, args);
      if (error) throw error;
      toast.success(confirm.mode === "restore" ? "تمت الاستعادة" : "تم الحذف نهائيًا");
      setConfirm(null);
      setReason("");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "تعذر تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-2">
        <FolderArchive className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">الأرشيف</h1>
          <p className="text-sm text-muted-foreground">جميع العناصر المؤرشفة عبر النظام</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>العناصر المؤرشفة ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="بحث بالاسم أو الكود أو السبب…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {TABLES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? "جارٍ التحميل…" : "تحديث"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>سبب الأرشفة</TableHead>
                <TableHead>تاريخ الأرشفة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={`${r.table}-${r.id}`}>
                  <TableCell><Badge variant="secondary">{r.tableLabel}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{r.code ?? "—"}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{r.archive_reason ?? "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(r.archived_at).toLocaleString("en-US")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.route && (
                        <Link to={r.route.to as any} params={r.route.params}>
                          <Button size="sm" variant="ghost" title="فتح"><ExternalLink className="h-4 w-4" /></Button>
                        </Link>
                      )}
                      {canRestore && (
                        <Button size="sm" variant="ghost" onClick={() => setConfirm({ mode: "restore", row: r })} title="استعادة">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="ghost" className="text-destructive"
                          onClick={() => setConfirm({ mode: "delete", row: r })} title="حذف نهائي">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {loading ? "جارٍ التحميل…" : "لا توجد عناصر مؤرشفة"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirm !== null} onOpenChange={(v) => { if (!v) { setConfirm(null); setReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.mode === "restore" ? "استعادة العنصر" : "حذف نهائي"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.mode === "restore"
                ? `سيعود «${confirm?.row.name}» ليظهر في القوائم الافتراضية.`
                : `سيتم حذف «${confirm?.row.name}» نهائيًا ولا يمكن التراجع.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirm?.mode === "delete" && (
            <div className="space-y-2">
              <Label htmlFor="rsn">السبب (مقترح)</Label>
              <Textarea id="rsn" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => { e.preventDefault(); runOp(); }}
              className={confirm?.mode === "delete" ? "bg-destructive hover:bg-destructive/90" : undefined}
            >
              {busy ? "جارٍ التنفيذ…" : "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
