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
import { Plus, Download, Eye, Trash2, FileText, AlertTriangle, Search, Share2, Archive, UploadCloud, X, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import JSZip from "jszip";
import { createStorageObjectPath } from "@/lib/storage-path";

export const DOC_CATEGORIES = [
  "عقد","مخطط","شهادة","فاتورة","صورة","تقرير","أمر عمل",
  "محضر","عرض سعر","مستند قانوني","مستند مالي",
  // legacy values kept for backward compatibility with existing records
  "هوية","سجل تجاري","سند","عقد مورد","عقد صيانة","مخطط البرج",
  "شهادة دفاع مدني","شهادة مصعد","عقد أمن","شهادة نظام حريق",
  "تقرير صيانة سنوي","أخرى",
] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];
export type DocEntityType = "tenant" | "contract" | "asset" | "vendor" | "building";

// Categories shown in the upload dialog (the user-curated short list)
export const DOC_UPLOAD_CATEGORIES: DocCategory[] = [
  "عقد","مخطط","شهادة","فاتورة","صورة","تقرير","أمر عمل",
  "محضر","عرض سعر","مستند قانوني","مستند مالي","أخرى",
];

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
  const { hasAnyPermission, isSuperAdmin, user } = useAuth();
  const canManage = isSuperAdmin || hasAnyPermission(["documents.create","documents.edit"]);

  const [items, setItems] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fCategory, setFCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [fileItems, setFileItems] = useState<Array<{ file: File; title: string; category: DocCategory }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<DocCategory>("عقد");
  const [form, setForm] = useState<{ issue_date?: string; expiry_date?: string; notes?: string }>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

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
    const path = createStorageObjectPath(`${entityType}/${entityId ?? "_root"}`, file);
    const { error } = await (supabase as any).storage.from("documents").upload(path, file);
    if (error) throw error;
    return path;
  };

  const stripExt = (name: string) => { const i = name.lastIndexOf("."); return i > 0 ? name.slice(0, i) : name; };

  const submit = async () => {
    if (fileItems.length === 0) { toast.error("اختر ملفًا واحدًا على الأقل"); return; }
    for (const it of fileItems) {
      if (!it.title.trim()) { toast.error("كل ملف يجب أن يكون له اسم"); return; }
    }
    try {
      const rows: any[] = [];
      for (const it of fileItems) {
        const path = await uploadOne(it.file);
        rows.push({
          title: it.title.trim(),
          category: it.category,
          entity_type: entityType,
          entity_id: entityId,
          file_path: path,
          file_name: it.file.name,
          mime_type: it.file.type || null,
          file_size: it.file.size,
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
      setFileItems([]);
      setForm({});
      void load();
    } catch (e: any) { toast.error(e.message ?? "فشل الرفع"); }
  };

  const signedUrl = async (path: string, expiresIn = 3600) => {
    const { data, error } = await (supabase as any).storage.from("documents").createSignedUrl(path, expiresIn);
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
  const share = async (d: DocumentRow) => {
    const url = await signedUrl(d.file_path, 7 * 24 * 3600); // 7 days
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ رابط المشاركة (صالح 7 أيام)");
    } catch {
      window.prompt("رابط المشاركة (صالح 7 أيام):", url);
    }
  };
  const remove = async (d: DocumentRow) => {
    await (supabase as any).storage.from("documents").remove([d.file_path]);
    const { error } = await (supabase as any).from("documents").delete().eq("id", d.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    void load();
  };

  // Filtered list based on search
  const filtered = items.filter((d) => {
    if (!search.trim()) return true;
    const s = search.trim().toLowerCase();
    return (
      d.title.toLowerCase().includes(s) ||
      (d.file_name ?? "").toLowerCase().includes(s) ||
      (d.notes ?? "").toLowerCase().includes(s) ||
      d.category.toLowerCase().includes(s)
    );
  });

  const downloadZip = async (docs: DocumentRow[], label: string) => {
    if (docs.length === 0) { toast.error("لا توجد ملفات للتحميل"); return; }
    setZipping(true);
    const t = toast.loading(`جارٍ تحضير الأرشيف (${docs.length} ملف)...`);
    try {
      const zip = new JSZip();
      const used = new Map<string, number>();
      for (const d of docs) {
        const url = await signedUrl(d.file_path);
        if (!url) continue;
        const res = await fetch(url);
        const blob = await res.blob();
        let name = d.file_name ?? `${d.title}`;
        if (used.has(name)) {
          const n = (used.get(name) ?? 1) + 1;
          used.set(name, n);
          const dot = name.lastIndexOf(".");
          name = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
        } else { used.set(name, 1); }
        const folder = zip.folder(d.category) ?? zip;
        folder.file(name, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `${label}-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("تم تحضير الأرشيف", { id: t });
    } catch (e: any) {
      toast.error(e.message ?? "فشل تحضير الأرشيف", { id: t });
    } finally { setZipping(false); }
  };
  const downloadAllZip = () => downloadZip(filtered, "archive");
  const downloadSelectedZip = () => {
    const docs = filtered.filter((d) => selected.has(d.id));
    downloadZip(docs, "selected");
  };
  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((d) => d.id)));
  };

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    setFileItems((prev) => [
      ...prev,
      ...Array.from(list).map((f) => ({ file: f, title: stripExt(f.name), category: defaultCategory })),
    ]);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    onPickFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في العناوين والملاحظات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-2 pe-8 w-64"
          />
        </div>
        <Select value={fCategory} onValueChange={setFCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="التصنيف" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التصنيفات</SelectItem>
            {DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ms-auto flex gap-2 flex-wrap">
          <Button
            variant={selectMode ? "default" : "outline"}
            onClick={() => { setSelectMode((v) => !v); setSelected(new Set()); }}
          >
            <CheckSquare className="h-4 w-4 ms-1" /> {selectMode ? "إلغاء التحديد" : "تحديد ملفات"}
          </Button>
          {selectMode ? (
            <Button onClick={downloadSelectedZip} disabled={zipping || selected.size === 0}>
              <Archive className="h-4 w-4 ms-1" /> تحميل المحدد ({selected.size})
            </Button>
          ) : (
            <Button variant="outline" onClick={downloadAllZip} disabled={zipping || filtered.length === 0}>
              <Archive className="h-4 w-4 ms-1" /> تحميل الكل (ZIP)
            </Button>
          )}
          {canManage && (
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setFileItems([]); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 ms-1" /> رفع مستند</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-2xl">
                <DialogHeader><DialogTitle>رفع مستندات</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>التصنيف الافتراضي (يُطبَّق على الملفات الجديدة)</Label>
                    <Select value={defaultCategory} onValueChange={(v) => setDefaultCategory(v as DocCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DOC_UPLOAD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                    <Label>الملفات</Label>
                    <label
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      className={`mt-1 flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
                    >
                      <UploadCloud className="h-7 w-7 text-muted-foreground" />
                      <div className="text-sm">اسحب وأفلِت الملفات هنا أو اضغط للاختيار</div>
                      <div className="text-xs text-muted-foreground">يمكن اختيار عدة ملفات بأي صيغة</div>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
                      />
                    </label>
                    {fileItems.length > 0 && (
                      <div className="mt-2 space-y-2 max-h-72 overflow-auto">
                        {fileItems.map((it, i) => (
                          <div key={i} className="border rounded-md p-2 bg-muted/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs truncate">
                                {it.file.name} <span className="text-muted-foreground">({(it.file.size / 1024).toFixed(1)} KB)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setFileItems((p) => p.filter((_, k) => k !== i))}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">اسم المستند</Label>
                                <Input
                                  value={it.title}
                                  onChange={(e) => setFileItems((p) => p.map((x, k) => k === i ? { ...x, title: e.target.value } : x))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">التصنيف</Label>
                                <Select
                                  value={it.category}
                                  onValueChange={(v) => setFileItems((p) => p.map((x, k) => k === i ? { ...x, category: v as DocCategory } : x))}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {DOC_UPLOAD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={submit}>رفع {fileItems.length > 0 ? `(${fileItems.length})` : ""}</Button>
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
                {selectMode && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="تحديد الكل"
                    />
                  </TableHead>
                )}
                <TableHead>العنوان</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={selectMode ? 7 : 6} className="text-center py-6 text-muted-foreground">جارٍ التحميل...</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={selectMode ? 7 : 6} className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  {items.length === 0 ? "لا توجد مستندات بعد" : "لا نتائج مطابقة للبحث"}
                </TableCell></TableRow>
              )}
              {filtered.map((d) => (
                <TableRow key={d.id} data-state={selected.has(d.id) ? "selected" : undefined}>
                  {selectMode && (
                    <TableCell>
                      <Checkbox checked={selected.has(d.id)} onCheckedChange={() => toggleSelect(d.id)} aria-label={d.title} />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div>{d.title}</div>
                    {d.file_name && <div className="text-xs text-muted-foreground truncate max-w-xs">{d.file_name}</div>}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{d.category}</Badge></TableCell>
                  <TableCell>{d.issue_date ?? "—"}</TableCell>
                  <TableCell>{d.expiry_date ?? "—"}</TableCell>
                  <TableCell>{expiryBadge(d.expiry_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => view(d)} title="معاينة"><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => download(d)} title="تحميل"><Download className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => share(d)} title="نسخ رابط مشاركة (7 أيام)"><Share2 className="h-4 w-4" /></Button>
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
