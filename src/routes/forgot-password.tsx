import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const emailSchema = z.string().trim().email({ message: "البريد الإلكتروني غير صالح" });

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    if (!ev.success) return toast.error(ev.error.issues[0].message);

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(ev.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error("تعذّر إرسال رابط الاستعادة");
      return;
    }
    setSent(true);
    toast.success("تم إرسال رابط استعادة كلمة المرور");
  };

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
          <h1 className="text-2xl font-bold mb-1">استعادة كلمة المرور</h1>
          <p className="text-primary-foreground/80 text-sm">سنرسل لك رابط إعادة التعيين</p>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm">
                إذا كان البريد <span className="font-semibold" dir="ltr">{email}</span> مسجلاً
                لدينا، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.
              </p>
              <Button
                onClick={() => navigate({ to: "/auth" })}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                العودة لتسجيل الدخول
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                <Input
                  id="reset-email"
                  type="email"
                  dir="ltr"
                  className="text-left"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@tower.com"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {busy ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
                إرسال الرابط
              </Button>
              <Link
                to="/auth"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4" />
                العودة لتسجيل الدخول
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
