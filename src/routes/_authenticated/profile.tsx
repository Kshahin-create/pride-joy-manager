import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, User as UserIcon, Lock, Mail, Shield, LogOut, Camera } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const nameSchema = z.string().trim().min(2, "الاسم قصير جداً").max(100);
const phoneSchema = z
  .string()
  .trim()
  .max(20, "رقم الجوال طويل جداً")
  .regex(/^[0-9+\-\s()]*$/, "رقم الجوال غير صالح")
  .optional()
  .or(z.literal(""));
const passwordSchema = z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(72);

function ProfilePage() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
        setAvatarUrl(data?.avatar_url ?? null);
        setLoading(false);
      });
  }, [user]);

  const initials = (fullName || user?.email || "؟").trim().slice(0, 2).toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const nv = nameSchema.safeParse(fullName);
    if (!nv.success) return toast.error(nv.error.issues[0].message);
    const pv = phoneSchema.safeParse(phone);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: nv.data, phone: phone || null })
      .eq("id", user!.id);
    setSavingProfile(false);
    if (error) return toast.error("تعذّر حفظ البيانات");
    toast.success("تم حفظ البيانات");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pv = passwordSchema.safeParse(newPass);
    if (!pv.success) return toast.error(pv.error.issues[0].message);
    if (newPass !== confirmPass) return toast.error("كلمتا المرور غير متطابقتين");

    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: pv.data });
    setSavingPass(false);
    if (error) return toast.error("تعذّر تحديث كلمة المرور");
    setNewPass("");
    setConfirmPass("");
    toast.success("تم تحديث كلمة المرور");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("الحد الأقصى للصورة 2 ميجا");

    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("تعذّر رفع الصورة");
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setUploading(false);
    if (error) return toast.error("تم الرفع لكن لم يتم حفظ الرابط");
    setAvatarUrl(url);
    toast.success("تم تحديث الصورة");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="ms-2 h-4 w-4 animate-spin" />
        جارٍ التحميل…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ملفي الشخصي</h1>
          <p className="text-sm text-muted-foreground">إدارة بيانات حسابك وتفضيلاتك</p>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="text-destructive">
          <LogOut className="ms-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-gold" />
            البيانات الشخصية
          </CardTitle>
          <CardDescription>اسمك وصورتك ومعلومات التواصل</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-gold/30">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-2 cursor-pointer rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                تغيير الصورة
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground mt-2">JPG أو PNG، الحد الأقصى 2 ميجا</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">الاسم الكامل</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  className="text-left"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 5XX XXX XXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </Label>
              <Input id="email" value={user?.email ?? ""} dir="ltr" className="text-left" disabled />
              <p className="text-xs text-muted-foreground">
                لتغيير البريد الإلكتروني تواصل مع المدير العام
              </p>
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {savingProfile ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
              حفظ التغييرات
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold" />
            الأدوار والصلاحيات
          </CardTitle>
          <CardDescription>الأدوار الممنوحة لحسابك في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">لم يتم تعيين أي دور لحسابك بعد</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="text-xs px-3 py-1">
                  {ROLE_LABELS[r]}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription>اختر كلمة مرور قوية لا تقل عن 8 أحرف</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={savingPass}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {savingPass ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
              تحديث كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
