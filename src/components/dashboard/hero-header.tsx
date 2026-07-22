import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, FileSignature, Receipt, Wrench, UserPlus } from "lucide-react";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { useActiveProperty } from "@/lib/active-property-context";

interface Props {
  title: string;
  onRefresh: () => void;
  loading: boolean;
  refreshedAt: Date;
  canSeeFinance: boolean;
  isAdmin: boolean;
  isMaintenance: boolean;
  rangeSlot?: React.ReactNode;
}

const greet = (h: number) =>
  h < 5 ? "مساء الخير" : h < 12 ? "صباح الخير" : h < 17 ? "طاب يومك" : "مساء الخير";

export function HeroHeader({
  title, onRefresh, loading, refreshedAt, canSeeFinance, isAdmin, isMaintenance, rangeSlot,
}: Props) {
  const { user, roles } = useAuth();
  const { activeProperty } = useActiveProperty();
  const activePropertyName = activeProperty?.name;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    ?? user?.email?.split("@")[0] ?? "";

  // ISO date (2026-07-22) per requirement
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(now);

  const quicks: { label: string; to: string; icon: any; show: boolean }[] = [
    { label: "عقد جديد", to: "/contracts", icon: FileSignature, show: isAdmin },
    { label: "مصروف", to: "/expenses", icon: Receipt, show: canSeeFinance },
    { label: "بلاغ صيانة", to: "/maintenance", icon: Wrench, show: isAdmin || isMaintenance },
    { label: "زائر", to: "/lobby", icon: UserPlus, show: true },
  ].filter((q) => q.show);

  return (
    <div className="rounded-xl border bg-card px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {greet(now.getHours())}{firstName && <>، {firstName}</>}
            </h1>
            {activePropertyName && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-xs sm:text-sm text-muted-foreground truncate">{activePropertyName}</span>
              </>
            )}
            {roles.length > 0 && (
              <span className="hidden sm:inline text-[11px] text-muted-foreground/70">
                — {roles.map((r) => ROLE_LABELS[r] ?? r).join("، ")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 tabular-nums" dir="ltr">
            <span>{dateStr}</span>
            <span className="opacity-40">•</span>
            <span>{timeStr}</span>
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live · {refreshedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {quicks.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.label}
                to={q.to as any}
                className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border bg-background hover:bg-muted transition-colors"
              >
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {q.label}
              </Link>
            );
          })}
          {rangeSlot}
          <button
            onClick={onRefresh}
            disabled={loading}
            aria-label="تحديث"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border bg-background hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <p className="sr-only">{title}</p>
    </div>
  );
}
