import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Building2,
  Car,
  ChevronDown,
  ChevronLeft,
  Search,
  Building,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/building-map")({
  component: BuildingMap,
});

type Office = {
  id: string;
  code: string;
  office_number: string;
  floor: number;
  area_sqm: number | null;
  status: string;
};

type Spot = {
  id: string;
  spot_number: string;
  floor: string;
  spot_type: string;
  status: string;
};

const OFFICE_STATUS: Record<string, string> = {
  "متاح": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "محجوز": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "مؤجر": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "تحت الصيانة": "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  "غير متاح": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

const SPOT_STATUS: Record<string, string> = {
  "متاح": "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  "مخصص": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "مشغول": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "صيانة": "bg-orange-500/15 text-orange-700 border-orange-500/30",
};

function BuildingMap() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [search, setSearch] = useState("");
  const [closedFloors, setClosedFloors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const [o, p] = await Promise.all([
        supabase
          .from("offices")
          .select("id, code, office_number, floor, area_sqm, status")
          .order("floor", { ascending: false })
          .order("office_number"),
        supabase
          .from("parking_spots")
          .select("id, spot_number, floor, spot_type, status")
          .order("floor")
          .order("spot_number"),
      ]);
      if (o.data) setOffices(o.data as Office[]);
      if (p.data) setSpots(p.data as Spot[]);
    })();
  }, []);

  const q = search.trim();
  const matchOffice = (o: Office) =>
    !q || o.code.includes(q) || o.office_number.includes(q) || String(o.floor).includes(q);
  const matchSpot = (s: Spot) =>
    !q || s.spot_number.includes(q) || s.floor.includes(q);

  const officesByFloor = useMemo(() => {
    const m = new Map<number, Office[]>();
    for (const o of offices.filter(matchOffice)) {
      const arr = m.get(o.floor) ?? [];
      arr.push(o);
      m.set(o.floor, arr);
    }
    return m;
  }, [offices, q]);

  const spotsByFloor = useMemo(() => {
    const m = new Map<string, Spot[]>();
    for (const s of spots.filter(matchSpot)) {
      const arr = m.get(s.floor) ?? [];
      arr.push(s);
      m.set(s.floor, arr);
    }
    return m;
  }, [spots, q]);

  const officeFloors = useMemo(
    () => [...officesByFloor.keys()].sort((a, b) => b - a),
    [officesByFloor],
  );
  const parkingFloors = useMemo(
    () => [...spotsByFloor.keys()].sort(),
    [spotsByFloor],
  );

  const toggle = (k: string) =>
    setClosedFloors((p) => ({ ...p, [k]: !p[k] }));

  const stats = {
    floors: 9,
    offices: offices.length,
    available: offices.filter((o) => o.status === "متاح").length,
    leased: offices.filter((o) => o.status === "مؤجر").length,
    spots: spots.length,
    spotsAvailable: spots.filter((s) => s.status === "متاح").length,
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary">خريطة البرج</h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض كامل لجميع أدوار المكاتب والمواقف في البرج
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث برقم المكتب أو الموقف..."
            className="pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Building className="h-4 w-4" />} label="أدوار المكاتب" value={stats.floors} />
        <Stat icon={<Building2 className="h-4 w-4" />} label="إجمالي المكاتب" value={stats.offices} sub={`${stats.available} متاح · ${stats.leased} مؤجر`} />
        <Stat icon={<Car className="h-4 w-4" />} label="أدوار المواقف" value={3} />
        <Stat icon={<Car className="h-4 w-4" />} label="إجمالي المواقف" value={stats.spots} sub={`${stats.spotsAvailable} متاح`} />
      </div>

      {/* Office floors */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" /> أدوار المكاتب
        </h2>
        {officeFloors.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">لا توجد مكاتب مطابقة</CardContent></Card>
        )}
        {officeFloors.map((floor) => {
          const key = `f-${floor}`;
          const closed = closedFloors[key];
          const items = officesByFloor.get(floor)!;
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader
                className="py-3 cursor-pointer flex flex-row items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                onClick={() => toggle(key)}
              >
                <CardTitle className="text-base flex items-center gap-2">
                  {closed ? <ChevronLeft className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <Building2 className="h-4 w-4 text-gold" />
                  الدور {floor}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({items.length} مكاتب)
                  </span>
                </CardTitle>
              </CardHeader>
              {!closed && (
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {items.map((o) => (
                      <Link
                        key={o.id}
                        to="/offices/$id"
                        params={{ id: o.id }}
                        className={cn(
                          "border rounded-lg p-3 text-center hover:border-primary hover:shadow-md transition-all group",
                          OFFICE_STATUS[o.status] ?? "",
                        )}
                      >
                        <div className="font-bold text-base font-mono group-hover:text-primary">
                          {o.code}
                        </div>
                        <div className="text-[11px] mt-1 opacity-80">
                          {o.area_sqm ? `${o.area_sqm} م²` : "—"}
                        </div>
                        <div className="text-[10px] mt-1 font-medium">
                          {o.status}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </section>

      {/* Parking floors */}
      <section className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Car className="h-4 w-4" /> أدوار المواقف
        </h2>
        {parkingFloors.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">لا توجد مواقف مطابقة</CardContent></Card>
        )}
        {parkingFloors.map((fl) => {
          const key = `p-${fl}`;
          const closed = closedFloors[key];
          const items = spotsByFloor.get(fl)!;
          const available = items.filter((i) => i.status === "متاح").length;
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader
                className="py-3 cursor-pointer flex flex-row items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                onClick={() => toggle(key)}
              >
                <CardTitle className="text-base flex items-center gap-2">
                  {closed ? <ChevronLeft className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <Car className="h-4 w-4 text-gold" />
                  دور المواقف {fl}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({items.length} موقف · {available} متاح)
                  </span>
                </CardTitle>
              </CardHeader>
              {!closed && (
                <CardContent className="pt-4">
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}>
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className={cn(
                          "border rounded-md py-2 text-center font-mono text-xs font-semibold",
                          SPOT_STATUS[s.status] ?? "",
                        )}
                        title={`${s.spot_number} — ${s.status}${s.spot_type !== "عادي" ? ` (${s.spot_type})` : ""}`}
                      >
                        {s.spot_number}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-bold text-primary mt-1">
          {value.toLocaleString("ar-EG")}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
