import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileSignature, AlertTriangle } from "lucide-react";
import { VendorQuickAddDialog } from "@/components/vendor-quick-add-dialog";
import { ArchivedFilterToggle, DeleteArchiveMenu } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/supply-contracts")({
  component: SupplyContractsPage,
});

type Vendor = { id: string; company_name: string };
type Contract = {
  id: string;
  contract_number: string | null;
  contract_name: string;
  status: string;
  vendor_id: string | null;
  vendor_company_name: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_value: number | null;
  supply_categories: string[] | null;
};

const STATUSES = ["مسودة", "ساري", "موقوف", "منتهي", "مجدد", "ملغي"];
const CATEGORIES = [
  "مواد نظافة",
  "مواد كهربائية",
  "مواد سباكة",
  "قطع غيار",
  "معدات",
  "أثاث",
  "أجهزة تقنية",
];
const PAYMENT_METHODS = ["تحويل بنكي", "شيك", "نقداً", "بطاقة"];
const PAYMENT_FREQS = ["دفعة واحدة", "شهري", "ربع سنوي", "نصف سنوي", "سنوي", "حسب التوريد"];

function SupplyContractsPage() {
  const { activePropertyId } = useActiveProperty();
  const [items, setItems] = useState<Contract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    status: "مسودة",
    contract_type: "توريد",
    supply_categories: [] as string[],
    tax_included: true,
    tax_rate: 15,
    payment_frequency: "حسب التوريد",
  });
  const [vendorAddOpen, setVendorAddOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const load = async () => {
    let cq: any = (supabase as any).from("supply_contracts").select("*");
    cq = showArchived ? cq.not("archived_at", "is", null) : cq.is("archived_at", null);
    const { data, error } = await scoped(cq, activePropertyId).order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems(data ?? []);
    const { data: vs } = await (supabase as any)
      .from("vendors")
      .select("id, company_name")
      .order("company_name");
    setVendors(vs ?? []);
  };
  useEffect(() => {
    load();
  }, [activePropertyId, showArchived]);


  const filtered = useMemo(() => {
    let arr = items;
    if (statusF !== "all") arr = arr.filter((c) => c.status === statusF);
    const s = q.trim();
    if (s)
      arr = arr.filter(
        (c) =>
          c.contract_name.includes(s) ||
          (c.contract_number ?? "").includes(s) ||
          (c.vendor_company_name ?? "").includes(s),
      );
    return arr;
  }, [items, q, statusF]);

  const expiringCount = useMemo(() => {
    const in60 = new Date();
    in60.setDate(in60.getDate() + 60);
    return items.filter(
      (c) =>
        c.status === "ساري" &&
        c.end_date &&
        new Date(c.end_date) <= in60 &&
        new Date(c.end_date) >= new Date(),
    ).length;
  }, [items]);

  const toggleCat = (c: string) => {
    const set = new Set<string>(form.supply_categories ?? []);
    set.has(c) ? set.delete(c) : set.add(c);
    setForm({ ...form, supply_categories: Array.from(set) });
  };

  const save = async () => {
    if (!form.contract_name) return toast.error("اسم العقد مطلوب");
    const vendor = vendors.find((v) => v.id === form.vendor_id);
    const payload = {
      ...form,
      vendor_company_name: form.vendor_company_name || vendor?.company_name || null,
      contract_value: form.contract_value ? Number(form.contract_value) : 0,
      duration_months: form.duration_months ? Number(form.duration_months) : null,
      tax_rate: form.tax_rate ? Number(form.tax_rate) : 15,
    };
    const { error } = await (supabase as any).from("supply_contracts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ العقد");
    setOpen(false);
    setForm({
      status: "مسودة",
      contract_type: "توريد",
      supply_categories: [],
      tax_included: true,
      tax_rate: 15,
      payment_frequency: "حسب التوريد",
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-gold" /> عقود الموردين والتوريد
          </h1>
          <p className="text-sm text-muted-foreground">
            إدارة عقود توريد المواد والمعدات والقطع
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-1" /> عقد توريد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>عقد توريد جديد</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <section>
                <h3 className="font-semibold mb-3">البيانات الأساسية</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>اسم العقد *</Label>
                    <Input
                      value={form.contract_name ?? ""}
                      onChange={(e) => setForm({ ...form, contract_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>حالة العقد</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">أطراف العقد</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>الطرف الأول (الإدارة)</Label>
                    <Input
                      value={form.first_party ?? ""}
                      onChange={(e) => setForm({ ...form, first_party: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>المورد</Label>
                    <div className="flex gap-2">
                      <Select
                        value={form.vendor_id ?? ""}
                        onValueChange={(v) => {
                          const ven = vendors.find((x) => x.id === v);
                          setForm({ ...form, vendor_id: v, vendor_company_name: ven?.company_name ?? "" });
                        }}
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="اختر مورد" /></SelectTrigger>
                        <SelectContent>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setVendorAddOpen(true)} title="إضافة مورد جديد">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>السجل التجاري</Label>
                    <Input
                      value={form.vendor_commercial_registration ?? ""}
                      onChange={(e) => setForm({ ...form, vendor_commercial_registration: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>الرقم الضريبي</Label>
                    <Input
                      value={form.vendor_tax_number ?? ""}
                      onChange={(e) => setForm({ ...form, vendor_tax_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>اسم المسؤول</Label>
                    <Input
                      value={form.vendor_contact_person ?? ""}
                      onChange={(e) => setForm({ ...form, vendor_contact_person: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>الجوال</Label>
                    <Input
                      value={form.vendor_mobile ?? ""}
                      onChange={(e) => setForm({ ...form, vendor_mobile: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={form.vendor_email ?? ""}
                      onChange={(e) => setForm({ ...form, vendor_email: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">مدة العقد</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>تاريخ البداية</Label>
                    <Input
                      type="date"
                      value={form.start_date ?? ""}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>تاريخ النهاية</Label>
                    <Input
                      type="date"
                      value={form.end_date ?? ""}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>المدة (شهر)</Label>
                    <Input
                      type="number"
                      value={form.duration_months ?? ""}
                      onChange={(e) => setForm({ ...form, duration_months: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">نوع التوريد</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.supply_categories?.includes(c)}
                        onCheckedChange={() => toggleCat(c)}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">نطاق التوريد</h3>
                <div className="grid gap-3">
                  <div>
                    <Label>الأصناف والكميات التقديرية</Label>
                    <Textarea
                      rows={3}
                      placeholder="مثال: ورق تواليت — 200 لفة شهرياً"
                      value={form.supply_items_text ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          supply_items_text: e.target.value,
                          supply_items: e.target.value
                            .split("\n")
                            .filter(Boolean)
                            .map((line: string) => ({ item: line })),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>جدول التوريد</Label>
                    <Input
                      placeholder="مثال: كل أسبوعين / عند الطلب"
                      value={form.supply_schedule ?? ""}
                      onChange={(e) => setForm({ ...form, supply_schedule: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">البيانات المالية</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>قيمة العقد</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.contract_value ?? ""}
                      onChange={(e) => setForm({ ...form, contract_value: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>طريقة السداد</Label>
                    <Select
                      value={form.payment_method ?? ""}
                      onValueChange={(v) => setForm({ ...form, payment_method: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>تكرار الدفع</Label>
                    <Select
                      value={form.payment_frequency}
                      onValueChange={(v) => setForm({ ...form, payment_frequency: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_FREQS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نسبة الضريبة %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.tax_rate ?? ""}
                      onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.tax_included}
                      onCheckedChange={(v) => setForm({ ...form, tax_included: !!v })}
                    />
                    الضريبة مشمولة
                  </label>
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">التنبيهات</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>عتبات تنبيه قرب الانتهاء (أيام، مفصولة بفواصل)</Label>
                    <Input
                      placeholder="90,30"
                      value={(form.alert_thresholds_days ?? [90, 30]).join(",")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          alert_thresholds_days: e.target.value
                            .split(",")
                            .map((s) => parseInt(s.trim()))
                            .filter((n) => !isNaN(n)),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>تنبيه تأخر التوريد (أيام)</Label>
                    <Input
                      type="number"
                      value={form.delivery_delay_alert_days ?? 7}
                      onChange={(e) =>
                        setForm({ ...form, delivery_delay_alert_days: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </section>

              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={save}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {expiringCount > 0 && (
        <Card className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>
              يوجد <b>{expiringCount}</b> عقد توريد سينتهي خلال 60 يوماً.
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span>قائمة العقود</span>
            <div className="flex gap-2">
              <ArchivedFilterToggle value={showArchived} onChange={setShowArchived} />
              <Select value={statusF} onValueChange={setStatusF}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="بحث..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-56"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead>
                <TableHead>اسم العقد</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الفئات</TableHead>
                <TableHead>البداية</TableHead>
                <TableHead>النهاية</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.contract_number}</TableCell>
                  <TableCell className="font-medium">{c.contract_name}</TableCell>
                  <TableCell>{c.vendor_company_name ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {(c.supply_categories ?? []).slice(0, 2).join("، ")}
                    {(c.supply_categories?.length ?? 0) > 2 ? "…" : ""}
                  </TableCell>
                  <TableCell>{c.start_date ?? "—"}</TableCell>
                  <TableCell>{c.end_date ?? "—"}</TableCell>
                  <TableCell>{c.contract_value ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    لا توجد عقود.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <VendorQuickAddDialog
        open={vendorAddOpen}
        onClose={() => setVendorAddOpen(false)}
        defaultActivity="توريد"
        onCreated={(v) => {
          setVendors((prev) => [...prev, v].sort((a, b) => a.company_name.localeCompare(b.company_name)));
          setForm({ ...form, vendor_id: v.id, vendor_company_name: v.company_name });
          setVendorAddOpen(false);
        }}
      />
    </div>
  );
}
