import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

interface Props {
  /** صلاحية واحدة مطلوبة */
  perm?: string;
  /** أي واحدة من الصلاحيات تكفي */
  anyOf?: string[];
  /** بديل يُعرض لو معندوش الصلاحية */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * يخفي الـ children لو المستخدم معندوش الصلاحية.
 * المدير العام دايمًا يشوف كل شيء.
 */
export function PermissionGate({ perm, anyOf, fallback = null, children }: Props) {
  const { hasPermission, hasAnyPermission } = useAuth();
  const allowed = perm
    ? hasPermission(perm)
    : anyOf
      ? hasAnyPermission(anyOf)
      : true;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
