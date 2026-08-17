import { useAuth } from "@/lib/auth-context";

/**
 * صلاحيات الصور والملفات الموحّدة لكل قسم.
 * أي مستخدم عنده صلاحية القسم (<module>.file_delete / .delete / .edit)
 * يقدر يحذف أو يستبدل الملفات — نفس منطق سياسات قاعدة البيانات والتخزين.
 */
export function useFilePermissions() {
  const { isSuperAdmin, hasAnyPermission } = useAuth();

  const canDeleteFiles = (module: string) =>
    isSuperAdmin ||
    hasAnyPermission([
      `${module}.file_delete`,
      `${module}.delete`,
      `${module}.edit`,
    ]);

  const canUploadFiles = (module: string) =>
    isSuperAdmin ||
    hasAnyPermission([
      `${module}.upload`,
      `${module}.create`,
      `${module}.edit`,
    ]);

  const canArchiveFiles = (module: string) =>
    isSuperAdmin || hasAnyPermission(["records.archive", `${module}.file_delete`, `${module}.delete`, `${module}.edit`]);

  return { canDeleteFiles, canUploadFiles, canArchiveFiles };
}
