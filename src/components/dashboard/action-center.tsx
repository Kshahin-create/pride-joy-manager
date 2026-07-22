import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronLeft, ListTodo } from "lucide-react";

export interface ActionItem {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  subtitle?: string;
  link: string;
  cta?: string;
}

const DOT: Record<ActionItem["priority"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-sky-500",
};

const RANK: Record<ActionItem["priority"], number> = { high: 0, medium: 1, low: 2 };

const TABS: { id: "all" | "high" | "medium" | "low"; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "high", label: "حرج" },
  { id: "medium", label: "متوسط" },
  { id: "low", label: "منخفض" },
];

export function ActionCenter({ items }: { items: ActionItem[] }) {
  const [tab, setTab] = useState<"all" | "high" | "medium" | "low">("all");

  const counts = {
    all: items.length,
    high: items.filter((i) => i.priority === "high").length,
    medium: items.filter((i) => i.priority === "medium").length,
    low: items.filter((i) => i.priority === "low").length,
  };

  const filtered = (tab === "all" ? items : items.filter((i) => i.priority === tab))
    .slice()
    .sort((a, b) => RANK[a.priority] - RANK[b.priority])
    .slice(0, 10);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          مركز الإجراءات
          <span className="ms-auto text-xs font-normal text-muted-foreground">
            {counts.all} بند
          </span>
        </CardTitle>
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          {TABS.map((t) => {
            const active = tab === t.id;
            const n = counts[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
              >
                {t.label}
                <span
                  className={`tabular-nums rounded-full px-1.5 ${
                    active ? "bg-primary-foreground/20" : "bg-muted"
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground flex flex-col items-center gap-2 px-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            {tab === "high"
              ? "لا توجد بنود حرجة — عمل ممتاز."
              : tab === "medium"
              ? "لا توجد بنود متوسطة الأولوية."
              : tab === "low"
              ? "لا توجد بنود منخفضة الأولوية."
              : "كل شيء تحت السيطرة — لا توجد بنود تحتاج تدخّل الآن."}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((it) => (
              <Link
                key={it.id}
                to={it.link as any}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
              >
                <span className={`relative flex h-2.5 w-2.5 shrink-0 rounded-full ${DOT[it.priority]}`}>
                  {it.priority === "high" && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-500/60" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{it.title}</p>
                  {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
                </div>
                <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                  {it.cta ?? "فتح"} <ChevronLeft className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
