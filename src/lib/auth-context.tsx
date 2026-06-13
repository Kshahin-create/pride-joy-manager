import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// النظام القديم — للتوافق العكسي فقط
export type AppRole =
  | "super_admin"
  | "accountant"
  | "security_supervisor"
  | "maintenance_supervisor"
  | "receptionist"
  | "owner";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** أسماء الأدوار اللي للمستخدم (ديناميكية الآن) */
  roles: string[];
  /** كل الصلاحيات المجمعة من الأدوار */
  permissions: Set<string>;
  loading: boolean;
  signOut: () => Promise<void>;
  /** متوافق مع النظام القديم — يفحص اسم الدور */
  hasRole: (role: AppRole | string) => boolean;
  hasAnyRole: (roles: (AppRole | string)[]) => boolean;
  /** الجديد — فحص صلاحية محددة */
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  /** المدير العام دايمًا له كل شيء */
  isSuperAdmin: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadAccess = async (uid: string | undefined) => {
    if (!uid) {
      setRoles([]);
      setPermissions(new Set());
      return;
    }
    // الأدوار: من user_role_assignments → app_roles (ديناميكية)
    const { data: ra } = await (supabase as any)
      .from("user_role_assignments")
      .select("app_roles(name)")
      .eq("user_id", uid);
    const roleNames = ((ra ?? []) as any[])
      .map((r) => r.app_roles?.name)
      .filter(Boolean) as string[];
    setRoles(roleNames);

    // الصلاحيات: عن طريق RPC الديناميكي
    const { data: perms } = await (supabase as any).rpc("get_my_permissions");
    setPermissions(new Set(((perms ?? []) as string[])));
  };

  const checkActive = async (uid: string | undefined) => {
    if (!uid) return true;
    const { data } = await supabase.from("profiles").select("is_active").eq("id", uid).maybeSingle();
    if (data && data.is_active === false) {
      await supabase.auth.signOut();
      setRoles([]);
      setPermissions(new Set());
      setUser(null);
      setSession(null);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setTimeout(async () => {
        const ok = await checkActive(s?.user?.id);
        if (ok) await loadAccess(s?.user?.id);
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      const ok = await checkActive(data.session?.user?.id);
      if (ok) await loadAccess(data.session?.user?.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setPermissions(new Set());
  };

  const isSuperAdmin = roles.includes("super_admin");

  const value: AuthContextValue = {
    user,
    session,
    roles,
    permissions,
    loading,
    signOut,
    hasRole: (r) => roles.includes(r),
    hasAnyRole: (rs) => rs.some((r) => roles.includes(r)),
    hasPermission: (k) => isSuperAdmin || permissions.has(k),
    hasAnyPermission: (ks) => isSuperAdmin || ks.some((k) => permissions.has(k)),
    isSuperAdmin,
    refresh: () => loadAccess(user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير عام",
  accountant: "محاسب",
  security_supervisor: "مشرف أمن",
  maintenance_supervisor: "مشرف صيانة",
  receptionist: "موظف استقبال",
  owner: "مالك",
};

export function roleLabel(name: string): string {
  return ROLE_LABELS[name] ?? name;
}
