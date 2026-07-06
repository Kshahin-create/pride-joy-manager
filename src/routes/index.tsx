import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import logoWhiteAsset from "@/assets/icon_white.png.asset.json";
import {
  Building2, ShieldCheck, Wrench, Car, FileSignature, Wallet,
  LayoutDashboard, LogIn, ArrowLeft, Users, BarChart3, Sparkles,
  Cog, Sprout, FileSpreadsheet, MessageCircle, FileBarChart,
  CheckCircle2, PlayCircle, Cable, Flame, Camera, Zap, Gauge, Wind,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TAAM — منصة إدارة وتشغيل وصيانة العقارات والمرافق" },
      { name: "description", content: "TAAM منصة متكاملة لإدارة العقارات والأصول والصيانة والتشغيل والعقود والتحصيلات من مكان واحد، مصممة للسوق السعودي." },
      { property: "og:title", content: "TAAM — منصة إدارة وتشغيل العقارات والمرافق" },
      { property: "og:description", content: "إدارة العقارات والأصول والصيانة والتشغيل والعقود والتحصيلات من منصة واحدة." },
    ],
  }),
  component: LandingPage,
});

const AUDIENCE = [
  "شركات إدارة وتشغيل العقارات",
  "ملاك الأبراج والمجمعات التجارية",
  "شركات إدارة المرافق",
  "المدن الصناعية",
  "المجمعات الإدارية",
  "المراكز التجارية",
];

const MODULES = [
  { icon: Building2, title: "العقارات", emoji: "🏢" },
  { icon: FileSignature, title: "العقود", emoji: "📑" },
  { icon: Cog, title: "الأصول", emoji: "⚙️" },
  { icon: Wrench, title: "الصيانة", emoji: "🔧" },
  { icon: ShieldCheck, title: "الأمن", emoji: "🛡️" },
  { icon: Sprout, title: "النظافة", emoji: "🧹" },
  { icon: Car, title: "المواقف", emoji: "🚗" },
  { icon: Users, title: "الزوار", emoji: "👥" },
  { icon: Wallet, title: "المالية", emoji: "💰" },
  { icon: BarChart3, title: "التقارير", emoji: "📊" },
];

const ASSETS = [
  { icon: Cable, label: "المصاعد" },
  { icon: Wind, label: "التكييف" },
  { icon: Flame, label: "أنظمة الحريق" },
  { icon: Camera, label: "الكاميرات" },
  { icon: Gauge, label: "المضخات" },
  { icon: Zap, label: "اللوحات الكهربائية" },
];

const MAINT = [
  "بلاغات",
  "أوامر عمل",
  "صيانة وقائية",
  "تنبيهات تلقائية",
  "متابعة المقاولين",
];

const DASH = [
  "نسب الإشغال",
  "الإيرادات",
  "المصروفات",
  "حالة الأصول",
  "مؤشرات الصيانة",
  "مؤشرات التشغيل",
];

const ADVANTAGES = [
  "إدارة العقارات والتشغيل والصيانة في منصة واحدة",
  "إدارة دورة حياة الأصول بالكامل",
  "متابعة العقود والتحصيلات",
  "لوحات بيانات لحظية",
  "نظام عربي مصمم للسوق السعودي",
  "قابل لإدارة برج واحد أو عشرات المشاريع",
];

function LandingPage() {
  const { user } = useAuth();
  const ctaTo = user ? "/dashboard" : "/auth";

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={logoWhiteAsset.url}
              alt="TAAM"
              className="h-9 w-9 rounded-lg object-contain shadow"
            />
            <div className="leading-tight">
              <div className="text-base font-extrabold text-primary tracking-wide">TAAM</div>
              <div className="text-[10px] text-muted-foreground">منصة إدارة وتشغيل العقارات</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to={ctaTo}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <LogIn className="h-4 w-4 ms-1" />
                {user ? "لوحة التحكم" : "تسجيل الدخول"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/40" />
          <div className="absolute -top-32 -start-32 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-32 -end-32 h-[420px] w-[420px] rounded-full bg-gold/15 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            منصة التشغيل المتكاملة للعقارات والمرافق
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary leading-tight"
          >
            TAAM
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg sm:text-xl font-semibold text-foreground"
          >
            منصة متكاملة لإدارة وتشغيل وصيانة العقارات والمرافق
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed"
          >
            إدارة العقارات والأصول والصيانة والتشغيل والعقود والتحصيلات من منصة واحدة
            مصممة لشركات إدارة وتشغيل المرافق والعقارات.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-3 justify-center"
          >
            <Link to={ctaTo}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7">
                {user ? "فتح لوحة التحكم" : "تسجيل الدخول"}
                <ArrowLeft className="h-4 w-4 me-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-7">
              <PlayCircle className="h-4 w-4 ms-2" />
              شاهد النظام
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-16 md:py-20 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">لمن صُمم النظام؟</h2>
            <p className="mt-3 text-muted-foreground">منصة واحدة تخدم كل من يدير عقارًا أو مرفقًا.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUDIENCE.map((a, i) => (
              <motion.div
                key={a}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-5 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="font-semibold text-sm text-foreground">{a}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules — ماذا يمكنك إدارة؟ */}
      <section className="py-16 md:py-20 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">ماذا يمكنك إدارة؟</h2>
            <p className="mt-3 text-muted-foreground">كل عمليات المنشأة في وحدات متكاملة تعمل معًا.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group rounded-xl border border-border bg-card p-5 text-center hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="mb-2 flex justify-center">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <m.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-foreground">{m.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified ops */}
      <section className="py-16 md:py-20 border-b border-border/60 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
              كل عمليات العقار في مكان واحد
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              بدّل ملفات Excel ومجموعات WhatsApp والتقارير المتفرقة بمنصة موحّدة،
              مع سجل كامل لكل أصل وكل عقد وكل عملية صيانة.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: FileSpreadsheet, t: "بدل ملفات Excel" },
                { icon: MessageCircle, t: "بدل مجموعات WhatsApp" },
                { icon: FileBarChart, t: "بدل التقارير المتفرقة" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex items-center gap-3 text-sm">
                  <div className="h-9 w-9 rounded-lg bg-background border border-border grid place-items-center text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-foreground font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="grid grid-cols-2 gap-3">
              {MODULES.slice(0, 8).map((m) => (
                <div key={m.title} className="rounded-lg border border-border bg-background p-4 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                    <m.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold">{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Assets */}
      <section className="py-16 md:py-20 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">اعرف حالة أصولك لحظة بلحظة</h2>
            <p className="mt-3 text-muted-foreground">سجل كامل للأعطال والصيانة والضمانات لكل أصل.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {ASSETS.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-5 text-center hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="h-10 w-10 mx-auto rounded-lg bg-primary/10 grid place-items-center text-primary mb-2">
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">{a.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Maintenance */}
      <section className="py-16 md:py-20 border-b border-border/60 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">صيانة أكثر ذكاءً</h2>
            <p className="mt-3 text-muted-foreground">من البلاغ إلى الإغلاق — كل شيء متتبع.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MAINT.map((m, i) => (
              <motion.div
                key={m}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-5 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <Wrench className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-semibold">{m}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboards */}
      <section className="py-16 md:py-20 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">اتخذ قراراتك بناءً على بيانات حقيقية</h2>
            <p className="mt-3 text-muted-foreground">لوحات بيانات لحظية تجمع كل مؤشرات التشغيل.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DASH.map((d, i) => (
              <motion.div
                key={d}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <BarChart3 className="h-5 w-5 text-primary mb-3" />
                <div className="font-bold text-foreground">{d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-16 md:py-20 border-b border-border/60 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">لماذا TAAM؟</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {ADVANTAGES.map((a, i) => (
              <motion.div
                key={a}
                initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-5 flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium leading-relaxed">{a}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final pitch */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-gold/10" />
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <LayoutDashboard className="h-10 w-10 mx-auto text-primary mb-5" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary leading-snug">
            TAAM ليس مجرد نظام عقاري
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            بل منصة تشغيل متكاملة تربط العقار والأصول والصيانة والتشغيل والمالية في مكان واحد.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to={ctaTo}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">
                {user ? "فتح لوحة التحكم" : "ابدأ الآن"}
                <ArrowLeft className="h-4 w-4 me-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} TAAM — جميع الحقوق محفوظة.</div>
          <div>منصة إدارة وتشغيل العقارات والمرافق.</div>
        </div>
      </footer>
    </div>
  );
}
