import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public server functions for the lobby self check-in kiosk.
// No auth required — anyone in the lobby uses this on a tablet/screen.

export const getLobbyDirectory = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [officesRes, contractsRes] = await Promise.all([
    supabaseAdmin.from("offices").select("id,code,floor,office_number").order("floor").order("office_number"),
    supabaseAdmin
      .from("contracts")
      .select("office_id, status, company:companies(id, company_name)")
      .in("status", ["ساري", "مجدد", "تحت التجديد"]),
  ]);

  if (officesRes.error) throw new Error(officesRes.error.message);
  if (contractsRes.error) throw new Error(contractsRes.error.message);

  // Map office_id -> companies (active contracts)
  const officeCompanies = new Map<string, { id: string; company_name: string }[]>();
  for (const row of (contractsRes.data ?? []) as Array<{
    office_id: string;
    company: { id: string; company_name: string } | null;
  }>) {
    if (!row.office_id || !row.company) continue;
    const arr = officeCompanies.get(row.office_id) ?? [];
    if (!arr.find((c) => c.id === row.company!.id)) arr.push(row.company);
    officeCompanies.set(row.office_id, arr);
  }

  // Group by floor
  const floorsMap = new Map<
    number,
    { office_id: string; code: string; office_number: string; companies: { id: string; company_name: string }[] }[]
  >();
  for (const o of (officesRes.data ?? []) as Array<{
    id: string;
    code: string;
    floor: number;
    office_number: string;
  }>) {
    const companies = officeCompanies.get(o.id) ?? [];
    if (companies.length === 0) continue; // skip vacant offices
    const arr = floorsMap.get(o.floor) ?? [];
    arr.push({ office_id: o.id, code: o.code, office_number: o.office_number, companies });
    floorsMap.set(o.floor, arr);
  }

  const floors = Array.from(floorsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([floor, offices]) => ({ floor, offices }));

  return { floors };
});

const checkInSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  phone: z.string().trim().min(6, "رقم الهاتف مطلوب").max(30),
  floor: z.number().int().min(1).max(9),
  office_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export const lobbyCheckIn = createServerFn({ method: "POST" })
  .inputValidator(checkInSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Verify office + company + floor relationship
    const { data: office, error: oErr } = await supabaseAdmin
      .from("offices")
      .select("id, floor, property_id")
      .eq("id", data.office_id)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!office || office.floor !== data.floor) throw new Error("بيانات المكتب غير صحيحة");

    const { data: company, error: cErr } = await supabaseAdmin
      .from("companies")
      .select("id, company_name")
      .eq("id", data.company_id)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!company) throw new Error("الشركة غير موجودة");

    const { data: inserted, error } = await supabaseAdmin
      .from("visitors")
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        office_id: data.office_id,
        company_id: data.company_id,
        company_visiting: company.company_name,
        visitor_type: "زائر",
        property_id: office.property_id,
      })
      .select("id, visitor_number, company_visiting")
      .single();

    if (error) throw new Error(error.message);
    return inserted;
  });
