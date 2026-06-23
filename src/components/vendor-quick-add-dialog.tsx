import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function VendorQuickAddDialog({
  open,
  onClose,
  onCreated,
  defaultName = "",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (vendor: { id: string; company_name: string }) => void;
  defaultName?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    company_name: defaultName,
    contact_name: "",
    phone: "",
    email: "",
    commercial_register: "",
    tax_number: "",
    service_type: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.company_name.trim()) return toast.error("اسم الشركة مطلوب");
    setBusy(true);
    const { data, error } = await (supabase as any)
      .from("vendors")
      .insert({
        company_name: f.company_name.trim(),
        contact_name: f.contact_name.trim() || null,
        phone: f.phone.trim() || null,
        email: f.email.trim() || null,
        commercial_register: f.commercial_register.trim() || null,
        tax_number: f.tax_number.trim() || null,
        service_type: f.service_type.trim() || null,
      })
      .select("id, company_name")
      .single();
    setBusy(false);
    if (error || !data) return toast.error("تعذّر الحفظ");
    toast.success("تم إضافة المورد");
    onCreated({ id: data.id, company_name: data.company_name });
    setF({ company_name: "", contact_name: "", phone: "", email: "", commercial_register: "", tax_number: "", service_type: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>إضافة مورد جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>اسم الشركة *</Label>
              <Input value={f.company_name} onChange={(e) => setF({ ...f, company_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>اسم المسؤول</Label>
              <Input value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الجوال</Label>
              <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>نوع الخدمة</Label>
              <Input value={f.service_type} onChange={(e) => setF({ ...f, service_type: e.target.value })} placeholder="تكييف، نظافة، مصاعد..." />
            </div>
            <div className="space-y-1.5">
              <Label>السجل التجاري</Label>
              <Input value={f.commercial_register} onChange={(e) => setF({ ...f, commercial_register: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الرقم الضريبي</Label>
              <Input value={f.tax_number} onChange={(e) => setF({ ...f, tax_number: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit" disabled={busy} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
