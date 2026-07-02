import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export type RangePreset = "7d" | "30d" | "90d" | "6m" | "12m" | "ytd" | "custom";

export interface TimeRange {
  preset: RangePreset;
  from: Date;
  to: Date;
}

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "7d", label: "7 أيام" },
  { id: "30d", label: "30 يوم" },
  { id: "90d", label: "90 يوم" },
  { id: "6m", label: "6 أشهر" },
  { id: "12m", label: "12 شهر" },
  { id: "ytd", label: "منذ بداية السنة" },
];

export function computeRange(preset: RangePreset, customFrom?: Date, customTo?: Date): TimeRange {
  const to = new Date();
  const from = new Date();
  switch (preset) {
    case "7d": from.setDate(to.getDate() - 6); break;
    case "30d": from.setDate(to.getDate() - 29); break;
    case "90d": from.setDate(to.getDate() - 89); break;
    case "6m": from.setMonth(to.getMonth() - 5); from.setDate(1); break;
    case "12m": from.setMonth(to.getMonth() - 11); from.setDate(1); break;
    case "ytd": from.setMonth(0); from.setDate(1); break;
    case "custom":
      return {
        preset,
        from: customFrom ?? new Date(to.getFullYear(), to.getMonth(), 1),
        to: customTo ?? to,
      };
  }
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { preset, from, to };
}

export function rangeLabel(r: TimeRange): string {
  const p = PRESETS.find((x) => x.id === r.preset);
  if (p) return p.label;
  const f = (d: Date) => new Intl.DateTimeFormat("en-GB").format(d);
  return `${f(r.from)} → ${f(r.to)}`;
}

export function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cFrom, setCFrom] = useState<string>(value.from.toISOString().slice(0, 10));
  const [cTo, setCTo] = useState<string>(value.to.toISOString().slice(0, 10));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white backdrop-blur"
        >
          <CalendarRange className="h-3.5 w-3.5" />
          <span className="text-xs">{rangeLabel(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2 pointer-events-auto">
        <div className="grid grid-cols-2 gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              variant={value.preset === p.id ? "default" : "ghost"}
              size="sm"
              className="h-8 justify-start text-xs"
              onClick={() => {
                onChange(computeRange(p.id));
                setOpen(false);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t space-y-2">
          <p className="text-[11px] text-muted-foreground">نطاق مخصص</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">من</label>
              <Input type="date" value={cFrom} onChange={(e) => setCFrom(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">إلى</label>
              <Input type="date" value={cTo} onChange={(e) => setCTo(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => {
              const f = new Date(cFrom); f.setHours(0, 0, 0, 0);
              const t = new Date(cTo); t.setHours(23, 59, 59, 999);
              if (isNaN(f.getTime()) || isNaN(t.getTime()) || f > t) return;
              onChange(computeRange("custom", f, t));
              setOpen(false);
            }}
          >
            تطبيق
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
