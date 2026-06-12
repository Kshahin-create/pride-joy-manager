import { useEffect, useState } from "react";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { BrandLogo } from "@/components/brand-logo";
import { Link, useNavigate } from "@tanstack/react-router";


import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? user.email ?? "");
        setAvatarUrl(data?.avatar_url ?? null);
      });
  }, [user]);

  const initials = (fullName || user?.email || "؟").trim().slice(0, 2).toUpperCase();
  const primaryRole = roles[0];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <header className="h-14 border-b bg-card/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 sticky top-0 z-30 supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <SidebarTrigger className="shrink-0" />
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <BrandLogo variant="color" className="h-7 w-7 sm:h-8 sm:w-8 object-contain shrink-0" />
          <span className="text-sm font-semibold text-primary truncate hidden xs:inline sm:inline">
            نخبة تسكين العقارية
          </span>
        </Link>
      </div>



      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8 ring-1 ring-border">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-right hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-medium max-w-[140px] truncate">{fullName || "—"}</span>
                {primaryRole && (
                  <span className="text-[11px] text-muted-foreground">
                    {ROLE_LABELS[primaryRole]}
                  </span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">{fullName || user?.email}</span>
                <span className="text-xs text-muted-foreground" dir="ltr">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.length > 0 && (
              <>
                <div className="px-2 py-1.5 flex flex-wrap gap-1">
                  {roles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-[10px]">
                      {ROLE_LABELS[r]}
                    </Badge>
                  ))}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <UserIcon className="h-4 w-4 ms-2" />
                ملفي الشخصي
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/telegram" className="cursor-pointer">
                <Settings className="h-4 w-4 ms-2" />
                ربط تيليجرام
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
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
