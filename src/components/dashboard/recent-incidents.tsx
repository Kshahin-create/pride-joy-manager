import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export interface IncidentRow {
  id: string;
  incident_number: string;
  incident_type?: string | null;
  location?: string | null;
  incident_date: string;
  status: string;
}

export function RecentIncidents({ rows }: { rows: IncidentRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" /> آخر الحوادث الأمنية
        </CardTitle>
        <Link to="/security" className="text-xs text-primary hover:underline">الكل</Link>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">لا توجد حوادث</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-muted-foreground">{r.incident_number}</span>
                    <span className="text-xs font-medium truncate">{r.incident_type ?? "—"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{r.location ?? ""}</p>
                </div>
                <div className="text-end shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.status === "مغلق" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                    {r.status}
                  </span>
                  <p dir="ltr" className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                    {new Date(r.incident_date).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
