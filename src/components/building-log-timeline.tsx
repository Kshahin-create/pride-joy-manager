import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, MessageSquareWarning, Wrench, RefreshCw, Shield,
  Footprints, FileSignature, Receipt, ClipboardCheck, Building2,
  UserCheck, UserMinus, Sparkles, AlertCircle, FilePlus, FileX } from "lucide-react";

export type BuildingLogRow = {
  id: string;
  event_type: string;
  module: string;
  entity_id: string | null;
  description: string;
  location: string | null;
  metadata: Record<string, any> | null;
  actor_id: string | null;
  created_at: string;
};

export const EVENT_TYPES = [
  "شكوى جديدة","إغلاق بلاغ","طلب صيانة","تغيير حالة صيانة","عطل","استبدال أصل",
  "حادث أمني","جولة أمنية","تجديد عقد","عقد جديد","إلغاء عقد","استلام دفعة",
  "تفتيش","زيارة جهة حكومية","دخول مقاول","خروج مقاول","حدث يدوي",
] as const;

const STYLE: Record<string, { color: string; bg: string; Icon: any }> = {
  "شكوى جديدة":      { color: "text-blue-700",   bg: "bg-blue-100",   Icon: MessageSquareWarning },
  "إغلاق بلاغ":      { color: "text-slate-700",  bg: "bg-slate-100",  Icon: FileX },
  "طلب صيانة":       { color: "text-orange-700", bg: "bg-orange-100", Icon: Wrench },
  "تغيير حالة صيانة":{ color: "text-amber-700",  bg: "bg-amber-100",  Icon: RefreshCw },
  "عطل":             { color: "text-red-700",    bg: "bg-red-100",    Icon: AlertCircle },
  "استبدال أصل":     { color: "text-purple-700", bg: "bg-purple-100", Icon: RefreshCw },
  "حادث أمني":       { color: "text-red-700",    bg: "bg-red-100",    Icon: Shield },
  "جولة أمنية":      { color: "text-emerald-700",bg: "bg-emerald-100",Icon: Footprints },
  "تجديد عقد":       { color: "text-indigo-700", bg: "bg-indigo-100", Icon: RefreshCw },
  "عقد جديد":        { color: "text-indigo-700", bg: "bg-indigo-100", Icon: FileSignature },
  "إلغاء عقد":       { color: "text-rose-700",   bg: "bg-rose-100",   Icon: FileX },
  "استلام دفعة":     { color: "text-green-700",  bg: "bg-green-100",  Icon: Receipt },
  "تفتيش":           { color: "text-cyan-700",   bg: "bg-cyan-100",   Icon: ClipboardCheck },
  "زيارة جهة حكومية":{ color: "text-violet-700", bg: "bg-violet-100", Icon: Building2 },
  "دخول مقاول":      { color: "text-teal-700",   bg: "bg-teal-100",   Icon: UserCheck },
  "خروج مقاول":      { color: "text-slate-700",  bg: "bg-slate-100",  Icon: UserMinus },
  "حدث يدوي":        { color: "text-gray-700",   bg: "bg-gray-100",   Icon: Sparkles },
};

export function eventStyle(t: string) {
  return STYLE[t] ?? { color: "text-gray-700", bg: "bg-gray-100", Icon: FilePlus };
}

export function groupByDay(items: BuildingLogRow[]) {
  const out = new Map<string, BuildingLogRow[]>();
  for (const it of items) {
    const day = it.created_at.slice(0, 10);
    const arr = out.get(day) ?? [];
    arr.push(it);
    out.set(day, arr);
  }
  return Array.from(out.entries());
}

interface Filters {
  from?: string; to?: string; type?: string; location?: string; q?: string;
  officeId?: string;
}

export function useBuildingLog(filters: Filters) {
  const [items, setItems] = useState<BuildingLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any).from("building_log").select("*").order("created_at", { ascending: false }).limit(500);
    if (filters.from) q = q.gte("created_at", filters.from);
    if (filters.to)   q = q.lte("created_at", filters.to + "T23:59:59");
    if (filters.type && filters.type !== "all") q = q.eq("event_type", filters.type);
    if (filters.location) q = q.ilike("location", `%${filters.location}%`);
    if (filters.q) q = q.ilike("description", `%${filters.q}%`);
    if (filters.officeId) {
      q = q.or(`entity_id.eq.${filters.officeId},metadata->>office_id.eq.${filters.officeId}`);
    }
    const { data, error } = await q;
    if (!error) setItems((data ?? []) as BuildingLogRow[]);
    setLoading(false);
  }, [filters.from, filters.to, filters.type, filters.location, filters.q, filters.officeId]);

  useEffect(() => { void load(); }, [load]);
  return { items, loading, reload: load };
}

export function Timeline({ items }: { items: BuildingLogRow[] }) {
  const groups = useMemo(() => groupByDay(items), [items]);
  if (items.length === 0) {
    return (
      <Card><CardContent className="py-10 text-center text-muted-foreground">
        <ScrollText className="h-10 w-10 mx-auto mb-2 opacity-40" />
        لا توجد أحداث مطابقة
      </CardContent></Card>
    );
  }
  return (
    <div className="space-y-6" dir="rtl">
      {groups.map(([day, rows]) => (
        <div key={day}>
          <div className="sticky top-0 z-10 bg-background py-2 mb-2 border-b">
            <Badge variant="outline" className="text-sm">{day} — {rows.length} حدث</Badge>
          </div>
          <ol className="relative border-s border-border ms-3 space-y-3">
            {rows.map((r) => {
              const s = eventStyle(r.event_type);
              const time = new Date(r.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              return (
                <li key={r.id} className="ms-4 relative">
                  <span className={`absolute -start-[1.4rem] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background ${s.bg} ${s.color}`}>
                    <s.Icon className="h-3.5 w-3.5" />
                  </span>
                  <Card>
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge className={`${s.bg} ${s.color} border-0`}>{r.event_type}</Badge>
                        <span className="text-muted-foreground">{time}</span>
                        {r.location && <span className="text-muted-foreground">• {r.location}</span>}
                        <span className="text-muted-foreground">• {r.module}</span>
                      </div>
                      <div className="text-sm leading-relaxed">{r.description}</div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
