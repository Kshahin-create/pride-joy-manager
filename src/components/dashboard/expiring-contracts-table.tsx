import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ExpiringRow {
  id: string;
  contract_number: string;
  company_name: string;
  office_label?: string;
  end_date: string;
  days_left: number;
}

export function ExpiringContractsTable({ rows }: { rows: ExpiringRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" />
          عقود قاربت الانتهاء
        </CardTitle>
        <Link to="/contracts" className="text-xs text-primary hover:underline flex items-center gap-1">
          الكل <ChevronLeft className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد عقود قريبة الانتهاء</p>
        ) : (
          <div className="divide-y">
            {rows.slice(0, 5).map((r) => {
              const tone =
                r.days_left <= 0 ? "destructive" :
                r.days_left <= 30 ? "destructive" :
                r.days_left <= 60 ? "default" : "secondary";
              const badgeText = r.days_left <= 0 ? `منتهي منذ ${Math.abs(r.days_left)} يوم` : `متبقي ${r.days_left} يوم`;
              return (
                <Link
                  key={r.id}
                  to={`/contracts/${r.id}` as any}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{r.contract_number}</span>
                      {r.office_label && (
                        <span className="text-xs text-muted-foreground">• {r.office_label}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate mt-0.5">{r.company_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">ينتهي: {r.end_date}</p>
                  </div>
                  <Badge variant={tone as any} className="shrink-0 tabular-nums">{badgeText}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
