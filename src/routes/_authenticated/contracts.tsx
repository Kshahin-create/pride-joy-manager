import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/contracts")({
  component: () => <ModulePlaceholder title="العقود" description="عقود الإيجار وحالاتها وتجديداتها" />,
});
