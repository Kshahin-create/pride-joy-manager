import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n || 0);

interface Props {
  total: number;
  rented: number;
  reserved: number;
  available: number;
  maintenance: number;
}

export function OccupancyPanel({ total, rented, reserved, available, maintenance }: Props) {
  const occ = total ? Math.round(((rented + reserved) / total) * 100) : 0;
  const bar = (v: number) => (total ? (v / total) * 100 : 0);

  const rows = [
    { label: "مؤجر", value: rented, color: "bg-emerald-500", text: "text-emerald-600" },
    { label: "محجوز", value: reserved, color: "bg-amber-500", text: "text-amber-600" },
    { label: "متاح", value: available, color: "bg-slate-400", text: "text-slate-500" },
    { label: "صيانة", value: maintenance, color: "bg-red-500", text: "text-red-600" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          نسبة الإشغال
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <OccupancyRing percent={occ} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">إجمالي المكاتب</p>
            <p className="text-2xl font-bold text-primary tabular-nums">{fmt(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-emerald-600">{fmt(rented + reserved)}</span> مشغول
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${r.color}`} />
                  <span className="text-muted-foreground">{r.label}</span>
                </span>
                <span className={`font-bold tabular-nums ${r.text}`}>{fmt(r.value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${r.color} transition-all duration-500`}
                  style={{ width: `${bar(r.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OccupancyRing({ percent }: { percent: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="hsl(var(--muted))" strokeWidth="9" fill="none" />
        <circle
          cx="50" cy="50" r={r}
          stroke="hsl(var(--primary))" strokeWidth="9" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-primary tabular-nums">{percent}%</span>
        <span className="text-[9px] text-muted-foreground">إشغال</span>
      </div>
    </div>
  );
}
