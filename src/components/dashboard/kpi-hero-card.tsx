import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

type Tone = "primary" | "emerald" | "amber" | "red" | "sky";


const TONE: Record<Tone, { bg: string; ring: string; stroke: string; fill: string; text: string }> = {
  primary: { bg: "from-primary/10 via-primary/5 to-transparent", ring: "ring-primary/20", stroke: "hsl(var(--primary))", fill: "hsl(var(--primary) / 0.25)", text: "text-primary" },
  emerald: { bg: "from-emerald-500/10 via-emerald-500/5 to-transparent", ring: "ring-emerald-500/20", stroke: "rgb(16 185 129)", fill: "rgba(16,185,129,0.25)", text: "text-emerald-600 dark:text-emerald-400" },
  amber:   { bg: "from-amber-500/10 via-amber-500/5 to-transparent",   ring: "ring-amber-500/20",   stroke: "rgb(245 158 11)", fill: "rgba(245,158,11,0.25)", text: "text-amber-600 dark:text-amber-400" },
  red:     { bg: "from-red-500/10 via-red-500/5 to-transparent",       ring: "ring-red-500/20",     stroke: "rgb(239 68 68)",  fill: "rgba(239,68,68,0.25)",  text: "text-red-600 dark:text-red-400" },
  sky:     { bg: "from-sky-500/10 via-sky-500/5 to-transparent",       ring: "ring-sky-500/20",     stroke: "rgb(14 165 233)", fill: "rgba(14,165,233,0.25)", text: "text-sky-600 dark:text-sky-400" },
};

export type Trend = { label: string; value: number }[];

interface Props {
  label: string;
  value: string;
  sublabel?: string;
  tone?: Tone;
  icon: React.ComponentType<{ className?: string }>;
  deltaPct?: number | null;
  trend?: Trend;
  link?: string;
  invertDelta?: boolean; // for "متأخرات" — decrease is good
}

export function KpiHeroCard({
  label, value, sublabel, tone = "primary", icon: Icon, deltaPct, trend, link, invertDelta,
}: Props) {
  const t = TONE[tone];
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const positive = hasDelta ? (invertDelta ? deltaPct! < 0 : deltaPct! > 0) : false;
  const negative = hasDelta ? (invertDelta ? deltaPct! > 0 : deltaPct! < 0) : false;

  const body = (
    <Card className={`relative overflow-hidden ring-1 ${t.ring} bg-gradient-to-br ${t.bg} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            {sublabel && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{sublabel}</p>}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-background/60 backdrop-blur ${t.text}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <p className={`text-2xl sm:text-3xl font-bold ${t.text} tabular-nums`}>{value}</p>
        </div>

        {hasDelta && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {positive && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />}
            {negative && <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />}
            {!positive && !negative && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className={positive ? "text-emerald-600 font-semibold" : negative ? "text-red-600 font-semibold" : "text-muted-foreground"}>
              {Math.abs(deltaPct!).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">مقارنة بالشهر السابق</span>
          </div>
        )}
      </div>

      {trend && trend.length > 1 && (
        <div className="h-12 w-full -mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={t.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ direction: "rtl", borderRadius: 6, fontSize: 11, padding: "4px 8px" }}
                labelStyle={{ fontSize: 10 }}
                formatter={(v: any) => [v, ""]}
              />
              <Area type="monotone" dataKey="value" stroke={t.stroke} strokeWidth={2} fill={`url(#spark-${tone})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );

  return link ? <Link to={link as any} className="block">{body}</Link> : body;
}
