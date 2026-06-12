import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/parking")({
  component: () => <ModulePlaceholder title="المواقف" description="إدارة مواقف السيارات والاشتراكات" />,
});
