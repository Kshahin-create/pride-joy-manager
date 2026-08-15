import { useAuth } from "@/lib/auth-context";

/**
 * صلاحيات الصور والملفات الموحّدة لكل قسم.
 * أي مستخدم عنده صلاحية عامة (files.delete) أو صلاحية القسم
 * (<module>.file_delete / .delete / .manage / .edit) يقدر يحذف أو يستبدل الملفات.
 */
export function useFilePermissions() {
  const { isSuperAdmin, hasAnyPermission } = useAuth();

  const canDeleteFiles = (module: string) =>
    isSuperAdmin ||
    hasAnyPermission([
      "files.delete",
      `${module}.file_delete`,
      `${module}.delete`,
      `${module}.manage`,
      `${module}.edit`,
    ]);

  const canUploadFiles = (module: string) =>
    isSuperAdmin ||
    hasAnyPermission([
      `${module}.upload`,
      `${module}.create`,
      `${module}.edit`,
      `${module}.manage`,
    ]);

  const canArchiveFiles = (module: string) =>
    isSuperAdmin || hasAnyPermission(["files.archive", "records.archive", `${module}.file_delete`]);

  return { canDeleteFiles, canUploadFiles, canArchiveFiles };
}
