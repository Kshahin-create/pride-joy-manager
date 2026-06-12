import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Row = {
  id: string; contract_number: string; status: string;
  start_date: string; end_date: string; rent_amount: number;
  offices?: { code: string } | null;
  companies?: { company_name: string } | null;
};

export function CompanyContractsTab({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
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
    <ContractsTableCard
      title="عقود العميل"
      rows={rows}
      loading={loading}
      emptyMessage="لا توجد عقود لهذا العميل"
      secondColumn={{ header: "المكتب", render: (r) => r.offices?.code ?? "—" }}
    />
  );
}

export function OfficeContractsLog({ officeId }: { officeId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
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
    <ContractsTableCard
      title="سجل المكتب — العقود"
      rows={rows}
      loading={loading}
      emptyMessage="لا توجد عقود سابقة لهذا المكتب"
      secondColumn={{ header: "المستأجر", render: (r) => r.companies?.company_name ?? "—" }}
    />
  );
}

function ContractsTableCard({
  title, rows, loading, emptyMessage, secondColumn,
}: {
  title: string; rows: Row[]; loading: boolean; emptyMessage: string;
  secondColumn: { header: string; render: (r: Row) => string };
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">{emptyMessage}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم العقد</TableHead><TableHead>{secondColumn.header}</TableHead>
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
                  <TableCell>{secondColumn.render(c)}</TableCell>
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
