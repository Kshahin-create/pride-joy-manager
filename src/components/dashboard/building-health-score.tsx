import { Card, CardContent } from "@/components/ui/card";
import { Activity, ShieldCheck, Sparkles } from "lucide-react";

export interface HealthInputs {
  ticketsOpen: number;
  ticketsEmergency: number;
  criticalFailures: number;
  woOverdue: number;
  pmDue: number;
  contractsExpiring: number;
  contractsExpired: number;
  incidentsOpen: number;
  docsExpiring: number;
  overdueTotal: number;
}

/**
 * Building Health Score — 0..100
 * Deducts weighted points from a perfect 100 for each active pain signal.
 */
export function computeHealthScore(i: HealthInputs): number {
  let score = 100;
  score -= Math.min(30, i.criticalFailures * 10);
  score -= Math.min(20, i.ticketsEmergency * 8);
  score -= Math.min(20, i.woOverdue * 3);
  score -= Math.min(10, i.incidentsOpen * 4);
  score -= Math.min(10, i.pmDue * 1.5);
  score -= Math.min(10, i.contractsExpired * 2);
  score -= Math.min(6,  i.contractsExpiring * 0.5);
  score -= Math.min(6,  i.docsExpiring * 0.5);
  score -= Math.min(8,  i.ticketsOpen * 0.2);
  if (i.overdueTotal > 0) score -= Math.min(10, Math.log10(i.overdueTotal + 1) * 3);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function bandOf(score: number) {
  if (score >= 85) return { label: "ممتاز", tone: "emerald", stroke: "rgb(16 185 129)", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 65) return { label: "جيد", tone: "sky",     stroke: "rgb(14 165 233)", text: "text-sky-600 dark:text-sky-400" };
  if (score >= 45) return { label: "يحتاج انتباه", tone: "amber", stroke: "rgb(245 158 11)", text: "text-amber-600 dark:text-amber-400" };
  return { label: "حرج", tone: "red", stroke: "rgb(239 68 68)", text: "text-red-600 dark:text-red-400" };
}

export function BuildingHealthScore({ inputs }: { inputs: HealthInputs }) {
  const score = computeHealthScore(inputs);
  const band = bandOf(score);
  const R = 42;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;

  const drivers: { label: string; value: number; ok: boolean }[] = [
    { label: "أعطال حرجة", value: inputs.criticalFailures, ok: inputs.criticalFailures === 0 },
    { label: "أوامر متأخرة", value: inputs.woOverdue, ok: inputs.woOverdue === 0 },
    { label: "بلاغات طارئة", value: inputs.ticketsEmergency, ok: inputs.ticketsEmergency === 0 },
    { label: "حوادث أمنية", value: inputs.incidentsOpen, ok: inputs.incidentsOpen === 0 },
    { label: "وقائية مستحقة", value: inputs.pmDue, ok: inputs.pmDue === 0 },
    { label: "عقود منتهية", value: inputs.contractsExpired, ok: inputs.contractsExpired === 0 },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="54" cy="54" r={R} fill="none"
                stroke={band.stroke} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${dash} ${C - dash}`}
                transform="rotate(-90 54 54)"
                style={{ transition: "stroke-dasharray 700ms ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold tabular-nums ${band.text}`}>{score}%</span>
              <span className="text-[10px] text-muted-foreground">Score</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold">مؤشّر صحّة المبنى</p>
              <span className={`text-xs font-semibold ms-auto sm:ms-0 sm:ml-2 ${band.text}`}>{band.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              مركّب من الصيانة، الأمن، العقود، الوقائية، البلاغات والمستندات.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-3">
              {drivers.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate">{d.label}</span>
                  <span className={`font-semibold tabular-nums ${d.ok ? "text-emerald-600" : "text-foreground"}`}>
                    {d.ok ? <Sparkles className="inline h-3 w-3" /> : d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
