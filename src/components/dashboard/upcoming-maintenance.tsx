import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, CalendarClock } from "lucide-react";

export interface UpcomingPM {
  id: string;
  plan_name: string;
  next_due_at: string;
  frequency?: string | null;
}

export function UpcomingMaintenance({ rows }: { rows: UpcomingPM[] }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" /> صيانة قادمة
        </CardTitle>
        <Link to="/pm-plans" className="text-xs text-primary hover:underline">الكل</Link>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">لا توجد خطط قادمة</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const d = new Date(r.next_due_at);
              const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
              const tone =
                days < 0 ? "bg-red-500/10 text-red-600 border-red-500/30"
                : days <= 7 ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
              return (
                <li key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.plan_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      <span dir="ltr" className="tabular-nums">{d.toLocaleDateString("en-GB")}</span>
                      {r.frequency && <span className="opacity-60">• {r.frequency}</span>}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tone} tabular-nums shrink-0`}>
                    {days < 0 ? `متأخر ${Math.abs(days)}ي` : days === 0 ? "اليوم" : `${days}ي`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
