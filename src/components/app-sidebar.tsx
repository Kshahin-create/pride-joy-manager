import { Link, useRouterState } from "@tanstack/react-router";
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
  UserCog,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, type AppRole } from "@/lib/auth-context";

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
    ],
  },
  {
    label: "التشغيل",
    items: [
      { title: "التشغيل", url: "/operations", icon: Cog },
      { title: "الأمن", url: "/security", icon: Shield, roles: ["super_admin", "security_supervisor", "owner"] },
      { title: "الأصول والصيانة", url: "/assets", icon: Wrench, roles: ["super_admin", "maintenance_supervisor", "owner"] },
      { title: "الموردون", url: "/vendors", icon: Truck, roles: ["super_admin", "accountant", "maintenance_supervisor", "owner"] },
      { title: "المواقف", url: "/parking", icon: Car, roles: ["super_admin", "security_supervisor", "owner"] },
    ],
  },
  {
    label: "خدمات",
    items: [
      { title: "الشكاوى والطلبات", url: "/complaints", icon: MessageSquareWarning },
      { title: "المستندات", url: "/documents", icon: FolderArchive },
      { title: "التفتيشات", url: "/inspections", icon: ClipboardCheck, roles: ["super_admin", "maintenance_supervisor", "security_supervisor", "owner"] },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { title: "المستخدمون", url: "/users", icon: UserCog, roles: ["super_admin"] },
    ],
  },
];

export function AppSidebar() {
  const { hasAnyRole, roles } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const visible = (item: NavItem) =>
    !item.roles || hasAnyRole(item.roles) || roles.length === 0; // لا تخفي قبل تحميل الأدوار

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="w-9 h-9 rounded-lg bg-gold text-gold-foreground flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-foreground">Pride &amp; Joy</span>
            <span className="text-xs text-sidebar-foreground/70">إدارة البرج</span>
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
    </Sidebar>
  );
}
