import { Card, CardContent } from "@/components/ui/card";
import { Activity, ShieldCheck } from "lucide-react";

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

/** Overall health 0..100 */
export function computeHealthScore(i: HealthInputs): number {
  let score = 100;
  score -= Math.min(30, i.criticalFailures * 10);
  score -= Math.min(20, i.ticketsEmergency * 8);
  score -= Math.min(20, i.woOverdue * 3);
  score -= Math.min(10, i.incidentsOpen * 4);
  score -= Math.min(10, i.pmDue * 1.5);
  score -= Math.min(10, i.contractsExpired * 2);
  score -= Math.min(6, i.contractsExpiring * 0.5);
  score -= Math.min(6, i.docsExpiring * 0.5);
  score -= Math.min(8, i.ticketsOpen * 0.2);
  if (i.overdueTotal > 0) score -= Math.min(10, Math.log10(i.overdueTotal + 1) * 3);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function bandOf(score: number) {
  if (score >= 85) return { label: "Excellent", ar: "ممتاز", stroke: "rgb(16 185 129)", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
  if (score >= 65) return { label: "Good", ar: "جيد", stroke: "rgb(14 165 233)", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" };
  if (score >= 45) return { label: "Needs Attention", ar: "يحتاج انتباه", stroke: "rgb(245 158 11)", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
  return { label: "Critical", ar: "حرج", stroke: "rgb(239 68 68)", text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
}

/** Category sub-scores — each independently capped 0..100 */
function categoryScores(i: HealthInputs) {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const maintenance = clamp(100 - i.criticalFailures * 15 - i.woOverdue * 6 - i.ticketsEmergency * 8);
  const security = clamp(100 - i.incidentsOpen * 12);
  const cleaning = clamp(100 - i.ticketsOpen * 0.8);
  const assets = clamp(100 - i.criticalFailures * 10 - i.pmDue * 2);
  const contracts = clamp(100 - i.contractsExpired * 8 - i.contractsExpiring * 1.5);
  const inspections = clamp(100 - i.pmDue * 4 - i.docsExpiring * 2);
  return { maintenance, security, cleaning, assets, contracts, inspections };
}

function catTone(v: number) {
  if (v >= 85) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (v >= 65) return { bar: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" };
  if (v >= 45) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
  return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400" };
}

export function BuildingHealthScore({ inputs }: { inputs: HealthInputs }) {
  const score = computeHealthScore(inputs);
  const band = bandOf(score);
  const R = 60;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  const cats = categoryScores(inputs);

  const breakdown: { key: string; label: string; value: number }[] = [
    { key: "maintenance", label: "الصيانة", value: cats.maintenance },
    { key: "security", label: "الأمن", value: cats.security },
    { key: "cleaning", label: "النظافة", value: cats.cleaning },
    { key: "assets", label: "الأصول", value: cats.assets },
    { key: "contracts", label: "العقود", value: cats.contracts },
    { key: "inspections", label: "التفتيشات", value: cats.inspections },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
          {/* Big score dial */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
              <svg width="148" height="148" viewBox="0 0 148 148">
                <circle cx="74" cy="74" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="74" cy="74" r={R} fill="none"
                  stroke={band.stroke} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${dash} ${C - dash}`}
                  transform="rotate(-90 74 74)"
                  style={{ transition: "stroke-dasharray 800ms ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold tabular-nums leading-none ${band.text}`}>{score}</span>
                <span className="text-[10px] text-muted-foreground mt-1 tracking-wider">/ 100</span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold">مؤشّر صحّة المبنى</p>
              </div>
              <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${band.bg} ${band.text}`}>
                {band.ar} · {band.label}
              </span>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 max-w-xs">
                <Activity className="h-3 w-3 shrink-0" />
                مركّب من الصيانة، الأمن، النظافة، الأصول، العقود والتفتيشات.
              </p>
            </div>
          </div>

          {/* Category breakdown bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {breakdown.map((c) => {
              const t = catTone(c.value);
              return (
                <div key={c.key}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className={`font-semibold tabular-nums ${t.text}`}>{c.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${t.bar} rounded-full`}
                      style={{ width: `${c.value}%`, transition: "width 700ms ease" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
