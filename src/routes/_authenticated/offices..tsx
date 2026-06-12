
function OfficeContractsLog({ officeId }: { officeId: string }) {
  const [rows, setRows] = useState<Array<{
    id: string; contract_number: string; status: string;
    start_date: string; end_date: string; rent_amount: number;
    companies?: { company_name: string } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("contracts")
        .select("id, contract_number, status, start_date, end_date, rent_amount, companies(company_name)")
        .eq("office_id", officeId).order("start_date", { ascending: false });
      setRows((data as never) ?? []);
      setLoading(false);
    })();
  }, [officeId]);
  return (
    <Card>
      <CardHeader><CardTitle>سجل المكتب — العقود</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">لا توجد عقود سابقة لهذا المكتب</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم العقد</TableHead><TableHead>المستأجر</TableHead>
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
                  <TableCell>{c.companies?.company_name ?? "—"}</TableCell>
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
