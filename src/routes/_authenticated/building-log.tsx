import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/building-log")({
  component: () => <ModulePlaceholder title="سجل البرج" description="سجل مركزي بكل أحداث البرج" />,
});
