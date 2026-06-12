import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileSignature,
  Wallet,
  Cog,
  Shield,
  Wrench,
  Truck,
  Car,
  MessageSquareWarning,
  FolderArchive,
  ClipboardCheck,
  ScrollText,
  Map,
  UserCog,
  UserPlus,
  FileText,
  Building,
  Send,
  Code2,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";


interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles?: AppRole[]; // إن لم تذكر يصل الكل
}

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "عام",
    items: [
      { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard },
      { title: "خريطة البرج", url: "/building-map", icon: Map },
      { title: "التقرير اليومي", url: "/daily-report", icon: FileText },
      { title: "سجل البرج", url: "/building-log", icon: ScrollText, roles: ["super_admin", "owner"] },
    ],
  },
  {
    label: "الإيجارات والعملاء",
    items: [
      { title: "المكاتب", url: "/offices", icon: Building2 },
      { title: "العملاء", url: "/tenants", icon: Users },
      { title: "العقود", url: "/contracts", icon: FileSignature },
      { title: "المالية", url: "/finance", icon: Wallet, roles: ["super_admin", "accountant", "owner"] },
      { title: "المصروفات", url: "/expenses", icon: Wallet, roles: ["super_admin", "accountant", "maintenance_supervisor", "owner"] },
    ],
  },
  {
    label: "التشغيل",
    items: [
      { title: "التشغيل", url: "/operations", icon: Cog },
      { title: "الأمن", url: "/security", icon: Shield, roles: ["super_admin", "security_supervisor", "owner"] },
      { title: "الأصول", url: "/assets", icon: Wrench, roles: ["super_admin", "maintenance_supervisor", "owner"] },
      { title: "أوامر العمل", url: "/maintenance", icon: Wrench },
      { title: "الصيانة الوقائية", url: "/pm-plans", icon: Wrench, roles: ["super_admin", "maintenance_supervisor", "owner"] },
      { title: "الموردون", url: "/vendors", icon: Truck, roles: ["super_admin", "accountant", "maintenance_supervisor", "owner"] },
      { title: "المواقف", url: "/parking", icon: Car, roles: ["super_admin", "security_supervisor", "owner"] },
    ],
  },
  {
    label: "خدمات",
    items: [
      { title: "الشكاوى والطلبات", url: "/complaints", icon: MessageSquareWarning },
      { title: "الزوار", url: "/visitors", icon: UserPlus, roles: ["super_admin", "receptionist", "security_supervisor", "owner"] },
      { title: "المستندات", url: "/documents", icon: FolderArchive },
      { title: "التفتيشات", url: "/inspections", icon: ClipboardCheck, roles: ["super_admin", "maintenance_supervisor", "security_supervisor", "owner"] },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { title: "المستخدمون", url: "/users", icon: UserCog, roles: ["super_admin"] },
      { title: "هوية البرج", url: "/identity", icon: Building, roles: ["super_admin", "owner"] },
      { title: "مصفوفة الصلاحيات", url: "/permissions", icon: Shield, roles: ["super_admin", "owner"] },
      { title: "بوت تيليجرام", url: "/telegram", icon: Send },
      { title: "واجهة الـ API", url: "/api-docs", icon: Code2 },
    ],
  },
];

export function AppSidebar() {
  const { hasAnyRole, roles, user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
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

  const visible = (item: NavItem) =>
    !item.roles || hasAnyRole(item.roles) || roles.length === 0;

  const initials = (fullName || user?.email || "؟").trim().slice(0, 2).toUpperCase();
  const primaryRole = roles[0];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm p-1">
            <BrandLogo variant="color" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-foreground">نخبة تسكين</span>
            <span className="text-xs text-sidebar-foreground/70">العقارية</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group) => {
          const items = group.items.filter(visible);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active = pathname === item.url || pathname.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                          <Link to={item.url} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={fullName || "ملفي الشخصي"} size="lg">
              <Link to="/profile" className="flex items-center gap-2">
                <Avatar className="h-7 w-7 ring-1 ring-sidebar-border shrink-0">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                  <AvatarFallback className="bg-gold text-gold-foreground text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-medium truncate">{fullName || "—"}</span>
                  {primaryRole && (
                    <span className="text-[10px] text-sidebar-foreground/70 truncate">
                      {ROLE_LABELS[primaryRole]}
                    </span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="تسجيل الخروج"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
