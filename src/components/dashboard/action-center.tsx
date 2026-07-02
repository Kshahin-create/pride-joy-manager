import { Link } from "@tanstack/react-router";
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

export function ActionCenter({ items }: { items: ActionItem[] }) {
  const sorted = [...items].sort((a, b) => RANK[a.priority] - RANK[b.priority]).slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          مركز الإجراءات — يحتاج تدخّل
          <span className="ms-auto text-xs font-normal text-muted-foreground">{items.length} بند</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            كل شيء تحت السيطرة — لا توجد بنود تحتاج تدخّل الآن
          </div>
        ) : (
          <div className="divide-y">
            {sorted.map((it) => (
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
