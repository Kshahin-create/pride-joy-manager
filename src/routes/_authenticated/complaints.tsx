import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProperty } from "@/lib/active-property-context";
import { scoped } from "@/lib/scoped-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { MessageSquareWarning, Plus, Flame } from "lucide-react";
import { ArchivedFilterToggle, DeleteArchiveMenu } from "@/components/delete-archive-menu";

export const Route = createFileRoute("/_authenticated/complaints")({ component: TicketsPage });

type TType = "شكوى" | "صيانة" | "نظافة" | "أمن" | "استفسار";
type TPriority = "منخفضة" | "متوسطة" | "عالية" | "طارئة";
type TStatus = "جديد" | "جاري المعالجة" | "مغلق";

type Ticket = {
  id: string;
  ticket_number: string;
  company_id: string | null;
  office_id: string | null;
  ticket_type: TType;
  category: string | null;
  priority: TPriority;
  status: TStatus;
  description: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  maintenance_request_id: string | null;
  created_at: string;
  offices?: { code: string } | null;
  companies?: { company_name: string } | null;
};

const TYPES: TType[] = ["شكوى", "صيانة", "نظافة", "أمن", "استفسار"];
const PRIORITIES: TPriority[] = ["منخفضة", "متوسطة", "عالية", "طارئة"];
const STATUSES: TStatus[] = ["جديد", "جاري المعالجة", "مغلق"];

export function priorityBadge(p: TPriority) {
  if (p === "طارئة")
    return (
      <Badge className="bg-red-600 text-white animate-pulse"><Flame className="h-3 w-3 me-1" /> طارئة</Badge>
    );
  if (p === "عالية") return <Badge className="bg-amber-500 text-white">عالية</Badge>;
  if (p === "متوسطة") return <Badge variant="secondary">متوسطة</Badge>;
  return <Badge variant="outline">منخفضة</Badge>;
}
export function statusBadge(s: TStatus) {
  if (s === "جديد") return <Badge className="bg-blue-500 text-white">جديد</Badge>;
  if (s === "جاري المعالجة") return <Badge className="bg-amber-500 text-white">جاري</Badge>;
  return <Badge variant="secondary">مغلق</Badge>;
}

function TicketsPage() {
  const { activePropertyId } = useActiveProperty();
  const { hasAnyPermission, isSuperAdmin } = useAuth();
  const canCreate = isSuperAdmin || hasAnyPermission(["tickets.create"]);

  const [items, setItems] = useState<Ticket[]>([]);
  const [offices, setOffices] = useState<{ id: string; code: string; space_id: string | null }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; company_name: string }[]>([]);
  const [assets, setAssets] = useState<{ id: string; asset_name: string; space_id: string | null; office_id: string | null }[]>([]);

  const [fType, setFType] = useState<string>("all");
  const [fPriority, setFPriority] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fOffice, setFOffice] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Ticket>>({ ticket_type: "شكوى", priority: "متوسطة" });

  const [showArchived, setShowArchived] = useState(false);

  const load = async () => {
    let tq: any = (supabase as any).from("tickets").select("*, offices(code), companies(company_name)");
    tq = showArchived ? tq.not("archived_at", "is", null) : tq.is("archived_at", null);
    const [t, o, c, a] = await Promise.all([
      scoped(tq, activePropertyId).order("created_at", { ascending: false }),
      (supabase as any).from("offices").select("id, code, space_id").order("code"),
      scoped((supabase as any).from("companies").select("id, company_name"), activePropertyId).order("company_name"),
      (supabase as any).from("assets").select("id, asset_name, space_id, office_id").order("asset_name"),
    ]);
    if (t.error) toast.error(t.error.message);
    setItems((t.data ?? []) as Ticket[]);
    setOffices(o.data ?? []);
    setCompanies(c.data ?? []);
    setAssets(a.data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [activePropertyId, showArchived]);


  const officeAssets = useMemo(() => {
    if (!form.office_id) return [];
    const o = offices.find((x) => x.id === form.office_id);
    return assets.filter(
      (x) => x.office_id === form.office_id || (o?.space_id && x.space_id === o.space_id),
    );
  }, [assets, offices, form.office_id]);

  const filtered = useMemo(() => {
    return items
      .filter((t) => (fType === "all" ? true : t.ticket_type === fType))
      .filter((t) => (fPriority === "all" ? true : t.priority === fPriority))
      .filter((t) => (fStatus === "all" ? true : t.status === fStatus))
      .filter((t) => (fOffice === "all" ? true : t.office_id === fOffice))
      .sort((a, b) => {
        // urgent first
        if (a.priority === "طارئة" && b.priority !== "طارئة") return -1;
        if (b.priority === "طارئة" && a.priority !== "طارئة") return 1;
        return 0;
      });
  }, [items, fType, fPriority, fStatus, fOffice]);

  const counts = useMemo(() => ({
    new: items.filter((t) => t.status === "جديد").length,
    inProgress: items.filter((t) => t.status === "جاري المعالجة").length,
    closed: items.filter((t) => t.status === "مغلق").length,
    urgent: items.filter((t) => t.priority === "طارئة" && t.status !== "مغلق").length,
  }), [items]);

  const create = async () => {
    if (!form.description) return toast.error("الوصف مطلوب");
    const { error } = await (supabase as any).from("tickets").insert({
      ticket_type: form.ticket_type,
      priority: form.priority,
      status: "جديد",
      description: form.description,
      category: form.category ?? null,
      company_id: form.company_id ?? null,
      office_id: form.office_id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء التذكرة");
    setOpen(false); setForm({ ticket_type: "شكوى", priority: "متوسطة" }); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquareWarning className="h-6 w-6 text-gold" /> الشكاوى والطلبات
          </h1>
          <p className="text-sm text-muted-foreground">إدارة تذاكر العملاء والطلبات الداخلية</p>
        </div>
        <div className="flex items-center gap-2">
        <ArchivedFilterToggle value={showArchived} onChange={setShowArchived} />
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-1" /> تذكرة جديدة</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>تذكرة جديدة</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>النوع</Label>
                    <Select value={form.ticket_type} onValueChange={(v) => setForm({ ...form, ticket_type: v as TType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الأولوية</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>المكتب</Label>
                    <Select
                      value={form.office_id ?? "__none__"}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          office_id: v === "__none__" ? null : v,
                          category: null,
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">بدون</SelectItem>
                        {offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المستأجر</Label>
                    <Select value={form.company_id ?? "__none__"} onValueChange={(v) => setForm({ ...form, company_id: v === "__none__" ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">بدون</SelectItem>
                        {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>التصنيف (الأصل المرتبط بالمكتب)</Label>
                  <Select
                    value={form.category ?? "__none__"}
                    onValueChange={(v) => setForm({ ...form, category: v === "__none__" ? null : v })}
                    disabled={!form.office_id}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={form.office_id ? "اختر الأصل" : "اختر المكتب أولاً"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">بدون</SelectItem>
                      {form.office_id && officeAssets.length === 0 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground">
                          لا توجد أصول مرتبطة بالمكتب المختار
                        </div>
                      )}
                      {officeAssets.map((a) => <SelectItem key={a.id} value={a.asset_name}>{a.asset_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>الوصف *</Label><Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={create}>حفظ</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">جديد</div><div className="text-2xl font-bold mt-1">{counts.new}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">جاري المعالجة</div><div className="text-2xl font-bold mt-1">{counts.inProgress}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">مغلق</div><div className="text-2xl font-bold mt-1">{counts.closed}</div></CardContent></Card>
        <Card className={counts.urgent > 0 ? "border-red-500/60 bg-red-500/5" : ""}>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3 text-red-500" /> طارئ مفتوح</div>
            <div className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{counts.urgent}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة التذاكر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <Select value={fType} onValueChange={setFType}>
              <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fPriority} onValueChange={setFPriority}>
              <SelectTrigger><SelectValue placeholder="الأولوية" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأولويات</SelectItem>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={fOffice} onValueChange={setFOffice}>
              <SelectTrigger><SelectValue placeholder="المكتب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المكاتب</SelectItem>
                {offices.map((o) => <SelectItem key={o.id} value={o.id}>{o.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>المكتب</TableHead>
                <TableHead>المستأجر</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className={t.priority === "طارئة" && t.status !== "مغلق" ? "bg-red-500/5" : ""}>
                  <TableCell className="font-medium">{t.ticket_number}</TableCell>
                  <TableCell>{t.ticket_type}</TableCell>
                  <TableCell>{priorityBadge(t.priority)}</TableCell>
                  <TableCell>{t.offices?.code ?? "—"}</TableCell>
                  <TableCell>{t.companies?.company_name ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{t.description}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Link to="/complaints/$id" params={{ id: t.id }}>
                        <Button size="sm" variant="outline">تفاصيل</Button>
                      </Link>
                      <DeleteArchiveMenu table="tickets" id={t.id} entityLabel={t.ticket_number} onDone={load} compact />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد تذاكر.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
