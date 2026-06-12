import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Copy, Unlink, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/telegram")({
  component: TelegramPage,
});

const BOT_USERNAME = "PrideJoyManagerBot"; // عرضي فقط — يُستبدل بالـ username الحقيقي بعد الإعداد

function TelegramPage() {
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("telegram_subscribers" as never)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSub(data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user?.id]);

  const generate = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("create_telegram_link_code" as never);
    setGenerating(false);
    if (error) { toast.error(error.message); return; }
    setCode(data as unknown as string);
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("تم النسخ"); };

  const toggle = async (enabled: boolean) => {
    if (!sub) return;
    await supabase.from("telegram_subscribers" as never).update({ enabled } as never).eq("id", sub.id);
    void load();
  };

  const unlink = async () => {
    if (!sub) return;
    if (!confirm("فك الربط مع تيليجرام؟")) return;
    await supabase.from("telegram_subscribers" as never).delete().eq("id", sub.id);
    setCode(null);
    void load();
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Send className="h-6 w-6 text-gold" /> بوت تيليجرام</h1>
        <p className="text-sm text-muted-foreground">استقبل إشعارات البرج والتقارير اليومية على تيليجرام حسب دورك.</p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">جاري التحميل…</div>
      ) : sub ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>الحساب مرتبط</span>
              <Badge variant="secondary">نشط</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">اسم تيليجرام</div>
              <div>{sub.tg_first_name ?? "—"} {sub.tg_username ? `(@${sub.tg_username})` : ""}</div>
              <div className="text-muted-foreground">Chat ID</div>
              <div className="font-mono">{sub.chat_id}</div>
              <div className="text-muted-foreground">تاريخ الربط</div>
              <div>{new Date(sub.linked_at).toLocaleString("ar-SA")}</div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <Label htmlFor="enabled" className="cursor-pointer">تفعيل الإشعارات</Label>
              <Switch id="enabled" checked={sub.enabled} onCheckedChange={toggle} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> تحديث</Button>
              <Button variant="destructive" onClick={unlink} className="gap-2"><Unlink className="h-4 w-4" /> فك الربط</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>اربط حسابك بتيليجرام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="text-sm space-y-2 list-decimal pr-5">
              <li>اضغط زر "إنشاء كود ربط" أدناه.</li>
              <li>افتح البوت على تيليجرام: <a className="text-gold underline" href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer">@{BOT_USERNAME}</a></li>
              <li>أرسل الأمر: <code className="bg-muted px-1 py-0.5 rounded">/start &lt;الكود&gt;</code></li>
              <li>سيؤكد البوت ربط حسابك وتبدأ الإشعارات وفق دورك.</li>
            </ol>

            {code ? (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="text-xs text-muted-foreground">الكود (صالح 15 دقيقة):</div>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-bold tracking-widest font-mono">{code}</code>
                  <Button size="sm" variant="outline" onClick={() => copy(code)} className="gap-1"><Copy className="h-3 w-3" /> نسخ</Button>
                </div>
                <div className="text-xs text-muted-foreground">أو انسخ الأمر مباشرة:</div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-background border px-2 py-1 rounded flex-1">/start {code}</code>
                  <Button size="sm" variant="outline" onClick={() => copy(`/start ${code}`)} className="gap-1"><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
            ) : null}

            <Button onClick={generate} disabled={generating} className="gap-2">
              <Send className="h-4 w-4" /> {generating ? "..." : "إنشاء كود ربط"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>أوامر البوت</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1 font-mono">
          <div><b>/start CODE</b> — ربط الحساب</div>
          <div><b>/me</b> — حالة اشتراكك ودورك</div>
          <div><b>/today</b> — تقرير اليوم (للإدارة والمالية)</div>
          <div><b>/mute</b> — إيقاف الإشعارات</div>
          <div><b>/unmute</b> — تشغيل الإشعارات</div>
          <div><b>/stop</b> — فك الربط</div>
          <div><b>/help</b> — قائمة الأوامر</div>
        </CardContent>
      </Card>
    </div>
  );
}
