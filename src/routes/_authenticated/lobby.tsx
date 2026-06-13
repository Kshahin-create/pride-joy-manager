import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/lobby")({
  component: () => (
    <div className="p-6" dir="rtl">
      <ModulePlaceholder title="اللوبي" description="إدارة وتشغيل منطقة اللوبي" />
    </div>
  ),
});
