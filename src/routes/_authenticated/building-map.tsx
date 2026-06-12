import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2, Car, Coffee, Camera, Boxes, Bath, ArrowRightLeft,
  ArrowUpDown, Zap, Sun, MoreHorizontal, ChevronDown, ChevronLeft,
  Wrench, Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/building-map")({
  component: BuildingMap,
});

type Space = {
  id: string; space_code: string; space_name: string;
  space_type: string; floor: number | null; status: string;
  area_sqm: number | null;
};
type Asset = {
  id: string; asset_code: string; asset_name: string;
  space_id: string | null; criticality: string;
};

const TYPE_ICON: Record<string, any> = {
  "مكتب": Building2, "موقف سيارة": Car, "لوبي": Coffee,
  "مكتب مدير البرج": Building2, "غرفة كاميرات": Camera, "مخزن": Boxes,
  "دورة مياه": Bath, "ممر": ArrowRightLeft, "مصعد": ArrowUpDown,
  "سلم": ArrowUpDown, "غرفة كهرباء": Zap, "سطح": Sun, "أخرى": MoreHorizontal,
};

const STATUS_COLOR: Record<string, string> = {
  "نشط": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "تحت الصيانة": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "مغلق": "bg-red-500/15 text-red-700 dark:text-red-400",
};

function BuildingMap() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [openFloors, setOpenFloors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const [s, a] = await Promise.all([
        supabase.from("spaces").select("id,space_code,space_name,space_type,floor,status,area_sqm").order("floor").order("space_name"),
        supabase.from("assets").select("id,asset_code,asset_name,space_id,criticality"),
      ]);
      if (s.data) setSpaces(s.data as Space[]);
      if (a.data) setAssets(a.data as Asset[]);
    })();
  }, []);

  const assetsBySpace = useMemo(() => {
    const m: Record<string, Asset[]> = {};
    for (const a of assets) if (a.space_id) (m[a.space_id] ??= []).push(a);
    return m;
  }, [assets]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return spaces;
    return spaces.filter((s) =>
      s.space_name.includes(q) || s.space_code.includes(q) || s.space_type.includes(q)
    );
  }, [spaces, search]);

  const byFloor = useMemo(() => {
    const m: Record<string, Space[]> = {};
    for (const s of filtered) {
      const k = s.floor == null ? "غير محدد" : String(s.floor);
      (m[k] ??= []).push(s);
    }
    return m;
  }, [filtered]);

  const floorKeys = useMemo(() => {
    const ks = Object.keys(byFloor);
    return ks.sort((a, b) => {
      if (a === "غير محدد") return 1;
      if (b === "غير محدد") return -1;
      return Number(a) - Number(b);
    });
  }, [byFloor]);

  const toggle = (k: string) => setOpenFloors((p) => ({ ...p, [k]: !(p[k] ?? true) }));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">خريطة البرج</h1>
          <p className="text-sm text-muted-foreground mt-1">
            شجرة هرمية لكل الأدوار والمساحات والأصول داخل البرج
          </p>
        </div>
        <div className="relative w-72">
          <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مساحة..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="عدد المساحات" value={spaces.length} />
        <Stat label="مكاتب" value={spaces.filter((s) => s.space_type === "مكتب").length} />
        <Stat label="مواقف" value={spaces.filter((s) => s.space_type === "موقف سيارة").length} />
        <Stat label="أصول مربوطة" value={assets.filter((a) => a.space_id).length} />
      </div>

      <div className="space-y-3">
        {floorKeys.map((k) => {
          const isOpen = openFloors[k] ?? true;
          const items = byFloor[k];
          return (
            <Card key={k}>
              <CardHeader
                className="pb-3 cursor-pointer flex flex-row items-center justify-between"
                onClick={() => toggle(k)}
              >
                <CardTitle className="text-base flex items-center gap-2">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  {k === "غير محدد" ? "بدون دور" : k === "0" ? "الدور الأرضي" : `الدور ${k}`}
                  <span className="text-xs text-muted-foreground font-normal">({items.length} مساحة)</span>
                </CardTitle>
              </CardHeader>
              {isOpen && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((s) => {
                      const Icon = TYPE_ICON[s.space_type] ?? MoreHorizontal;
                      const sAssets = assetsBySpace[s.id] ?? [];
                      return (
                        <div key={s.id} className="border rounded-lg p-3 hover:bg-muted/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold text-sm truncate">{s.space_name}</div>
                                <div className="text-[11px] text-muted-foreground font-mono truncate">
                                  {s.space_code} · {s.space_type}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${STATUS_COLOR[s.status] ?? ""} text-[10px]`}>
                              {s.status}
                            </Badge>
                          </div>
                          {sAssets.length > 0 && (
                            <div className="mt-2 pt-2 border-t space-y-1">
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Wrench className="h-3 w-3" /> {sAssets.length} أصل
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sAssets.slice(0, 4).map((a) => (
                                  <Link
                                    key={a.id}
                                    to="/assets/$id"
                                    params={{ id: a.id }}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary truncate max-w-[140px]"
                                    title={a.asset_name}
                                  >
                                    {a.asset_name}
                                  </Link>
                                ))}
                                {sAssets.length > 4 && (
                                  <span className="text-[10px] text-muted-foreground">+{sAssets.length - 4}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
        {floorKeys.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد مساحات مطابقة للبحث</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-primary mt-1">{value.toLocaleString("ar-SA")}</p>
      </CardContent>
    </Card>
  );
}
