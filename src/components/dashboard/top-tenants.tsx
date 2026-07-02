import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, ChevronLeft } from "lucide-react";

export interface TopTenant {
  id: string;
  name: string;
  contract_number: string;
  annual_rent: number;
}

const fmtSAR = (n: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n || 0)} ر.س`;

export function TopTenants({ rows }: { rows: TopTenant[] }) {
  const max = rows.reduce((a, r) => Math.max(a, r.annual_rent), 0) || 1;

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Crown className="h-4 w-4 text-gold" />
          أعلى المستأجرين
        </CardTitle>
        <Link to="/contracts" className="text-xs text-primary hover:underline flex items-center gap-1">
          الكل <ChevronLeft className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5 p-4">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">لا توجد عقود</p>
        ) : (
          rows.slice(0, 5).map((r, i) => {
            const pct = (r.annual_rent / max) * 100;
            return (
              <Link
                key={r.id}
                to={`/contracts/${r.id}` as any}
                className="block group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span className="font-semibold truncate group-hover:text-primary transition">{r.name}</span>
                  </span>
                  <span className="tabular-nums font-bold text-primary shrink-0 ms-2">{fmtSAR(r.annual_rent)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-primary to-gold transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
