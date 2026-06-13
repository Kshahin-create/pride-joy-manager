
/* ===================== Tenant / Contract Tab ===================== */
interface ContractRow {
  id: string;
  contract_number: string;
  status: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  service_fees: number;
  notes: string | null;
  company_id: string;
  companies: {
    id: string;
    company_name: string;
    activity: string | null;
    commercial_register: string | null;
    tax_number: string | null;
    status: string;
  } | null;
}
interface ContactRow {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
}

const CONTRACT_BADGE: Record<string, string> = {
  "ساري": "bg-success text-success-foreground",
  "منتهي": "bg-muted text-muted-foreground",
  "ملغي": "bg-destructive text-destructive-foreground",
  "مجدد": "bg-info text-info-foreground",
};

function TenantTab({ officeId }: { officeId: string }) {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [contacts, setContacts] = useState<Record<string, ContactRow[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, contract_number, status, start_date, end_date, rent_amount, deposit_amount, service_fees, notes, company_id, companies(id, company_name, activity, commercial_register, tax_number, status)")
        .eq("office_id", officeId)
        .order("start_date", { ascending: false });
      if (error) {
        toast.error("تعذّر تحميل العقود");
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as ContractRow[];
      setContracts(rows);
      const companyIds = Array.from(new Set(rows.map((r) => r.company_id).filter(Boolean)));
      if (companyIds.length) {
        const { data: cps } = await (supabase as any)
          .from("contact_persons")
          .select("id, company_id, full_name, position, phone, email, is_primary")
          .in("company_id", companyIds);
        const map: Record<string, ContactRow[]> = {};
        ((cps ?? []) as any[]).forEach((c) => {
          (map[c.company_id] ||= []).push(c);
        });
        setContacts(map);
      } else setContacts({});
      setLoading(false);
    })();
  }, [officeId]);

  if (loading) {
    return <Card><CardContent className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></CardContent></Card>;
  }
  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground space-y-3">
          <Building2 className="h-10 w-10 mx-auto opacity-40" />
          <p>لا يوجد عقد إيجار مرتبط بهذا المكتب.</p>
          <Link to="/contracts">
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 ms-1" /> إنشاء عقد جديد</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const active = contracts.filter((c) => c.status === "ساري");
  const history = contracts.filter((c) => c.status !== "ساري");

  return (
    <div className="space-y-4">
      {active.map((c) => (
        <ContractCard key={c.id} contract={c} contacts={contacts[c.company_id] ?? []} />
      ))}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground mt-6">سجل العقود السابقة</h3>
          {history.map((c) => (
            <ContractCard key={c.id} contract={c} contacts={contacts[c.company_id] ?? []} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function ContractCard({ contract, contacts, compact }: { contract: ContractRow; contacts: ContactRow[]; compact?: boolean }) {
  const co = contract.companies;
  const days = daysUntil(contract.end_date);
  const expiring = contract.status === "ساري" && days !== null && days <= 60;
  return (
    <Card className={compact ? "opacity-80" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {co?.company_name ?? "—"}
              </CardTitle>
              <Badge className={CONTRACT_BADGE[contract.status] ?? "bg-muted"}>{contract.status}</Badge>
              {expiring && <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="h-3 w-3 ms-1" />ينتهي خلال {days} يوم</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">عقد رقم {contract.contract_number}{co?.activity ? ` — ${co.activity}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/contracts/$id" params={{ id: contract.id }}>
              <Button size="sm" variant="outline">فتح العقد</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Info label="بداية" value={<span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{contract.start_date}</span>} />
          <Info label="نهاية" value={<span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{contract.end_date}</span>} />
          <Info label="الإيجار الشهري" value={<span className="flex items-center gap-1"><Wallet className="h-3 w-3 text-muted-foreground" />{Number(contract.rent_amount).toLocaleString("ar-EG")} ج.م</span>} />
          <Info label="الضمان" value={`${Number(contract.deposit_amount).toLocaleString("ar-EG")} ج.م`} />
        </div>

        {co && (
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">بيانات الشركة</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Info label="السجل التجاري" value={co.commercial_register ?? "—"} />
              <Info label="الرقم الضريبي" value={co.tax_number ?? "—"} />
              <Info label="حالة العميل" value={<Badge variant="outline">{co.status}</Badge>} />
            </div>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">جهات الاتصال</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {contacts.map((p) => (
                <div key={p.id} className="rounded-md border border-border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.full_name}</span>
                    {p.is_primary && <Badge variant="outline" className="text-xs">رئيسي</Badge>}
                  </div>
                  {p.position && <div className="text-xs text-muted-foreground">{p.position}</div>}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-xs text-primary hover:underline" dir="ltr">
                      <Phone className="h-3 w-3" />{p.phone}
                    </a>
                  )}
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-xs text-primary hover:underline" dir="ltr">
                      <Mail className="h-3 w-3" />{p.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {contract.notes && (
          <div className="text-xs text-muted-foreground border-t border-border pt-2">
            <span className="font-semibold">ملاحظات: </span>{contract.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
