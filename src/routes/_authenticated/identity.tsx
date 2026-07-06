import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Building2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/identity")({
  component: IdentityPage,
});

type Identity = {
  id: boolean;
  building_name: string;
  legal_name: string | null;
  owner_name: string | null;
  cr_number: string | null;
  vat_number: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  total_floors: number | null;
  total_offices: number | null;
  notes: string | null;
};

function IdentityPage() {
  const { hasAnyPermission, isSuperAdmin } = useAuth();
  const canEdit = isSuperAdmin || hasAnyPermission(["identity.manage"]);
  const [data, setData] = useState<Identity | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase
        .from("building_identity" as never)
        .select("*")
        .eq("id", true)
        .maybeSingle();
      setData((row as unknown as Identity) ?? null);
    })();
  }, []);

  const set = <K extends keyof Identity>(k: K, v: Identity[K]) =>
    setData((d) => (d ? { ...d, [k]: v } : d));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase
      .from("building_identity" as never)
      .update({
        building_name: data.building_name,
        legal_name: data.legal_name,
        owner_name: data.owner_name,
        cr_number: data.cr_number,
        vat_number: data.vat_number,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        email: data.email,
        website: data.website,
        logo_url: data.logo_url,
        total_floors: data.total_floors,
        total_offices: data.total_offices,
        notes: data.notes,
      } as never)
      .eq("id", true);
    setSaving(false);
    if (error) toast.error("فشل الحفظ: " + error.message);
    else toast.success("تم حفظ هوية البرج");
  };

  if (!data) return <div className="p-6 text-muted-foreground">جاري التحميل…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-gold" /> هوية البرج
        </h1>
        {canEdit && (
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "جاري الحفظ…" : "حفظ"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="اسم البرج" value={data.building_name} onChange={(v) => set("building_name", v)} readOnly={!canEdit} />
          <Field label="الاسم القانوني / الشركة المالكة" value={data.legal_name ?? ""} onChange={(v) => set("legal_name", v)} readOnly={!canEdit} />
          <Field label="اسم المالك" value={data.owner_name ?? ""} onChange={(v) => set("owner_name", v)} readOnly={!canEdit} />
          <Field label="رقم السجل التجاري" value={data.cr_number ?? ""} onChange={(v) => set("cr_number", v)} readOnly={!canEdit} />
          <Field label="الرقم الضريبي (VAT)" value={data.vat_number ?? ""} onChange={(v) => set("vat_number", v)} readOnly={!canEdit} />
          <Field label="رابط الشعار (Logo URL)" value={data.logo_url ?? ""} onChange={(v) => set("logo_url", v)} readOnly={!canEdit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>العنوان والتواصل</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="العنوان" value={data.address ?? ""} onChange={(v) => set("address", v)} readOnly={!canEdit} />
          <Field label="المدينة" value={data.city ?? ""} onChange={(v) => set("city", v)} readOnly={!canEdit} />
          <Field label="الدولة" value={data.country ?? ""} onChange={(v) => set("country", v)} readOnly={!canEdit} />
          <Field label="الهاتف" value={data.phone ?? ""} onChange={(v) => set("phone", v)} readOnly={!canEdit} />
          <Field label="البريد الإلكتروني" value={data.email ?? ""} onChange={(v) => set("email", v)} readOnly={!canEdit} />
          <Field label="الموقع الإلكتروني" value={data.website ?? ""} onChange={(v) => set("website", v)} readOnly={!canEdit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>إحصاءات وملاحظات</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>إجمالي الطوابق</Label>
            <Input type="number" value={data.total_floors ?? ""} onChange={(e) => set("total_floors", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
          </div>
          <div>
            <Label>إجمالي المكاتب</Label>
            <Input type="number" value={data.total_offices ?? ""} onChange={(e) => set("total_offices", e.target.value === "" ? null : Number(e.target.value))} disabled={!canEdit} />
          </div>
          <div className="md:col-span-2">
            <Label>ملاحظات</Label>
            <Textarea value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} disabled={!canEdit} rows={4} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, readOnly }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={readOnly} />
    </div>
  );
}
