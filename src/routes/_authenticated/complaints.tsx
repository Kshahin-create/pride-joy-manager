import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/complaints")({
  component: () => <ModulePlaceholder title="الشكاوى والطلبات" description="بلاغات وشكاوى وطلبات العملاء" />,
});
