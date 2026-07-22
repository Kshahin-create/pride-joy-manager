import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sunrise, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, FileSignature, Wrench, Receipt } from "lucide-react";

export interface TodaysBriefInputs {
  woClosedToday: number;
  woOverdue: number;
  criticalFailures: number;
  contractsExpiringSoon: number; // <= 7 days
  revenueDeltaPct: number | null; // vs previous period
  ticketsEmergency: number;
  visitorsToday: number;
}

interface BriefLine {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  tone: "good" | "warn" | "bad" | "info";
}

const TONE: Record<BriefLine["tone"], string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-red-600 dark:text-red-400",
  info: "text-sky-600 dark:text-sky-400",
};

export function TodaysBrief({ inputs }: { inputs: TodaysBriefInputs }) {
  const lines: BriefLine[] = [];

  if (inputs.woClosedToday > 0)
    lines.push({ icon: CheckCircle2, tone: "good", text: `تم إنهاء ${inputs.woClosedToday} أوامر عمل اليوم.` });

  if (inputs.woOverdue > 0)
    lines.push({ icon: AlertTriangle, tone: "warn", text: `يوجد ${inputs.woOverdue} أوامر صيانة متأخرة.` });
  else
    lines.push({ icon: CheckCircle2, tone: "good", text: "لا توجد أوامر صيانة متأخرة." });

  if (inputs.criticalFailures > 0)
    lines.push({ icon: AlertTriangle, tone: "bad", text: `${inputs.criticalFailures} عطل حرج يحتاج تدخل فوري.` });
  else
    lines.push({ icon: CheckCircle2, tone: "good", text: "لا توجد أعطال حرجة اليوم." });

  if (inputs.ticketsEmergency > 0)
    lines.push({ icon: AlertTriangle, tone: "bad", text: `${inputs.ticketsEmergency} بلاغ طارئ مفتوح.` });

  if (inputs.contractsExpiringSoon > 0)
    lines.push({ icon: FileSignature, tone: "warn", text: `${inputs.contractsExpiringSoon} عقد ينتهي خلال 7 أيام.` });

  if (typeof inputs.revenueDeltaPct === "number" && Number.isFinite(inputs.revenueDeltaPct)) {
    const up = inputs.revenueDeltaPct >= 0;
    lines.push({
      icon: up ? TrendingUp : TrendingDown,
      tone: up ? "good" : "warn",
      text: `الإيرادات ${up ? "أعلى" : "أقل"} من الفترة السابقة بنسبة ${Math.abs(inputs.revenueDeltaPct).toFixed(1)}%.`,
    });
  }

  if (inputs.visitorsToday > 0)
    lines.push({ icon: Receipt, tone: "info", text: `${inputs.visitorsToday} زائر مسجّل اليوم.` });

  if (lines.length === 0)
    lines.push({ icon: CheckCircle2, tone: "good", text: "يوم هادئ — لا توجد أحداث بارزة حتى الآن." });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-primary" />
          ملخص اليوم
          <span className="ms-auto text-[10px] font-normal text-muted-foreground">لمحة سريعة خلال 10 ثوانٍ</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {lines.slice(0, 8).map((l, i) => {
            const Icon = l.icon;
            return (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${TONE[l.tone]}`} />
                <span className="text-foreground/90 leading-relaxed">{l.text}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line
void Wrench;
