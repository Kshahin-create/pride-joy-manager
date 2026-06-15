import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCheck,
  Archive,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Wallet,
  Wrench,
  Shield,
  FileSignature,
  Cog,
  Layers,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

type Priority = "critical" | "high" | "medium" | "low";
type Category = "financial" | "maintenance" | "security" | "contracts" | "operations" | "general";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  dismissed_at: string | null;
  created_at: string;
  notification_type: string;
  priority: Priority;
  category: Category;
  group_key: string | null;
  entity_type: string | null;
  entity_id: string | null;
  escalated_at: string | null;
};

const PRIORITY_STYLE: Record<Priority, { color: string; bg: string; label: string; icon: typeof AlertTriangle }> = {
  critical: { color: "text-red-600 border-red-500", bg: "bg-red-500/10", label: "حرج", icon: AlertTriangle },
  high: { color: "text-orange-600 border-orange-500", bg: "bg-orange-500/10", label: "عالي", icon: AlertCircle },
  medium: { color: "text-blue-600 border-blue-500", bg: "bg-blue-500/10", label: "متوسط", icon: Info },
  low: { color: "text-muted-foreground border-muted", bg: "bg-muted/30", label: "منخفض", icon: Info },
};

const CATEGORY_META: Record<Category, { label: string; icon: typeof Wallet }> = {
  financial: { label: "مالي", icon: Wallet },
  maintenance: { label: "صيانة", icon: Wrench },
  security: { label: "أمن", icon: Shield },
  contracts: { label: "عقود", icon: FileSignature },
  operations: { label: "تشغيل", icon: Cog },
  general: { label: "عام", icon: Bell },
};

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("تعذر تحميل الإشعارات");
    setItems((data as Notif[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("notifications-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (priorityFilter !== "all" && n.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
      if (readFilter === "unread" && n.is_read) return false;
      if (readFilter === "read" && !n.is_read) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !(n.body?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [items, priorityFilter, categoryFilter, readFilter, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Notif[]>();
    for (const n of filtered) {
      const key = n.group_key || n.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return Array.from(map.entries())
      .map(([key, list]) => {
        const sorted = list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        const priorityRank = (p: Priority) => ({ critical: 4, high: 3, medium: 2, low: 1 }[p]);
        const maxPriority = sorted.reduce<Priority>(
          (acc, n) => (priorityRank(n.priority) > priorityRank(acc) ? n.priority : acc),
          "low"
        );
        return {
          key,
          list: sorted,
          latest: sorted[0],
          total: list.length,
          unread: list.filter((n) => !n.is_read).length,
          priority: maxPriority,
        };
      })
      .sort((a, b) => {
        const rank = (p: Priority) => ({ critical: 4, high: 3, medium: 2, low: 1 }[p]);
        return rank(b.priority) - rank(a.priority) || +new Date(b.latest.created_at) - +new Date(a.latest.created_at);
      });
  }, [filtered]);

  const stats = useMemo(() => {
    const unread = items.filter((n) => !n.is_read).length;
    const critical = items.filter((n) => !n.is_read && n.priority === "critical").length;
    const high = items.filter((n) => !n.is_read && n.priority === "high").length;
    const escalated = items.filter((n) => n.escalated_at).length;
    return { unread, critical, high, escalated, total: items.length };
  }, [items]);

  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", ids);
    load();
  };

  const dismiss = async (ids: string[]) => {
    if (!ids.length) return;
    await supabase
      .from("notifications")
      .update({ dismissed_at: new Date().toISOString() } as never)
      .in("id", ids);
    toast.success(`تم أرشفة ${ids.length} إشعار`);
    load();
  };

  const toggleExpand = (key: string) => {
    setExpanded((s) => {
      const ns = new Set(s);
      ns.has(key) ? ns.delete(key) : ns.add(key);
      return ns;
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" /> مركز الإشعارات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            كل التنبيهات الذكية للنظام — مجمّعة حسب الأولوية والفئة
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markRead(items.filter((n) => !n.is_read).map((n) => n.id))}
            disabled={stats.unread === 0}
          >
            <CheckCheck className="h-4 w-4 ms-1" />
            تحديد الكل كمقروء
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="غير مقروء" value={stats.unread} icon={Bell} color="text-primary" />
        <StatCard label="حرجة" value={stats.critical} icon={AlertTriangle} color="text-red-600" />
        <StatCard label="عالية" value={stats.high} icon={AlertCircle} color="text-orange-600" />
        <StatCard label="مُصعَّدة" value={stats.escalated} icon={TrendingUp} color="text-purple-600" />
        <StatCard label="الإجمالي" value={stats.total} icon={Layers} color="text-muted-foreground" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pe-8"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger><SelectValue placeholder="الأولوية" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأولويات</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="الفئة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفئات</SelectItem>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={readFilter} onValueChange={(v) => setReadFilter(v as never)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">الكل</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">غير مقروء</TabsTrigger>
                <TabsTrigger value="read" className="flex-1">مقروء</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as never)}>
              <TabsList>
                <TabsTrigger value="grouped">عرض مجمّع</TabsTrigger>
                <TabsTrigger value="list">قائمة كاملة</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">{filtered.length} نتيجة</span>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading && <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>}
      {!loading && filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
          لا توجد إشعارات
        </CardContent></Card>
      )}

      {!loading && viewMode === "grouped" && (
        <div className="space-y-2">
          {groups.map((g) => (
            <GroupCard
              key={g.key}
              group={g}
              expanded={expanded.has(g.key)}
              onToggle={() => toggleExpand(g.key)}
              onMarkRead={markRead}
              onDismiss={dismiss}
            />
          ))}
        </div>
      )}

      {!loading && viewMode === "list" && (
        <div className="space-y-2">
          {filtered.map((n) => (
            <NotificationRow key={n.id} n={n} onMarkRead={markRead} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Bell; color: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${color} opacity-60`} />
        </div>
      </CardContent>
    </Card>
  );
}

function GroupCard({
  group, expanded, onToggle, onMarkRead, onDismiss,
}: {
  group: { key: string; list: Notif[]; latest: Notif; total: number; unread: number; priority: Priority };
  expanded: boolean;
  onToggle: () => void;
  onMarkRead: (ids: string[]) => void;
  onDismiss: (ids: string[]) => void;
}) {
  const isSingle = group.total === 1;
  const ps = PRIORITY_STYLE[group.priority];
  const cat = CATEGORY_META[group.latest.category];
  const PIcon = ps.icon;
  const CIcon = cat.icon;

  return (
    <Card className={`border-r-4 ${ps.color} ${group.unread > 0 ? ps.bg : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className={`${ps.color} gap-1`}>
                <PIcon className="h-3 w-3" /> {ps.label}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CIcon className="h-3 w-3" /> {cat.label}
              </Badge>
              {group.unread > 0 && (
                <Badge className="bg-primary">{group.unread} جديد</Badge>
              )}
              {!isSingle && (
                <Badge variant="outline">{group.total} إشعار</Badge>
              )}
              {group.latest.escalated_at && (
                <Badge variant="destructive" className="gap-1">
                  <TrendingUp className="h-3 w-3" /> مُصعَّد
                </Badge>
              )}
            </div>
            <CardTitle className="text-base">{group.latest.title}</CardTitle>
            {group.latest.body && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{group.latest.body}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(group.latest.created_at), { addSuffix: true, locale: ar })}
            </p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {group.latest.link && (
              <Link to={group.latest.link as never}>
                <Button size="sm" variant="outline">فتح</Button>
              </Link>
            )}
            {!isSingle && (
              <Button size="sm" variant="ghost" onClick={onToggle}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {group.unread > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs"
              onClick={() => onMarkRead(group.list.filter((n) => !n.is_read).map((n) => n.id))}>
              <CheckCheck className="h-3 w-3 ms-1" /> تحديد كمقروء
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs"
            onClick={() => onDismiss(group.list.map((n) => n.id))}>
            <Archive className="h-3 w-3 ms-1" /> أرشفة
          </Button>
        </div>
      </CardHeader>
      {expanded && !isSingle && (
        <CardContent className="pt-0 space-y-1">
          {group.list.slice(1).map((n) => (
            <NotificationRow key={n.id} n={n} onMarkRead={onMarkRead} onDismiss={onDismiss} compact />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function NotificationRow({
  n, onMarkRead, onDismiss, compact,
}: { n: Notif; onMarkRead: (ids: string[]) => void; onDismiss: (ids: string[]) => void; compact?: boolean }) {
  const ps = PRIORITY_STYLE[n.priority];
  const cat = CATEGORY_META[n.category];
  return (
    <div className={`flex items-center gap-2 p-2 rounded border ${compact ? "" : "bg-card"} ${!n.is_read ? "border-primary/40" : "border-border"}`}>
      <div className={`w-1 self-stretch rounded ${ps.color.split(" ")[1].replace("border-", "bg-")}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{n.title}</span>
          {!n.is_read && <Badge variant="secondary" className="text-[10px] h-4">جديد</Badge>}
          <Badge variant="outline" className="text-[10px] h-4">{ps.label}</Badge>
          <Badge variant="outline" className="text-[10px] h-4">{cat.label}</Badge>
        </div>
        {n.body && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.body}</p>}
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        {n.link && (
          <Link to={n.link as never}>
            <Button size="sm" variant="ghost" className="h-7 text-xs">فتح</Button>
          </Link>
        )}
        {!n.is_read && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onMarkRead([n.id])}>
            <CheckCheck className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onDismiss([n.id])}>
          <Archive className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
