import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useActiveProperty } from "@/lib/active-property-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/offices/")({
  component: OfficesPage,
});

type OfficeStatus = "متاح" | "محجوز" | "مؤجر" | "تحت الصيانة" | "غير متاح";

interface Office {
  id: string;
  code: string;
  office_number: string;
  floor: number;
  area_sqm: number | null;
  parking_count: number;
  view_type: string | null;
  status: OfficeStatus;
  management_entity: string | null;
  notes: string | null;
}

const STATUSES: OfficeStatus[] = ["متاح", "محجوز", "مؤجر", "تحت الصيانة", "غير متاح"];
const FLOORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 99];
const floorLabel = (f: number) => (f === 99 ? "السطح (99)" : `الدور ${f}`);

const STATUS_STYLES: Record<OfficeStatus, { badge: string; card: string; dot: string }> = {
  "متاح": {
    badge: "bg-success text-success-foreground",
    card: "border-success/40 bg-success/5 hover:bg-success/10",
    dot: "bg-success",
  },
  "محجوز": {
    badge: "bg-warning text-warning-foreground",
    card: "border-warning/40 bg-warning/10 hover:bg-warning/20",
    dot: "bg-warning",
  },
  "مؤجر": {
    badge: "bg-info text-info-foreground",
    card: "border-info/40 bg-info/5 hover:bg-info/10",
    dot: "bg-info",
  },
  "تحت الصيانة": {
    badge: "bg-destructive/80 text-destructive-foreground",
    card: "border-destructive/40 bg-destructive/5 hover:bg-destructive/10",
    dot: "bg-destructive/80",
  },
  "غير متاح": {
    badge: "bg-muted-foreground/70 text-background",
    card: "border-muted-foreground/30 bg-muted/40 hover:bg-muted/60",
    dot: "bg-muted-foreground",
  },
};

function OfficesPage() {
  const { hasRole } = useAuth();
  const { activePropertyId } = useActiveProperty();
  const canEdit = hasRole("super_admin");
  const navigate = useNavigate();
  const openOffice = (o: Office) => navigate({ to: "/offices/$id", params: { id: o.id } });

  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "table">("grid");

  // table state
  const [q, setQ] = useState("");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof Office>("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // dialogs
  const [selected, setSelected] = useState<Office | null>(null);
  const [editing, setEditing] = useState<Office | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Office | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("offices")
      .select("*")
      .order("floor", { ascending: true })
      .order("office_number", { ascending: true });
    if (activePropertyId && activePropertyId !== "all") {
      q = q.eq("property_id", activePropertyId);
    }
    const { data, error } = await q;
    if (error) {
      toast.error("تعذّر تحميل المكاتب");
      setLoading(false);
      return;
    }
    setOffices((data ?? []) as Office[]);
    setLoading(false);
  }, [activePropertyId]);

  useEffect(() => {
    load();
  }, [load]);

  // إحصائيات
  const stats = useMemo(() => {
    const total = offices.length;
    const by = (s: OfficeStatus) => offices.filter((o) => o.status === s).length;
    const rented = by("مؤجر");
    const available = by("متاح");
    const reserved = by("محجوز");
    const maintenance = by("تحت الصيانة");
    const unavailable = by("غير متاح");
    const occupancy = total ? Math.round((rented / total) * 100) : 0;
    return { total, rented, available, reserved, maintenance, unavailable, occupancy };
  }, [offices]);

  // فلترة الجدول
  const filtered = useMemo(() => {
    let rs = offices.slice();
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rs = rs.filter(
        (o) =>
          o.code.toLowerCase().includes(s) ||
          (o.management_entity ?? "").toLowerCase().includes(s) ||
          (o.view_type ?? "").toLowerCase().includes(s),
      );
    }
    if (floorFilter !== "all") rs = rs.filter((o) => o.floor === Number(floorFilter));
    if (statusFilter !== "all") rs = rs.filter((o) => o.status === statusFilter);
    rs.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rs;
  }, [offices, q, floorFilter, statusFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => {
    setPage(1);
  }, [q, floorFilter, statusFilter, view]);

  const changeStatus = async (office: Office, status: OfficeStatus) => {
    if (!canEdit) return toast.error("غير مصرّح");
    if (status === office.status) return;
    const { error } = await supabase.from("offices").update({ status }).eq("id", office.id);
    if (error) return toast.error("تعذّر تغيير الحالة");
    toast.success("تم تحديث الحالة");
    setOffices((os) => os.map((o) => (o.id === office.id ? { ...o, status } : o)));
    setSelected((s) => (s && s.id === office.id ? { ...s, status } : s));
  };

  const deleteOffice = async (office: Office) => {
    const { error } = await supabase.from("offices").delete().eq("id", office.id);
    if (error) return toast.error("تعذّر حذف المكتب");
    toast.success("تم حذف المكتب");
    setOffices((os) => os.filter((o) => o.id !== office.id));
    setDeleting(null);
    setSelected((s) => (s && s.id === office.id ? null : s));
  };

  const toggleSort = (k: keyof Office) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">المكاتب</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة مكاتب البرج (9 أدوار × 6 مكاتب).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-sm rounded inline-flex items-center gap-1.5 transition ${
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              شبكي
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 text-sm rounded inline-flex items-center gap-1.5 transition ${
                view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <TableIcon className="h-4 w-4" />
              جدول
            </button>
          </div>
          {canEdit && (
            <Button
              onClick={() => setCreating(true)}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Plus className="h-4 w-4 ms-1" />
              إضافة مكتب
            </Button>
          )}
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="إجمالي المكاتب" value={stats.total} hint="9 أدوار × 6 مكاتب" tone="primary" />
        <StatCard label="المؤجّر" value={stats.rented} tone="info" />
        <StatCard label="المتاح" value={stats.available} tone="success" />
        <StatCard label="المحجوز" value={stats.reserved} tone="warning" />
        <StatCard label="نسبة الإشغال" value={`${stats.occupancy}%`} tone="gold" />
      </div>

      {/* المحتوى */}
      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin inline text-muted-foreground" />
        </Card>
      ) : view === "grid" ? (
        <GridView offices={offices} onSelect={openOffice} />
      ) : (
        <Card>
          <div className="p-3 border-b flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute top-1/2 -translate-y-1/2 start-2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث بالكود أو الجهة أو الإطلالة…"
                className="ps-8"
              />
            </div>
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="الدور" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                {FLOORS.map((f) => (
                  <SelectItem key={f} value={String(f)}>{floorLabel(f)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead onClick={() => toggleSort("code")} active={sortKey === "code"} dir={sortDir}>الكود</SortHead>
                <SortHead onClick={() => toggleSort("floor")} active={sortKey === "floor"} dir={sortDir}>الدور</SortHead>
                <SortHead onClick={() => toggleSort("area_sqm")} active={sortKey === "area_sqm"} dir={sortDir}>المساحة (م²)</SortHead>
                <TableHead>المواقف</TableHead>
                <TableHead>الإطلالة</TableHead>
                <SortHead onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir}>الحالة</SortHead>
                <TableHead>الجهة المشرفة</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    لا توجد مكاتب مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => openOffice(o)}>
                    <TableCell className="font-semibold text-primary">{o.code}</TableCell>
                    <TableCell>{o.floor}</TableCell>
                    <TableCell>{o.area_sqm ?? "—"}</TableCell>
                    <TableCell>{o.parking_count}</TableCell>
                    <TableCell>{o.view_type ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.management_entity ?? "—"}</TableCell>
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        office={o}
                        canEdit={canEdit}
                        onEdit={() => setEditing(o)}
                        onStatus={(s) => changeStatus(o, s)}
                        onDelete={() => setDeleting(o)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-3 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filtered.length} نتيجة — صفحة {page} من {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* الحوارات */}
      <OfficeDetailsDialog
        office={selected}
        canEdit={canEdit}
        onClose={() => setSelected(null)}
        onEdit={() => {
          setEditing(selected);
          setSelected(null);
        }}
        onStatus={(s) => selected && changeStatus(selected, s)}
        onDelete={() => selected && setDeleting(selected)}
      />

      <OfficeFormDialog
        open={creating || !!editing}
        office={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المكتب <span className="font-semibold">{deleting?.code}</span>؟
              لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteOffice(deleting)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ===================== مكونات داخلية ===================== */

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone: "primary" | "success" | "warning" | "gold" | "info";
}) {
  const toneClass = {
    primary: "border-t-primary text-primary",
    success: "border-t-success text-success",
    warning: "border-t-warning text-[oklch(0.55_0.15_75)]",
    gold: "border-t-gold text-[oklch(0.45_0.13_85)]",
    info: "border-t-info text-info",
  }[tone];
  return (
    <Card className={`border-t-4 ${toneClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: OfficeStatus }) {
  return <Badge className={STATUS_STYLES[status].badge}>{status}</Badge>;
}

function SortHead({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <TableHead>
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-primary">
        {children}
        {active && <span className="text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </TableHead>
  );
}

function GridView({
  offices,
  onSelect,
}: {
  offices: Office[];
  onSelect: (o: Office) => void;
}) {
  const byFloor = useMemo(() => {
    const map = new Map<number, Office[]>();
    FLOORS.forEach((f) => map.set(f, []));
    offices.forEach((o) => map.get(o.floor)?.push(o));
    map.forEach((arr) => arr.sort((a, b) => a.office_number.localeCompare(b.office_number)));
    return map;
  }, [offices]);

  return (
    <Card>
      <div className="p-4 border-b flex items-center gap-4 flex-wrap text-xs">
        <span className="font-semibold">دليل الألوان:</span>
        {STATUSES.map((s) => (
          <div key={s} className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${STATUS_STYLES[s].dot}`} />
            <span>{s}</span>
          </div>
        ))}
      </div>
      <div className="p-4 space-y-3">
        {[...FLOORS].reverse().map((f) => {
          const items = byFloor.get(f) ?? [];
          return (
            <div key={f} className="flex items-stretch gap-3">
              <div className="w-16 shrink-0 rounded-lg bg-primary text-primary-foreground flex flex-col items-center justify-center font-bold text-sm">
                <span className="text-[10px] opacity-80">{f === 99 ? "السطح" : "دور"}</span>
                <span className="text-lg">{f}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 flex-1">
                {items.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => onSelect(o)}
                    className={`rounded-lg border-2 p-3 text-right transition ${STATUS_STYLES[o.status].card}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{o.code}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[o.status].dot}`} />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{o.status}</div>
                    {o.area_sqm != null && (
                      <div className="text-[11px] text-muted-foreground">{o.area_sqm} م²</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RowActions({
  office,
  canEdit,
  onEdit,
  onStatus,
  onDelete,
}: {
  office: Office;
  canEdit: boolean;
  onEdit: () => void;
  onStatus: (s: OfficeStatus) => void;
  onDelete: () => void;
}) {
  if (!canEdit) {
    return <span className="text-xs text-muted-foreground">قراءة فقط</span>;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">إجراءات</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4 ms-2" />
          تعديل
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">تغيير الحالة</DropdownMenuLabel>
        {STATUSES.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onStatus(s)} disabled={s === office.status}>
            <span className={`w-2.5 h-2.5 rounded-full ms-2 ${STATUS_STYLES[s].dot}`} />
            {s}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 ms-2" />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OfficeDetailsDialog({
  office,
  canEdit,
  onClose,
  onEdit,
  onStatus,
  onDelete,
}: {
  office: Office | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStatus: (s: OfficeStatus) => void;
  onDelete: () => void;
}) {
  if (!office) return null;
  return (
    <Dialog open={!!office} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>المكتب {office.code}</span>
            <StatusBadge status={office.status} />
          </DialogTitle>
          <DialogDescription>تفاصيل المكتب وإجراءات سريعة.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="الدور" value={office.floor} />
          <Info label="رقم المكتب" value={office.office_number} />
          <Info label="المساحة" value={office.area_sqm ? `${office.area_sqm} م²` : "—"} />
          <Info label="عدد المواقف" value={office.parking_count} />
          <Info label="الإطلالة" value={office.view_type ?? "—"} />
          <Info label="الجهة المشرفة" value={office.management_entity ?? "—"} />
          {office.notes && (
            <div className="col-span-2">
              <Info label="ملاحظات" value={office.notes} />
            </div>
          )}
        </div>
        {canEdit && (
          <>
            <div className="border-t pt-3">
              <Label className="text-xs text-muted-foreground mb-2 block">تغيير الحالة</Label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatus(s)}
                    disabled={s === office.status}
                    className={`px-2.5 py-1 rounded-md text-xs border transition disabled:opacity-100 disabled:cursor-default ${
                      s === office.status
                        ? STATUS_STYLES[s].badge + " border-transparent"
                        : "bg-card hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 ms-1" />
                حذف
              </Button>
              <Button onClick={onEdit} className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Pencil className="h-4 w-4 ms-1" />
                تعديل
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

const officeSchema = z.object({
  code: z.string().trim().min(1, "الكود مطلوب").max(20),
  office_number: z.string().trim().min(1, "رقم المكتب مطلوب").max(10),
  floor: z.number().int().refine((v) => (v >= 1 && v <= 9) || v === 99, "الدور بين 1 و 9 أو 99 (السطح)"),
  area_sqm: z.number().nonnegative().nullable(),
  parking_count: z.number().int().nonnegative(),
  view_type: z.string().max(100).nullable(),
  status: z.enum(STATUSES as [OfficeStatus, ...OfficeStatus[]]),
  management_entity: z.string().max(150).nullable(),
  notes: z.string().max(1000).nullable(),
});

function OfficeFormDialog({
  open,
  office,
  onClose,
  onSaved,
}: {
  open: boolean;
  office: Office | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!office;
  const [form, setForm] = useState<{
    code: string;
    office_number: string;
    floor: number;
    area_sqm: string;
    parking_count: number;
    view_type: string;
    status: OfficeStatus;
    management_entity: string;
    notes: string;
  }>({
    code: "",
    office_number: "",
    floor: 1,
    area_sqm: "",
    parking_count: 0,
    view_type: "",
    status: "متاح",
    management_entity: "إدارة البرج",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (office) {
        setForm({
          code: office.code,
          office_number: office.office_number,
          floor: office.floor,
          area_sqm: office.area_sqm?.toString() ?? "",
          parking_count: office.parking_count,
          view_type: office.view_type ?? "",
          status: office.status,
          management_entity: office.management_entity ?? "",
          notes: office.notes ?? "",
        });
      } else {
        setForm({
          code: "",
          office_number: "",
          floor: 1,
          area_sqm: "",
          parking_count: 1,
          view_type: "",
          status: "متاح",
          management_entity: "إدارة البرج",
          notes: "",
        });
      }
    }
  }, [open, office]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePid = typeof window !== "undefined" ? localStorage.getItem("taam_active_property") : null;
    const payload: any = {
      code: form.code.trim(),
      office_number: form.office_number.trim(),
      floor: Number(form.floor),
      area_sqm: form.area_sqm.trim() === "" ? null : Number(form.area_sqm),
      parking_count: Number(form.parking_count),
      view_type: form.view_type.trim() || null,
      status: form.status,
      management_entity: form.management_entity.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (!isEdit && activePid && activePid !== "all") payload.property_id = activePid;
    const v = officeSchema.safeParse(payload);
    if (!v.success) {
      toast.error(v.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = isEdit
      ? await supabase.from("offices").update(payload).eq("id", office!.id)
      : await supabase.from("offices").insert(payload);
    setBusy(false);
    if (error) {
      if (error.code === "23505") toast.error("الكود أو رقم المكتب مستخدم مسبقاً");
      else toast.error("تعذّر الحفظ: " + error.message);
      return;
    }
    toast.success(isEdit ? "تم تحديث المكتب" : "تم إضافة المكتب");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "تعديل مكتب" : "إضافة مكتب جديد"}</DialogTitle>
            <DialogDescription>
              املأ بيانات المكتب. الكود والدور ورقم المكتب حقول إلزامية.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">الكود</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="مثال: F1-01"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="num">رقم المكتب</Label>
              <Input
                id="num"
                value={form.office_number}
                onChange={(e) => setForm({ ...form, office_number: e.target.value })}
                placeholder="مثال: 01"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>الدور</Label>
              <Select
                value={String(form.floor)}
                onValueChange={(v) => setForm({ ...form, floor: Number(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FLOORS.map((f) => (
                    <SelectItem key={f} value={String(f)}>{floorLabel(f)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الحالة</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as OfficeStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">المساحة (م²)</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                value={form.area_sqm}
                onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
                placeholder="مثال: 60.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="park">عدد المواقف</Label>
              <Input
                id="park"
                type="number"
                min={0}
                value={form.parking_count}
                onChange={(e) => setForm({ ...form, parking_count: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="view">نوع الإطلالة</Label>
              <Input
                id="view"
                value={form.view_type}
                onChange={(e) => setForm({ ...form, view_type: e.target.value })}
                placeholder="مثال: إطلالة بحرية"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mgmt">الجهة المشرفة</Label>
              <Input
                id="mgmt"
                value={form.management_entity}
                onChange={(e) => setForm({ ...form, management_entity: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              إلغاء
            </Button>
            <Button type="submit" disabled={busy} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
