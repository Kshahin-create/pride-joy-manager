import { useAuth } from "@/lib/auth-context";

/**
 * تحديد من يحق له رؤية الأرقام المالية في كل الصفحات (إيرادات، مصروفات، أسعار العقود، ...).
 * حصراً: المدير العام (super_admin) و المحاسب (accountant).
 */
export function useCanSeeFinance(): boolean {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(["super_admin", "accountant"]);
}
