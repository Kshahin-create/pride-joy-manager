import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/lobby")({
  component: LobbyPage,
});

function LobbyPage() {
  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">اللوبي</h1>
        <p className="text-sm text-muted-foreground">إدارة وتشغيل منطقة اللوبي</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> شاشة تسجيل الزوار (Kiosk)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            افتح هذه الصفحة على شاشة/تابلت في اللوبي ليُسجّل الزوار بياناتهم بأنفسهم (اسم، هاتف، الدور، الشركة).
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <a href="/lobby-checkin" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 ml-1" /> فتح شاشة اللوبي
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/lobby-checkin">معاينة هنا</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
