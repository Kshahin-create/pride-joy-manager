import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const emailSchema = z.string().trim().email({ message: "البريد الإلكتروني غير صالح" }).max(255);
const passwordSchema = z
  .string()
  .min(6, { message: "كلمة المرور يجب ألا تقل عن 6 أحرف" })
  .max(72, { message: "كلمة المرور طويلة جداً" });
const nameSchema = z.string().trim().min(2, { message: "الاسم قصير جداً" }).max(100);

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary via-primary to-[oklch(0.22_0.05_250)] p-4"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8 text-primary-foreground">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold text-gold-foreground mb-4 shadow-lg">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-1">Pride &amp; Joy Tower</h1>
          <p className="text-primary-foreground/80 text-sm">نظام إدارة وتشغيل البرج</p>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl p-6">
          <SignInForm onSuccess={() => navigate({ to: "/dashboard" })} />
          <p className="text-xs text-muted-foreground text-center mt-4">
            الحسابات تُنشأ من قِبل المدير العام فقط.
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
  const [busy, setBusy] = useState(false);

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
      toast.error("فشل تسجيل الدخول: تحقق من البريد وكلمة المرور");
      return;
    }
    toast.success("أهلاً بك");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">البريد الإلكتروني</Label>
        <Input
          id="signin-email"
          type="email"
          dir="ltr"
          className="text-left"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@tower.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">كلمة المرور</Label>
        <Input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
        {busy ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
        تسجيل الدخول
      </Button>
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nv = nameSchema.safeParse(name);
    const ev = emailSchema.safeParse(email);
    const pv = passwordSchema.safeParse(password);
    if (!nv.success) return toast.error(nv.error.issues[0].message);
    if (!ev.success) return toast.error(ev.error.issues[0].message);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: ev.data,
      password: pv.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: nv.data },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("تعذّر إنشاء الحساب: " + error.message);
      return;
    }
    toast.success("تم إنشاء الحساب بنجاح");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">الاسم الكامل</Label>
        <Input
          id="signup-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: أحمد علي"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">البريد الإلكتروني</Label>
        <Input
          id="signup-email"
          type="email"
          dir="ltr"
          className="text-left"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@tower.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">كلمة المرور</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
        {busy ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
        إنشاء حساب
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        أوّل حساب يتم تسجيله يصبح المدير العام تلقائياً.
      </p>
    </form>
  );
}
