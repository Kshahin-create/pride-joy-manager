import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, FileSignature, Wallet, ShieldCheck, Wrench, Car,
  MessageSquareWarning, FolderArchive, BookOpenCheck, ArrowLeft, LogIn,
  Sparkles, Cctv, Receipt, KeyRound, Crown, Calculator, Headphones,
  CircleUserRound, Lock, Network, ChevronLeft, Phone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pride & Joy Tower — منصة الإدارة الذكية للأبراج المكتبية" },
      { name: "description", content: "منصة تشغيل رقمية متكاملة لإدارة المكاتب، العقود، التحصيلات، الصيانة، الأمن، المواقف، والمستندات لبرج Pride & Joy Tower." },
      { property: "og:title", content: "Pride & Joy Tower — منصة الإدارة الذكية" },
      { property: "og:description", content: "إدارة ذكية متكاملة لبرج Pride & Joy Tower من مكان واحد." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <LandingNavbar />
      <Hero3DScene />
      <FeaturesSection />
      <WorkflowSection />
      <DashboardMockup3D />
      <RolesSection />
      <ApiFirstSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}

/* ---------------- NAVBAR ---------------- */
function LandingNavbar() {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-lg shadow-primary/30">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-primary">Pride & Joy Tower</div>
            <div className="text-[10px] text-muted-foreground">منصة الإدارة الذكية</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">المميزات</a>
          <a href="#workflow" className="hover:text-primary transition-colors">سير العمل</a>
          <a href="#preview" className="hover:text-primary transition-colors">لوحة التحكم</a>
          <a href="#roles" className="hover:text-primary transition-colors">الصلاحيات</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
              <LogIn className="h-4 w-4 ms-1" />
              {user ? "لوحة التحكم" : "تسجيل الدخول"}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- HERO 3D ---------------- */
function Hero3DScene() {
  const { user } = useAuth();
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* ambient gradient & grid */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/40" />
        <div className="absolute top-0 start-0 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 end-0 h-[500px] w-[500px] rounded-full bg-gold/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* TEXT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center lg:text-start"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            منصة تشغيل ذكية للأبراج المكتبية
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.2] text-primary">
            إدارة ذكية متكاملة لبرج
            <span className="block mt-2 bg-gradient-to-l from-primary via-primary/80 to-gold bg-clip-text text-transparent">
              Pride & Joy Tower
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
            منصة تشغيل رقمية لإدارة المكاتب، العقود، التحصيلات، الصيانة، الأمن، المواقف، المستندات، وسجل البرج المركزي من مكان واحد.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 h-12 px-7">
                <LogIn className="h-4 w-4 ms-2" />
                تسجيل الدخول
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 h-12 px-7">
                استعراض المميزات
                <ArrowLeft className="h-4 w-4 me-2" />
              </Button>
            </a>
          </div>

          {/* Mini stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { v: "54", l: "مكتب" },
              { v: "9", l: "أدوار مكتبية" },
              { v: "3", l: "أدوار مواقف" },
              { v: "∞", l: "سجل مركزي" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border/70 bg-card/70 backdrop-blur px-3 py-3 text-center">
                <div className="text-2xl font-bold text-primary">{s.v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3D TOWER SCENE */}
        <Tower3D />
      </div>
    </section>
  );
}

function Tower3D() {
  const floors = Array.from({ length: 9 });
  const orbiters = [
    { icon: Cctv, label: "الأمن", x: -160, y: -120, delay: 0 },
    { icon: Wrench, label: "الصيانة", x: 170, y: -90, delay: 0.4 },
    { icon: Receipt, label: "الفواتير", x: 190, y: 80, delay: 0.8 },
    { icon: FileSignature, label: "العقود", x: -180, y: 60, delay: 1.2 },
    { icon: Car, label: "المواقف", x: 0, y: 220, delay: 1.6 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2 }}
      className="relative h-[520px] sm:h-[600px] flex items-center justify-center"
      style={{ perspective: "1400px" }}
    >
      {/* Floor disc */}
      <div
        className="absolute bottom-10 h-16 w-72 rounded-[50%] bg-gradient-to-br from-primary/30 to-transparent blur-2xl"
        aria-hidden
      />

      {/* Tower */}
      <motion.div
        animate={{ rotateY: [0, 6, -6, 0], rotateX: [8, 10, 8] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        <div className="relative w-44 sm:w-52 rounded-t-3xl bg-gradient-to-b from-primary via-primary/90 to-primary/70 shadow-[0_50px_100px_-20px_rgba(30,58,95,0.5)] border border-primary/40 overflow-hidden">
          {/* roof crown */}
          <div className="h-3 bg-gradient-to-b from-gold to-gold/60" />
          <div className="absolute top-0 inset-x-10 h-8 -mt-6 flex justify-center">
            <div className="w-1.5 h-12 bg-gold shadow-lg shadow-gold/50 rounded-full" />
          </div>

          {/* floors */}
          <div className="p-3 space-y-2">
            {floors.map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 4 }).map((__, j) => {
                  const lit = (i + j) % 3 !== 0;
                  return (
                    <motion.div
                      key={j}
                      className="h-5 rounded-sm border border-white/10"
                      animate={lit ? { opacity: [0.9, 1, 0.85] } : { opacity: 0.25 }}
                      transition={{ duration: 2 + ((i + j) % 4), repeat: Infinity, ease: "easeInOut", delay: (i * 0.1 + j * 0.07) % 2 }}
                      style={{
                        background: lit
                          ? "linear-gradient(180deg, #fde68a 0%, #C9A227 100%)"
                          : "rgba(255,255,255,0.06)",
                        boxShadow: lit ? "0 0 10px rgba(201, 162, 39, 0.55)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* entrance */}
          <div className="px-6 pb-4 pt-2 flex items-end justify-center">
            <div className="h-9 w-12 rounded-t-md bg-gold/80 border border-gold shadow-inner" />
          </div>
        </div>

        {/* reflective base */}
        <div className="mx-auto mt-1 h-10 w-56 rounded-[50%] bg-gradient-to-b from-primary/20 to-transparent blur-md" />
      </motion.div>

      {/* Orbiting feature cards */}
      {orbiters.map((o, i) => {
        const Icon = o.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -10, 0], x: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: o.delay }}
            className="absolute"
            style={{ transform: `translate(${o.x}px, ${o.y}px)` }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/90 backdrop-blur-xl px-3 py-2 shadow-xl shadow-primary/10 hover:shadow-gold/30 transition-shadow">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 grid place-items-center">
                <Icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold text-primary whitespace-nowrap">{o.label}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ---------------- FEATURES ---------------- */
const FEATURES = [
  { icon: Building2, title: "إدارة المكاتب", desc: "تتبع 54 مكتبًا عبر 9 طوابق بحالات وإشغال محدث لحظيًا." },
  { icon: Users, title: "العملاء والشركات", desc: "ملف موحد لكل شركة مع مسؤولين، تفاعلات، ومراحل قمع المبيعات." },
  { icon: FileSignature, title: "العقود", desc: "إنشاء وتجديد وإلغاء العقود مع مرفقات وتنبيهات الانتهاء." },
  { icon: Wallet, title: "المالية والتحصيلات", desc: "فواتير تلقائية، سندات قبض، متابعة المتأخرات وحالة السداد." },
  { icon: ShieldCheck, title: "الأمن والجولات", desc: "جداول الجولات، الحوادث، وكاميرات المراقبة في مكان واحد." },
  { icon: Wrench, title: "الأصول والصيانة", desc: "تكييفات، عدادات كهرباء، نقاط شبكة، وأوامر صيانة مجدولة." },
  { icon: Car, title: "المواقف", desc: "إدارة 3 أدوار مواقف بحجوزات وتعيينات للمستأجرين والزوار." },
  { icon: MessageSquareWarning, title: "الشكاوى والطلبات", desc: "تذاكر تتحول تلقائيًا لأوامر صيانة مع تتبع المدة والأولوية." },
  { icon: FolderArchive, title: "المستندات والأرشفة", desc: "تخزين آمن للعقود، الفواتير، التراخيص، والمخططات." },
  { icon: BookOpenCheck, title: "سجل البرج المركزي", desc: "تايملاين موحد لكل حدث مهم — مرجع لا يتغير عبر السنوات." },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="الموديولات"
          title="كل ما يحتاجه برج مكتبي حديث"
          subtitle="عشر منظومات متكاملة تعمل كقطعة واحدة لإدارة الأشخاص، الأماكن، والعقود."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard3D key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard3D({ feature, index }: { feature: typeof FEATURES[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 5) * 0.06 }}
      whileHover={{ rotateX: -6, rotateY: 6, translateY: -4 }}
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      className="group relative rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-5 shadow-md shadow-primary/5 hover:shadow-2xl hover:shadow-gold/20 transition-shadow"
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-gold/10 via-transparent to-primary/10 pointer-events-none" />
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="h-12 w-12 rounded-xl grid place-items-center bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 group-hover:shadow-gold/40 transition-shadow">
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="mt-4 font-bold text-primary text-base">{feature.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.desc}</p>
    </motion.div>
  );
}

/* ---------------- WORKFLOW ---------------- */
const WORKFLOW = [
  { icon: Building2, label: "المكتب", desc: "مرتبط بالعقد" },
  { icon: FileSignature, label: "العقد", desc: "يولّد الفواتير" },
  { icon: Receipt, label: "الفواتير", desc: "تحصيل ومتابعة" },
  { icon: MessageSquareWarning, label: "التذكرة", desc: "تتحول لطلب صيانة" },
  { icon: Wrench, label: "أمر الصيانة", desc: "تنفيذ ومتابعة" },
  { icon: BookOpenCheck, label: "سجل البرج", desc: "كل شيء مسجّل" },
];

function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 md:py-28 bg-gradient-to-b from-primary/[0.04] via-secondary/30 to-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="عمليات مترابطة"
          title="كل شيء يحدث في البرج — مترابط ومسجّل"
          subtitle="الموديولات لا تعيش منفصلة. الحدث يبدأ من نقطة وينتهي في السجل المركزي."
        />
        <div className="mt-16 relative">
          {/* timeline line */}
          <div className="hidden md:block absolute top-12 inset-x-8 h-px bg-gradient-to-l from-transparent via-gold/60 to-transparent" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
            {WORKFLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative h-24 w-24 rounded-2xl bg-card border-2 border-gold/40 grid place-items-center shadow-xl shadow-primary/10">
                    <Icon className="h-9 w-9 text-primary" />
                    <span className="absolute -top-2 -end-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold grid place-items-center shadow-lg">
                      {i + 1}
                    </span>
                  </div>
                  <div className="mt-4 font-bold text-primary">{step.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{step.desc}</div>
                  {i < WORKFLOW.length - 1 && (
                    <ChevronLeft className="hidden md:block absolute h-6 w-6 text-gold/70" style={{ top: 36, left: `calc(${(100 / WORKFLOW.length) * (i + 1)}% - 12px)` }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- DASHBOARD MOCKUP ---------------- */
function DashboardMockup3D() {
  const cards = [
    { label: "نسبة الإشغال", value: "87%", trend: "+4%", color: "from-emerald-500/15 to-emerald-500/0", text: "text-emerald-600" },
    { label: "المتأخرات", value: "124,500 ر.س", trend: "-12%", color: "from-rose-500/15 to-rose-500/0", text: "text-rose-600" },
    { label: "البلاغات المفتوحة", value: "7", trend: "جديد", color: "from-amber-500/15 to-amber-500/0", text: "text-amber-600" },
    { label: "عقود تنتهي قريبًا", value: "3", trend: "خلال 90 يوم", color: "from-primary/15 to-primary/0", text: "text-primary" },
    { label: "الحوادث الأمنية", value: "0", trend: "آخر 24 ساعة", color: "from-sky-500/15 to-sky-500/0", text: "text-sky-600" },
  ];
  return (
    <section id="preview" className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="معاينة الواجهة"
          title="لوحة تحكم واضحة، أرقام تتحدث"
          subtitle="مؤشرات تشغيل البرج كاملة في شاشة واحدة — مصممة للمدير العام، المحاسب، والمشرفين."
        />
        <motion.div
          initial={{ opacity: 0, rotateX: 12, y: 60 }}
          whileInView={{ opacity: 1, rotateX: 6, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          style={{ transformStyle: "preserve-3d", perspective: "1600px" }}
          className="mt-14 relative mx-auto max-w-5xl"
        >
          {/* glow */}
          <div className="absolute -inset-10 bg-gradient-to-br from-primary/20 via-gold/10 to-transparent blur-3xl -z-10" />

          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/20 overflow-hidden">
            {/* window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="mx-auto text-xs text-muted-foreground">app.pride-joy-tower / dashboard</div>
            </div>

            <div className="p-5 md:p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-bold text-primary">لوحة التحكم</div>
                  <div className="text-xs text-muted-foreground">نظرة عامة على تشغيل البرج</div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  مباشر
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {cards.map((c, i) => (
                  <motion.div
                    key={c.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`rounded-xl p-4 border border-border bg-gradient-to-br ${c.color}`}
                  >
                    <div className="text-[11px] text-muted-foreground">{c.label}</div>
                    <div className={`mt-1 text-xl font-extrabold ${c.text}`}>{c.value}</div>
                    <div className="mt-2 text-[10px] text-muted-foreground">{c.trend}</div>
                  </motion.div>
                ))}
              </div>

              {/* fake chart */}
              <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-primary">إيرادات آخر 6 أشهر</div>
                  <div className="text-[10px] text-muted-foreground">عرض توضيحي فقط</div>
                </div>
                <div className="h-28 flex items-end gap-2">
                  {[40, 65, 55, 80, 72, 92].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.08 }}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-gold"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- ROLES ---------------- */
const ROLES = [
  { icon: Crown, label: "مدير البرج", desc: "صلاحية كاملة على جميع الموديولات." },
  { icon: Calculator, label: "المحاسب", desc: "إدارة الفواتير، التحصيلات، والتقارير المالية." },
  { icon: ShieldCheck, label: "مشرف الأمن", desc: "الجولات، الحوادث، وكاميرات المراقبة." },
  { icon: Wrench, label: "مشرف الصيانة", desc: "أوامر الصيانة، التكييف، والكهرباء." },
  { icon: Headphones, label: "الاستقبال", desc: "العملاء، الزوار، وإدخال الشكاوى." },
  { icon: CircleUserRound, label: "المالك", desc: "وصول مقروء للتقارير والمؤشرات." },
];

function RolesSection() {
  return (
    <section id="roles" className="py-20 md:py-28 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="نظام الصلاحيات"
          title="كل دور يرى ما يخصه فقط"
          subtitle="حماية البيانات عبر صلاحيات مبنية على الأدوار، مع تشفير وتدقيق لكل عملية حساسة."
        />
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group relative rounded-2xl border border-border/70 bg-card p-5 overflow-hidden hover:border-gold/50 transition-colors"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-gold/10 blur-2xl group-hover:bg-gold/20 transition-colors" />
                <div className="flex items-start gap-4 relative">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 grid place-items-center text-primary border border-primary/20">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-primary">{r.label}</h3>
                      <Lock className="h-3.5 w-3.5 text-gold" />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- API-FIRST ---------------- */
function ApiFirstSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-primary to-primary/85 text-primary-foreground p-8 md:p-14">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px, 60px 60px",
          }} />
          <div className="absolute -end-20 -top-20 h-80 w-80 rounded-full bg-gold/30 blur-3xl" />
          <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-semibold mb-4">
                <Network className="h-3.5 w-3.5" />
                البنية التقنية
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
                النظام مبني بمنهجية <span className="text-gold">API-First</span>
              </h2>
              <p className="mt-4 text-primary-foreground/85 leading-relaxed max-w-xl">
                كل البيانات محفوظة في قاعدة بيانات حقيقية، وكل كيان داخل النظام قابل للربط مستقبلًا مع تطبيق موبايل أو أنظمة خارجية عبر APIs آمنة — جاهز للنمو بدون إعادة بناء.
              </p>
            </div>
            <div className="rounded-2xl bg-background/10 backdrop-blur-xl border border-white/10 p-5 font-mono text-xs leading-relaxed text-primary-foreground/90 shadow-2xl">
              <div className="flex items-center gap-2 mb-3 text-primary-foreground/60">
                <KeyRound className="h-3.5 w-3.5" /> secure API endpoint
              </div>
              <div><span className="text-gold">GET</span> /api/v1/offices?status=available</div>
              <div><span className="text-gold">POST</span> /api/v1/contracts</div>
              <div><span className="text-gold">GET</span> /api/v1/invoices?overdue=true</div>
              <div><span className="text-gold">POST</span> /api/v1/maintenance/tickets</div>
              <div><span className="text-gold">GET</span> /api/v1/building-log</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */
function FinalCTA() {
  const { user } = useAuth();
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden text-center bg-card border border-border p-10 md:p-16 shadow-2xl shadow-primary/10"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-card to-card" />
            <div className="absolute -top-20 -start-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-20 -end-20 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary leading-tight">
            ابدأ إدارة البرج باحترافية من أول يوم
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            انضم لطاقم Pride & Joy Tower وأدر كل شيء — من المكتب الصغير حتى السجل المركزي — بواجهة عربية أنيقة وسريعة.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30">
                <LogIn className="h-4 w-4 ms-2" />
                دخول لوحة التحكم
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-7 border-gold/40 text-primary hover:bg-gold/10">
              <Phone className="h-4 w-4 ms-2" />
              تواصل مع الإدارة
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function LandingFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-6 items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gold grid place-items-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-bold">Pride & Joy Tower</div>
              <div className="text-xs text-primary-foreground/70">منصة إدارة وتشغيل ذكية</div>
            </div>
          </div>
        </div>
        <div className="text-sm text-primary-foreground/80 leading-relaxed">
          منصة عربية متكاملة لتشغيل الأبراج المكتبية الحديثة — مكاتب، عقود، تحصيلات، صيانة، أمن، ومستندات في مكان واحد.
        </div>
        <div className="text-xs text-primary-foreground/70 sm:text-end">
          © {new Date().getFullYear()} Pride & Joy Tower — جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}

/* ---------------- SHARED ---------------- */
function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary leading-tight">{title}</h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
