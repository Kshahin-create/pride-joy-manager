import { useEffect, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { useNavigate } from "@tanstack/react-router";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? user.email ?? ""));
  }, [user]);

  const initials = (fullName || user?.email || "؟").trim().slice(0, 2).toUpperCase();
  const primaryRole = roles[0];

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">Pride &amp; Joy Tower</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-right hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-medium">{fullName || "—"}</span>
                {primaryRole && (
                  <span className="text-[11px] text-muted-foreground">
                    {ROLE_LABELS[primaryRole]}
                  </span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">{fullName || user?.email}</span>
                <span className="text-xs text-muted-foreground" dir="ltr">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 flex flex-wrap gap-1">
              {roles.length === 0 && (
                <span className="text-xs text-muted-foreground">لم يتم تعيين دور</span>
              )}
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="text-[10px]">
                  {ROLE_LABELS[r]}
                </Badge>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="h-4 w-4 ms-2" />
              ملفي الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth" });
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 ms-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
