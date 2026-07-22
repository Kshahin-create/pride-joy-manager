import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const fmtSAR = (n: number) =>
  `SAR ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n || 0)}`;

export interface MonthlyRow { month: string; revenue: number; expenses: number }

export function RevenueExpensesChart({ data }: { data: MonthlyRow[] }) {
  const totalRev = data.reduce((a, r) => a + r.revenue, 0);
  const totalExp = data.reduce((a, r) => a + r.expenses, 0);
  const net = totalRev - totalExp;

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2 px-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          <CardTitle className="text-sm font-bold flex items-center gap-2 min-w-0">
            <TrendingUp className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">الإيرادات مقابل المصروفات — 12 شهر</span>
          </CardTitle>
          <div className="grid grid-cols-3 gap-3 text-[11px] sm:flex sm:items-center sm:gap-4 sm:text-xs tabular-nums" dir="ltr">
            <span className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Revenue
              </span>
              <span className="font-semibold text-emerald-600">{fmtSAR(totalRev)}</span>
            </span>
            <span className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Expenses
              </span>
              <span className="font-semibold text-red-600">{fmtSAR(totalExp)}</span>
            </span>
            <span className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
              <span className="text-muted-foreground">Net</span>
              <span className={`font-semibold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmtSAR(net)}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[260px] pt-2 pr-3 pl-1 pb-2 sm:pr-5 sm:pl-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 8, bottom: 4 }}>
            <defs>
              <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(239 68 68)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month" reversed
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false} tickLine={false} tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              axisLine={false} tickLine={false} tickMargin={6}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              formatter={(v: any, name: any) => [fmtSAR(Number(v)), name === "revenue" ? "Revenue" : "Expenses"]}
              contentStyle={{ direction: "ltr", borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
            />
            <Area type="monotone" dataKey="revenue" stroke="rgb(16 185 129)" strokeWidth={2.25} fill="url(#grad-rev)" activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="expenses" stroke="rgb(239 68 68)" strokeWidth={2.25} fill="url(#grad-exp)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
