import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { DocumentsTab } from "@/components/documents-tab";
import { DeleteArchiveMenu } from "@/components/delete-archive-menu";
import { ArrowRight, Plus, Star, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendors/$id")({
  component: VendorDetailsPage,
});

type Vendor = {
  id: string;
  company_name: string;
  activity: string | null;
  contact_person: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};
type Contract = {
  id: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  contract_value: number;
  notes: string | null;
};
type Evaluation = {
  id: string;
  quality_score: number;
  commitment_score: number;
  speed_score: number;
  evaluation_date: string;
  notes: string | null;
};

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

function VendorDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/vendors/$id" });
  const nav = useNavigate();
  const { hasRole, hasAnyRole } = useAuth();
  const canManage = hasRole("super_admin");
  const canEvaluate = hasAnyRole(["super_admin", "maintenance_supervisor"]);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [cOpen, setCOpen] = useState(false);
  const [eOpen, setEOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [cForm, setCForm] = useState<Partial<Contract>>({});
  const [eForm, setEForm] = useState<Partial<Evaluation>>({
    quality_score: 5,
    commitment_score: 5,
    speed_score: 5,
    evaluation_date: new Date().toISOString().slice(0, 10),
  });

  const saveVendor = async () => {
    if (!form.company_name) return toast.error("اسم الشركة مطلوب");
    const { error } = await (supabase as any).from("vendors").update({
      company_name: form.company_name,
      activity: form.activity ?? null,
      contact_person: form.contact_person ?? null,
      mobile: form.mobile ?? null,
      email: form.email ?? null,
      address: form.address ?? null,
      notes: form.notes ?? null,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث بيانات المورد");
    setEditing(false);
    load();
  };

  const load = async () => {
    const { data: v } = await (supabase as any).from("vendors").select("*").eq("id", id).maybeSingle();
    setVendor(v as Vendor | null);
    const { data: cs } = await (supabase as any).from("vendor_contracts").select("*").eq("vendor_id", id).order("end_date", { ascending: false });
    setContracts((cs ?? []) as Contract[]);
    const { data: es } = await (supabase as any).from("vendor_evaluations").select("*").eq("vendor_id", id).order("evaluation_date", { ascending: false });
    setEvals((es ?? []) as Evaluation[]);
  };
  useEffect(() => { load(); }, [id]);

  const avg = useMemo(() => {
    if (evals.length === 0) return null;
    const q = evals.reduce((s, e) => s + e.quality_score, 0) / evals.length;
    const c = evals.reduce((s, e) => s + e.commitment_score, 0) / evals.length;
    const sp = evals.reduce((s, e) => s + e.speed_score, 0) / evals.length;
    return { quality: q, commitment: c, speed: sp, overall: (q + c + sp) / 3 };
  }, [evals]);

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const saveContract = async () => {
    if (!cForm.contract_number || !cForm.start_date || !cForm.end_date) return toast.error("الحقول المطلوبة ناقصة");
    const { error } = await (supabase as any).from("vendor_contracts").insert({
      vendor_id: id,
      contract_number: cForm.contract_number,
      start_date: cForm.start_date,
      end_date: cForm.end_date,
      contract_value: Number(cForm.contract_value ?? 0),
      notes: cForm.notes ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("تم حفظ العقد");
    setCOpen(false); setCForm({}); load();
  };

  const saveEval = async () => {
    const { error } = await (supabase as any).from("vendor_evaluations").insert({
      vendor_id: id,
      quality_score: eForm.quality_score,
      commitment_score: eForm.commitment_score,
      speed_score: eForm.speed_score,
      evaluation_date: eForm.evaluation_date,
      notes: eForm.notes ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("تم حفظ التقييم");
    setEOpen(false);
    setEForm({ quality_score: 5, commitment_score: 5, speed_score: 5, evaluation_date: new Date().toISOString().slice(0, 10) });
    load();
  };

  if (!vendor) return <div className="p-6 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Link to="/vendors" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
            <ArrowRight className="h-3 w-3" /> العودة للموردين
          </Link>
          <h1 className="text-2xl font-bold mt-1">{vendor.company_name}</h1>
          {vendor.activity && <p className="text-sm text-muted-foreground">{vendor.activity}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {avg && (
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Stars value={avg.overall} />
                <span className="text-sm font-medium">{avg.overall.toFixed(2)} / 5</span>
              </div>
            </Card>
          )}
          <DeleteArchiveMenu
            table="vendors"
            id={vendor.id}
            isArchived={!!(vendor as any).archived_at}
            entityLabel={vendor.company_name}
            onDone={() => nav({ to: "/vendors" })}
            asButtons
          />
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">البيانات</TabsTrigger>
          <TabsTrigger value="contracts">العقود ({contracts.length})</TabsTrigger>
          <TabsTrigger value="evals">التقييمات ({evals.length})</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>بيانات المورد</CardTitle>
              {canManage && !editing && (
                <Button size="sm" variant="outline" onClick={() => { setForm(vendor); setEditing(true); }}>
                  تعديل
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>اسم الشركة *</Label><Input value={form.company_name ?? ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
                  <div><Label>النشاط</Label><Input value={form.activity ?? ""} onChange={(e) => setForm({ ...form, activity: e.target.value })} /></div>
                  <div><Label>مسؤول التواصل</Label><Input value={form.contact_person ?? ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                  <div><Label>الجوال</Label><Input value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
                  <div><Label>البريد</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>العنوان</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>ملاحظات</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                  <div className="sm:col-span-2 flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditing(false)}>إلغاء</Button>
                    <Button onClick={saveVendor}>حفظ التعديلات</Button>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">مسؤول التواصل: </span>{vendor.contact_person ?? "—"}</div>
                  <div><span className="text-muted-foreground">الجوال: </span>{vendor.mobile ?? "—"}</div>
                  <div><span className="text-muted-foreground">البريد: </span>{vendor.email ?? "—"}</div>
                  <div><span className="text-muted-foreground">العنوان: </span>{vendor.address ?? "—"}</div>
                  {vendor.notes && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">ملاحظات: </span>{vendor.notes}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>العقود</CardTitle>
              {canManage && (
                <Dialog open={cOpen} onOpenChange={setCOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 me-1" /> إضافة عقد</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>عقد مورد جديد</DialogTitle></DialogHeader>
                    <div className="grid gap-3">
                      <div><Label>رقم العقد *</Label><Input value={cForm.contract_number ?? ""} onChange={(e) => setCForm({ ...cForm, contract_number: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>تاريخ البدء *</Label><Input type="date" value={cForm.start_date ?? ""} onChange={(e) => setCForm({ ...cForm, start_date: e.target.value })} /></div>
                        <div><Label>تاريخ الانتهاء *</Label><Input type="date" value={cForm.end_date ?? ""} onChange={(e) => setCForm({ ...cForm, end_date: e.target.value })} /></div>
                      </div>
                      <div><Label>قيمة العقد</Label><Input type="number" step="0.01" value={cForm.contract_value ?? ""} onChange={(e) => setCForm({ ...cForm, contract_value: Number(e.target.value) })} /></div>
                      <div><Label>ملاحظات</Label><Textarea value={cForm.notes ?? ""} onChange={(e) => setCForm({ ...cForm, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button onClick={saveContract}>حفظ</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم العقد</TableHead>
                    <TableHead>البدء</TableHead>
                    <TableHead>الانتهاء</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => {
                    const d = daysUntil(c.end_date);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contract_number}</TableCell>
                        <TableCell>{c.start_date}</TableCell>
                        <TableCell>{c.end_date}</TableCell>
                        <TableCell>{Number(c.contract_value).toLocaleString()} ج.م</TableCell>
                        <TableCell>
                          {d < 0 ? (
                            <Badge variant="destructive">منتهي</Badge>
                          ) : d <= 60 ? (
                            <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white">
                              <AlertTriangle className="h-3 w-3 me-1" /> ينتهي خلال {d} يوم
                            </Badge>
                          ) : (
                            <Badge variant="secondary">ساري</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {contracts.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">لا توجد عقود.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evals">
          <div className="space-y-4">
            {avg && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { label: "الجودة", val: avg.quality },
                  { label: "الالتزام", val: avg.commitment },
                  { label: "سرعة التنفيذ", val: avg.speed },
                  { label: "المتوسط العام", val: avg.overall },
                ].map((m) => (
                  <Card key={m.label}>
                    <CardContent className="pt-6">
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Stars value={m.val} />
                        <span className="font-semibold">{m.val.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>سجل التقييمات</CardTitle>
                {canEvaluate && (
                  <Dialog open={eOpen} onOpenChange={setEOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 me-1" /> إضافة تقييم</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>تقييم المورد</DialogTitle></DialogHeader>
                      <div className="grid gap-3">
                        {([
                          ["quality_score", "الجودة"],
                          ["commitment_score", "الالتزام"],
                          ["speed_score", "سرعة التنفيذ"],
                        ] as const).map(([k, label]) => (
                          <div key={k}>
                            <Label>{label} (1-5)</Label>
                            <Input
                              type="number" min={1} max={5}
                              value={(eForm as any)[k] ?? 5}
                              onChange={(e) => setEForm({ ...eForm, [k]: Number(e.target.value) } as any)}
                            />
                          </div>
                        ))}
                        <div><Label>تاريخ التقييم</Label><Input type="date" value={eForm.evaluation_date ?? ""} onChange={(e) => setEForm({ ...eForm, evaluation_date: e.target.value })} /></div>
                        <div><Label>ملاحظات</Label><Textarea value={eForm.notes ?? ""} onChange={(e) => setEForm({ ...eForm, notes: e.target.value })} /></div>
                      </div>
                      <DialogFooter><Button onClick={saveEval}>حفظ</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الجودة</TableHead>
                      <TableHead>الالتزام</TableHead>
                      <TableHead>السرعة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evals.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.evaluation_date}</TableCell>
                        <TableCell><Stars value={e.quality_score} /></TableCell>
                        <TableCell><Stars value={e.commitment_score} /></TableCell>
                        <TableCell><Stars value={e.speed_score} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {evals.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">لا توجد تقييمات.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab entityType="vendor" entityId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
