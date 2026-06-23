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
  defaultActivity = "",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (vendor: { id: string; company_name: string }) => void;
  defaultActivity?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    company_name: "",
    activity: defaultActivity,
    contact_person: "",
    mobile: "",
    email: "",
    address: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.company_name.trim()) return toast.error("اسم الشركة مطلوب");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await (supabase as any)
      .from("vendors")
      .insert({
        company_name: f.company_name.trim(),
        activity: f.activity.trim() || null,
        contact_person: f.contact_person.trim() || null,
        mobile: f.mobile.trim() || null,
        email: f.email.trim() || null,
        address: f.address.trim() || null,
        created_by: u.user?.id ?? null,
      })
      .select("id, company_name")
      .single();
    setBusy(false);
    if (error || !data) return toast.error("تعذّر الحفظ");
    toast.success("تم إضافة المورد");
    onCreated({ id: data.id, company_name: data.company_name });
    setF({ company_name: "", activity: defaultActivity, contact_person: "", mobile: "", email: "", address: "" });
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
              <Label>النشاط</Label>
              <Input value={f.activity} onChange={(e) => setF({ ...f, activity: e.target.value })} placeholder="تكييف، نظافة، مصاعد..." />
            </div>
            <div className="space-y-1.5">
              <Label>اسم المسؤول</Label>
              <Input value={f.contact_person} onChange={(e) => setF({ ...f, contact_person: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الجوال</Label>
              <Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>العنوان</Label>
              <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
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
