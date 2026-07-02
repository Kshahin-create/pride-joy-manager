import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n || 0);

export interface StatItem {
  label: string;
  value: number | string;
  tone?: "emerald" | "amber" | "red" | "sky" | "slate";
  icon: LucideIcon;
  link?: string;
  pulse?: boolean;
}

export interface SectionTab {
  id: string;
  label: string;
  badge?: number;
  stats: StatItem[];
}

const TONE_MAP: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  red: "text-red-600 dark:text-red-400 bg-red-500/10",
  sky: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  slate: "text-slate-600 dark:text-slate-400 bg-slate-500/10",
};

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  if (tabs.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground">مؤشرات التشغيل حسب القسم</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={tabs[0].id} dir="rtl" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs data-[state=active]:bg-background gap-1.5">
                {t.label}
                {(t.badge ?? 0) > 0 && (
                  <span className="ms-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full tabular-nums">
                    {t.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {t.stats.map((s) => {
                  const cls = TONE_MAP[s.tone ?? "sky"];
                  const Icon = s.icon;
                  const body = (
                    <div className={`p-3 rounded-lg border bg-card hover:shadow-md transition-all ${s.pulse ? "ring-2 ring-red-500/40" : ""}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`h-7 w-7 rounded-md flex items-center justify-center ${cls}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                      <p className="text-lg font-bold mt-0.5 tabular-nums">{typeof s.value === "number" ? fmt(s.value) : s.value}</p>
                    </div>
                  );
                  return s.link ? (
                    <Link key={s.label} to={s.link as any}>{body}</Link>
                  ) : (
                    <div key={s.label}>{body}</div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
