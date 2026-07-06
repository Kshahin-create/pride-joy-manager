import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeePicker } from "@/components/employee-picker";
import { toast } from "sonner";
import { Trash2, Upload, ImageIcon } from "lucide-react";
import { SafeImage } from "@/components/safe-image";

const BUCKET = "maintenance-photos";
const PRIORITIES = ["منخفضة", "متوسطة", "عالية", "طارئة"] as const;
const TYPES = ["كهرباء", "سباكة", "تكييف", "مصاعد", "أمن", "نظافة", "أخرى"] as const;

type Attachment = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  attachment_kind: string | null;
  created_at: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
  onSaved?: () => void;
}

export function MaintenanceRequestEditDialog({ open, onClose, requestId, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [supEmpId, setSupEmpId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!requestId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("maintenance_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setForm(data);
    setSupEmpId(null);

    const { data: atts } = await (supabase as any)
      .from("maintenance_request_attachments")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    const list = (atts ?? []) as Attachment[];
    setAttachments(list);

    if (list.length > 0) {
      const { data: urls } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(list.map((a) => a.file_path), 3600);
      const map: Record<string, string> = {};
      (urls ?? []).forEach((u: any) => {
        if (u.signedUrl && u.path) map[u.path] = u.signedUrl;
      });
      setSignedUrls(map);
    } else {
      setSignedUrls({});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && requestId) load();
    if (!open) {
      setForm({});
      setAttachments([]);
      setSignedUrls({});
      setUploadFiles([]);
    }
  }, [open, requestId]);

  const save = async () => {
    if (!requestId) return;
    setSaving(true);
    // All fields optional — only send what's set
    const payload: any = {
      location: form.location || null,
      request_type: form.request_type || null,
      description: form.description || null,
      priority: form.priority || "متوسطة",
      assigned_technician: form.assigned_technician || null,
      notes: form.notes || null,
      hold_reason: form.hold_reason || null,
    };
    const { error } = await (supabase as any)
      .from("maintenance_requests")
      .update(payload)
      .eq("id", requestId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم حفظ التعديلات");
    onSaved?.();
    onClose();
  };

  const upload = async () => {
    if (!requestId || uploadFiles.length === 0) return;
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    for (const file of uploadFiles) {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${requestId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || undefined,
      });
      if (upErr) {
        toast.error(upErr.message);
        continue;
      }
      const { error: insErr } = await (supabase as any).from("maintenance_request_attachments").insert({
        request_id: requestId,
        file_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        attachment_kind: file.type.startsWith("image/") ? "photo" : "document",
        uploaded_by: u.user?.id ?? null,
      });
      if (insErr) toast.error(insErr.message);
    }
    setUploadFiles([]);
    setUploading(false);
    toast.success("تم رفع المرفقات");
    load();
  };

  const removeAttachment = async (a: Attachment) => {
    if (!confirm(`حذف "${a.file_name}"؟`)) return;
    const { error: dbErr } = await (supabase as any)
      .from("maintenance_request_attachments")
      .delete()
      .eq("id", a.id);
    if (dbErr) {
      toast.error(dbErr.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([a.file_path]);
    toast.success("تم الحذف");
    load();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بلاغ صيانة {form.request_number ? `— ${form.request_number}` : ""}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>الموقع</Label>
                <Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>النوع</Label>
                <Select value={form.request_type ?? ""} onValueChange={(v) => setForm({ ...form, request_type: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>الأولوية</Label>
                <Select value={form.priority ?? "متوسطة"} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>الفني المسؤول</Label>
                <EmployeePicker
                  value={supEmpId}
                  onChange={(_id, emp) => {
                    setSupEmpId(_id);
                    setForm({ ...form, assigned_technician: emp?.full_name ?? form.assigned_technician });
                  }}
                  defaultDepartment="الصيانة"
                  defaultEmployer="شركة صيانة"
                  placeholder={form.assigned_technician || "اختر فني"}
                />
                {form.assigned_technician && (
                  <p className="text-xs text-muted-foreground">المُعيَّن حاليًا: {form.assigned_technician}</p>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>الوصف</Label>
              <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid gap-1.5">
              <Label>ملاحظات</Label>
              <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="grid gap-1.5">
              <Label>سبب التعليق (اختياري)</Label>
              <Textarea rows={2} value={form.hold_reason ?? ""} onChange={(e) => setForm({ ...form, hold_reason: e.target.value })} />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  المرفقات والصور ({attachments.length})
                </h4>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
                />
                <Button type="button" onClick={upload} disabled={uploading || uploadFiles.length === 0}>
                  <Upload className="ms-1 h-4 w-4" />
                  {uploading ? "جاري الرفع..." : "رفع"}
                </Button>
              </div>

              {attachments.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 border rounded-md text-sm">
                  لا توجد مرفقات
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((a) => {
                    const url = signedUrls[a.file_path];
                    const isImage = (a.mime_type ?? "").startsWith("image/");
                    return (
                      <div key={a.id} className="relative border rounded-md p-2 group">
                        {isImage && url ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            <SafeImage src={url} alt={a.file_name} className="w-full h-32 object-cover rounded" />
                          </a>
                        ) : (
                          <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-32 text-muted-foreground hover:text-foreground">
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-xs mt-1 break-all px-1 text-center">{a.file_name}</span>
                          </a>
                        )}
                        <div className="mt-1 text-[10px] text-muted-foreground truncate">{a.file_name}</div>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 left-1 h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => removeAttachment(a)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                المرفقات خاصة — لا يصل إليها إلا المستخدمون المسجَّلون عبر روابط موقَّعة مؤقتة.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={save} disabled={saving || loading}>حفظ التعديلات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
