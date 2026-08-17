import { useState } from "react";
import { MoreVertical, Archive, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Mode = "archive" | "restore" | "delete";

/** ربط كل جدول بالقسم الخاص به لاستخدام صلاحيات القسم (نفس الربط الموجود في قاعدة البيانات) */
const MODULE_FOR_TABLE: Record<string, string> = {
  cleaning_plans: "cleaning",
  cleaning_logs: "cleaning",
  cleaning_contracts: "cleaning",
  parking_spots: "parking",
  parking_violations: "parking",
  parking_cleaning_logs: "parking",
  parking_maintenance_checks: "parking",
  maintenance_requests: "maintenance",
  security_incidents: "incidents",
  patrols: "patrols",
  guards: "guards",
  assets: "assets",
  contracts: "contracts",
  offices: "offices",
  companies: "tenants",
  expenses: "expenses",
  invoices: "invoices",
  payments: "payments",
  documents: "documents",
  employees: "employees",
  vendors: "vendors",
  vendor_payments: "vendor_payments",
  visitors: "visitors",
  inspections: "inspections",
  pm_plans: "pm_plans",
  spaces: "spaces",
  cameras: "cameras",
  network_points: "network_points",
  electricity_meters: "electricity",
  ac_units: "ac_units",
  building_log: "building_log",
  tickets: "tickets",
};

interface Props {
  /** اسم الجدول في قاعدة البيانات */
  table: string;
  /** معرف السجل */
  id: string;
  /** هل السجل مؤرشف حاليًا؟ */
  isArchived?: boolean;
  /** يُنفَّذ بعد العملية بنجاح لتحديث القائمة */
  onDone?: () => void;
  /** عرض كزر أساسي بدلاً من قائمة منسدلة (لصفحات التفاصيل) */
  asButtons?: boolean;
  /** نص مختصر للعنصر يظهر في رسالة التأكيد */
  entityLabel?: string;
  /** حجم مصغّر للاستخدام داخل الجداول */
  compact?: boolean;
}

export function DeleteArchiveMenu({
  table,
  id,
  isArchived = false,
  onDone,
  asButtons = false,
  entityLabel,
  compact = false,
}: Props) {
  const { hasPermission } = useAuth();
  const mod = MODULE_FOR_TABLE[table];
  const modDelete = mod ? hasPermission(`${mod}.delete`) : false;
  const modManage = mod ? hasPermission(`${mod}.manage`) : false;
  const canArchive = hasPermission("records.archive") || modDelete || modManage;
  const canRestore = hasPermission("records.restore") || modDelete || modManage;
  const canDelete = hasPermission("records.delete") || modDelete;

  const [open, setOpen] = useState<Mode | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!canArchive && !canRestore && !canDelete) return null;

  const run = async () => {
    if (!open) return;
    setLoading(true);
    try {
      let err;
      if (open === "archive") {
        ({ error: err } = await supabase.rpc("archive_record", {
          _table: table,
          _id: id,
          _reason: reason || undefined,
        }));
      } else if (open === "restore") {
        ({ error: err } = await supabase.rpc("restore_record", {
          _table: table,
          _id: id,
        }));
      } else {
        ({ error: err } = await supabase.rpc("delete_record", {
          _table: table,
          _id: id,
          _reason: reason || undefined,
        }));
      }
      if (err) throw err;
      toast.success(
        open === "archive"
          ? "تمت الأرشفة بنجاح"
          : open === "restore"
            ? "تمت الاستعادة بنجاح"
            : "تم الحذف نهائيًا",
      );
      setOpen(null);
      setReason("");
      onDone?.();
    } catch (e: any) {
      toast.error(e?.message || "تعذر تنفيذ العملية");
    } finally {
      setLoading(false);
    }
  };

  const trigger = asButtons ? (
    <div className="flex gap-2">
      {!isArchived && canArchive && (
        <Button variant="outline" size="sm" onClick={() => setOpen("archive")}>
          <Archive className="h-4 w-4 ml-2" /> أرشفة
        </Button>
      )}
      {isArchived && canRestore && (
        <Button variant="outline" size="sm" onClick={() => setOpen("restore")}>
          <RotateCcw className="h-4 w-4 ml-2" /> استعادة
        </Button>
      )}
      {canDelete && (
        <Button variant="destructive" size="sm" onClick={() => setOpen("delete")}>
          <Trash2 className="h-4 w-4 ml-2" /> حذف نهائي
        </Button>
      )}
    </div>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={compact ? "h-8 w-8" : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {!isArchived && canArchive && (
          <DropdownMenuItem onClick={() => setOpen("archive")}>
            <Archive className="h-4 w-4 ml-2" /> أرشفة
          </DropdownMenuItem>
        )}
        {isArchived && canRestore && (
          <DropdownMenuItem onClick={() => setOpen("restore")}>
            <RotateCcw className="h-4 w-4 ml-2" /> استعادة
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            {(canArchive || canRestore) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => setOpen("delete")}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 ml-2" /> حذف نهائي
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {trigger}
      <AlertDialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {open === "archive"
                ? "أرشفة العنصر"
                : open === "restore"
                  ? "استعادة العنصر"
                  : "حذف نهائي"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {open === "delete"
                ? `هل أنت متأكد من حذف ${entityLabel ? `«${entityLabel}»` : "هذا العنصر"}؟ لا يمكن التراجع عن هذا الإجراء.`
                : open === "archive"
                  ? "لن يظهر العنصر في القوائم الافتراضية، ويمكن استعادته لاحقًا من فلتر «عرض المؤرشف»."
                  : "سيعود العنصر ليظهر في القوائم الافتراضية."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(open === "archive" || open === "delete") && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                السبب {open === "delete" ? "(مقترح)" : "(اختياري)"}
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سبب العملية…"
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                run();
              }}
              className={open === "delete" ? "bg-destructive hover:bg-destructive/90" : undefined}
            >
              {loading ? "جارٍ التنفيذ…" : "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ArchiveFilterProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ArchivedFilterToggle({ value, onChange }: ArchiveFilterProps) {
  return (
    <Button
      variant={value ? "default" : "outline"}
      size="sm"
      onClick={() => onChange(!value)}
    >
      <Archive className="h-4 w-4 ml-2" />
      {value ? "عرض النشط" : "عرض المؤرشف"}
    </Button>
  );
}
