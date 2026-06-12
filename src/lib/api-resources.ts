// Shared resource map used by both:
// - the API docs UI page (to render endpoints the user can see/use)
// - the public proxy route (/api/public/v1/*) to gate access
//
// Adding a new table here automatically exposes it through the external API
// (with the role-based rules below). Do NOT add sensitive tables (user_roles,
// telegram_link_codes, api_keys, profiles…) — those stay private.

export type ApiRole =
  | "super_admin"
  | "accountant"
  | "security_supervisor"
  | "maintenance_supervisor"
  | "receptionist"
  | "owner";

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface ApiResource {
  table: string;
  label: string;
  description: string;
  read: ApiRole[] | "*";   // "*" = any signed-in user
  write: ApiRole[];         // POST + PATCH
  remove: ApiRole[];        // DELETE
}

const SUPER: ApiRole[] = ["super_admin"];
const ADMIN_OWNER: ApiRole[] = ["super_admin", "owner"];

export const API_RESOURCES: ApiResource[] = [
  // ── إيجارات وعملاء ──────────────────────────────
  { table: "offices",            label: "المكاتب",             description: "الوحدات المتاحة للإيجار", read: "*", write: ["super_admin","accountant"], remove: SUPER },
  { table: "companies",          label: "العملاء (الشركات)",  description: "بيانات الشركات المستأجرة", read: "*", write: ["super_admin","accountant","receptionist"], remove: SUPER },
  { table: "contracts",          label: "العقود",              description: "عقود الإيجار",            read: ["super_admin","accountant","owner"], write: ["super_admin","accountant"], remove: SUPER },
  { table: "contact_persons",    label: "أشخاص الاتصال",     description: "جهات الاتصال للعملاء",    read: "*", write: ["super_admin","accountant","receptionist"], remove: SUPER },

  // ── مالية ──────────────────────────────────────
  { table: "invoices",           label: "الفواتير",            description: "فواتير الإيجار والخدمات", read: ["super_admin","accountant","owner"], write: ["super_admin","accountant"], remove: SUPER },
  { table: "payments",           label: "الدفعات",             description: "المدفوعات المستلمة",      read: ["super_admin","accountant","owner"], write: ["super_admin","accountant"], remove: SUPER },
  { table: "expenses",           label: "المصروفات",          description: "مصروفات التشغيل",         read: ["super_admin","accountant","maintenance_supervisor","owner"], write: ["super_admin","accountant","maintenance_supervisor"], remove: SUPER },
  { table: "vendors",            label: "الموردون",            description: "موردو الخدمات",           read: ["super_admin","accountant","maintenance_supervisor","owner"], write: ["super_admin","accountant","maintenance_supervisor"], remove: SUPER },
  { table: "vendor_contracts",   label: "عقود الموردين",     description: "عقود مع الموردين",        read: ["super_admin","accountant","maintenance_supervisor","owner"], write: ["super_admin","accountant"], remove: SUPER },
  { table: "vendor_payments",    label: "دفعات الموردين",   description: "سندات صرف للموردين",       read: ["super_admin","accountant","owner"], write: ["super_admin","accountant"], remove: SUPER },
  { table: "vendor_evaluations", label: "تقييم الموردين",   description: "تقييمات الأداء",           read: ["super_admin","accountant","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },

  // ── صيانة وأصول ───────────────────────────────
  { table: "assets",                  label: "الأصول",                description: "أصول البرج التقنية", read: ["super_admin","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },
  { table: "maintenance_requests",    label: "أوامر العمل",         description: "طلبات وأوامر الصيانة", read: "*", write: ["super_admin","maintenance_supervisor","receptionist"], remove: SUPER },
  { table: "pm_plans",                label: "خطط الصيانة الوقائية", description: "جدولة الصيانة", read: ["super_admin","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },
  { table: "ac_units",                label: "وحدات التكييف",      description: "AC units",          read: ["super_admin","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },
  { table: "ac_maintenance_logs",     label: "صيانة التكييف",      description: "سجل صيانة AC",      read: ["super_admin","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },
  { table: "electricity_meters",      label: "عدادات الكهرباء",   description: "عدادات الكهرباء",    read: ["super_admin","accountant","maintenance_supervisor","owner"], write: ["super_admin","accountant","maintenance_supervisor"], remove: SUPER },
  { table: "electricity_readings",    label: "قراءات الكهرباء",   description: "قراءات شهرية",       read: ["super_admin","accountant","maintenance_supervisor","owner"], write: ["super_admin","accountant","maintenance_supervisor"], remove: SUPER },
  { table: "network_points",          label: "نقاط الشبكة",       description: "Network points",     read: ["super_admin","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },
  { table: "inspections",             label: "التفتيشات",          description: "نتائج التفتيش",     read: ["super_admin","maintenance_supervisor","security_supervisor","owner"], write: ["super_admin","maintenance_supervisor","security_supervisor"], remove: SUPER },
  { table: "inspection_templates",    label: "قوالب التفتيش",    description: "قوالب التفتيش",     read: ["super_admin","maintenance_supervisor","security_supervisor","owner"], write: ["super_admin"], remove: SUPER },
  { table: "inspection_results",      label: "تفاصيل التفتيش",   description: "نتائج لكل بند",     read: ["super_admin","maintenance_supervisor","security_supervisor","owner"], write: ["super_admin","maintenance_supervisor","security_supervisor"], remove: SUPER },

  // ── أمن ────────────────────────────────────────
  { table: "guards",                  label: "الحراس",              description: "بيانات أفراد الأمن", read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "guard_attendance",        label: "حضور الحراس",        description: "سجل الحضور",       read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "guard_leaves",            label: "إجازات الحراس",     description: "إجازات",            read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "guard_evaluations",       label: "تقييم الحراس",       description: "تقييم الأداء",     read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "guard_trainings",         label: "تدريبات الحراس",    description: "تدريبات وشهادات",  read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "guard_penalties_rewards", label: "جزاءات ومكافآت",   description: "الجزاءات والمكافآت", read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "patrols",                 label: "الجولات الأمنية",   description: "جولات الأمن",       read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "patrol_checkpoints",      label: "نقاط الجولات",      description: "نقاط فحص الجولات",  read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "security_incidents",      label: "الحوادث الأمنية",   description: "بلاغات وحوادث",     read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "cameras",                 label: "الكاميرات",           description: "كاميرات المراقبة", read: ["super_admin","security_supervisor","maintenance_supervisor","owner"], write: ["super_admin","security_supervisor","maintenance_supervisor"], remove: SUPER },
  { table: "camera_maintenance_logs", label: "صيانة الكاميرات", description: "سجل صيانة كاميرات", read: ["super_admin","security_supervisor","maintenance_supervisor","owner"], write: ["super_admin","security_supervisor","maintenance_supervisor"], remove: SUPER },

  // ── زوار ومواقف ──────────────────────────────
  { table: "visitors",                label: "الزوار",               description: "تسجيل دخول/خروج الزوار", read: ["super_admin","receptionist","security_supervisor","owner"], write: ["super_admin","receptionist","security_supervisor"], remove: SUPER },
  { table: "parking_spots",           label: "مواقف السيارات",   description: "مواقف ومالكيها",    read: "*", write: ["super_admin","security_supervisor","receptionist"], remove: SUPER },
  { table: "parking_violations",      label: "مخالفات المواقف", description: "مخالفات",            read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },
  { table: "parking_maintenance_checks", label: "فحص المواقف",  description: "فحص المواقف",       read: ["super_admin","security_supervisor","maintenance_supervisor","owner"], write: ["super_admin","security_supervisor","maintenance_supervisor"], remove: SUPER },
  { table: "parking_cleaning_logs",   label: "نظافة المواقف",  description: "سجل نظافة المواقف", read: ["super_admin","security_supervisor","owner"], write: ["super_admin","security_supervisor"], remove: SUPER },

  // ── خدمات ──────────────────────────────────────
  { table: "tickets",                 label: "الشكاوى والطلبات", description: "تذاكر العملاء",      read: "*", write: "*" as unknown as ApiRole[], remove: SUPER },
  { table: "documents",               label: "المستندات",          description: "أرشيف المستندات",  read: "*", write: ["super_admin","accountant"], remove: SUPER },
  { table: "cleaning_logs",           label: "سجل النظافة",       description: "سجل أعمال النظافة", read: ["super_admin","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },
  { table: "cleaning_plans",          label: "خطط النظافة",      description: "جداول النظافة",     read: ["super_admin","maintenance_supervisor","owner"], write: ["super_admin","maintenance_supervisor"], remove: SUPER },

  // ── معلومات عامة ───────────────────────────────
  { table: "spaces",                  label: "المساحات المشتركة", description: "مساحات البرج",     read: "*", write: ["super_admin"], remove: SUPER },
  { table: "building_identity",       label: "هوية البرج",         description: "بيانات البرج",      read: "*", write: ADMIN_OWNER, remove: SUPER },
  { table: "building_log",            label: "سجل البرج",          description: "سجل الأحداث",      read: ADMIN_OWNER, write: [], remove: [] },
  { table: "notifications",           label: "الإشعارات",          description: "إشعارات النظام",   read: "*", write: ["super_admin"], remove: SUPER },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

export function canRead(resource: ApiResource, roles: string[]): boolean {
  if (resource.read === "*") return true;
  return roles.some((r) => (resource.read as string[]).includes(r));
}

export function canMethod(resource: ApiResource, method: ApiMethod, roles: string[]): boolean {
  if (method === "GET") return canRead(resource, roles);
  if (method === "DELETE") return roles.some((r) => resource.remove.includes(r as ApiRole));
  // POST / PATCH share write
  const write = resource.write as unknown;
  if (write === "*") return true;
  return roles.some((r) => (write as string[]).includes(r));
}

export function getResource(table: string): ApiResource | undefined {
  return API_RESOURCES.find((r) => r.table === table);
}
