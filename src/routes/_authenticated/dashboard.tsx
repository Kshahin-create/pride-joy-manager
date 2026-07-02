import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, FileSignature, Wallet, AlertTriangle,
  Wrench, Shield, Car, Users, Receipt, Clock, CheckCircle2,
  TrendingUp, TrendingDown, Activity, Camera, FileText, Briefcase, UserCheck, HardHat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { useAuth } from "@/lib/auth-context";
import { Timeline as BuildingLogTimeline, type BuildingLogRow } from "@/components/building-log-timeline";
import { KpiHeroCard } from "@/components/dashboard/kpi-hero-card";
import { AlertStrip, type AlertItem } from "@/components/dashboard/alert-strip";
import { RevenueExpensesChart, type MonthlyRow } from "@/components/dashboard/revenue-expenses-chart";
import { OccupancyPanel } from "@/components/dashboard/occupancy-panel";
import { ExpiringContractsTable, type ExpiringRow } from "@/components/dashboard/expiring-contracts-table";
import { ActionCenter, type ActionItem } from "@/components/dashboard/action-center";
import { SectionTabs, type SectionTab } from "@/components/dashboard/section-tabs";
import { HeroHeader } from "@/components/dashboard/hero-header";
import { FloorOccupancy, type FloorRow } from "@/components/dashboard/floor-occupancy";
import { TopTenants, type TopTenant } from "@/components/dashboard/top-tenants";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { CountUp } from "@/components/dashboard/count-up";
import { TimeRangeSelector, computeRange, rangeLabel, type TimeRange } from "@/components/dashboard/time-range-selector";
import { QuickStatsStrip, type QuickStat } from "@/components/dashboard/quick-stats-strip";
import { UpcomingMaintenance, type UpcomingPM } from "@/components/dashboard/upcoming-maintenance";
import { RecentIncidents, type IncidentRow } from "@/components/dashboard/recent-incidents";
import { ComplaintsByCategory, type CategoryRow } from "@/components/dashboard/complaints-by-category";
import { DocsExpiring, type ExpiringDoc } from "@/components/dashboard/docs-expiring";

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

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n || 0));
const fmtSAR = (n: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n || 0))} ر.س`;

// Stagger container for section grid
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function Dashboard() {
  const { activePropertyId } = useActiveProperty();
  const { roles, hasAnyRole, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [range, setRange] = useState<TimeRange>(() => computeRange("30d"));
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [events, setEvents] = useState<BuildingLogRow[]>([]);
  const [expiring, setExpiring] = useState<ExpiringRow[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [floorRows, setFloorRows] = useState<FloorRow[]>([]);
  const [topTenants, setTopTenants] = useState<TopTenant[]>([]);
  const [heatmap, setHeatmap] = useState<number[][]>(() => Array.from({ length: 7 }, () => Array(24).fill(0)));
  const [extras, setExtras] = useState({
    visitors_inside: 0, visitors_today: 0,
    expenses_pending: 0, expenses_paid_month: 0,
    wo_overdue: 0, wo_pm_due: 0,
    collected_now: 0, collected_prev: 0,
    expenses_prev_month: 0,
    cameras_count: 0, employees_count: 0, vendors_count: 0,
    docs_expiring_count: 0, new_contracts_month: 0,
  });
  const [upcomingPMs, setUpcomingPMs] = useState<UpcomingPM[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<IncidentRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDoc[]>([]);

  const isAdmin = hasAnyRole(["super_admin", "owner"]);
  const isAccountant = hasAnyRole(["accountant"]);
  const isMaintenance = hasAnyRole(["maintenance_supervisor"]);
  const isSecurity = hasAnyRole(["security_supervisor"]);
  const isReception = hasAnyRole(["receptionist"]);
  const canSeeFinance = hasAnyRole(["super_admin", "accountant"]);
  const allow = (key: string, fallback: boolean) => fallback || hasPermission(key);

  const show = {
    occupancy: allow("dashboard.widget.occupancy", isAdmin),
    revenueChart: allow("dashboard.widget.revenue_chart", canSeeFinance),
    finance: allow("dashboard.widget.finance", canSeeFinance),
    expenses: allow("dashboard.widget.expenses", canSeeFinance),
    operations: allow("dashboard.widget.operations", isAdmin || isMaintenance || isReception),
    workOrders: allow("dashboard.widget.work_orders", isAdmin || isMaintenance),
    contracts: allow("dashboard.widget.contracts", isAdmin || isAccountant),
    security: allow("dashboard.widget.security", isAdmin || isSecurity),
    parking: allow("dashboard.widget.parking", isAdmin || isSecurity),
    visitors: allow("dashboard.widget.visitors", isAdmin || isSecurity || isReception),
    events: allow("dashboard.widget.events", isAdmin),
  };

  const load = async () => {
    setLoading(true);
    const now = new Date();
    const rangeFromISO = range.from.toISOString().slice(0, 10);
    const rangeToISO = range.to.toISOString().slice(0, 10);
    const rangeDays = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000));
    const prevFrom = new Date(range.from.getTime() - rangeDays * 86400000);
    const prevTo = new Date(range.from.getTime() - 86400000);
    const prevFromISO = prevFrom.toISOString().slice(0, 10);
    const prevToISO = prevTo.toISOString().slice(0, 10);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in90 = new Date(); in90.setDate(in90.getDate() + 90);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const monthStartISO = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const in60ISO = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const todayISO = today.toISOString().slice(0, 10);

    const [
      sRes, mRes, eRes,
      vIn, vTd,
      eP, eM, ePrev,
      woO, woP,
      expList, expiringList, overdueWO, emergency,
      officesRes, topContractsRes, eventsAllRes,
      pmUpcoming, incidentsRes, ticketsCatRes, docsExpRes,
      camerasCount, employeesCount, vendorsCount, docsExpCount, newContractsCount,
    ] = await Promise.all([
      supabase.from("dashboard_stats").select("*").maybeSingle(),
      supabase.from("monthly_revenue").select("*"),
      supabase.from("building_log").select("*").order("created_at", { ascending: false }).limit(8),
      scoped(supabase.from("visitors").select("id", { count: "exact", head: true }), activePropertyId).eq("status", "داخل"),
      scoped(supabase.from("visitors").select("id", { count: "exact", head: true }), activePropertyId).gte("check_in_at", today.toISOString()),
      scoped(supabase.from("expenses").select("amount"), activePropertyId).eq("status", "معلّق"),
      scoped(supabase.from("expenses").select("amount"), activePropertyId).eq("status", "مدفوع").gte("expense_date", rangeFromISO).lte("expense_date", rangeToISO),
      scoped(supabase.from("expenses").select("amount"), activePropertyId).eq("status", "مدفوع")
        .gte("expense_date", prevFromISO)
        .lte("expense_date", prevToISO),
      scoped(supabase.from("maintenance_requests").select("id", { count: "exact", head: true }), activePropertyId).eq("is_overdue", true).neq("status", "مغلق"),
      scoped(supabase.from("pm_plans").select("id", { count: "exact", head: true }), activePropertyId).eq("is_active", true).lte("next_due_at", new Date().toISOString()),
      scoped(supabase.from("expenses").select("amount, expense_date"), activePropertyId).eq("status", "مدفوع").gte("expense_date", new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 10)),
      scoped(
        supabase.from("contracts").select("id, contract_number, end_date, status, company_id, office_id, companies(company_name), offices(office_number)"),
        activePropertyId
      ).eq("status", "ساري").lte("end_date", in90.toISOString().slice(0, 10)).order("end_date", { ascending: true }).limit(10),
      scoped(supabase.from("maintenance_requests").select("id, request_number, description, completion_due_at"), activePropertyId).eq("is_overdue", true).neq("status", "مغلق").limit(5),
      scoped(supabase.from("tickets").select("id, ticket_number, description, priority"), activePropertyId).eq("priority", "طارئة").neq("status", "مغلق").limit(5),
      scoped(supabase.from("offices").select("floor, status"), activePropertyId),
      canSeeFinance
        ? scoped(
            supabase.from("contracts").select("id, contract_number, annual_rent, companies(company_name)"),
            activePropertyId
          ).eq("status", "ساري").order("annual_rent", { ascending: false }).limit(5)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("building_log").select("created_at").gte("created_at", sevenDaysAgo.toISOString()).limit(2000),
      // Upcoming PM plans (next 5)
      scoped(supabase.from("pm_plans").select("id, plan_name, next_due_at, frequency"), activePropertyId)
        .eq("is_active", true).not("next_due_at", "is", null).order("next_due_at", { ascending: true }).limit(5),
      // Recent security incidents
      scoped(supabase.from("security_incidents").select("id, incident_number, incident_type, location, incident_date, status"), activePropertyId)
        .order("incident_date", { ascending: false }).limit(5),
      // Tickets by category (open only)
      scoped(supabase.from("tickets").select("category"), activePropertyId).neq("status", "مغلق"),
      // Expiring documents (top 5)
      scoped(supabase.from("documents").select("id, title, category, expiry_date"), activePropertyId)
        .not("expiry_date", "is", null).lte("expiry_date", in60ISO).order("expiry_date", { ascending: true }).limit(5),
      // Extra counts
      scoped(supabase.from("cameras").select("id", { count: "exact", head: true }), activePropertyId),
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "نشط"),
      supabase.from("vendors").select("id", { count: "exact", head: true }),
      scoped(supabase.from("documents").select("id", { count: "exact", head: true }), activePropertyId)
        .not("expiry_date", "is", null).lte("expiry_date", in60ISO).gte("expiry_date", todayISO),
      scoped(supabase.from("contracts").select("id", { count: "exact", head: true }), activePropertyId)
        .gte("created_at", monthStartISO),
    ]);

    if (sRes.data) setStats(sRes.data as Stats);

    // Monthly revenue + expenses
    const revMap = new Map<string, number>();
    (mRes.data ?? []).forEach((r: any) => revMap.set(r.month, Number(r.revenue) || 0));
    const expMap = new Map<string, number>();
    (expList.data ?? []).forEach((r: any) => {
      const k = String(r.expense_date).slice(0, 7);
      expMap.set(k, (expMap.get(k) ?? 0) + Number(r.amount || 0));
    });
    const months: MonthlyRow[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ month: key, revenue: revMap.get(key) ?? 0, expenses: expMap.get(key) ?? 0 });
    }
    setMonthly(months);

    if (eRes.data) setEvents(eRes.data as BuildingLogRow[]);

    // Expiring
    const exRows: ExpiringRow[] = ((expiringList.data ?? []) as any[]).map((c) => {
      const end = new Date(c.end_date);
      const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: c.id,
        contract_number: c.contract_number,
        company_name: c.companies?.company_name ?? "—",
        office_label: c.offices?.office_number,
        end_date: c.end_date,
        days_left: days,
      };
    });
    setExpiring(exRows);

    // Actions
    const items: ActionItem[] = [];
    ((overdueWO.data ?? []) as any[]).forEach((w) => items.push({
      id: `wo-${w.id}`, priority: "high",
      title: `أمر صيانة متأخر: ${w.request_number}`,
      subtitle: (w.description ?? "").slice(0, 80),
      link: `/maintenance`, cta: "عرض",
    }));
    ((emergency.data ?? []) as any[]).forEach((t) => items.push({
      id: `t-${t.id}`, priority: "high",
      title: `بلاغ طارئ: ${t.ticket_number}`,
      subtitle: (t.description ?? "").slice(0, 80),
      link: `/complaints/${t.id}`, cta: "معالجة",
    }));
    exRows.filter((r) => r.days_left <= 30).forEach((r) => items.push({
      id: `c-${r.id}`,
      priority: r.days_left <= 0 ? "high" : r.days_left <= 14 ? "high" : "medium",
      title: r.days_left <= 0 ? `عقد منتهي: ${r.contract_number}` : `عقد قارب الانتهاء: ${r.contract_number}`,
      subtitle: `${r.company_name} — ${r.days_left <= 0 ? `منتهي منذ ${Math.abs(r.days_left)} يوم` : `متبقي ${r.days_left} يوم`}`,
      link: `/contracts/${r.id}`, cta: "تجديد",
    }));
    setActions(items);

    // Floors
    const fmap = new Map<number, { total: number; occupied: number }>();
    ((officesRes.data ?? []) as any[]).forEach((o) => {
      const rec = fmap.get(o.floor) ?? { total: 0, occupied: 0 };
      rec.total += 1;
      if (o.status === "مؤجر" || o.status === "محجوز") rec.occupied += 1;
      fmap.set(o.floor, rec);
    });
    setFloorRows(Array.from(fmap.entries()).map(([floor, v]) => ({ floor, ...v })));

    // Top tenants
    setTopTenants(((topContractsRes.data ?? []) as any[]).map((c) => ({
      id: c.id,
      name: c.companies?.company_name ?? "—",
      contract_number: c.contract_number,
      annual_rent: Number(c.annual_rent || 0),
    })).filter((r) => r.annual_rent > 0));

    // Heatmap: build 7×24 grid ending today
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    ((eventsAllRes.data ?? []) as any[]).forEach((row) => {
      const d = new Date(row.created_at);
      const diffDays = Math.floor((today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays > 6) return;
      const dayIdx = 6 - diffDays; // oldest at top row 0? we'll show last 7 days
      const dow = d.getDay(); // 0=Sun
      grid[dow][d.getHours()] += 1;
      void dayIdx;
    });
    setHeatmap(grid);

    // Compute collected in range from monthly_revenue view (aggregated per month)
    const monthKeys = (from: Date, to: Date) => {
      const keys: string[] = [];
      const d = new Date(from.getFullYear(), from.getMonth(), 1);
      const end = new Date(to.getFullYear(), to.getMonth(), 1);
      while (d <= end) {
        keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        d.setMonth(d.getMonth() + 1);
      }
      return keys;
    };
    const sumMonths = (keys: string[]) => keys.reduce((a, k) => a + (revMap.get(k) ?? 0), 0);
    const collectedNowV = sumMonths(monthKeys(range.from, range.to));
    const collectedPrevV = sumMonths(monthKeys(prevFrom, prevTo));

    setExtras({
      visitors_inside: vIn.count ?? 0,
      visitors_today: vTd.count ?? 0,
      expenses_pending: (eP.data ?? []).reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      expenses_paid_month: (eM.data ?? []).reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      collected_now: collectedNowV,
      collected_prev: collectedPrevV,
      expenses_prev_month: (ePrev.data ?? []).reduce((a: number, x: any) => a + Number(x.amount || 0), 0),
      wo_overdue: woO.count ?? 0,
      wo_pm_due: woP.count ?? 0,
    });
    setRefreshedAt(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [activePropertyId, range.preset, range.from.getTime(), range.to.getTime()]);

  const occRate = stats && stats.offices_total
    ? Math.round(((stats.offices_rented + stats.offices_reserved) / stats.offices_total) * 100)
    : 0;
  const collectedNow = extras.collected_now;
  const collectedPrev = extras.collected_prev;
  const collectedDelta = collectedPrev > 0 ? ((collectedNow - collectedPrev) / collectedPrev) * 100 : null;
  const expensesDelta = extras.expenses_prev_month > 0
    ? ((extras.expenses_paid_month - extras.expenses_prev_month) / extras.expenses_prev_month) * 100
    : null;
  const netCashflow = collectedNow - extras.expenses_paid_month;
  const netCashflowPrev = collectedPrev - extras.expenses_prev_month;
  const netDelta = netCashflowPrev !== 0 ? ((netCashflow - netCashflowPrev) / Math.abs(netCashflowPrev)) * 100 : null;

  const spark = (key: "revenue" | "expenses") =>
    monthly.slice(-6).map((m) => ({ label: m.month, value: m[key] }));
  const netSpark = monthly.slice(-6).map((m) => ({ label: m.month, value: m.revenue - m.expenses }));

  const title = isAdmin ? "لوحة الإدارة العليا"
    : isAccountant ? "لوحة المالية"
    : isMaintenance ? "لوحة الصيانة والتشغيل"
    : isSecurity ? "لوحة الأمن والمواقف"
    : isReception ? "لوحة الاستقبال"
    : "اللوحة الرئيسية";

  // Alerts
  const alertItems: AlertItem[] = [];
  if ((stats?.tickets_emergency ?? 0) > 0) alertItems.push({ label: "بلاغات طارئة", count: stats!.tickets_emergency, tone: "red", link: "/complaints" });
  if (extras.wo_overdue > 0) alertItems.push({ label: "أوامر صيانة متأخرة", count: extras.wo_overdue, tone: "red", link: "/maintenance" });
  if ((stats?.critical_failures ?? 0) > 0) alertItems.push({ label: "أعطال حرجة", count: stats!.critical_failures, tone: "red", link: "/maintenance" });
  const expiredCount = expiring.filter((r) => r.days_left <= 0).length;
  if (expiredCount > 0) alertItems.push({ label: "عقود منتهية", count: expiredCount, tone: "red", link: "/contracts" });
  if (extras.wo_pm_due > 0) alertItems.push({ label: "خطط وقائية مستحقة", count: extras.wo_pm_due, tone: "amber", link: "/pm-plans" });
  if ((stats?.violations_open ?? 0) > 0) alertItems.push({ label: "مخالفات مواقف مفتوحة", count: stats!.violations_open, tone: "amber", link: "/parking" });

  // Tabs
  const tabs: SectionTab[] = [];
  if (show.operations) tabs.push({
    id: "ops", label: "التشغيل",
    badge: (stats?.tickets_emergency ?? 0) + (stats?.tickets_open ?? 0),
    stats: [
      { label: "بلاغات مفتوحة", value: stats?.tickets_open ?? 0, icon: Clock, tone: "amber", link: "/complaints" },
      { label: "بلاغات مغلقة", value: stats?.tickets_closed ?? 0, icon: CheckCircle2, tone: "emerald", link: "/complaints" },
      { label: "بلاغات طارئة", value: stats?.tickets_emergency ?? 0, icon: AlertTriangle, tone: "red", link: "/complaints", pulse: (stats?.tickets_emergency ?? 0) > 0 },
    ],
  });
  if (show.workOrders) tabs.push({
    id: "mnt", label: "الصيانة",
    badge: extras.wo_overdue + (stats?.critical_failures ?? 0),
    stats: [
      { label: "أعطال حرجة", value: stats?.critical_failures ?? 0, icon: AlertTriangle, tone: "red", link: "/maintenance" },
      { label: "أوامر متأخرة SLA", value: extras.wo_overdue, icon: AlertTriangle, tone: "red", link: "/maintenance", pulse: extras.wo_overdue > 0 },
      { label: "صيانة مجدولة هذا الأسبوع", value: stats?.scheduled_week ?? 0, icon: Wrench, tone: "sky", link: "/maintenance" },
      { label: "خطط وقائية مستحقة", value: extras.wo_pm_due, icon: Wrench, tone: "amber", link: "/pm-plans" },
    ],
  });
  if (show.contracts) tabs.push({
    id: "contracts", label: "العقود",
    badge: stats?.contracts_expiring ?? 0,
    stats: [
      { label: "عقود سارية", value: stats?.contracts_active ?? 0, icon: FileSignature, tone: "emerald", link: "/contracts" },
      { label: "تنتهي خلال 90 يوم", value: stats?.contracts_expiring ?? 0, icon: AlertTriangle, tone: "amber", link: "/contracts" },
      { label: "عقود منتهية", value: stats?.contracts_expired ?? 0, icon: FileSignature, tone: "slate", link: "/contracts" },
    ],
  });
  if (show.security) tabs.push({
    id: "sec", label: "الأمن",
    badge: stats?.incidents_open ?? 0,
    stats: [
      { label: "عدد الحراس", value: stats?.guards_count ?? 0, icon: Users, tone: "sky", link: "/security" },
      { label: "جولات هذا الأسبوع", value: stats?.patrols_week ?? 0, icon: Shield, tone: "emerald", link: "/security" },
      { label: "حوادث مفتوحة", value: stats?.incidents_open ?? 0, icon: AlertTriangle, tone: "red", link: "/security" },
    ],
  });
  if (show.parking) tabs.push({
    id: "prk", label: "المواقف",
    badge: stats?.violations_open ?? 0,
    stats: [
      { label: "مواقف مشغولة", value: stats?.parking_occupied ?? 0, icon: Car, tone: "emerald", link: "/parking" },
      { label: "مواقف متاحة", value: stats?.parking_available ?? 0, icon: Car, tone: "slate", link: "/parking" },
      { label: "مخالفات مفتوحة", value: stats?.violations_open ?? 0, icon: AlertTriangle, tone: "red", link: "/parking" },
    ],
  });
  if (show.visitors) tabs.push({
    id: "vis", label: "الزوار",
    stats: [
      { label: "داخل البرج الآن", value: extras.visitors_inside, icon: Users, tone: "emerald", link: "/visitors" },
      { label: "زوار اليوم", value: extras.visitors_today, icon: Users, tone: "sky", link: "/visitors" },
    ],
  });

  void roles;

  return (
    <div className="space-y-5 pb-8">
      <HeroHeader
        title={title}
        onRefresh={load}
        loading={loading}
        refreshedAt={refreshedAt}
        canSeeFinance={canSeeFinance}
        isAdmin={isAdmin}
        isMaintenance={isMaintenance}
        rangeSlot={<TimeRangeSelector value={range} onChange={setRange} />}
      />

      <AlertStrip items={alertItems} />

      {/* KPI Hero Row */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {show.finance && (
          <motion.div variants={item}>
            <KpiHeroCard
              label={`المحصل — ${rangeLabel(range)}`}
              value={fmtSAR(collectedNow)}
              tone="emerald"
              icon={Receipt}
              deltaPct={collectedDelta}
              trend={spark("revenue")}
              link="/finance"
            />
          </motion.div>
        )}
        {show.finance && (
          <motion.div variants={item}>
            <KpiHeroCard
              label="إجمالي المتأخرات"
              value={fmtSAR(stats?.overdue_total ?? 0)}
              sublabel="مستحق على المستأجرين"
              tone="red"
              icon={AlertTriangle}
              invertDelta
              link="/finance"
            />
          </motion.div>
        )}
        {show.occupancy && (
          <motion.div variants={item}>
            <KpiHeroCard
              label="نسبة الإشغال"
              value={`${occRate}%`}
              sublabel={`${fmt((stats?.offices_rented ?? 0) + (stats?.offices_reserved ?? 0))} من ${fmt(stats?.offices_total ?? 0)}`}
              tone="primary"
              icon={Building2}
              link="/offices"
            />
          </motion.div>
        )}
        {show.finance && (
          <motion.div variants={item}>
            <KpiHeroCard
              label="صافي التدفق"
              value={fmtSAR(netCashflow)}
              sublabel={`إيرادات − مصروفات (${rangeLabel(range)})`}
              tone={netCashflow >= 0 ? "sky" : "red"}
              icon={netCashflow >= 0 ? TrendingUp : TrendingDown}
              deltaPct={netDelta}
              trend={netSpark}
              link="/finance"
            />
          </motion.div>
        )}
        {!show.finance && !show.occupancy && (
          <motion.div variants={item}>
            <KpiHeroCard
              label="بلاغات مفتوحة"
              value={fmt(stats?.tickets_open ?? 0)}
              tone="amber"
              icon={Activity}
              link="/complaints"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Main grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          {show.revenueChart && <RevenueExpensesChart data={monthly} />}
          {show.events && <ActivityHeatmap cells={heatmap} />}
          {(show.contracts || isAdmin) && <ExpiringContractsTable rows={expiring} />}
          <ActionCenter items={actions} />
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          {show.occupancy && stats && (
            <OccupancyPanel
              total={stats.offices_total}
              rented={stats.offices_rented}
              reserved={stats.offices_reserved}
              available={stats.offices_available}
              maintenance={stats.offices_maintenance}
            />
          )}

          {show.occupancy && floorRows.length > 0 && <FloorOccupancy rows={floorRows} />}

          {show.finance && topTenants.length > 0 && <TopTenants rows={topTenants} />}

          {show.expenses && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" /> المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MiniRow label={`مدفوعة — ${rangeLabel(range)}`} value={extras.expenses_paid_month} tone="emerald" delta={expensesDelta} invertDelta currency />
                <MiniRow label="معلّقة بانتظار الاعتماد" value={extras.expenses_pending} tone="amber" currency />
                <div className="pt-2 border-t">
                  <Link to="/expenses" className="text-xs text-primary hover:underline">إدارة المصروفات ←</Link>
                </div>
              </CardContent>
            </Card>
          )}

          {show.finance && (
            <Card className="bg-gradient-to-br from-primary/5 to-gold/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" /> الإيرادات السنوية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  <CountUp value={stats?.revenue_ytd ?? 0} format={(n) => fmtSAR(n)} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">منذ بداية السنة</p>
              </CardContent>
            </Card>
          )}

          {show.events && (
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> آخر الأحداث
                </CardTitle>
                <Link to="/building-log" className="text-xs text-primary hover:underline">الكل</Link>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">لا توجد أحداث</p>
                ) : (
                  <BuildingLogTimeline items={events} />
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>

      <SectionTabs tabs={tabs} />
    </div>
  );
}

function MiniRow({
  label, value, tone, delta, invertDelta, currency,
}: { label: string; value: number; tone: "emerald" | "amber" | "red"; delta?: number | null; invertDelta?: boolean; currency?: boolean }) {
  const toneCls = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-red-600";
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = hasDelta ? (invertDelta ? delta! < 0 : delta! > 0) : false;
  const negative = hasDelta ? (invertDelta ? delta! > 0 : delta! < 0) : false;
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold tabular-nums ${toneCls}`}>
          <CountUp value={value} format={currency ? fmtSAR : fmt} />
        </p>
      </div>
      {hasDelta && (
        <span className={`text-xs font-semibold ${positive ? "text-emerald-600" : negative ? "text-red-600" : "text-muted-foreground"}`}>
          {positive ? "▲" : negative ? "▼" : "•"} {Math.abs(delta!).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
