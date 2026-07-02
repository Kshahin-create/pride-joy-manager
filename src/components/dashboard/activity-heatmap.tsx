import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/**
 * cells: 7 (days) × 24 (hours). Values are counts.
 */
export function ActivityHeatmap({ cells, title = "نشاط آخر 7 أيام" }: { cells: number[][]; title?: string }) {
  const max = Math.max(1, ...cells.flat());
  const total = cells.flat().reduce((a, b) => a + b, 0);
  const shade = (v: number) => {
    if (v === 0) return "bg-muted/50";
    const p = v / max;
    if (p < 0.2) return "bg-primary/20";
    if (p < 0.4) return "bg-primary/40";
    if (p < 0.6) return "bg-primary/60";
    if (p < 0.8) return "bg-primary/80";
    return "bg-primary";
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <span className="text-[11px] text-muted-foreground tabular-nums">{total} حدث</span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 pt-4 shrink-0">
                {DAYS.map((d) => (
                  <div key={d} className="h-3.5 text-[10px] text-muted-foreground leading-none flex items-center pe-1">{d}</div>
                ))}
              </div>
              <div className="flex-1">
                <div className="flex gap-0.5 text-[9px] text-muted-foreground tabular-nums pb-1">
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="flex-1 text-center">{h % 3 === 0 ? h : ""}</div>
                  ))}
                </div>
                {cells.map((row, di) => (
                  <div key={di} className="flex gap-0.5 mb-1">
                    {row.map((v, hi) => (
                      <div
                        key={hi}
                        title={`${DAYS[di]} ${hi}:00 — ${v} حدث`}
                        className={`h-3.5 flex-1 rounded-sm ${shade(v)} transition-all hover:ring-2 hover:ring-primary/60`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <span>أقل</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${shade(p * max)}`} />
          ))}
          <span>أكثر</span>
        </div>
      </CardContent>
    </Card>
  );
}
