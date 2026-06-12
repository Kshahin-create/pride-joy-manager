import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, FileSignature, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const STATS = [
  { label: "إجمالي المكاتب", value: "54", icon: Building2, hint: "9 أدوار × 6 مكاتب" },
  { label: "العملاء النشطون", value: "—", icon: Users, hint: "قريباً" },
  { label: "العقود السارية", value: "—", icon: FileSignature, hint: "قريباً" },
  { label: "تحصيلات الشهر", value: "—", icon: Wallet, hint: "قريباً" },
];

function Dashboard() {
  const { user, roles } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">أهلاً بك في Pride &amp; Joy Tower</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مرحباً {user?.email}{" "}
          {roles.length > 0 && (
            <span>
              — صلاحيتك: {roles.map((r) => ROLE_LABELS[r]).join(", ")}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Card key={s.label} className="border-t-4 border-t-gold">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-5 w-5 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر الأحداث في البرج</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            لا توجد أحداث مسجّلة بعد. ستظهر الأحداث هنا بمجرد تفعيل الموديولات التشغيلية.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
