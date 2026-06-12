
function CompanyContractsTab({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<Array<{
    id: string; contract_number: string; status: string;
    start_date: string; end_date: string; rent_amount: number;
    offices?: { code: string } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contracts")
        .select("id, contract_number, status, start_date, end_date, rent_amount, offices(code)")
        .eq("company_id", companyId).order("created_at", { ascending: false });
      setRows((data as never) ?? []);
      setLoading(false);
    })();
  }, [companyId]);
  return (
    <Card>
      <CardHeader><CardTitle>عقود العميل</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">لا توجد عقود لهذا العميل</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم العقد</TableHead><TableHead>المكتب</TableHead>
                <TableHead>من</TableHead><TableHead>إلى</TableHead>
                <TableHead>الإيجار</TableHead><TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link to="/contracts/$id" params={{ id: c.id }} className="text-primary hover:underline font-medium">
                      {c.contract_number}
                    </Link>
                  </TableCell>
                  <TableCell>{c.offices?.code ?? "—"}</TableCell>
                  <TableCell>{c.start_date}</TableCell>
                  <TableCell>{c.end_date}</TableCell>
                  <TableCell>{Number(c.rent_amount).toLocaleString("ar-EG")}</TableCell>
                  <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
