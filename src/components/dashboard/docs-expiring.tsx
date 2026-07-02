import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWarning } from "lucide-react";

export interface ExpiringDoc {
  id: string;
  title: string;
  category?: string | null;
  expiry_date: string;
}

export function DocsExpiring({ rows }: { rows: ExpiringDoc[] }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-primary" /> مستندات قاربت على الانتهاء
        </CardTitle>
        <Link to="/documents" className="text-xs text-primary hover:underline">الكل</Link>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">كل المستندات سارية</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const d = new Date(r.expiry_date);
              const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
              const tone =
                days < 0 ? "bg-red-500/10 text-red-600 border-red-500/30"
                : days <= 30 ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-sky-500/10 text-sky-600 border-sky-500/30";
              return (
                <li key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.category && <p className="text-[11px] text-muted-foreground">{r.category}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tone} tabular-nums shrink-0`}>
                    {days < 0 ? `منتهي ${Math.abs(days)}ي` : `${days}ي`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
