import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, ExternalLink, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type Priority = "critical" | "high" | "medium" | "low";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  notification_type: string;
  priority: Priority;
  category: string;
  group_key: string | null;
};

const PRIORITY_BADGE: Record<Priority, { color: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { color: "bg-red-500", icon: AlertTriangle, label: "حرج" },
  high: { color: "bg-orange-500", icon: AlertCircle, label: "عالي" },
  medium: { color: "bg-blue-500", icon: Info, label: "متوسط" },
  low: { color: "bg-muted-foreground", icon: Info, label: "منخفض" },
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const lastIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,link,is_read,created_at,notification_type,priority,category,group_key")
      .is("dismissed_at", null)
      .order("created_at", { ascending: false })
      .limit(30);
    const list = (data as Notif[]) || [];

    // Audio cue on new critical notification
    if (list.length > 0 && lastIdRef.current && list[0].id !== lastIdRef.current && !list[0].is_read && list[0].priority === "critical") {
      try {
        const ctx = new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; g.gain.value = 0.05;
        o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 220);
      } catch { /* silent */ }
    }
    lastIdRef.current = list[0]?.id ?? null;
    setItems(list);
  }, [user]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("notif-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    const t = setInterval(load, 60_000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(t);
    };
  }, [load]);

  const unread = items.filter((n) => !n.is_read).length;
  const criticalUnread = items.filter((n) => !n.is_read && n.priority === "critical").length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).in("id", ids);
    load();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="الإشعارات" className="relative">
          <Bell className={`h-5 w-5 ${criticalUnread > 0 ? "text-red-500 animate-pulse" : ""}`} />
          {unread > 0 && (
            <span className={`absolute -top-0.5 -end-0.5 h-4 min-w-[16px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${criticalUnread > 0 ? "bg-red-500" : "bg-destructive"}`}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">الإشعارات</span>
            {criticalUnread > 0 && (
              <Badge variant="destructive" className="h-5 text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" /> {criticalUnread} حرج
              </Badge>
            )}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5 ms-1" /> تحديد الكل
            </Button>
          )}
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد إشعارات</p>
          )}
          {items.slice(0, 15).map((n) => {
            const ps = PRIORITY_BADGE[n.priority] ?? PRIORITY_BADGE.medium;
            const PIcon = ps.icon;
            const body = (
              <div
                className={`px-3 py-2.5 border-b last:border-b-0 hover:bg-accent cursor-pointer flex gap-2 ${!n.is_read ? "bg-primary/5" : ""}`}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  setOpen(false);
                }}
              >
                <div className={`w-1 self-stretch rounded ${ps.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <PIcon className={`h-3 w-3 ${n.priority === "critical" ? "text-red-500" : n.priority === "high" ? "text-orange-500" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium truncate flex-1">{n.title}</p>
                    {!n.is_read && <Badge variant="secondary" className="text-[10px] h-4 px-1">جديد</Badge>}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                  </p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link as never}>{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
        <div className="border-t p-2">
          <Link to="/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <ExternalLink className="h-3.5 w-3.5 ms-1" />
              فتح مركز الإشعارات الكامل
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
