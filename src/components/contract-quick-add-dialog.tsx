import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { VendorQuickAddDialog } from "@/components/vendor-quick-add-dialog";

export type ContractKind = "ac" | "elevator" | "fire" | "cleaning" | "supply";

const KIND_META: Record<ContractKind, { table: string; label: string; vendorNameCol: string | null; activity: string }> = {
  ac:       { table: "ac_contracts",       label: "عقد تكييف",       vendorNameCol: "vendor_name",         activity: "تكييف" },
  elevator: { table: "elevator_contracts", label: "عقد مصاعد",       vendorNameCol: "vendor_name",         activity: "مصاعد" },
  fire:     { table: "fire_contracts",     label: "عقد أنظمة حريق",  vendorNameCol: "company_name",        activity: "أنظمة حريق" },
  cleaning: { table: "cleaning_contracts", label: "عقد نظافة",       vendorNameCol: "vendor_name",         activity: "نظافة" },
  supply:   { table: "supply_contracts",   label: "عقد توريد",       vendorNameCol: "vendor_company_name", activity: "توريد" },
};

export function ContractQuickAddDialog({
  open,
  kind,
  onClose,
  onCreated,
}: {
  open: boolean;
  kind: ContractKind;
  onClose: () => void;
  onCreated: (c: { id: string; contract_number: string | null; vendor_name: string | null }) => void;
}) {
  const { activePropertyId } = useActiveProperty();
  const [busy, setBusy] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; company_name: string }[]>([]);
  const [vendorQuickOpen, setVendorQuickOpen] = useState(false);
  const [f, setF] = useState({
    contract_name: "",
    contract_number: "",
    vendor_id: "",
    start_date: "",
    end_date: "",
  });

  const meta = KIND_META[kind];

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any).from("vendors").select("id,company_name").order("company_name");
      setVendors((data ?? []) as { id: string; company_name: string }[]);
    })();
    setF({ contract_name: "", contract_number: "", vendor_id: "", start_date: "", end_date: "" });
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.contract_name.trim()) return toast.error("اسم العقد مطلوب");
    if (kind === "elevator" && !(activePropertyId && activePropertyId !== "all")) {
      return toast.error("يجب اختيار عقار نشط أولاً");
    }
    setBusy(true);
    const vendor = vendors.find((v) => v.id === f.vendor_id) || null;
    const { data: u } = await supabase.auth.getUser();
    const payload: any = {
      contract_name: f.contract_name.trim(),
      contract_number: f.contract_number.trim() || null,
      vendor_id: f.vendor_id || null,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      status: "ساري",
      created_by: u.user?.id ?? null,
    };
    if (activePropertyId && activePropertyId !== "all") payload.property_id = activePropertyId;
    if (meta.vendorNameCol && vendor) payload[meta.vendorNameCol] = vendor.company_name;

    const { data, error } = await (supabase as any).from(meta.table).insert(payload).select("id, contract_number").single();
    setBusy(false);
    if (error || !data) return toast.error(error?.message || "تعذّر الحفظ");
    toast.success("تم إنشاء العقد");
    onCreated({ id: data.id, contract_number: data.contract_number, vendor_name: vendor?.company_name ?? null });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent dir="rtl" className="max-w-xl">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>إضافة {meta.label} جديد</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="col-span-2 space-y-1.5">
                <Label>اسم العقد *</Label>
                <Input value={f.contract_name} onChange={(e) => setF({ ...f, contract_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>رقم العقد (اختياري)</Label>
                <Input value={f.contract_number} onChange={(e) => setF({ ...f, contract_number: e.target.value })} placeholder="سيُولّد تلقائياً" />
              </div>
              <div className="space-y-1.5">
                <Label>المورد / شركة الصيانة</Label>
                <div className="flex gap-1">
                  <Select value={f.vendor_id} onValueChange={(v) => setF({ ...f, vendor_id: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="اختر مورد…" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setVendorQuickOpen(true)} title="مورد جديد">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ البداية</Label>
                <Input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ النهاية</Label>
                <Input type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}حفظ العقد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <VendorQuickAddDialog
        open={vendorQuickOpen}
        onClose={() => setVendorQuickOpen(false)}
        defaultActivity={meta.activity}
        onCreated={(v) => {
          setVendors((arr) => [...arr, v].sort((a, b) => a.company_name.localeCompare(b.company_name)));
          setF((p) => ({ ...p, vendor_id: v.id }));
          setVendorQuickOpen(false);
        }}
      />
    </>
  );
}
