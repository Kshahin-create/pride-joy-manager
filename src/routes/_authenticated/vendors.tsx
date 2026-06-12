import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/vendors")({
  component: () => <ModulePlaceholder title="الموردون" description="الموردون وعقود الخدمات" />,
});
