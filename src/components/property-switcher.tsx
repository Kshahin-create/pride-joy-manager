import { Building2, Check, ChevronsUpDown, Layers } from "lucide-react";
import { useState } from "react";
import { useActiveProperty } from "@/lib/active-property-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function PropertySwitcher() {
  const { properties, activePropertyId, activeProperty, setActivePropertyId, loading } = useActiveProperty();
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="px-2 py-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
        تحميل العقارات...
      </div>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  const label =
    activePropertyId === "all"
      ? "كل العقارات"
      : activeProperty?.name ?? "اختر عقاراً";

  return (
    <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
      <div className="text-[10px] font-semibold text-sidebar-foreground/60 mb-1 px-1">العقار النشط</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between bg-sidebar-accent/40 border-sidebar-border hover:bg-sidebar-accent text-sidebar-foreground h-9"
          >
            <span className="flex items-center gap-2 min-w-0">
              {activePropertyId === "all" ? (
                <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
              <span className="truncate text-xs font-medium">{label}</span>
            </span>
            <ChevronsUpDown className="h-3 w-3 opacity-60 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1" dir="rtl">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => { setActivePropertyId("all"); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent text-right",
                activePropertyId === "all" && "bg-accent"
              )}
            >
              <Layers className="h-4 w-4 text-primary" />
              <span className="flex-1 text-right">كل العقارات</span>
              {activePropertyId === "all" && <Check className="h-4 w-4 text-primary" />}
            </button>
          )}
          <div className="my-1 h-px bg-border" />
          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setActivePropertyId(p.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent text-right",
                activePropertyId === p.id && "bg-accent"
              )}
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0 text-right">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {p.property_type}{p.city ? ` · ${p.city}` : ""}
                </div>
              </div>
              {activePropertyId === p.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
