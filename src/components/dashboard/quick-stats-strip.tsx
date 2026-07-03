import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "./count-up";

export interface QuickStat {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "primary" | "emerald" | "amber" | "red" | "sky" | "violet" | "slate";
  link?: string;
  search?: Record<string, string>;
  suffix?: string;
}

const TONES: Record<string, string> = {
  primary: "from-primary/15 to-primary/5 text-primary border-primary/20",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20",
  red: "from-red-500/15 to-red-500/5 text-red-600 dark:text-red-400 border-red-500/20",
  sky: "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/20",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400 border-violet-500/20",
  slate: "from-slate-500/15 to-slate-500/5 text-slate-600 dark:text-slate-300 border-slate-500/20",
};

export function QuickStatsStrip({ items }: { items: QuickStat[] }) {
  if (items.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5"
    >
      {items.map((s) => {
        const Icon = s.icon;
        const cls = TONES[s.tone ?? "sky"];
        const body = (
          <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${cls} p-3 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
            <div className="flex items-center justify-between mb-1.5">
              <Icon className="h-4 w-4" />
              <span className="text-[10px] text-muted-foreground truncate max-w-[7rem]">{s.label}</span>
            </div>
            <p className="text-xl font-bold tabular-nums">
              <CountUp value={s.value} />
              {s.suffix && <span className="text-xs font-normal opacity-70 ms-0.5">{s.suffix}</span>}
            </p>
          </div>
        );
        return s.link ? <Link key={s.label} to={s.link as any}>{body}</Link> : <div key={s.label}>{body}</div>;
      })}
    </motion.div>
  );
}
