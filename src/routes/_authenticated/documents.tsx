import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/documents")({
  component: () => <ModulePlaceholder title="المستندات" description="أرشيف الوثائق والمخططات" />,
});
