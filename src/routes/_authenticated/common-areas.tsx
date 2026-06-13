import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const Route = createFileRoute("/_authenticated/common-areas")({
  component: () => (
    <div className="p-6" dir="rtl">
      <ModulePlaceholder title="المناطق المشتركة" description="إدارة الممرات والسلالم والمناطق المشتركة" />
    </div>
  ),
});
