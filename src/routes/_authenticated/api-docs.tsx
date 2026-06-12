import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Check, Copy, KeyRound, Loader2, Plus, ShieldCheck, ShieldX, Trash2,
  Search, Globe, Code2, AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useAuth } from "@/lib/auth-context";
import {
  API_RESOURCES, canMethod, type ApiMethod, type ApiResource,
} from "@/lib/api-resources";
import {
  createApiKey, deleteApiKey, listApiKeys, revokeApiKey,
} from "@/lib/api-keys.functions";

export const Route = createFileRoute("/_authenticated/api-docs")({
  component: ApiDocsPage,
});

const METHOD_COLORS: Record<ApiMethod, string> = {
  GET:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  POST:   "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  PATCH:  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function CopyButton({ text, label = "نسخ" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-7 gap-1 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("تم النسخ");
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group">
      <pre className="rounded-md bg-muted/50 border p-3 text-xs overflow-x-auto font-mono leading-relaxed text-left" dir="ltr">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

// ─── Resource card ──────────────────────────────────────────────────────────
function ResourceCard({ resource, roles, baseUrl, apiKey }: {
  resource: ApiResource;
  roles: string[];
  baseUrl: string;
  apiKey: string;
}) {
  const methods: ApiMethod[] = ["GET", "POST", "PATCH", "DELETE"];
  const allowed = methods.filter((m) => canMethod(resource, m, roles));
  const endpoint = `${baseUrl}/api/public/v1/${resource.table}`;

  const examples: Record<ApiMethod, string> = {
    GET:    `curl -H "Authorization: Bearer ${apiKey}" \\\n  "${endpoint}?select=*&limit=10"`,
    POST:   `curl -X POST -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -H "Prefer: return=representation" \\\n  -d '{"field":"value"}' \\\n  "${endpoint}"`,
    PATCH:  `curl -X PATCH -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"field":"new value"}' \\\n  "${endpoint}?id=eq.RECORD_ID"`,
    DELETE: `curl -X DELETE -H "Authorization: Bearer ${apiKey}" \\\n  "${endpoint}?id=eq.RECORD_ID"`,
  };

  return (
    <AccordionItem value={resource.table} className="border rounded-lg px-3 mb-2 bg-card">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 flex-1 text-right">
          <div className="flex flex-col items-start min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{resource.label}</span>
              <code className="text-xs text-muted-foreground font-mono" dir="ltr">{resource.table}</code>
            </div>
            <span className="text-xs text-muted-foreground">{resource.description}</span>
          </div>
          <div className="flex gap-1 shrink-0">
            {methods.map((m) => {
              const ok = allowed.includes(m);
              return (
                <Badge
                  key={m}
                  variant="outline"
                  className={`text-[10px] font-mono ${ok ? METHOD_COLORS[m] : "opacity-30"}`}
                >
                  {m}
                </Badge>
              );
            })}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <code className="font-mono text-muted-foreground break-all flex-1" dir="ltr">{endpoint}</code>
          <CopyButton text={endpoint} label="" />
        </div>
        {allowed.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded bg-muted/50">
            <ShieldX className="h-4 w-4" />
            دورك الحالي ({roles.join(", ") || "بدون دور"}) لا يسمح بأي عملية على هذا المورد.
          </div>
        ) : (
          <Tabs defaultValue={allowed[0]}>
            <TabsList className="h-8">
              {allowed.map((m) => (
                <TabsTrigger key={m} value={m} className="text-xs h-6 px-2 font-mono">
                  {m}
                </TabsTrigger>
              ))}
            </TabsList>
            {allowed.map((m) => (
              <TabsContent key={m} value={m} className="mt-2">
                <CodeBlock code={examples[m]} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── API Keys section ──────────────────────────────────────────────────────
function ApiKeysSection() {
  const qc = useQueryClient();
  const list = useServerFn(listApiKeys);
  const create = useServerFn(createApiKey);
  const revoke = useServerFn(revokeApiKey);
  const remove = useServerFn(deleteApiKey);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => list(),
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [expDays, setExpDays] = useState<string>("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () => create({
      data: {
        name: name.trim(),
        expires_in_days: expDays ? Number(expDays) : undefined,
      },
    }),
    onSuccess: (data) => {
      setNewKey(data.full_key);
      setName("");
      setExpDays("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => {
      toast.success("تم إلغاء المفتاح");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => {
    setOpen(false);
    setNewKey(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              مفاتيحي
            </CardTitle>
            <CardDescription className="mt-1">
              ولّد مفتاحًا لاستخدامه من خارج النظام (Postman / n8n / موبايل). المفتاح يرث صلاحياتك تلقائيًا.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setNewKey(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> إنشاء مفتاح
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{newKey ? "تم إنشاء المفتاح" : "مفتاح API جديد"}</DialogTitle>
                <DialogDescription>
                  {newKey
                    ? "انسخ المفتاح الآن — لن يظهر مرة أخرى بعد إغلاق هذه النافذة."
                    : "اختر اسمًا وصفيًا ومدة انتهاء اختيارية."}
                </DialogDescription>
              </DialogHeader>

              {newKey ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>هذا المفتاح يعطي وصولًا كاملًا لصلاحياتك. لا تشاركه مع أي شخص.</span>
                  </div>
                  <CodeBlock code={newKey} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="key-name">اسم المفتاح</Label>
                    <Input
                      id="key-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثلاً: موبايل الحارس"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <Label htmlFor="key-exp">ينتهي بعد (أيام) — اختياري</Label>
                    <Input
                      id="key-exp"
                      type="number"
                      min={1}
                      max={3650}
                      value={expDays}
                      onChange={(e) => setExpDays(e.target.value)}
                      placeholder="مثلاً 90 (اتركه فارغًا = بدون انتهاء)"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                {newKey ? (
                  <Button onClick={closeDialog}>تمام</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                    <Button
                      onClick={() => createMut.mutate()}
                      disabled={!name.trim() || createMut.isPending}
                    >
                      {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      إنشاء
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            لا يوجد مفاتيح بعد. أنشئ مفتاحك الأول.
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => {
              const revoked = !!k.revoked_at;
              const expired = k.expires_at && new Date(k.expires_at) < new Date();
              return (
                <div key={k.id} className="flex items-center gap-3 p-3 border rounded-md flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{k.name}</span>
                      <code className="text-xs font-mono text-muted-foreground" dir="ltr">
                        {k.key_prefix}…
                      </code>
                      {revoked && <Badge variant="destructive" className="text-[10px]">ملغي</Badge>}
                      {!revoked && expired && <Badge variant="secondary" className="text-[10px]">منتهي</Badge>}
                      {!revoked && !expired && (
                        <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-600">
                          نشط
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      آخر استخدام: {k.last_used_at ? new Date(k.last_used_at).toLocaleString("ar-EG") : "لم يُستخدم"}
                      {k.expires_at && ` · ينتهي ${new Date(k.expires_at).toLocaleDateString("ar-EG")}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!revoked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMut.mutate(k.id)}
                        disabled={revokeMut.isPending}
                      >
                        إلغاء
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف نهائي للمفتاح؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            أي تطبيق يستخدمه سيتوقف فورًا. لا يمكن استرجاعه.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMut.mutate(k.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
function ApiDocsPage() {
  const { roles } = useAuth();
  const [search, setSearch] = useState("");
  const [exampleKey] = useState("pjk_YOUR_API_KEY");
  const baseUrl = getBaseUrl();

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return API_RESOURCES;
    return API_RESOURCES.filter(
      (r) =>
        r.table.toLowerCase().includes(s) ||
        r.label.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s),
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Code2 className="h-6 w-6" />
          واجهة برمجة التطبيقات (API)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          وصول كامل لبيانات السيستم من خارج التطبيق — بصلاحياتك أنت فقط.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="resources">الموارد ({API_RESOURCES.length})</TabsTrigger>
          <TabsTrigger value="keys">مفاتيحي</TabsTrigger>
        </TabsList>

        {/* ── نظرة عامة ── */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>كيف يعمل الـ API؟</CardTitle>
              <CardDescription>
                نقطة وصول واحدة تشبه REST بالكامل، مع التحقق من المفتاح + الصلاحيات.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>الـ Base URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono flex-1 break-all" dir="ltr">
                    {baseUrl}/api/public/v1/&lt;table&gt;
                  </code>
                  <CopyButton text={`${baseUrl}/api/public/v1/`} label="" />
                </div>
              </div>

              <div>
                <Label>المصادقة</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  أرسل المفتاح في الـ Header:
                </p>
                <CodeBlock code={`Authorization: Bearer pjk_YOUR_API_KEY`} />
              </div>

              <div>
                <Label>صلاحياتك الحالية</Label>
                <div className="flex gap-1 flex-wrap mt-1">
                  {roles.length === 0 ? (
                    <Badge variant="secondary">بدون دور محدد</Badge>
                  ) : (
                    roles.map((r) => (
                      <Badge key={r} variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> {r}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div>
                <Label>أمثلة سريعة</Label>
                <div className="mt-2 space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">اقرأ كل المكاتب:</div>
                    <CodeBlock code={`curl -H "Authorization: Bearer ${exampleKey}" \\\n  "${baseUrl}/api/public/v1/offices?select=*"`} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">فلترة بالحالة:</div>
                    <CodeBlock code={`curl -H "Authorization: Bearer ${exampleKey}" \\\n  "${baseUrl}/api/public/v1/maintenance_requests?status=eq.جديد&order=created_at.desc"`} />
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3 space-y-1">
                <p>📚 الـ API يدعم نفس قواعد PostgREST في الفلترة والترتيب والاختيار:</p>
                <ul className="list-disc pr-4 space-y-0.5">
                  <li><code dir="ltr">?select=col1,col2</code> — اختر أعمدة محددة</li>
                  <li><code dir="ltr">?col=eq.value</code> — تساوي / <code dir="ltr">gt.</code> / <code dir="ltr">lt.</code> / <code dir="ltr">like.</code></li>
                  <li><code dir="ltr">?order=col.desc</code> — ترتيب</li>
                  <li><code dir="ltr">?limit=10&offset=20</code> — صفحات</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── الموارد ── */}
        <TabsContent value="resources" className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مورد…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>

          <Accordion type="multiple" className="space-y-0">
            {filtered.map((r) => (
              <ResourceCard
                key={r.table}
                resource={r}
                roles={roles}
                baseUrl={baseUrl}
                apiKey={exampleKey}
              />
            ))}
          </Accordion>

          {filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              لا يوجد موارد مطابقة
            </div>
          )}
        </TabsContent>

        {/* ── مفاتيح ── */}
        <TabsContent value="keys">
          <ApiKeysSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
