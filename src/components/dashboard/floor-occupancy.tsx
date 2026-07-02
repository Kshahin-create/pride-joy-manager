import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

export interface FloorRow {
  floor: number;
  total: number;
  occupied: number;
}

const floorName = (f: number) => (f === 99 ? "السطح" : `دور ${f}`);

export function FloorOccupancy({ rows }: { rows: FloorRow[] }) {
  const sorted = [...rows].sort((a, b) => (a.floor === 99 ? 1 : b.floor === 99 ? -1 : a.floor - b.floor));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          إشغال الأدوار
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>
        ) : (
          sorted.map((r) => {
            const pct = r.total ? Math.round((r.occupied / r.total) * 100) : 0;
            const tone = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-primary" : pct >= 20 ? "bg-amber-500" : "bg-slate-400";
            return (
              <div key={r.floor} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{floorName(r.floor)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    <span className="font-bold text-foreground">{r.occupied}</span>/{r.total} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${tone} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
