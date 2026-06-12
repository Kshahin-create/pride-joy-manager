import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
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

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  notification_type: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,link,is_read,created_at,notification_type")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as Notif[]) || []);
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
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">الإشعارات</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5 ms-1" /> تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">لا توجد إشعارات</p>
          )}
          {items.map((n) => {
            const body = (
              <div
                className={`px-3 py-2.5 border-b last:border-b-0 hover:bg-accent cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                  setOpen(false);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                  {!n.is_read && <Badge variant="secondary" className="text-[10px] h-5">جديد</Badge>}
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link as any}>{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
