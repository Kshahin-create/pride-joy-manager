import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/operations")({
  component: () => <ModulePlaceholder title="التشغيل" description="إدارة عمليات التشغيل اليومية" />,
});
