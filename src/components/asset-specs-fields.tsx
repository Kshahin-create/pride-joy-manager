import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/**
 * Renders type-specific technical fields for an asset.
 * All values are persisted into the `specs` JSONB column.
 */

type SpecsValue = Record<string, any>;

export function AssetSpecsFields({
  assetType,
  value,
  onChange,
}: {
  assetType: string | null | undefined;
  value: SpecsValue;
  onChange: (next: SpecsValue) => void;
}) {
  if (!assetType) return null;
  const t = assetType.trim();
  const set = (k: string, v: any) => onChange({ ...(value || {}), [k]: v });

  // AC / تكييف
  if (/تكييف/.test(t)) {
    return (
      <Grid>
        <Field label="نوع الوحدة">
          <Select value={value?.unit_type ?? ""} onValueChange={(v) => set("unit_type", v)}>
            <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
            <SelectContent>
              {["سبليت", "كاسيت", "شباك", "مركزي", "VRF", "Chiller", "أخرى"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="الموديل"><Input value={value?.model ?? ""} onChange={(e) => set("model", e.target.value)} /></Field>
        <Field label="نوع السعة">
          <Select value={value?.capacity_unit ?? ""} onValueChange={(v) => set("capacity_unit", v)}>
            <SelectTrigger><SelectValue placeholder="BTU / طن" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BTU">BTU</SelectItem>
              <SelectItem value="طن">طن</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Grid>
    );
  }

  // Electricity meter / عداد كهرباء
  if (/كهرباء|عداد/.test(t)) {
    return (
      <Grid>
        <Field label="رقم العداد"><Input value={value?.meter_number ?? ""} onChange={(e) => set("meter_number", e.target.value)} /></Field>
        <Field label="رقم حساب الكهرباء"><Input value={value?.account_number ?? ""} onChange={(e) => set("account_number", e.target.value)} /></Field>
        <Field label="النوع">
          <Select value={value?.meter_type ?? ""} onValueChange={(v) => set("meter_type", v)}>
            <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="مستقل">مستقل</SelectItem>
              <SelectItem value="مشترك">مشترك</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Grid>
    );
  }

  // Water tank / خزان
  if (/خزان/.test(t)) {
    return (
      <Grid>
        <Field label="نوع الخزان">
          <Select value={value?.tank_type ?? ""} onValueChange={(v) => set("tank_type", v)}>
            <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
            <SelectContent>
              {["علوي", "أرضي", "تحت الأرض", "آخر"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="مادة التصنيع"><Input value={value?.material ?? ""} onChange={(e) => set("material", e.target.value)} /></Field>
        <Field label="رقم الخزان"><Input value={value?.tank_number ?? ""} onChange={(e) => set("tank_number", e.target.value)} /></Field>
        <Field label="عدد المداخل"><Input type="number" value={value?.inlets ?? ""} onChange={(e) => set("inlets", Number(e.target.value) || null)} /></Field>
        <Field label="عدد المخارج"><Input type="number" value={value?.outlets ?? ""} onChange={(e) => set("outlets", Number(e.target.value) || null)} /></Field>
        <Field label="المضخة المرتبطة"><Input value={value?.linked_pump ?? ""} onChange={(e) => set("linked_pump", e.target.value)} placeholder="اختياري" /></Field>
        <div className="flex items-center gap-2 mt-6">
          <Switch checked={!!value?.has_pump} onCheckedChange={(v) => set("has_pump", v)} />
          <Label className="text-xs">مرتبط بمضخة</Label>
        </div>
      </Grid>
    );
  }

  // Elevator / مصعد
  if (/مصعد/.test(t)) {
    return (
      <Grid>
        <Field label="رقم المصعد"><Input value={value?.elevator_number ?? ""} onChange={(e) => set("elevator_number", e.target.value)} /></Field>
        <Field label="نوع المصعد">
          <Select value={value?.elevator_type ?? ""} onValueChange={(v) => set("elevator_type", v)}>
            <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ركاب">ركاب</SelectItem>
              <SelectItem value="خدمات">خدمات</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="الموديل"><Input value={value?.model ?? ""} onChange={(e) => set("model", e.target.value)} /></Field>
        <Field label="الحمولة (كجم)"><Input value={value?.load_kg ?? ""} onChange={(e) => set("load_kg", e.target.value)} /></Field>
        <Field label="عدد الأشخاص"><Input type="number" value={value?.persons ?? ""} onChange={(e) => set("persons", Number(e.target.value) || null)} /></Field>
        <Field label="عدد الطوابق المخدومة"><Input type="number" value={value?.floors_served ?? ""} onChange={(e) => set("floors_served", Number(e.target.value) || null)} /></Field>
        <Field label="تاريخ بدء التشغيل"><Input type="date" value={value?.commissioning_date ?? ""} onChange={(e) => set("commissioning_date", e.target.value)} /></Field>
        <Field label="رقم شهادة السلامة"><Input value={value?.safety_certificate ?? ""} onChange={(e) => set("safety_certificate", e.target.value)} /></Field>
      </Grid>
    );
  }

  // Water pump / مضخة
  if (/مضخة/.test(t)) {
    return (
      <Grid>
        <Field label="رقم المضخة"><Input value={value?.pump_number ?? ""} onChange={(e) => set("pump_number", e.target.value)} /></Field>
        <Field label="نوع المضخة">
          <Select value={value?.pump_type ?? ""} onValueChange={(v) => set("pump_type", v)}>
            <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
            <SelectContent>
              {["تغذية", "تقوية", "حريق", "تصريف", "أخرى"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="الموديل"><Input value={value?.model ?? ""} onChange={(e) => set("model", e.target.value)} /></Field>
        <Field label="القدرة"><Input value={value?.power ?? ""} onChange={(e) => set("power", e.target.value)} placeholder="مثال: 3HP" /></Field>
        <Field label="معدل التدفق"><Input value={value?.flow_rate ?? ""} onChange={(e) => set("flow_rate", e.target.value)} placeholder="L/min" /></Field>
        <Field label="الضغط التشغيلي"><Input value={value?.pressure ?? ""} onChange={(e) => set("pressure", e.target.value)} placeholder="bar" /></Field>
        <Field label="الخزان المرتبط"><Input value={value?.linked_tank ?? ""} onChange={(e) => set("linked_tank", e.target.value)} /></Field>
        <Field label="تاريخ بدء التشغيل"><Input type="date" value={value?.commissioning_date ?? ""} onChange={(e) => set("commissioning_date", e.target.value)} /></Field>
      </Grid>
    );
  }

  // Fire alarm / إنذار حريق
  if (/إنذار|حريق/.test(t)) {
    return (
      <Grid>
        <Field label="رقم النظام"><Input value={value?.system_number ?? ""} onChange={(e) => set("system_number", e.target.value)} /></Field>
        <Field label="نوع النظام">
          <Select value={value?.system_type ?? ""} onValueChange={(v) => set("system_type", v)}>
            <SelectTrigger><SelectValue placeholder="اختر…" /></SelectTrigger>
            <SelectContent>
              {["تقليدي", "معنون", "لاسلكي", "آخر"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="الموديل"><Input value={value?.model ?? ""} onChange={(e) => set("model", e.target.value)} /></Field>
        <Field label="عدد اللوحات"><Input type="number" value={value?.panels ?? ""} onChange={(e) => set("panels", Number(e.target.value) || null)} /></Field>
        <Field label="عدد الكواشف"><Input type="number" value={value?.detectors ?? ""} onChange={(e) => set("detectors", Number(e.target.value) || null)} /></Field>
        <Field label="عدد نقاط الإنذار اليدوية"><Input type="number" value={value?.manual_points ?? ""} onChange={(e) => set("manual_points", Number(e.target.value) || null)} /></Field>
        <Field label="عدد الأجراس"><Input type="number" value={value?.bells ?? ""} onChange={(e) => set("bells", Number(e.target.value) || null)} /></Field>
        <Field label="عدد الفلاشات"><Input type="number" value={value?.flashers ?? ""} onChange={(e) => set("flashers", Number(e.target.value) || null)} /></Field>
        <Field label="المناطق المغطاة"><Input value={value?.zones ?? ""} onChange={(e) => set("zones", e.target.value)} /></Field>
        <Field label="موقع لوحة التحكم"><Input value={value?.control_panel_location ?? ""} onChange={(e) => set("control_panel_location", e.target.value)} /></Field>
        <div className="flex items-center gap-4 col-span-full">
          <div className="flex items-center gap-2">
            <Switch checked={!!value?.linked_to_cctv} onCheckedChange={(v) => set("linked_to_cctv", v)} />
            <Label className="text-xs">مرتبط بغرفة المراقبة</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!value?.linked_to_suppression} onCheckedChange={(v) => set("linked_to_suppression", v)} />
            <Label className="text-xs">مرتبط بنظام الإطفاء</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!value?.linked_to_civil_defense} onCheckedChange={(v) => set("linked_to_civil_defense", v)} />
            <Label className="text-xs">مرتبط بالدفاع المدني</Label>
          </div>
        </div>
      </Grid>
    );
  }

  return null;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
