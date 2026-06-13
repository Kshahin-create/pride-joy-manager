import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Building2, ShieldCheck, Wrench, Car, FolderArchive,
  Users, FileSignature, Wallet, LayoutDashboard, LogIn, ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام إدارة Pride & Joy Tower" },
      { name: "description", content: "نظام داخلي لإدارة وتشغيل برج Pride & Joy Tower — العقود، الصيانة، الأمن، المواقف والمستندات." },
      { property: "og:title", content: "نظام إدارة Pride & Joy Tower" },
      { property: "og:description", content: "منصة موحدة لإدارة وتشغيل البرج." },
    ],
  }),
  component: LandingPage,
});

const MODULES = [
  { icon: Building2, title: "المكاتب", desc: "إدارة كل المكاتب والأدوار والمساحات." },
  { icon: Users, title: "العملاء", desc: "ملفات المستأجرين وبياناتهم وتواصلهم." },
  { icon: FileSignature, title: "العقود", desc: "متابعة العقود وتواريخ التجديد والانتهاء." },
  { icon: Wallet, title: "الفواتير والمالية", desc: "إصدار الفواتير ومتابعة المدفوعات والمصروفات." },
  { icon: Wrench, title: "الصيانة وأوامر العمل", desc: "تذاكر الصيانة والصيانة الوقائية." },
  { icon: ShieldCheck, title: "الأمن والمراقبة", desc: "الحراسات، الجولات، الحوادث والكاميرات." },
  { icon: Car, title: "المواقف", desc: "تخصيص ومتابعة مواقف السيارات." },
  { icon: FolderArchive, title: "الأرشيف والمستندات", desc: "أرشيف مركزي لكل مستندات البرج والمستأجرين." },
];

function LandingPage() {
  const { user } = useAuth();
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center shadow">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-primary">Pride & Joy Tower</div>
              <div className="text-[10px] text-muted-foreground">نظام الإدارة الداخلي</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to={user ? "/dashboard" : "/auth"}>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            منصة الإدارة الموحدة
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary leading-tight"
          >
            نظام إدارة وتشغيل برج Pride & Joy Tower
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed"
          >
            منصة داخلية موحّدة لفريق الإدارة لمتابعة العقود، الصيانة، الأمن، المواقف، والمستندات في مكان واحد.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3 justify-center"
          >
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7">
                {user ? "فتح لوحة التحكم" : "تسجيل الدخول"}
                <ArrowLeft className="h-4 w-4 me-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 md:py-20 flex-1">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">وحدات النظام</h2>
            <p className="mt-3 text-muted-foreground">
              كل ما يحتاجه فريق إدارة البرج لتشغيل يومي منظم وشفاف.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{m.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Pride & Joy Tower — جميع الحقوق محفوظة.</div>
          <div>نظام داخلي للاستخدام من قِبل فريق الإدارة فقط.</div>
        </div>
      </footer>
    </div>
  );
}
