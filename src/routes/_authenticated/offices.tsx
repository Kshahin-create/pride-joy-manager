import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/offices")({
  component: () => <ModulePlaceholder title="المكاتب" description="إدارة المكاتب والمواقع والمساحات في البرج" />,
});
