import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LabelList,
} from "recharts";

const fmtSAR = (n: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n || 0)} ر.س`;

export interface MonthlyRow { month: string; revenue: number; expenses: number }

export function RevenueExpensesChart({ data }: { data: MonthlyRow[] }) {
  const totalRev = data.reduce((a, r) => a + r.revenue, 0);
  const totalExp = data.reduce((a, r) => a + r.expenses, 0);
  const net = totalRev - totalExp;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          <CardTitle className="text-sm font-bold flex items-center gap-2 min-w-0">
            <TrendingUp className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">الإيرادات مقابل المصروفات — 12 شهر</span>
          </CardTitle>
          <div className="grid grid-cols-3 gap-2 text-[11px] sm:flex sm:items-center sm:gap-3 sm:text-xs">
            <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                إيرادات
              </span>
              <span className="font-bold text-emerald-600 truncate">{fmtSAR(totalRev)}</span>
            </span>
            <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                مصروفات
              </span>
              <span className="font-bold text-red-600 truncate">{fmtSAR(totalExp)}</span>
            </span>
            <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="text-muted-foreground">صافي</span>
              <span className={`font-bold truncate ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmtSAR(net)}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[240px] sm:h-[260px] pt-2 px-1 sm:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 40, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} reversed />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} padding={{ top: 32 }} />
            <Tooltip
              formatter={(v: any, name: any) => [fmtSAR(Number(v)), name === "revenue" ? "إيرادات" : "مصروفات"]}
              contentStyle={{ direction: "rtl", borderRadius: 8, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="rgb(16 185 129)" strokeWidth={2.5} fill="url(#grad-rev)">
              <LabelList
                dataKey="revenue"
                position="top"
                content={(props: any) => {
                  const idx = props.index ?? 0;
                  const value = data[idx]?.revenue ?? 0;
                  if (!value || props.x == null || props.y == null) return null;
                  return (
                    <text
                      x={props.x}
                      y={props.y}
                      dx={10}
                      dy={-10}
                      textAnchor="start"
                      fill="hsl(var(--foreground))"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {fmtSAR(Number(value))}
                    </text>
                  );
                }}
              />
            </Area>
            <Area type="monotone" dataKey="expenses" stroke="rgb(239 68 68)" strokeWidth={2.5} fill="url(#grad-exp)">
              <LabelList
                dataKey="expenses"
                position="top"
                content={(props: any) => {
                  const idx = props.index ?? 0;
                  const value = data[idx]?.expenses ?? 0;
                  if (!value || props.x == null || props.y == null) return null;
                  return (
                    <text
                      x={props.x}
                      y={props.y}
                      dx={10}
                      dy={-10}
                      textAnchor="start"
                      fill="rgb(239 68 68)"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {fmtSAR(Number(value))}
                    </text>
                  );
                }}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
