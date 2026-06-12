import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/inspections")({
  component: () => <ModulePlaceholder title="التفتيشات" description="جداول التفتيش وتقارير الجودة" />,
});
