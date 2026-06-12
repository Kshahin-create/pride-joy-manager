import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/finance")({
  component: () => <ModulePlaceholder title="المالية" description="الفواتير والمدفوعات والتقارير المالية" />,
});
