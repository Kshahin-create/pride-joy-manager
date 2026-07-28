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
  ShieldCheck,
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
  Sparkles,
  Sofa,
  LayoutGrid,
  Bell,
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
import { PropertySwitcher } from "@/components/property-switcher";
import { useAuth, roleLabel } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";


interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  /** الصلاحية المطلوبة لإظهار العنصر — لو متعددة، أي واحدة تكفي */
  perms?: string[];
  superAdminOnly?: boolean;
}

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "عام",
    items: [
      { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard, perms: ["dashboard.view"] },
      { title: "خريطة البرج", url: "/building-map", icon: Map, perms: ["building_map.view"] },
      { title: "التقرير اليومي", url: "/daily-report", icon: FileText, perms: ["daily_report.view"] },
      { title: "سجل البرج", url: "/building-log", icon: ScrollText, perms: ["building_log.view"] },
    ],
  },
  {
    label: "الإيجارات والعملاء",
    items: [
      { title: "المكاتب", url: "/offices", icon: Building2, perms: ["offices.view"] },
      { title: "العملاء", url: "/tenants", icon: Users, perms: ["tenants.view"] },
      { title: "العقود", url: "/contracts", icon: FileSignature, perms: ["contracts.view"] },
      { title: "المالية", url: "/finance", icon: Wallet, perms: ["invoices.view"] },
      { title: "المصروفات", url: "/expenses", icon: Wallet, perms: ["expenses.view"] },
    ],
  },
  {
    label: "التشغيل",
    items: [
      { title: "النظافة", url: "/operations", icon: Sparkles, perms: ["cleaning.view"] },
      { title: "عقود النظافة", url: "/cleaning-contracts", icon: FileSignature, perms: ["contracts.view"] },
      { title: "عقود صيانة المصاعد", url: "/elevator-contracts", icon: FileSignature, perms: ["contracts.view"] },
      { title: "عقود صيانة التكييف", url: "/ac-contracts", icon: FileSignature, perms: ["contracts.view"] },
      { title: "عقود أنظمة الحريق", url: "/fire-contracts", icon: FileSignature, perms: ["contracts.view"] },
      { title: "عقود التوريد", url: "/supply-contracts", icon: FileSignature, perms: ["contracts.view"] },
      { title: "الصيانة", url: "/maintenance", icon: Wrench, perms: ["maintenance.view"] },
      { title: "الأمن", url: "/security", icon: Shield, perms: ["guards.view","patrols.view","incidents.view","cameras.view"] },
      { title: "اللوبي", url: "/lobby", icon: Sofa, perms: ["visitors.view","visitors.checkin"] },
      { title: "المناطق المشتركة", url: "/common-areas", icon: LayoutGrid, perms: ["spaces.view","spaces.manage"] },
    ],
  },
  {
    label: "موارد التشغيل",
    items: [
      { title: "الموظفون", url: "/employees", icon: Users, perms: ["users.view","guards.view","employees.view"] },
      { title: "جهات العمل", url: "/employees/employers", icon: Building, perms: ["users.view","employees.view","employees.create"] },
      { title: "الأقسام", url: "/employees/departments", icon: UserCog, perms: ["users.view","employees.view","employees.create"] },
      { title: "الأصول", url: "/assets", icon: Wrench, perms: ["assets.view"] },
      { title: "الصيانة الوقائية", url: "/pm-plans", icon: Wrench, perms: ["pm_plans.view"] },
      { title: "الموردون", url: "/vendors", icon: Truck, perms: ["vendors.view"] },
      { title: "المواقف", url: "/parking", icon: Car, perms: ["parking.view"] },
    ],
  },
  {
    label: "خدمات",
    items: [
      { title: "الشكاوى والطلبات", url: "/complaints", icon: MessageSquareWarning, perms: ["tickets.view"] },
      { title: "الزوار", url: "/visitors", icon: UserPlus, perms: ["visitors.view"] },
      { title: "المستندات", url: "/documents", icon: FolderArchive, perms: ["documents.view"] },
      { title: "التفتيشات", url: "/inspections", icon: ClipboardCheck, perms: ["inspections.view"] },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { title: "المستخدمون", url: "/users", icon: UserCog, perms: ["users.view"] },
      { title: "الأدوار والصلاحيات", url: "/roles", icon: ShieldCheck, perms: ["roles.manage"] },
      { title: "العقارات", url: "/properties", icon: Building, perms: ["identity.view"] },
      { title: "هوية البرج", url: "/identity", icon: Building, perms: ["identity.view"] },
      { title: "بوت تيليجرام", url: "/telegram", icon: Send, perms: ["telegram.view"] },
      { title: "مركز الإشعارات", url: "/notifications", icon: Bell },
      { title: "واجهة الـ API", url: "/api-docs", icon: Code2, perms: ["api_keys.view"] },
      { title: "الأرشيف", url: "/archive", icon: FolderArchive, perms: ["records.restore"] },
      { title: "سجل التدقيق", url: "/audit-log", icon: ScrollText, superAdminOnly: true },
    ],
  },
];

export function AppSidebar() {
  const { hasAnyPermission, roles, user, signOut, isSuperAdmin } = useAuth();
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

  const visible = (item: NavItem) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return !item.perms || isSuperAdmin || hasAnyPermission(item.perms);
  };

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

      <PropertySwitcher />


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
                      {roleLabel(primaryRole)}
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
