import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useCanSeeFinance } from "@/lib/finance-access";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FinanceAccessGate({ children }: { children: ReactNode }) {
  const allowed = useCanSeeFinance();
  if (allowed) return <>{children}</>;
  return (
    <div className="p-6">
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="p-8 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold">صفحة محمية</h2>
          <p className="text-sm text-muted-foreground">
            الأرقام المالية متاحة فقط للمدير العام والمحاسب.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">العودة للوحة</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
