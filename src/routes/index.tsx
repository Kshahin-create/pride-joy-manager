import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <p className="text-muted-foreground">جارٍ التحميل…</p>
      </div>
    );
  }
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}
