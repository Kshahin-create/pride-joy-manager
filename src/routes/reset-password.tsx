import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const passwordSchema = z
  .string()
  .min(8, { message: "كلمة المرور يجب ألا تقل عن 8 أحرف" })
  .max(72, { message: "كلمة المرور طويلة جداً" });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pv = passwordSchema.safeParse(pass);
    if (!pv.success) return toast.error(pv.error.issues[0].message);
    if (pass !== confirm) return toast.error("كلمتا المرور غير متطابقتين");

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pv.data });
    setBusy(false);
    if (error) {
      toast.error("تعذّر تحديث كلمة المرور: " + error.message);
      return;
    }
    toast.success("تم تحديث كلمة المرور بنجاح");
    navigate({ to: "/dashboard" });
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
          <h1 className="text-2xl font-bold mb-1">تعيين كلمة مرور جديدة</h1>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl shadow-2xl p-6">
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">جارٍ التحقق من الرابط…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pass">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="new-pass"
                    type={show ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="pe-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pass">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm-pass"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {busy ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
                حفظ كلمة المرور
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
