import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/security")({
  component: () => <ModulePlaceholder title="الأمن" description="الحراس والجولات وحوادث الأمن والكاميرات" />,
});
