import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLobbyDirectory, lobbyCheckIn } from "@/lib/lobby-checkin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, UserPlus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/lobby-checkin")({
  head: () => ({ meta: [{ title: "تسجيل دخول الزوار - اللوبي" }] }),
  component: LobbyCheckInPage,
});

type Floor = {
  floor: number;
  offices: { office_id: string; code: string; office_number: string; companies: { id: string; company_name: string }[] }[];
};

function LobbyCheckInPage() {
  const fetchDirectory = useServerFn(getLobbyDirectory);
  const submit = useServerFn(lobbyCheckIn);
  const navigate = useNavigate();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ visitor_number: string; company_visiting: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [floor, setFloor] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");

  useEffect(() => {
    fetchDirectory()
      .then((r) => setFloors(r.floors))
      .catch((e) => toast.error(e?.message ?? "تعذّر تحميل البيانات"))
      .finally(() => setLoading(false));
  }, []);

  const companiesOnFloor = useMemo(() => {
    if (!floor) return [];
    const f = floors.find((x) => x.floor === Number(floor));
    if (!f) return [];
    // Flatten unique companies with their office
    const seen = new Set<string>();
    const result: { company_id: string; company_name: string; office_id: string; code: string }[] = [];
    for (const o of f.offices) {
      for (const c of o.companies) {
        const key = `${c.id}-${o.office_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ company_id: c.id, company_name: c.company_name, office_id: o.office_id, code: o.code });
      }
    }
    return result.sort((a, b) => a.company_name.localeCompare(b.company_name, "ar"));
  }, [floor, floors]);

  useEffect(() => {
    setCompanyId("");
  }, [floor]);

  const reset = () => {
    setFullName(""); setPhone(""); setFloor(""); setCompanyId(""); setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = companiesOnFloor.find((c) => `${c.company_id}|${c.office_id}` === companyId);
    if (!fullName.trim() || !phone.trim() || !floor || !selected) {
      toast.error("يرجى استكمال جميع الحقول");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          floor: Number(floor),
          office_id: selected.office_id,
          company_id: selected.company_id,
        },
      });
      setSuccess({ visitor_number: res.visitor_number ?? "—", company_visiting: res.company_visiting ?? "" });
      // Auto-reset after 6s for next visitor
      setTimeout(reset, 6000);
    } catch (err: any) {
      toast.error(err?.message ?? "تعذّر التسجيل");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6"
    >
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <UserPlus className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold mb-2">تسجيل دخول الزوار</h1>
          <p className="text-slate-300 text-lg">أهلاً بك — يرجى تعبئة بياناتك</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="p-8">
            {success ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-bold">تم التسجيل بنجاح</h2>
                <p className="text-muted-foreground">
                  رقم الزائر: <span className="font-mono font-bold">{success.visitor_number}</span>
                </p>
                <p className="text-lg">يمكنك التوجّه إلى <span className="font-bold">{success.company_visiting}</span></p>
                <Button size="lg" onClick={reset} className="mt-4">تسجيل زائر آخر</Button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-base">الاسم الكامل</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ادخل اسمك الكامل"
                    className="h-14 text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">رقم الهاتف</Label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="h-14 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">الدور</Label>
                  <Select value={floor} onValueChange={setFloor}>
                    <SelectTrigger className="h-14 text-lg"><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 9 }, (_, i) => i + 1).map((f) => (
                        <SelectItem key={f} value={String(f)} className="text-lg">
                          الدور {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {floor && (
                  <div className="space-y-2">
                    <Label className="text-base">الشركة</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder={companiesOnFloor.length ? "اختر الشركة" : "لا توجد شركات في هذا الدور"} />
                      </SelectTrigger>
                      <SelectContent>
                        {companiesOnFloor.map((c) => (
                          <SelectItem key={`${c.company_id}|${c.office_id}`} value={`${c.company_id}|${c.office_id}`} className="text-lg">
                            {c.company_name} <span className="text-muted-foreground text-sm">({c.code})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" disabled={busy} size="lg" className="w-full h-14 text-lg mt-4">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "تسجيل الدخول"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-slate-400 text-sm mt-6">شكراً لزيارتكم</p>
      </div>
    </div>
  );
}
