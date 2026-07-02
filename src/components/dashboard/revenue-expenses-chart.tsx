import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            الإيرادات مقابل المصروفات — 12 شهر
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">إيرادات:</span>
              <span className="font-bold text-emerald-600">{fmtSAR(totalRev)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">مصروفات:</span>
              <span className="font-bold text-red-600">{fmtSAR(totalExp)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">صافي:</span>
              <span className={`font-bold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmtSAR(net)}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[260px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: any, name: any) => [fmtSAR(Number(v)), name === "revenue" ? "إيرادات" : "مصروفات"]}
              contentStyle={{ direction: "rtl", borderRadius: 8, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="rgb(16 185 129)" strokeWidth={2.5} fill="url(#grad-rev)" />
            <Area type="monotone" dataKey="expenses" stroke="rgb(239 68 68)" strokeWidth={2.5} fill="url(#grad-exp)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
