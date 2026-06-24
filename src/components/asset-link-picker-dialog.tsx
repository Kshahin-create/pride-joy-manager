import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Plus, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string; asset_name: string; asset_code: string;
  asset_type: string | null; location_type: string | null;
  office_id: string | null; current_status: string | null;
}

/**
 * Dialog that lets the user EITHER link an existing asset to an office,
 * OR continue to create a brand-new one.
 */
export function AssetLinkPickerDialog({
  open, onClose, onLinked, onCreateNew, officeId,
}: {
  open: boolean;
  onClose: () => void;
  onLinked: () => void;       // existing asset just got linked
  onCreateNew: () => void;    // user chose to add new
  officeId: string;
}) {
  const [tab, setTab] = useState<"choose" | "link">("choose");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { if (open) { setTab("choose"); setQ(""); setRows([]); } }, [open]);

  const search = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any).from("assets")
      .select("id,asset_name,asset_code,asset_type,location_type,office_id,current_status")
      .or(`office_id.is.null,office_id.neq.${officeId}`)
      .order("asset_code")
      .limit(50);
    const term = q.trim();
    if (term) {
      query = query.or(`asset_name.ilike.%${term}%,asset_code.ilike.%${term}%,asset_type.ilike.%${term}%`);
    }
    const { data, error } = await query;
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
  }, [q, officeId]);

  useEffect(() => { if (tab === "link") search(); }, [tab, search]);

  const link = async (r: Row) => {
    setBusyId(r.id);
    const { error } = await (supabase as any)
      .from("assets")
      .update({ office_id: officeId, location_type: "مكتب" })
      .eq("id", r.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`تم ربط الأصل "${r.asset_name}" بالمكتب`);
    onLinked();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة أصل للمكتب</DialogTitle>
        </DialogHeader>

        {tab === "choose" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            <Card
              className="p-5 cursor-pointer hover:border-primary transition-colors flex flex-col items-center text-center gap-2"
              onClick={() => setTab("link")}
            >
              <div className="w-12 h-12 rounded-full bg-info/10 text-info grid place-items-center">
                <Link2 className="h-6 w-6" />
              </div>
              <div className="font-semibold">ربط أصل موجود</div>
              <div className="text-xs text-muted-foreground">البحث داخل الأصول المسجلة وربطها بهذا المكتب</div>
            </Card>
            <Card
              className="p-5 cursor-pointer hover:border-primary transition-colors flex flex-col items-center text-center gap-2"
              onClick={onCreateNew}
            >
              <div className="w-12 h-12 rounded-full bg-gold/15 text-gold grid place-items-center">
                <Plus className="h-6 w-6" />
              </div>
              <div className="font-semibold">إضافة أصل جديد</div>
              <div className="text-xs text-muted-foreground">إنشاء أصل جديد بالكامل وربطه تلقائياً بالمكتب</div>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pr-8"
                  placeholder="ابحث بالاسم أو الكود أو النوع…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                />
              </div>
              <Button variant="outline" onClick={search}>بحث</Button>
            </div>

            <div className="border rounded-md max-h-[50vh] overflow-y-auto divide-y">
              {loading ? (
                <div className="py-8 text-center"><Loader2 className="h-5 w-5 inline animate-spin text-muted-foreground" /></div>
              ) : rows.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
              ) : rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 p-2.5">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{r.asset_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.asset_code}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {r.asset_type && <Badge variant="outline" className="text-[10px]">{r.asset_type}</Badge>}
                      {r.current_status && <Badge variant="secondary" className="text-[10px]">{r.current_status}</Badge>}
                      {r.office_id && <Badge variant="destructive" className="text-[10px]">مرتبط بمكتب آخر</Badge>}
                    </div>
                  </div>
                  <Button size="sm" disabled={busyId === r.id} onClick={() => link(r)}>
                    {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "ربط"}
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTab("choose")}>رجوع</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
