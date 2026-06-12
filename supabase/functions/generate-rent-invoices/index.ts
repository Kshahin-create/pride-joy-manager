// Edge Function: generate-rent-invoices
// Generates monthly rent invoices for a contract's full duration.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Authorize: super_admin or accountant
    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", userData.user.id);
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    if (!roleList.includes("super_admin") && !roleList.includes("accountant")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const contractId = body.contract_id as string | undefined;
    if (!contractId) {
      return new Response(JSON.stringify({ error: "contract_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: contract, error: cErr } = await admin
      .from("contracts")
      .select("id, company_id, start_date, end_date, rent_amount, status")
      .eq("id", contractId)
      .maybeSingle();
    if (cErr || !contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);
    const months: { issue_date: string; due_date: string }[] = [];
    let cursor = start;
    while (cursor <= end) {
      const issue = toISO(cursor);
      const due = toISO(addMonths(cursor, 0)); // due same day; or could be +X days
      months.push({ issue_date: issue, due_date: due });
      cursor = addMonths(cursor, 1);
    }

    // Skip months where a rent invoice already exists on that issue date for this contract
    const { data: existing } = await admin
      .from("invoices")
      .select("issue_date")
      .eq("contract_id", contractId)
      .eq("invoice_type", "إيجار");
    const existingSet = new Set((existing ?? []).map((r: { issue_date: string }) => r.issue_date));

    const toInsert = months
      .filter((m) => !existingSet.has(m.issue_date))
      .map((m) => ({
        contract_id: contractId,
        company_id: contract.company_id,
        invoice_type: "إيجار",
        amount_due: contract.rent_amount,
        issue_date: m.issue_date,
        due_date: m.due_date,
        created_by: userData.user.id,
      }));

    if (toInsert.length === 0) {
      return new Response(JSON.stringify({ generated: 0, message: "لا توجد فواتير جديدة لتوليدها" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await admin.from("invoices").insert(toInsert);
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ generated: toInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
