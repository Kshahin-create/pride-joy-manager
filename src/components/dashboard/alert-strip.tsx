import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronLeft } from "lucide-react";

export interface AlertItem {
  label: string;
  count: number;
  tone: "red" | "amber";
  link: string;
}

export function AlertStrip({ items }: { items: AlertItem[] }) {
  const active = items.filter((i) => i.count > 0);
  if (active.length === 0) return null;

  const hasRed = active.some((i) => i.tone === "red");
  const stripClass = hasRed
    ? "from-red-500/15 via-red-500/10 to-amber-500/10 border-red-500/30"
    : "from-amber-500/15 via-amber-500/10 to-amber-500/5 border-amber-500/30";

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-l ${stripClass}`}>
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <div className="relative flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${hasRed ? "text-red-600" : "text-amber-600"}`} />
          <span className={`absolute inset-0 rounded-full animate-ping ${hasRed ? "bg-red-500/30" : "bg-amber-500/30"}`} />
        </div>
        <span className="text-sm font-bold">تحتاج تدخّل فوري:</span>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {active.map((item) => (
            <Link
              key={item.label}
              to={item.link as any}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-transform hover:scale-105 ${
                item.tone === "red"
                  ? "bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/30"
                  : "bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30"
              }`}
            >
              <span>{item.label}</span>
              <span className="bg-background/60 rounded-full px-1.5 py-0.5 tabular-nums">{item.count}</span>
              <ChevronLeft className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
