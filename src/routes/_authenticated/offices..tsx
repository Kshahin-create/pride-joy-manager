
/* ===================== Finance (Invoices + Payments) ===================== */
type InvoiceRow = {
  id: string; invoice_number: string; invoice_type: string;
  amount_due: number; amount_paid: number; issue_date: string; due_date: string;
  status: string; contract_id: string | null;
};
type PaymentRow = {
  id: string; receipt_number: string; amount_paid: number; payment_date: string;
  invoice_id: string;
};

function FinanceTab({ officeId }: { officeId: string }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: contracts } = await supabase.from("contracts").select("id").eq("office_id", officeId);
      const contractIds = (contracts ?? []).map((c: any) => c.id);
      if (!contractIds.length) { setInvoices([]); setPayments([]); setLoading(false); return; }
      const { data: invs } = await (supabase as any).from("invoices")
        .select("id, invoice_number, invoice_type, amount_due, amount_paid, issue_date, due_date, status, contract_id")
        .in("contract_id", contractIds).order("issue_date", { ascending: false });
      const list = (invs ?? []) as InvoiceRow[];
      setInvoices(list);
      if (list.length) {
        const { data: pays } = await (supabase as any).from("payments")
          .select("id, receipt_number, amount_paid, payment_date, invoice_id")
          .in("invoice_id", list.map((i) => i.id))
          .order("payment_date", { ascending: false });
        setPayments((pays ?? []) as PaymentRow[]);
      } else setPayments([]);
      setLoading(false);
    })();
  }, [officeId]);

  if (loading) return <Card><CardContent className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></CardContent></Card>;
  if (!invoices.length) return <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد فواتير مرتبطة بهذا المكتب.</CardContent></Card>;

  const totalDue = invoices.reduce((s, i) => s + Number(i.amount_due || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
  const outstanding = totalDue - totalPaid;
  const overdue = invoices.filter((i) => i.status === "متأخر").length;

  const statusBadge: Record<string, string> = {
    "مدفوع": "bg-success text-success-foreground",
    "مستحق": "bg-warning text-warning-foreground",
    "مدفوع جزئي": "bg-info text-info-foreground",
    "متأخر": "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">إجمالي الفواتير</div><div className="text-xl font-bold mt-1">{totalDue.toLocaleString("ar-EG")} ج.م</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">المسدّد</div><div className="text-xl font-bold mt-1 text-success">{totalPaid.toLocaleString("ar-EG")} ج.م</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">المتبقي</div><div className={`text-xl font-bold mt-1 ${outstanding > 0 ? "text-destructive" : ""}`}>{outstanding.toLocaleString("ar-EG")} ج.م</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">فواتير متأخرة</div><div className={`text-xl font-bold mt-1 ${overdue > 0 ? "text-destructive" : ""}`}>{overdue}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">الفواتير</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>الرقم</TableHead><TableHead>النوع</TableHead>
              <TableHead>الإصدار</TableHead><TableHead>الاستحقاق</TableHead>
              <TableHead>المبلغ</TableHead><TableHead>المسدّد</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.invoice_number}</TableCell>
                  <TableCell>{i.invoice_type}</TableCell>
                  <TableCell>{i.issue_date}</TableCell>
                  <TableCell>{i.due_date}</TableCell>
                  <TableCell>{Number(i.amount_due).toLocaleString("ar-EG")}</TableCell>
                  <TableCell>{Number(i.amount_paid).toLocaleString("ar-EG")}</TableCell>
                  <TableCell><Badge className={statusBadge[i.status] ?? "bg-muted"}>{i.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">سندات القبض</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 text-sm">لا توجد دفعات مسجّلة بعد.</div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>سند القبض</TableHead><TableHead>الفاتورة</TableHead>
                <TableHead>التاريخ</TableHead><TableHead>المبلغ</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const inv = invoices.find((x) => x.id === p.invoice_id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.receipt_number}</TableCell>
                      <TableCell>{inv?.invoice_number ?? "—"}</TableCell>
                      <TableCell>{p.payment_date}</TableCell>
                      <TableCell className="font-medium text-success">{Number(p.amount_paid).toLocaleString("ar-EG")} ج.م</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ===================== Maintenance ===================== */
type MaintRow = {
  id: string; request_number: string; request_type: string; priority: string;
  status: string; description: string | null; created_at: string;
  closed_at: string | null; cost: number | null;
};

function MaintenanceTab({ officeId }: { officeId: string }) {
  const [items, setItems] = useState<MaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("maintenance_requests")
        .select("id, request_number, request_type, priority, status, description, created_at, closed_at, cost")
        .eq("office_id", officeId).order("created_at", { ascending: false });
      setItems((data ?? []) as MaintRow[]);
      setLoading(false);
    })();
  }, [officeId]);

  if (loading) return <Card><CardContent className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></CardContent></Card>;
  if (!items.length) return <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد طلبات صيانة لهذا المكتب.</CardContent></Card>;

  const open = items.filter((i) => i.status !== "مغلق").length;
  const closed = items.filter((i) => i.status === "مغلق").length;
  const totalCost = items.reduce((s, i) => s + Number(i.cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">مفتوحة</div><div className="text-xl font-bold mt-1 text-warning">{open}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">مغلقة</div><div className="text-xl font-bold mt-1 text-success">{closed}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">إجمالي التكلفة</div><div className="text-xl font-bold mt-1">{totalCost.toLocaleString("ar-EG")} ج.م</div></CardContent></Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>الرقم</TableHead><TableHead>النوع</TableHead>
              <TableHead>الأولوية</TableHead><TableHead>الوصف</TableHead>
              <TableHead>التاريخ</TableHead><TableHead>التكلفة</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id} className={m.priority === "طارئة" && m.status !== "مغلق" ? "bg-red-500/5" : ""}>
                  <TableCell className="font-medium">{m.request_number}</TableCell>
                  <TableCell>{m.request_type}</TableCell>
                  <TableCell>
                    {m.priority === "طارئة"
                      ? <Badge className="bg-red-600 text-white">طارئة</Badge>
                      : <Badge variant="outline">{m.priority}</Badge>}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">{m.description ?? "—"}</TableCell>
                  <TableCell className="text-xs">{m.created_at?.slice(0, 10)}</TableCell>
                  <TableCell>{m.cost ? `${Number(m.cost).toLocaleString("ar-EG")} ج.م` : "—"}</TableCell>
                  <TableCell><Badge variant={m.status === "مغلق" ? "secondary" : "default"}>{m.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ===================== Parking ===================== */
type SpotRow = {
  id: string; spot_number: string; floor: string;
  spot_type: string; status: string;
};

function ParkingTab({ officeId }: { officeId: string }) {
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("parking_spots")
        .select("id, spot_number, floor, spot_type, status")
        .eq("office_id", officeId).order("floor").order("spot_number");
      setSpots((data ?? []) as SpotRow[]);
      setLoading(false);
    })();
  }, [officeId]);

  if (loading) return <Card><CardContent className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" /></CardContent></Card>;
  if (!spots.length) return <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد مواقف مخصّصة لهذا المكتب.</CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Car className="h-4 w-4" /> المواقف المخصّصة ({spots.length})</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>رقم الموقف</TableHead><TableHead>الدور</TableHead>
            <TableHead>النوع</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {spots.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono font-bold">{s.spot_number}</TableCell>
                <TableCell>{s.floor}</TableCell>
                <TableCell>{s.spot_type}</TableCell>
                <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
