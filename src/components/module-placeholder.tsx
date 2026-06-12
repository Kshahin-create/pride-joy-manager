import { Construction } from "lucide-react";

export function ModulePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-3 bg-card">
        <div className="w-14 h-14 rounded-full bg-gold/15 text-gold flex items-center justify-center">
          <Construction className="h-7 w-7" />
        </div>
        <p className="text-lg font-semibold">قريباً</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          هذا الموديول قيد التطوير. سيتم تفعيله في المراحل القادمة من المشروع.
        </p>
      </div>
    </div>
  );
}
