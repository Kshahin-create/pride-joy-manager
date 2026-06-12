import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Building2, Users, FileSignature, Wallet, ShieldCheck, Wrench, Car,
  MessageSquareWarning, FolderArchive, BookOpenCheck, ArrowLeft, LogIn,
  Sparkles, Cctv, Receipt, ChevronLeft, Phone, MapPin, Mail,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pride & Joy Tower — برج المكاتب الفاخر" },
      { name: "description", content: "Pride & Joy Tower — برج مكتبي حديث يجمع بين الفخامة والموقع المتميز والخدمات المتكاملة لعملك." },
      { property: "og:title", content: "Pride & Joy Tower" },
      { property: "og:description", content: "برج مكتبي حديث بخدمات متكاملة وموقع متميز." },
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
      <ContactSection />
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
            <div className="text-[10px] text-muted-foreground">برج المكاتب الفاخر</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">المميزات</a>
          <a href="#workflow" className="hover:text-primary transition-colors">خدماتنا</a>
          <a href="#contact" className="hover:text-primary transition-colors">تواصل معنا</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to={user ? "/dashboard" : "/auth"}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
              <LogIn className="h-4 w-4 ms-1" />
              {user ? "لوحة التحكم" : "دخول الموظفين"}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- HERO 3D ---------------- */
function Hero3DScene() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center lg:text-start"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            وجهة الأعمال المتميزة
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.2] text-primary">
            مكتب أعمالك يستحق
            <span className="block mt-2 bg-gradient-to-l from-primary via-primary/80 to-gold bg-clip-text text-transparent">
              Pride & Joy Tower
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
            برج مكتبي عصري بتصميم فاخر، موقع متميز، وخدمات متكاملة تشمل الأمن على مدار الساعة، الصيانة، ومواقف السيارات — بيئة عمل احترافية تليق بأعمالك.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
            <a href="#contact">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 h-12 px-7">
                <Phone className="h-4 w-4 ms-2" />
                احجز جولة معاينة
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 h-12 px-7">
                تعرف على المميزات
                <ArrowLeft className="h-4 w-4 me-2" />
              </Button>
            </a>
          </div>
        </motion.div>

        <Tower3D />
      </div>
    </section>
  );
}

function Tower3D() {
  const floors = Array.from({ length: 9 });
  const orbiters = [
    { icon: Cctv, label: "أمن 24/7", x: -160, y: -120, delay: 0 },
    { icon: Wrench, label: "صيانة", x: 170, y: -90, delay: 0.4 },
    { icon: Car, label: "مواقف", x: 190, y: 80, delay: 0.8 },
    { icon: Sparkles, label: "نظافة", x: -180, y: 60, delay: 1.2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2 }}
      className="relative h-[520px] sm:h-[600px] flex items-center justify-center"
      style={{ perspective: "1400px" }}
    >
      <div className="absolute bottom-10 h-16 w-72 rounded-[50%] bg-gradient-to-br from-primary/30 to-transparent blur-2xl" aria-hidden />

      <motion.div
        animate={{ rotateY: [0, 6, -6, 0], rotateX: [8, 10, 8] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        <div className="relative w-44 sm:w-52 rounded-t-3xl bg-gradient-to-b from-primary via-primary/90 to-primary/70 shadow-[0_50px_100px_-20px_rgba(30,58,95,0.5)] border border-primary/40 overflow-hidden">
          <div className="h-3 bg-gradient-to-b from-gold to-gold/60" />
          <div className="absolute top-0 inset-x-10 h-8 -mt-6 flex justify-center">
            <div className="w-1.5 h-12 bg-gold shadow-lg shadow-gold/50 rounded-full" />
          </div>

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

          <div className="px-6 pb-4 pt-2 flex items-end justify-center">
            <div className="h-9 w-12 rounded-t-md bg-gold/80 border border-gold shadow-inner" />
          </div>
        </div>

        <div className="mx-auto mt-1 h-10 w-56 rounded-[50%] bg-gradient-to-b from-primary/20 to-transparent blur-md" />
      </motion.div>

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
  { icon: Building2, title: "تصميم عصري", desc: "مكاتب بمساحات مرنة وتشطيبات فاخرة جاهزة لاستقبال أعمالك." },
  { icon: ShieldCheck, title: "أمن على مدار الساعة", desc: "حراسة احترافية ومراقبة مستمرة لراحة بالك وأمان أعمالك." },
  { icon: Wrench, title: "صيانة سريعة", desc: "فريق صيانة جاهز للاستجابة لطلباتك بأسرع وقت ممكن." },
  { icon: Car, title: "مواقف واسعة", desc: "مواقف سيارات منظمة للمستأجرين والزوار في موقع البرج." },
  { icon: Sparkles, title: "خدمات استقبال", desc: "موظفو استقبال محترفون لاستقبال زوارك بأرقى أسلوب." },
  { icon: FolderArchive, title: "مرافق متكاملة", desc: "بنية تحتية حديثة تشمل الكهرباء، التكييف، والاتصالات." },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="لماذا Pride & Joy Tower"
          title="بيئة عمل تليق بأعمالك"
          subtitle="كل ما تحتاجه من خدمات ومرافق في مكان واحد، ليتفرغ فريقك لما يهم فعلًا."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      transition={{ duration: 0.5, delay: (index % 3) * 0.06 }}
      whileHover={{ rotateX: -6, rotateY: 6, translateY: -4 }}
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      className="group relative rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-6 shadow-md shadow-primary/5 hover:shadow-2xl hover:shadow-gold/20 transition-shadow"
    >
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-gold/10 via-transparent to-primary/10 pointer-events-none" />
      <div className="h-14 w-14 rounded-xl grid place-items-center bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30 group-hover:shadow-gold/40 transition-shadow">
        <Icon className="h-7 w-7 text-primary-foreground" />
      </div>
      <h3 className="mt-5 font-bold text-primary text-lg">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
    </motion.div>
  );
}

/* ---------------- WORKFLOW ---------------- */
const WORKFLOW = [
  { icon: Phone, label: "تواصل معنا", desc: "اطلب جولة معاينة" },
  { icon: Building2, label: "اختر مكتبك", desc: "تشكيلة من المساحات" },
  { icon: FileSignature, label: "وقّع العقد", desc: "إجراءات مبسطة" },
  { icon: BookOpenCheck, label: "ابدأ العمل", desc: "تسليم جاهز" },
];

function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 md:py-28 bg-gradient-to-b from-primary/[0.04] via-secondary/30 to-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="خطوات بسيطة"
          title="من المعاينة إلى تسليم المكتب"
          subtitle="رحلة سلسة من أول اتصال حتى استلام مفاتيح مكتبك الجديد."
        />
        <div className="mt-16 relative">
          <div className="hidden md:block absolute top-12 inset-x-8 h-px bg-gradient-to-l from-transparent via-gold/60 to-transparent" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            {WORKFLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center text-center relative"
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
                    <ChevronLeft className="hidden md:block absolute h-6 w-6 text-gold/70 top-9 -start-3" />
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

/* ---------------- CONTACT ---------------- */
function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-28">
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
            جاهزون لاستقبالك في Pride & Joy Tower
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            تواصل مع فريق الإدارة لحجز موعد معاينة أو الاستفسار عن المكاتب المتاحة وخدمات البرج.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-start">
            <ContactCard icon={Phone} title="اتصل بنا" value="إدارة البرج" />
            <ContactCard icon={Mail} title="البريد الإلكتروني" value="info@pride-joy-tower" />
            <ContactCard icon={MapPin} title="الموقع" value="Pride & Joy Tower" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ContactCard({ icon: Icon, title, value }: { icon: typeof Phone; title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 backdrop-blur p-5 flex items-start gap-3">
      <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center text-primary border border-primary/20 shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="mt-0.5 font-semibold text-primary truncate">{value}</div>
      </div>
    </div>
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
              <div className="text-xs text-primary-foreground/70">برج المكاتب الفاخر</div>
            </div>
          </div>
        </div>
        <div className="text-sm text-primary-foreground/80 leading-relaxed">
          برج مكتبي حديث بخدمات متكاملة وموقع متميز — بيئة عمل احترافية لأعمالك.
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

// Note: Unused imports kept intentionally minimal.
void Users; void FileSignature; void Wallet; void MessageSquareWarning; void Receipt; void LogIn;
