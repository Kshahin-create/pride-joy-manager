import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Download, Eye, Trash2, FileText, AlertTriangle, Search, Share2, Archive, UploadCloud, X } from "lucide-react";
import JSZip from "jszip";

export const DOC_CATEGORIES = [
  "عقد","هوية","سجل تجاري","فاتورة","سند","عقد مورد","عقد صيانة",
  "مخطط البرج","شهادة دفاع مدني","شهادة مصعد","عقد أمن",
  "شهادة نظام حريق","تقرير صيانة سنوي","أخرى",
] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];
export type DocEntityType = "tenant" | "contract" | "asset" | "vendor" | "building";

export interface DocumentRow {
  id: string;
  title: string;
  category: DocCategory;
  entity_type: DocEntityType;
  entity_id: string | null;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

export function expiryBadge(expiry: string | null) {
  if (!expiry) return null;
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Badge variant="destructive">منتهي</Badge>;
  if (days <= 30) return <Badge className="bg-red-500 text-white">ينتهي خلال {days} يوم</Badge>;
  if (days <= 90) return <Badge className="bg-amber-500 text-white">ينتهي خلال {days} يوم</Badge>;
  return <Badge variant="outline">سارٍ</Badge>;
}

interface Props {
  entityType: DocEntityType;
  entityId?: string | null;
  /** override: hide entity-type filter (always for fixed entity context) */
  fixedEntity?: boolean;
  /** when true, show all entity types instead of filtering */
  scope?: "all" | "tenant-side" | "building-side";
}

export function DocumentsTab({ entityType, entityId = null, fixedEntity = true, scope }: Props) {
  const { hasAnyRole, user } = useAuth();
  const canManage =
    hasAnyRole(["super_admin"]) ||
    (hasAnyRole(["accountant"]) && (entityType === "tenant" || entityType === "contract" || scope === "tenant-side"));

  const [items, setItems] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fCategory, setFCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [form, setForm] = useState<Partial<DocumentRow>>({
    category: "أخرى",
    entity_type: entityType,
  });

  const load = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any).from("documents").select("*").order("created_at", { ascending: false });
    if (fixedEntity) {
      q = q.eq("entity_type", entityType);
      if (entityId) q = q.eq("entity_id", entityId);
      else q = q.is("entity_id", null);
    } else if (scope === "tenant-side") {
      q = q.in("entity_type", ["tenant", "contract"]);
    } else if (scope === "building-side") {
      q = q.in("entity_type", ["building", "asset", "vendor"]);
    }
    if (fCategory !== "all") q = q.eq("category", fCategory);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data ?? []) as DocumentRow[]);
    setLoading(false);
  }, [entityType, entityId, fixedEntity, scope, fCategory]);

  useEffect(() => { void load(); }, [load]);

  const uploadOne = async (file: File) => {
    const path = `${entityType}/${entityId ?? "_root"}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { error } = await (supabase as any).storage.from("documents").upload(path, file);
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!files || files.length === 0) { toast.error("اختر ملفًا واحدًا على الأقل"); return; }
    if (!form.title?.trim()) { toast.error("العنوان مطلوب"); return; }
    try {
      const rows: any[] = [];
      for (const f of Array.from(files)) {
        const path = await uploadOne(f);
        rows.push({
          title: files.length > 1 ? `${form.title} - ${f.name}` : form.title,
          category: form.category ?? "أخرى",
          entity_type: entityType,
          entity_id: entityId,
          file_path: path,
          file_name: f.name,
          mime_type: f.type || null,
          file_size: f.size,
          issue_date: form.issue_date || null,
          expiry_date: form.expiry_date || null,
          notes: form.notes || null,
          uploaded_by: user?.id ?? null,
        });
      }
      const { error } = await (supabase as any).from("documents").insert(rows);
      if (error) throw error;
      toast.success(`تم رفع ${rows.length} مستند`);
      setOpen(false);
      setFiles(null);
      setForm({ category: "أخرى", entity_type: entityType });
      void load();
    } catch (e: any) { toast.error(e.message ?? "فشل الرفع"); }
  };

  const signedUrl = async (path: string) => {
    const { data, error } = await (supabase as any).storage.from("documents").createSignedUrl(path, 3600);
    if (error) { toast.error(error.message); return null; }
    return data?.signedUrl as string | null;
  };

  const view = async (d: DocumentRow) => {
    const url = await signedUrl(d.file_path);
    if (url) window.open(url, "_blank");
  };
  const download = async (d: DocumentRow) => {
    const url = await signedUrl(d.file_path);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = d.file_name ?? d.title; a.click();
  };
  const remove = async (d: DocumentRow) => {
    await (supabase as any).storage.from("documents").remove([d.file_path]);
    const { error } = await (supabase as any).from("documents").delete().eq("id", d.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    void load();
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={fCategory} onValueChange={setFCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="التصنيف" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ms-auto">
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ms-1" /> رفع مستند</Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>رفع مستندات</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>العنوان *</Label>
                    <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>التصنيف</Label>
                    <Select value={form.category ?? "أخرى"} onValueChange={(v) => setForm({ ...form, category: v as DocCategory })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>تاريخ الإصدار</Label>
                      <Input type="date" value={form.issue_date ?? ""} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>تاريخ الانتهاء</Label>
                      <Input type="date" value={form.expiry_date ?? ""} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>ملاحظات</Label>
                    <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <div>
                    <Label>الملفات (يمكن اختيار عدة ملفات)</Label>
                    <Input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={submit}>رفع</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
              {!loading && items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-1 opacity-40" /> لا توجد مستندات بعد
                </TableCell></TableRow>
              )}
              {items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell><Badge variant="secondary">{d.category}</Badge></TableCell>
                  <TableCell>{d.issue_date ?? "—"}</TableCell>
                  <TableCell>{d.expiry_date ?? "—"}</TableCell>
                  <TableCell>{expiryBadge(d.expiry_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => view(d)} title="معاينة"><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => download(d)} title="تحميل"><Download className="h-4 w-4" /></Button>
                      {canManage && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف المستند</AlertDialogTitle>
                              <AlertDialogDescription>سيتم حذف الملف نهائيًا. هل أنت متأكد؟</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(d)}>حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function ExpiringDocsCard() {
  const [items, setItems] = useState<DocumentRow[]>([]);
  useEffect(() => {
    void (async () => {
      const cutoff = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const { data } = await (supabase as any)
        .from("documents")
        .select("*")
        .not("expiry_date", "is", null)
        .lte("expiry_date", cutoff)
        .order("expiry_date", { ascending: true });
      setItems((data ?? []) as DocumentRow[]);
    })();
  }, []);
  if (items.length === 0) return null;
  return (
    <Card className="border-amber-300">
      <CardContent className="p-4 space-y-2" dir="rtl">
        <div className="flex items-center gap-2 font-semibold text-amber-700">
          <AlertTriangle className="h-5 w-5" /> شهادات/مستندات تنتهي قريبًا ({items.length})
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 9).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm border rounded-md p-2 bg-card">
              <div className="min-w-0">
                <div className="font-medium truncate">{d.title}</div>
                <div className="text-xs text-muted-foreground">{d.category}</div>
              </div>
              {expiryBadge(d.expiry_date)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
