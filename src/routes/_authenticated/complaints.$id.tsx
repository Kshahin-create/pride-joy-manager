import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ArrowRight, Wrench } from "lucide-react";
import { priorityBadge, statusBadge } from "./complaints";

export const Route = createFileRoute("/_authenticated/complaints/$id")({ component: TicketDetail });

type TStatus = "جديد" | "جاري المعالجة" | "مغلق";
const STATUSES: TStatus[] = ["جديد", "جاري المعالجة", "مغلق"];

function TicketDetail() {
  const { id } = useParams({ from: "/_authenticated/complaints/$id" });
  const { hasRole } = useAuth();
  const [t, setT] = useState<any>(null);
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [status, setStatus] = useState<TStatus>("جديد");
  const [assigned, setAssigned] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("tickets")
      .select("*, offices(id, code), companies(company_name), maintenance_requests(id, request_number)")
      .eq("id", id)
      .maybeSingle();
    setT(data);
    if (data) {
      setStatus(data.status);
      setAssigned(data.assigned_to);
      setNotes(data.resolution_notes ?? "");
    }
    const { data: p } = await (supabase as any).from("profiles").select("id, full_name");
    setUsers(p ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    if (status === "مغلق" && !notes.trim()) return toast.error("اكتب ملاحظات الحل عند الإغلاق");
    setBusy(true);
    const { error } = await (supabase as any)
      .from("tickets")
      .update({ status, assigned_to: assigned, resolution_notes: notes || null })
      .eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); load();
  };

  const convertToMaintenance = async () => {
    if (!t) return;
    setBusy(true);
    try {
      const { data: mr, error: mErr } = await (supabase as any).from("maintenance_requests").insert({
        request_type: t.ticket_type === "صيانة" ? "صيانة" : t.ticket_type,
        priority: t.priority === "طارئة" ? "عاجل" : "عادي",
        description: `[تذكرة ${t.ticket_number}] ${t.description}`,
        status: "جديد",
        reported_by: t.created_by,
      }).select("id, request_number").single();
      if (mErr) throw mErr;
      const { error: uErr } = await (supabase as any)
        .from("tickets")
        .update({ maintenance_request_id: mr.id, status: "جاري المعالجة" })
        .eq("id", id);
      if (uErr) throw uErr;
      toast.success(`تم إنشاء طلب الصيانة ${mr.request_number}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  if (!t) return <div className="p-6 text-muted-foreground">جاري التحميل...</div>;

  const canEdit =
    hasRole("super_admin") ||
    hasRole("receptionist") ||
    (hasRole("security_supervisor") && t.ticket_type === "أمن") ||
    (hasRole("maintenance_supervisor") && (t.ticket_type === "صيانة" || t.ticket_type === "نظافة"));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link to="/complaints" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="h-3 w-3" /> العودة للتذاكر
        </Link>
        <h1 className="text-2xl font-bold mt-1">{t.ticket_number}</h1>
        <div className="flex items-center gap-2 mt-2">
          {priorityBadge(t.priority)} {statusBadge(t.status)}
          <span className="text-sm text-muted-foreground">— {t.ticket_type}{t.category ? ` / ${t.category}` : ""}</span>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>البيانات</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">المكتب: </span>{t.offices?.code ?? "—"}</div>
          <div><span className="text-muted-foreground">المستأجر: </span>{t.companies?.company_name ?? "—"}</div>
          <div><span className="text-muted-foreground">تاريخ الإنشاء: </span>{new Date(t.created_at).toLocaleString("ar-EG")}</div>
          <div>
            <span className="text-muted-foreground">طلب صيانة مرتبط: </span>
            {t.maintenance_requests ? t.maintenance_requests.request_number : "—"}
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">الوصف: </span>
            <div className="mt-1 whitespace-pre-wrap">{t.description}</div>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader><CardTitle>المعالجة</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>الحالة</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>المسؤول</Label>
                <Select value={assigned ?? "__none__"} onValueChange={(v) => setAssigned(v === "__none__" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون</SelectItem>
                    {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name ?? u.id.slice(0, 8)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>ملاحظات الحل {status === "مغلق" && <span className="text-destructive">*</span>}</Label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={busy}>حفظ</Button>
              {t.ticket_type === "صيانة" && !t.maintenance_request_id && (
                <Button variant="outline" onClick={convertToMaintenance} disabled={busy}>
                  <Wrench className="h-4 w-4 me-1" /> تحويل إلى طلب صيانة
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
