import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, FileSignature, Receipt, Wrench, UserPlus, Calendar } from "lucide-react";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";

interface Props {
  title: string;
  onRefresh: () => void;
  loading: boolean;
  refreshedAt: Date;
  canSeeFinance: boolean;
  isAdmin: boolean;
  isMaintenance: boolean;
}

const greet = (h: number) =>
  h < 5 ? "مساء الخير" : h < 12 ? "صباح الخير" : h < 17 ? "طاب يومك" : h < 21 ? "مساء الخير" : "مساء الخير";

export function HeroHeader({ title, onRefresh, loading, refreshedAt, canSeeFinance, isAdmin, isMaintenance }: Props) {
  const { user, roles } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "";

  const dateStr = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(now);

  const quicks: { label: string; to: string; icon: any; show: boolean }[] = [
    { label: "عقد جديد", to: "/contracts", icon: FileSignature, show: isAdmin },
    { label: "مصروف جديد", to: "/expenses", icon: Receipt, show: canSeeFinance },
    { label: "بلاغ صيانة", to: "/maintenance", icon: Wrench, show: isAdmin || isMaintenance },
    { label: "تسجيل زائر", to: "/lobby", icon: UserPlus, show: true },
  ].filter((q) => q.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground shadow-lg"
    >
      {/* decorative orbs */}
      <div className="pointer-events-none absolute -top-20 -end-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -start-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-white/75 flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dateStr}</span>
              <span className="opacity-60">•</span>
              <span dir="ltr" className="tabular-nums">{timeStr}</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {greet(now.getHours())}
              {firstName && <>، <span className="text-white">{firstName}</span></>} 👋
            </h1>
            <p className="text-sm text-white/85 mt-1">
              {title}
              {roles.length > 0 && (
                <>
                  <span className="mx-1.5 opacity-50">•</span>
                  <span className="font-medium">{roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-white/75 bg-white/10 backdrop-blur px-2.5 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-emerald-300" />
              </span>
              مباشر — {refreshedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur transition-colors disabled:opacity-50 border border-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
          </div>
        </div>

        {quicks.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-white/70">اختصارات:</span>
            {quicks.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.label}
                  to={q.to as any}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition-all hover:-translate-y-0.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {q.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
