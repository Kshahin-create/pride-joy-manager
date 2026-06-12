import { createFileRoute, Navigate, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const emailSchema = z.string().trim().email({ message: "البريد الإلكتروني غير صالح" }).max(255);
const passwordSchema = z
  .string()
  .min(6, { message: "كلمة المرور يجب ألا تقل عن 6 أحرف" })
  .max(72, { message: "كلمة المرور طويلة جداً" });

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (m.includes("email not confirmed")) return "لم يتم تأكيد البريد الإلكتروني بعد";
  if (m.includes("too many")) return "محاولات كثيرة، حاول لاحقاً";
  if (m.includes("user not found")) return "لا يوجد حساب بهذا البريد";
  if (m.includes("network")) return "تحقق من اتصالك بالإنترنت";
  return "حدث خطأ، حاول مرة أخرى";
}

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary via-primary to-[oklch(0.24_0.06_240)] p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8 text-primary-foreground">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white mb-4 shadow-lg p-3">
            <BrandLogo variant="color" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold mb-1">نخبة تسكين العقارية</h1>
          <p className="text-primary-foreground/80 text-sm">نظام إدارة وتشغيل البرج</p>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl p-6">
          <SignInForm onSuccess={() => navigate({ to: "/dashboard" })} />
          <p className="text-xs text-muted-foreground text-center mt-4">
            الحسابات تُنشأ من قِبل المدير العام فقط
          </p>
        </div>

        <p className="text-center text-primary-foreground/60 text-xs mt-6">
          نظام داخلي لإدارة وموظفي البرج
        </p>
      </div>
    </div>

  );
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    const pv = passwordSchema.safeParse(password);
    if (!ev.success) return toast.error(ev.error.issues[0].message);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: ev.data,
      password: pv.data,
    });
    setBusy(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    toast.success("أهلاً بك");
    onSuccess();
  };

  const handleGoogle = async () => {
    setGoogleBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        toast.error("تعذّر تسجيل الدخول بجوجل");
        setGoogleBusy(false);
        return;
      }
      if (result.redirected) return;
      onSuccess();
    } catch {
      toast.error("تعذّر تسجيل الدخول بجوجل");
      setGoogleBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={googleBusy || busy}
        className="w-full h-11 font-medium"
      >
        {googleBusy ? (
          <Loader2 className="ms-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="ms-2 h-5 w-5" />
        )}
        المتابعة باستخدام Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">أو بالبريد الإلكتروني</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="signin-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              className="text-left pe-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@tower.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">كلمة المرور</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="signin-password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              className="pe-9 ps-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute start-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={busy || googleBusy}
          className="w-full h-11 bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {busy ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
          تسجيل الدخول
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.18a6.9 6.9 0 0 1 0-4.36V6.84H1.7a11.5 11.5 0 0 0 0 10.32l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.71 1.3 15.1.25 12 .25A11.5 11.5 0 0 0 1.7 6.84l3.85 2.98C6.46 7.1 9 4.75 12 4.75Z"
      />
    </svg>
  );
}
