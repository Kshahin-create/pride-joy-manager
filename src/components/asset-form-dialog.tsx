import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Upload, X, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VendorQuickAddDialog } from "@/components/vendor-quick-add-dialog";
import { AssetSpecsFields } from "@/components/asset-specs-fields";
import { ContractQuickAddDialog } from "@/components/contract-quick-add-dialog";

type ContractKind = "ac" | "elevator" | "fire" | "cleaning" | "supply";
const CONTRACT_TABLES: Record<ContractKind, { table: string; label: string }> = {
  ac:       { table: "ac_contracts",       label: "عقود التكييف" },
  elevator: { table: "elevator_contracts", label: "عقود المصاعد" },
  fire:     { table: "fire_contracts",     label: "عقود أنظمة الحريق" },
  cleaning: { table: "cleaning_contracts", label: "عقود النظافة" },
  supply:   { table: "supply_contracts",   label: "عقود التوريد" },
};
// suggest a default contract kind based on asset type
function suggestContractKind(type: string | null | undefined): ContractKind | null {
  if (!type) return null;
  if (/تكييف/.test(type)) return "ac";
  if (/مصعد/.test(type)) return "elevator";
  if (/حريق|إنذار/.test(type)) return "fire";
  return null;
}

export type LocationType = "مكتب" | "مرفق مشترك" | "البرج";
export type WarrantyStatus = "ساري" | "على وشك الانتهاء" | "منتهي" | "لا يوجد ضمان" | "غير معروف";
export type AssetCurrentStatus = "يعمل" | "يعمل مع ملاحظات" | "يحتاج صيانة" | "تحت الصيانة" | "معطل" | "مستبدل" | "خارج الخدمة";
export type MaintFreq = "شهري" | "كل 3 أشهر" | "كل 6 أشهر" | "سنوي" | "مدة مخصصة";

export const LOCATION_TYPES: LocationType[] = ["مكتب", "مرفق مشترك", "البرج"];
export const WARRANTY_STATUSES: WarrantyStatus[] = ["ساري", "على وشك الانتهاء", "منتهي", "لا يوجد ضمان", "غير معروف"];
export const CURRENT_STATUSES: AssetCurrentStatus[] = ["يعمل", "يعمل مع ملاحظات", "يحتاج صيانة", "تحت الصيانة", "معطل", "مستبدل", "خارج الخدمة"];
export const MAINT_FREQS: MaintFreq[] = ["شهري", "كل 3 أشهر", "كل 6 أشهر", "سنوي", "مدة مخصصة"];

// Map common Arabic asset type names to short codes used in asset_code prefix
const TYPE_PREFIX: Record<string, string> = {
  "تكييف": "AC", "كهرباء": "ELC", "شبكة": "NET", "شبكات": "NET",
  "مصعد": "ELV", "مولد": "GEN", "إطفاء": "FIR", "حريق": "FIR",
  "مراقبة": "CAM", "كاميرا": "CAM", "موقف": "PRK", "مواقف": "PRK",
  "سباكة": "PLB", "أثاث": "FRN",
};
function typeToPrefix(t: string | null | undefined): string {
  if (!t) return "AST";
  const k = t.trim();
  if (TYPE_PREFIX[k]) return TYPE_PREFIX[k];
  // Try first word
  const f = k.split(/\s+/)[0];
  if (TYPE_PREFIX[f]) return TYPE_PREFIX[f];
  // Fallback: take first 3 letters of latin or transliterate "AST"
  const latin = k.match(/[A-Za-z]+/);
  return latin ? latin[0].slice(0, 3).toUpperCase() : "AST";
}

async function generateAssetCode(opts: { typeName?: string | null; officeCode?: string | null }): Promise<string> {
  const prefix = typeToPrefix(opts.typeName);
  const year = new Date().getFullYear();
  const office = (opts.officeCode || "").trim();
  const base = office ? `${prefix}-${office}-${year}-` : `${prefix}-${year}-`;
  // Find next sequence
  const { data } = await (supabase as any)
    .from("assets").select("asset_code").ilike("asset_code", `${base}%`);
  let next = 1;
  ((data ?? []) as { asset_code: string }[]).forEach((r) => {
    const m = r.asset_code.match(/(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= next) next = n + 1;
    }
  });
  return `${base}${String(next).padStart(3, "0")}`;
}

export interface AssetFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  asset?: any | null;            // when editing
  defaultOfficeId?: string | null;
  defaultLocationType?: LocationType | null;
}

interface AssetType { id: string; name: string }
interface OfficeOpt { id: string; code: string; space_id: string | null }
interface Attachment {
  id: string; attachment_name: string | null; file_name: string;
  storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string;
}

export function AssetFormDialog({ open, onClose, onSaved, asset, defaultOfficeId, defaultLocationType }: AssetFormDialogProps) {
  const { activePropertyId } = useActiveProperty();
  const [form, setForm] = useState<any>({});
  const [types, setTypes] = useState<AssetType[]>([]);
  const [offices, setOffices] = useState<OfficeOpt[]>([]);
  const [newType, setNewType] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ f: File; name: string }[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const isEdit = !!asset?.id;
  const [vendors, setVendors] = useState<{ id: string; company_name: string }[]>([]);
  const [contracts, setContracts] = useState<{ id: string; contract_number: string | null; vendor_name: string | null }[]>([]);
  const [vendorQuickOpen, setVendorQuickOpen] = useState(false);

  const loadTypes = useCallback(async () => {
    const { data } = await (supabase as any).from("asset_types").select("id,name").order("name");
    setTypes((data ?? []) as AssetType[]);
  }, []);
  const loadOffices = useCallback(async () => {
    let q = (supabase as any).from("offices").select("id, code, space_id").order("code");
    if (activePropertyId && activePropertyId !== "all") q = q.eq("property_id", activePropertyId);
    const { data } = await q;
    setOffices((data ?? []) as OfficeOpt[]);
  }, [activePropertyId]);
  const loadVendors = useCallback(async () => {
    const { data } = await (supabase as any).from("vendors").select("id,company_name").order("company_name");
    setVendors((data ?? []) as { id: string; company_name: string }[]);
  }, []);

  const loadAttachments = useCallback(async (aid: string) => {
    const { data } = await (supabase as any)
      .from("asset_attachments").select("*").eq("asset_id", aid).order("created_at", { ascending: false });
    setAttachments((data ?? []) as Attachment[]);
  }, []);

  // Load contracts of the currently picked contract kind
  const loadContracts = useCallback(async (kind: ContractKind | null) => {
    if (!kind) { setContracts([]); return; }
    const cfg = CONTRACT_TABLES[kind];
    const cols = (kind === "supply")
      ? "id, contract_number, company_name"
      : "id, contract_number, vendor_name";
    const { data } = await (supabase as any).from(cfg.table).select(cols).order("contract_number", { ascending: false }).limit(100);
    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      contract_number: r.contract_number,
      vendor_name: r.vendor_name ?? r.company_name ?? null,
    }));
    setContracts(rows);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadTypes(); loadOffices(); loadVendors();
    if (isEdit) {
      setForm({ ...asset, specs: asset.specs ?? {} });
      loadAttachments(asset.id);
      if (asset.maintenance_contract_type) loadContracts(asset.maintenance_contract_type as ContractKind);
    } else {
      setForm({
        criticality: "عادي",
        current_status: "يعمل",
        location_type: defaultLocationType ?? (defaultOfficeId ? "مكتب" : null),
        office_id: defaultOfficeId ?? null,
        specs: {},
      });
      setAttachments([]);
      setContracts([]);
    }
    setPendingFiles([]);
  }, [open, asset, isEdit, defaultOfficeId, defaultLocationType, loadTypes, loadOffices, loadVendors, loadAttachments, loadContracts]);

  const officeForCode = useMemo(
    () => offices.find((o) => o.id === form.office_id) ?? null,
    [offices, form.office_id]
  );

  const generateCode = async () => {
    const code = await generateAssetCode({
      typeName: form.asset_type,
      officeCode: officeForCode?.code ?? null,
    });
    setForm((f: any) => ({ ...f, asset_code: code }));
  };

  const addType = async () => {
    const n = newType.trim();
    if (!n) return;
    const { data, error } = await (supabase as any).from("asset_types").insert({ name: n }).select("id,name").single();
    if (error) return toast.error(error.message);
    setTypes((t) => [...t, data].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f: any) => ({ ...f, asset_type: data.name }));
    setNewType("");
  };

  const removeAttachment = async (att: Attachment) => {
    if (!confirm(`حذف المرفق "${att.attachment_name || att.file_name}"؟`)) return;
    await (supabase as any).storage.from("asset-photos").remove([att.storage_path]).catch(() => {});
    const { error } = await (supabase as any).from("asset_attachments").delete().eq("id", att.id);
    if (error) return toast.error(error.message);
    setAttachments((a) => a.filter((x) => x.id !== att.id));
    toast.success("تم حذف المرفق");
  };

  const uploadPendingFor = async (assetId: string) => {
    for (const { f, name } of pendingFiles) {
      const path = `${assetId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${f.name}`;
      const { error: upErr } = await (supabase as any).storage.from("asset-photos").upload(path, f);
      if (upErr) { toast.error(upErr.message); continue; }
      await (supabase as any).from("asset_attachments").insert({
        asset_id: assetId,
        attachment_name: name || null,
        file_name: f.name,
        storage_path: path,
        mime_type: f.type || null,
        size_bytes: f.size,
      });
    }
  };

  const submit = async () => {
    if (!form.asset_name?.trim()) return toast.error("اسم الأصل مطلوب");
    if (!form.asset_type) return toast.error("نوع الأصل مطلوب");
    setBusy(true);
    try {
      // auto-fill missing space_id from office
      const spaceId = form.space_id || officeForCode?.space_id || null;
      const payload: any = {
        asset_name: form.asset_name.trim(),
        asset_type: form.asset_type,
        location_type: form.location_type ?? null,
        office_id: form.location_type === "مكتب" ? (form.office_id ?? null) : null,
        space_id: spaceId,
        location: form.location ?? null,
        manufacturer: form.manufacturer ?? null,
        supplier: form.supplier ?? null,
        serial_number: form.serial_number ?? null,
        capacity: form.capacity ?? null,
        install_date: form.install_date || null,
        warranty_start_date: form.warranty_start_date || null,
        warranty_end_date: form.warranty_end_date || null,
        warranty_status: form.warranty_status ?? null,
        current_status: form.current_status ?? "يعمل",
        expected_lifespan_years: form.expected_lifespan_years ?? null,
        responsible_person: form.responsible_person ?? null,
        maintenance_company: form.maintenance_company ?? null,
        maintenance_company_phone: form.maintenance_company_phone ?? null,
        maintenance_frequency: form.maintenance_frequency ?? null,
        custom_frequency_days: form.maintenance_frequency === "مدة مخصصة" ? (form.custom_frequency_days ?? null) : null,
        last_maintenance_date: form.last_maintenance_date || null,
        next_maintenance_date: form.next_maintenance_date || null,
        criticality: form.criticality ?? "عادي",
        notes: form.notes ?? null,
        supplier_vendor_id: form.supplier_vendor_id ?? null,
        maintenance_contract_type: form.maintenance_contract_type ?? null,
        maintenance_contract_id: form.maintenance_contract_id ?? null,
        specs: form.specs ?? {},
      };
      if (form.asset_code?.trim()) payload.asset_code = form.asset_code.trim();

      let assetId = asset?.id as string | undefined;
      if (isEdit) {
        const { error } = await (supabase as any).from("assets").update(payload).eq("id", assetId);
        if (error) throw error;
      } else {
        if (activePropertyId && activePropertyId !== "all") payload.property_id = activePropertyId;
        // auto-generate code if empty
        if (!payload.asset_code) {
          payload.asset_code = await generateAssetCode({
            typeName: payload.asset_type, officeCode: officeForCode?.code ?? null,
          });
        }
        const { data, error } = await (supabase as any).from("assets").insert(payload).select("id").single();
        if (error) throw error;
        assetId = data.id;
      }

      if (assetId && pendingFiles.length) await uploadPendingFor(assetId);

      toast.success(isEdit ? "تم تحديث الأصل" : "تم إضافة الأصل");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle>{isEdit ? "تعديل الأصل" : "إضافة أصل جديد"}</DialogTitle></DialogHeader>

        {/* Type first */}
        <Section title="نوع الأصل">
          <div className="flex gap-2 items-end">
            <Field label="نوع الأصل *" className="flex-1">
              <Select value={form.asset_type ?? ""} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                <SelectTrigger><SelectValue placeholder="اختر نوع…" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex gap-1">
              <Input placeholder="نوع جديد" value={newType} onChange={(e) => setNewType(e.target.value)} className="w-40" />
              <Button type="button" variant="outline" size="icon" onClick={addType}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </Section>

        {/* Basic */}
        <Section title="البيانات الأساسية">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="اسم الأصل *">
              <Input value={form.asset_name ?? ""} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} />
            </Field>
            <Field label="كود الأصل (تلقائي)">
              <div className="flex gap-2">
                <Input value={form.asset_code ?? ""} onChange={(e) => setForm({ ...form, asset_code: e.target.value })} placeholder="سيتم توليده تلقائياً" />
                <Button type="button" variant="outline" onClick={generateCode}>توليد</Button>
              </div>
            </Field>
            <Field label="الموقع المرتبط">
              <Select value={form.location_type ?? ""} onValueChange={(v) => setForm({ ...form, location_type: v, office_id: v === "مكتب" ? form.office_id : null })}>
                <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t === "مكتب" ? "أصل تابع لمكتب" : t === "مرفق مشترك" ? "أصل تابع لمرفق مشترك" : "أصل تابع للبرج"}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {form.location_type === "مكتب" && (
              <Field label="المكتب">
                <Select value={form.office_id ?? ""} onValueChange={(v) => setForm({ ...form, office_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر مكتب…" /></SelectTrigger>
                  <SelectContent>
                    {offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="موقع نصي (اختياري)">
              <Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="المسؤول">
              <Input value={form.responsible_person ?? ""} onChange={(e) => setForm({ ...form, responsible_person: e.target.value })} />
            </Field>
          </div>
        </Section>

        {/* Technical */}
        <Section title="البيانات الفنية">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="الشركة المصنعة">
              <Input value={form.manufacturer ?? ""} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            </Field>
            <Field label="السعة">
              <Input value={form.capacity ?? ""} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="مثال: 2 طن" />
            </Field>
            <Field label="الرقم التسلسلي">
              <Input value={form.serial_number ?? ""} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
            </Field>
            <Field label="المورد">
              <div className="flex gap-1">
                <Select
                  value={form.supplier_vendor_id ?? ""}
                  onValueChange={(v) => {
                    const ven = vendors.find((x) => x.id === v);
                    setForm({ ...form, supplier_vendor_id: v, supplier: ven?.company_name ?? form.supplier });
                  }}
                >
                  <SelectTrigger className="flex-1"><SelectValue placeholder="اختر مورد…" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" title="إضافة مورد جديد" onClick={() => setVendorQuickOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Field>
            <Field label="العمر الافتراضي (سنوات)">
              <Input type="number" value={form.expected_lifespan_years ?? ""} onChange={(e) => setForm({ ...form, expected_lifespan_years: Number(e.target.value) || null })} />
            </Field>
            <Field label="تاريخ التركيب">
              <Input type="date" value={form.install_date ?? ""} onChange={(e) => setForm({ ...form, install_date: e.target.value })} />
            </Field>
          </div>
        </Section>

        {/* Type-specific tech specs */}
        {form.asset_type && (
          <Section title="مواصفات فنية تفصيلية">
            <AssetSpecsFields
              assetType={form.asset_type}
              value={form.specs ?? {}}
              onChange={(v) => setForm({ ...form, specs: v })}
            />
          </Section>
        )}

        {/* Maintenance company — picked from existing contracts */}
        <Section title="بيانات شركة الصيانة">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="نوع عقد الصيانة">
              <Select
                value={form.maintenance_contract_type ?? ""}
                onValueChange={(v) => {
                  setForm({ ...form, maintenance_contract_type: v, maintenance_contract_id: null, maintenance_company: null });
                  loadContracts(v as ContractKind);
                }}
              >
                <SelectTrigger><SelectValue placeholder={suggestContractKind(form.asset_type) ? `مقترح: ${CONTRACT_TABLES[suggestContractKind(form.asset_type)!].label}` : "اختر نوع العقد…"} /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CONTRACT_TABLES) as [ContractKind, { label: string }][])
                    .map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="العقد / شركة الصيانة">
              <Select
                value={form.maintenance_contract_id ?? ""}
                onValueChange={(v) => {
                  const c = contracts.find((x) => x.id === v);
                  setForm({ ...form, maintenance_contract_id: v, maintenance_company: c?.vendor_name ?? form.maintenance_company });
                }}
                disabled={!form.maintenance_contract_type}
              >
                <SelectTrigger><SelectValue placeholder={form.maintenance_contract_type ? "اختر عقد…" : "اختر نوع العقد أولاً"} /></SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.contract_number ?? "—"}{c.vendor_name ? ` — ${c.vendor_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="اسم شركة الصيانة (يدوي إن لزم)">
              <Input value={form.maintenance_company ?? ""} onChange={(e) => setForm({ ...form, maintenance_company: e.target.value })} />
            </Field>
            <Field label="رقم جوال شركة الصيانة">
              <Input value={form.maintenance_company_phone ?? ""} onChange={(e) => setForm({ ...form, maintenance_company_phone: e.target.value })} />
            </Field>
          </div>
        </Section>

        {/* Warranty */}
        <Section title="بيانات الضمان">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="تاريخ بداية الضمان">
              <Input type="date" value={form.warranty_start_date ?? ""} onChange={(e) => setForm({ ...form, warranty_start_date: e.target.value })} />
            </Field>
            <Field label="تاريخ نهاية الضمان">
              <Input type="date" value={form.warranty_end_date ?? ""} onChange={(e) => setForm({ ...form, warranty_end_date: e.target.value })} />
            </Field>
            <Field label="حالة الضمان">
              <Select value={form.warranty_status ?? ""} onValueChange={(v) => setForm({ ...form, warranty_status: v })}>
                <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
                <SelectContent>
                  {WARRANTY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        {/* Status */}
        <Section title="حالة الأصل">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="الحالة الحالية">
              <Select value={form.current_status ?? "يعمل"} onValueChange={(v) => setForm({ ...form, current_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="التصنيف">
              <Select value={form.criticality ?? "عادي"} onValueChange={(v) => setForm({ ...form, criticality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="عادي">عادي</SelectItem>
                  <SelectItem value="حرج">حرج</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        {/* Periodic maintenance */}
        <Section title="بيانات الصيانة الدورية">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="دورية الصيانة">
              <Select value={form.maintenance_frequency ?? ""} onValueChange={(v) => setForm({ ...form, maintenance_frequency: v })}>
                <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
                <SelectContent>
                  {MAINT_FREQS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {form.maintenance_frequency === "مدة مخصصة" && (
              <Field label="عدد الأيام">
                <Input type="number" value={form.custom_frequency_days ?? ""} onChange={(e) => setForm({ ...form, custom_frequency_days: Number(e.target.value) || null })} />
              </Field>
            )}
            <Field label="تاريخ آخر صيانة">
              <Input type="date" value={form.last_maintenance_date ?? ""} onChange={(e) => setForm({ ...form, last_maintenance_date: e.target.value })} />
            </Field>
            <Field label="تاريخ الصيانة القادمة">
              <Input type="date" value={form.next_maintenance_date ?? ""} onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })} />
            </Field>
          </div>
        </Section>

        {/* Notes */}
        <Section title="ملاحظات">
          <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Section>

        {/* Attachments */}
        <Section title="المرفقات">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap items-end">
              <Field label="اسم المرفق (اختياري)" className="flex-1 min-w-[200px]">
                <Input id="att-name" placeholder="مثال: فاتورة الشراء" />
              </Field>
              <div>
                <Label className="text-xs">الملف</Label>
                <Input type="file" multiple onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  const nameEl = document.getElementById("att-name") as HTMLInputElement | null;
                  const name = nameEl?.value ?? "";
                  setPendingFiles((p) => [...p, ...files.map((f) => ({ f, name }))]);
                  if (nameEl) nameEl.value = "";
                  e.target.value = "";
                }} />
              </div>
            </div>
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((p, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    <Upload className="h-3 w-3" />
                    {p.name ? `${p.name}: ` : ""}{p.f.name}
                    <button type="button" onClick={() => setPendingFiles((x) => x.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {attachments.length > 0 && (
              <div className="border rounded-md divide-y">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="truncate">
                        <div className="font-medium truncate">{a.attachment_name || a.file_name}</div>
                        {a.attachment_name && <div className="text-xs text-muted-foreground truncate">{a.file_name}</div>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAttachment(a)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 ms-1 animate-spin" /> جاري الحفظ…</> : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <VendorQuickAddDialog
      open={vendorQuickOpen}
      onClose={() => setVendorQuickOpen(false)}
      onCreated={(v) => {
        setVendors((arr) => [...arr, v].sort((a, b) => a.company_name.localeCompare(b.company_name)));
        setForm((f: any) => ({ ...f, supplier_vendor_id: v.id, supplier: v.company_name }));
        setVendorQuickOpen(false);
      }}
    />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
