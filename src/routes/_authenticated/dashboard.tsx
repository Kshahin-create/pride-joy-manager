import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2, FileSignature, Wallet, TrendingUp, AlertTriangle,
  Wrench, Shield, Car, Users, Receipt, Clock, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { Timeline as BuildingLogTimeline, type BuildingLogRow } from "@/components/building-log-timeline";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Stats = {
  offices_total: number; offices_rented: number; offices_available: number;
  offices_reserved: number; offices_maintenance: number;
  collected_this_month: number; overdue_total: number; revenue_ytd: number;
  tickets_open: number; tickets_closed: number; tickets_emergency: number;
  critical_failures: number; scheduled_week: number;
  contracts_active: number; contracts_expiring: number; contracts_expired: number;
  guards_count: number; patrols_week: number; incidents_open: number;
  parking_occupied: number; parking_available: number; violations_open: number;
};

const fmt = (n: number) => new Intl.NumberFormat("ar-SA").format(n || 0);
const fmtSAR = (n: number) => `${new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n || 0)} ر.س`;

function Dashboard() {
  const { activePropertyId } = useActiveProperty();
  const { user, roles, hasAnyRole } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthly, setMonthly] = useState<{ month: string; revenue: number }[]>([]);
  const [events, setEvents] = useState<BuildingLogRow[]>([]);
  const [extras, setExtras] = useState({
    visitors_inside: 0, visitors_today: 0,
    expenses_pending: 0, expenses_paid_month: 0,
    wo_overdue: 0, wo_pm_due: 0,
  });

  const isAdmin = hasAnyRole(["super_admin", "owner"]);
  const isAccountant = hasAnyRole(["accountant"]);
  const isMaintenance = hasAnyRole(["maintenance_supervisor"]);
  const isSecurity = hasAnyRole(["security_supervisor"]);
  const isReception = hasAnyRole(["receptionist"]);

  const show = {
    occupancy: isAdmin,
    revenueChart: isAdmin || isAccountant,
    finance: isAdmin || isAccountant,
    expenses: isAdmin || isAccountant || isMaintenance,
    operations: isAdmin || isMaintenance || isReception,
    workOrders: isAdmin || isMaintenance,
    contracts: isAdmin || isAccountant,
    security: isAdmin || isSecurity,
    parking: isAdmin || isSecurity,
    visitors: isAdmin || isSecurity || isReception,
    events: isAdmin,
  };

  useEffect(() => {
    (async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [s, m, e, vIn, vTd, eP, eM, woO, woP] = await Promise.all([
        supabase.from("dashboard_stats").select("*").maybeSingle(),
        supabase.from("monthly_revenue").select("*"),
        supabase.from("building_log").select("*").order("created_at", { ascending: false }).limit(10),
        scoped(supabase.from("visitors").select("id", { count: "exact", head: true }), activePropertyId).eq("status", "داخل"),
        scoped(supabase.from("visitors").select("id", { count: "exact", head: true }), activePropertyId).gte("check_in_at", today.toISOString()),
        scoped(supabase.from("expenses").select("amount"), activePropertyId).eq("status", "معلّق"),
        scoped(supabase.from("expenses").select("amount"), activePropertyId).eq("status", "مدفوع").gte("expense_date", monthStart.toISOString().slice(0, 10)),
        scoped(supabase.from("maintenance_requests").select("id", { count: "exact", head: true }), activePropertyId).eq("is_overdue", true).neq("status", "مغلق"),
        scoped(supabase.from("pm_plans").select("id", { count: "exact", head: true }), activePropertyId).eq("is_active", true).lte("next_due_at", new Date().toISOString()),
      ]);
      if (s.data) setStats(s.data as Stats);
      if (m.data) setMonthly(m.data.map((r: any) => ({ month: r.month, revenue: Number(r.revenue) })));
      if (e.data) setEvents(e.data as BuildingLogRow[]);
      setExtras({
        visitors_inside: vIn.count ?? 0,
        visitors_today: vTd.count ?? 0,
        expenses_pending: (eP.data ?? []).reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
        expenses_paid_month: (eM.data ?? []).reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
        wo_overdue: woO.count ?? 0,
        wo_pm_due: woP.count ?? 0,
      });
    })();
  }, []);

  const occRate = stats && stats.offices_total
    ? Math.round(((stats.offices_rented + stats.offices_reserved) / stats.offices_total) * 100)
    : 0;

  const title = isAdmin ? "لوحة الإدارة العليا"
    : isAccountant ? "لوحة المالية"
    : isMaintenance ? "لوحة الصيانة والتشغيل"
    : isSecurity ? "لوحة الأمن والمواقف"
    : isReception ? "لوحة الاستقبال"
    : "اللوحة الرئيسية";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">{title}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
          مرحباً <span dir="ltr" className="inline-block align-middle">{user?.email}</span>
          {roles.length > 0 && <> — صلاحيتك: {roles.map((r) => ROLE_LABELS[r]).join(", ")}</>}
        </p>
      </div>


      {(show.occupancy || show.revenueChart) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {show.occupancy && (
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">نسبة الإشغال</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <OccupancyRing percent={occRate} />
                <div className="space-y-1.5 text-sm">
                  <Row label="إجمالي" value={fmt(stats?.offices_total ?? 0)} dot="bg-primary" />
                  <Row label="مؤجر" value={fmt(stats?.offices_rented ?? 0)} dot="bg-emerald-500" />
                  <Row label="محجوز" value={fmt(stats?.offices_reserved ?? 0)} dot="bg-amber-500" />
                  <Row label="متاح" value={fmt(stats?.offices_available ?? 0)} dot="bg-slate-400" />
                  <Row label="صيانة" value={fmt(stats?.offices_maintenance ?? 0)} dot="bg-red-500" />
                </div>
              </CardContent>
            </Card>
          )}

          {show.revenueChart && (
            <Card className={show.occupancy ? "lg:col-span-2" : "lg:col-span-3"}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">الإيرادات — آخر 12 شهر</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} reversed />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: any) => fmtSAR(Number(v))}
                      contentStyle={{ direction: "rtl", borderRadius: 8, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {show.finance && (
        <Section title="المؤشرات المالية">
          <Stat label="محصل هذا الشهر" value={fmtSAR(stats?.collected_this_month ?? 0)} icon={Receipt} color="emerald" link="/finance" />
          <Stat label="إيرادات هذه السنة" value={fmtSAR(stats?.revenue_ytd ?? 0)} icon={Wallet} color="blue" link="/finance" />
          <Stat label="إجمالي المتأخرات" value={fmtSAR(stats?.overdue_total ?? 0)} icon={AlertTriangle} color="red" link="/finance" />
        </Section>
      )}

      {show.expenses && (
        <Section title="المصروفات">
          <Stat label="معلّقة بانتظار الاعتماد" value={fmtSAR(extras.expenses_pending)} icon={Clock} color="amber" link="/expenses" />
          <Stat label="مدفوعة هذا الشهر" value={fmtSAR(extras.expenses_paid_month)} icon={Wallet} color="emerald" link="/expenses" />
        </Section>
      )}

      {show.operations && (
        <Section title="مؤشرات التشغيل">
          <Stat label="بلاغات مفتوحة" value={fmt(stats?.tickets_open ?? 0)} icon={Clock} color="amber" link="/complaints" />
          <Stat label="بلاغات مغلقة" value={fmt(stats?.tickets_closed ?? 0)} icon={CheckCircle2} color="emerald" link="/complaints" />
          <Stat
            label="بلاغات طارئة"
            value={fmt(stats?.tickets_emergency ?? 0)}
            icon={AlertTriangle}
            color="red"
            link="/complaints"
            pulse={(stats?.tickets_emergency ?? 0) > 0}
          />
        </Section>
      )}

      {show.workOrders && (
        <Section title="أوامر العمل والصيانة">
          <Stat label="أعطال أصول حرجة" value={fmt(stats?.critical_failures ?? 0)} icon={AlertTriangle} color="red" link="/maintenance" />
          <Stat label="صيانة مجدولة هذا الأسبوع" value={fmt(stats?.scheduled_week ?? 0)} icon={Wrench} color="blue" link="/maintenance" />
          <Stat label="أوامر متأخرة (SLA)" value={fmt(extras.wo_overdue)} icon={AlertTriangle} color="red" link="/maintenance" pulse={extras.wo_overdue > 0} />
          <Stat label="خطط وقائية مستحقة" value={fmt(extras.wo_pm_due)} icon={Wrench} color="amber" link="/pm-plans" />
        </Section>
      )}

      {show.contracts && (
        <Section title="مؤشرات العقود">
          <Stat label="العقود السارية" value={fmt(stats?.contracts_active ?? 0)} icon={FileSignature} color="emerald" link="/contracts" />
          <Stat label="تنتهي خلال 90 يوم" value={fmt(stats?.contracts_expiring ?? 0)} icon={AlertTriangle} color="amber" link="/contracts" />
          <Stat label="عقود منتهية" value={fmt(stats?.contracts_expired ?? 0)} icon={FileSignature} color="slate" link="/contracts" />
        </Section>
      )}

      {show.visitors && (
        <Section title="الزوار">
          <Stat label="داخل البرج الآن" value={fmt(extras.visitors_inside)} icon={Users} color="emerald" link="/visitors" />
          <Stat label="زوار اليوم" value={fmt(extras.visitors_today)} icon={Users} color="blue" link="/visitors" />
        </Section>
      )}

      {show.security && (
        <Section title="مؤشرات الأمن">
          <Stat label="عدد الحراس" value={fmt(stats?.guards_count ?? 0)} icon={Users} color="blue" link="/security" />
          <Stat label="جولات هذا الأسبوع" value={fmt(stats?.patrols_week ?? 0)} icon={Shield} color="emerald" link="/security" />
          <Stat label="حوادث مفتوحة" value={fmt(stats?.incidents_open ?? 0)} icon={AlertTriangle} color="red" link="/security" />
        </Section>
      )}

      {show.parking && (
        <Section title="مؤشرات المواقف">
          <Stat label="مواقف مشغولة" value={fmt(stats?.parking_occupied ?? 0)} icon={Car} color="emerald" link="/parking" />
          <Stat label="مواقف متاحة" value={fmt(stats?.parking_available ?? 0)} icon={Car} color="slate" link="/parking" />
          <Stat label="مخالفات مفتوحة" value={fmt(stats?.violations_open ?? 0)} icon={AlertTriangle} color="red" link="/parking" />
        </Section>
      )}

      {show.events && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> آخر الأحداث في البرج
            </CardTitle>
            <Link to="/building-log" className="text-xs text-primary hover:underline">عرض السجل الكامل</Link>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد أحداث بعد</p>
            ) : (
              <BuildingLogTimeline items={events} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-muted-foreground mb-2">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">{children}</div>
    </div>
  );
}

const COLORS: Record<string, string> = {
  emerald: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
  blue: "border-blue-500 text-blue-700 dark:text-blue-400",
  amber: "border-amber-500 text-amber-700 dark:text-amber-400",
  red: "border-red-500 text-red-700 dark:text-red-400",
  slate: "border-slate-400 text-slate-700 dark:text-slate-400",
};

function Stat({
  label, value, icon: Icon, color, link, pulse,
}: {
  label: string; value: string; icon: any; color: string; link?: string; pulse?: boolean;
}) {
  const cls = COLORS[color] || COLORS.blue;
  const body = (
    <Card className={`border-s-4 ${cls.split(" ")[0]} hover:shadow-md transition-shadow ${pulse ? "animate-pulse" : ""}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={`text-xl font-bold mt-1 ${cls.split(" ").slice(1).join(" ")}`}>{value}</p>
        </div>
        <Icon className={`h-6 w-6 ${cls.split(" ").slice(1).join(" ")}`} />
      </CardContent>
    </Card>
  );
  return link ? <Link to={link as any}>{body}</Link> : body;
}

function Row({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function OccupancyRing({ percent }: { percent: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="hsl(var(--muted))" strokeWidth="9" fill="none" />
        <circle
          cx="50" cy="50" r={r}
          stroke="hsl(var(--primary))" strokeWidth="9" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-primary">{percent}%</span>
        <span className="text-[10px] text-muted-foreground">إشغال</span>
      </div>
    </div>
  );
}
