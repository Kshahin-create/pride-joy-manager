import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

export interface CategoryRow {
  name: string;
  value: number;
}

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#64748b"];

export function ComplaintsByCategory({ rows }: { rows: CategoryRow[] }) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" /> البلاغات حسب التصنيف
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="value" nameKey="name" innerRadius={32} outerRadius={56} paddingAngle={2}>
                    {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 min-w-0 space-y-1.5">
              {rows.slice(0, 6).map((r, i) => {
                const pct = Math.round((r.value / total) * 100);
                return (
                  <li key={r.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="tabular-nums text-muted-foreground">{r.value}</span>
                    <span className="tabular-nums text-muted-foreground w-9 text-end">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
