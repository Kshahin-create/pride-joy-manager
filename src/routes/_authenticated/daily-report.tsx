import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Printer, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/daily-report")({
  component: DailyReportPage,
});

type Report = {
  date: string;
  visitors_in: number;
  visitors_out: number;
  visitors_still_inside: number;
  wo_new: number;
  wo_closed: number;
  wo_overdue_open: number;
  tickets_new: number;
  tickets_closed: number;
  incidents_new: number;
  patrols: number;
  payments_received: number;
  expenses_new: number;
  expenses_paid: number;
  events: Array<{
    id: string;
    event_type: string;
    module: string;
    description: string;
    created_at: string;
    location: string | null;
  }>;
};

function DailyReportPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [identity, setIdentity] = useState<{ building_name?: string; logo_url?: string | null } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (d: string) => {
    setLoading(true);
    const [{ data: rpc }, { data: ident }] = await Promise.all([
      supabase.rpc("get_daily_report" as never, { _date: d } as never),
      supabase.from("building_identity" as never).select("building_name,logo_url").eq("id", true).maybeSingle(),
    ]);
    setReport(rpc as unknown as Report);
    setIdentity((ident as never) ?? null);
    setLoading(false);
  };

  useEffect(() => { void load(date); }, [date]);

  const fmt = (n: number) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(n);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-gold" /> التقرير اليومي
          </h1>
          <p className="text-sm text-muted-foreground">ملخّص يومي لكل الأحداث والمؤشرات</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label>التاريخ</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => void load(date)} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" /> تحديث
          </Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> طباعة
          </Button>
        </div>
      </div>

      <div className="hidden print:flex items-center justify-between border-b pb-3 mb-4">
        <div>
          <div className="text-xl font-bold">{identity?.building_name ?? "تقرير يومي"}</div>
          <div className="text-sm">تاريخ التقرير: {date}</div>
        </div>
        {identity?.logo_url && <img src={identity.logo_url} alt="" className="h-12" />}
      </div>

      {!report ? (
        <div className="text-muted-foreground">جاري التحميل…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat title="زوّار دخلوا" value={report.visitors_in} />
            <Stat title="زوّار خرجوا" value={report.visitors_out} />
            <Stat title="زوّار ما زالوا داخل البرج" value={report.visitors_still_inside} tone="warn" />
            <Stat title="جولات أمنية" value={report.patrols} />

            <Stat title="أوامر عمل جديدة" value={report.wo_new} />
            <Stat title="أوامر عمل مُغلقة" value={report.wo_closed} tone="ok" />
            <Stat title="أوامر متأخرة (مفتوحة)" value={report.wo_overdue_open} tone="danger" />
            <Stat title="حوادث أمنية" value={report.incidents_new} tone={report.incidents_new > 0 ? "danger" : undefined} />

            <Stat title="تذاكر جديدة" value={report.tickets_new} />
            <Stat title="تذاكر مُغلقة" value={report.tickets_closed} tone="ok" />
            <Stat title="مدفوعات مستلمة" value={fmt(report.payments_received) + " ر.س"} tone="ok" />
            <Stat title="مصروفات جديدة" value={fmt(report.expenses_new) + " ر.س"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>أحداث اليوم ({report.events.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {report.events.length === 0 ? (
                <div className="text-sm text-muted-foreground">لا توجد أحداث في هذا اليوم</div>
              ) : (
                <ul className="divide-y">
                  {report.events.map((e) => (
                    <li key={e.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">{e.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.module} · {e.event_type}
                          {e.location ? ` · ${e.location}` : ""}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ title, value, tone }: { title: string; value: number | string; tone?: "ok" | "warn" | "danger" }) {
  const toneClass =
    tone === "ok" ? "text-emerald-600" :
    tone === "warn" ? "text-amber-600" :
    tone === "danger" ? "text-red-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{title}</div>
        <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
