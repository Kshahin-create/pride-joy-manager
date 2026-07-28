import { createFileRoute } from "@tanstack/react-router";
import { getResource, canMethod, type ApiMethod } from "@/lib/api-resources";

// Proxy route: /api/public/v1/<table>?<filters>
//
// Security model:
//  1. Bearer API key → resolved to user_id via `verify_api_key` RPC.
//  2. Application-level role gate (see api-resources.ts).
//  3. Multi-tenant property scoping enforced in this handler — the request
//     is forwarded with the service role key, so RLS does NOT apply and we
//     MUST scope every query to the user's assigned properties here.
//  4. Admin/owner users get cross-property access; every other role is
//     restricted to rows whose `property_id` matches `user_properties`.
//  5. Tables without a `property_id` column are only exposed to admin/owner.

const ALLOWED_METHODS: ApiMethod[] = ["GET", "POST", "PATCH", "DELETE"];

// Tables that carry a `property_id` column (mirrors information_schema at build time).
// If you add property scoping to a new table, add it here too.
const PROPERTY_SCOPED_TABLES = new Set<string>([
  "ac_contract_attachments", "ac_contracts", "ac_units", "assets", "building_log",
  "cameras", "cleaning_contracts", "cleaning_plans", "companies", "contracts",
  "documents", "electricity_meters", "elevator_contracts", "expenses",
  "fire_contracts", "guards", "inspection_templates", "inspections", "invoices",
  "maintenance_requests", "network_points", "offices", "parking_spots",
  "patrol_checkpoints", "patrols", "payments", "pm_plans", "security_incidents",
  "spaces", "supply_contracts", "tickets", "vendor_contracts", "vendor_payments",
  "visitors",
]);

// Roles that are always cross-property (bypass property scoping in the proxy).
const CROSS_PROPERTY_ROLES = new Set(["super_admin", "owner"]);

function cors(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Prefer, Range",
    "Access-Control-Expose-Headers": "Content-Range",
    ...extra,
  };
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(extra) },
  });
}

function propertyFilterValue(ids: string[]): string {
  // PostgREST `in.(...)` list — quote each UUID for safety.
  return `in.(${ids.map((id) => `"${id}"`).join(",")})`;
}

async function handle(request: Request, params: { _splat?: string }) {
  const method = request.method.toUpperCase() as ApiMethod;
  if (!ALLOWED_METHODS.includes(method)) {
    return json({ error: "method not allowed" }, 405);
  }

  // 1. Extract bearer
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !token.startsWith("pjk_")) {
    return json({ error: "missing or invalid API key (expect: Authorization: Bearer pjk_...)" }, 401);
  }

  // 2. Parse path → first segment is the table
  const splat = (params._splat ?? "").replace(/^\/+/, "");
  if (!splat) return json({ error: "table name required (/api/public/v1/<table>)" }, 400);

  const [table, ...rest] = splat.split("/");
  if (rest.length > 0) return json({ error: "sub-paths are not supported" }, 400);

  const resource = getResource(table);
  if (!resource) {
    return json({ error: `unknown or non-exposed table: ${table}` }, 404);
  }

  // 3. Verify key + load roles
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: verifyData, error: verifyErr } = await supabaseAdmin.rpc(
    "verify_api_key" as never,
    { _key: token } as never,
  );
  if (verifyErr) return json({ error: "verification failed" }, 500);
  const row = Array.isArray(verifyData) ? verifyData[0] : verifyData;
  const userId = (row as { user_id?: string } | undefined)?.user_id;
  if (!userId) return json({ error: "invalid or revoked API key" }, 401);

  const { data: roleRows } = await supabaseAdmin
    .from("user_roles" as never)
    .select("role")
    .eq("user_id", userId);
  const roles = ((roleRows ?? []) as { role: string }[]).map((r) => r.role);

  // 4. Role gate
  if (!canMethod(resource, method, roles)) {
    return json(
      {
        error: "forbidden: your role doesn't have permission for this operation",
        method,
        table,
        your_roles: roles,
      },
      403,
    );
  }

  // 5. Property scoping — enforced in-proxy since we forward with service role.
  const isCrossProperty = roles.some((r) => CROSS_PROPERTY_ROLES.has(r));
  const tableIsScoped = PROPERTY_SCOPED_TABLES.has(table);

  let allowedPropertyIds: string[] | null = null; // null = unrestricted
  if (!isCrossProperty) {
    if (!tableIsScoped) {
      return json(
        {
          error: "forbidden: this table is not property-scoped; only super_admin/owner may access it via the API",
          table,
        },
        403,
      );
    }
    const { data: props, error: pErr } = await supabaseAdmin
      .from("user_properties" as never)
      .select("property_id")
      .eq("user_id", userId);
    if (pErr) return json({ error: "failed to resolve property scope" }, 500);
    allowedPropertyIds = ((props ?? []) as { property_id: string }[])
      .map((p) => p.property_id)
      .filter(Boolean);
    if (allowedPropertyIds.length === 0) {
      return json({ error: "forbidden: no properties assigned to this user" }, 403);
    }
  }

  // 6. Build target URL with property_id filter injection.
  const baseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const url = new URL(request.url);

  // 6a. Block PostgREST relationship embedding — the proxy authorizes only the
  //     top-level table, so `select=*,related(*)` or `select=alias:related(*)`
  //     would bypass the role gate and pull data from other tables via the
  //     service-role forward. Only bare column lists are permitted.
  for (const key of ["select", "columns"]) {
    const val = url.searchParams.get(key);
    if (val && (val.includes("(") || val.includes(")") || val.includes(":"))) {
      return json(
        {
          error:
            "embedded/related-table syntax is not permitted in the select parameter; pass a plain comma-separated column list only",
          param: key,
        },
        400,
      );
    }
  }

  if (allowedPropertyIds && tableIsScoped) {
    // Reject any caller-supplied property_id filter — we own this filter.
    if (url.searchParams.has("property_id")) {
      return json(
        { error: "property_id filter is managed by the API; do not send it" },
        400,
      );
    }
    url.searchParams.set("property_id", propertyFilterValue(allowedPropertyIds));
  }

  // 7. Validate/normalise write payloads for property-scoped tables.
  let bodyText: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    bodyText = await request.text();
    if (allowedPropertyIds && tableIsScoped && bodyText) {
      try {
        const parsed = JSON.parse(bodyText);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        for (const r of rows) {
          if (!r || typeof r !== "object") continue;
          const pid = (r as Record<string, unknown>).property_id;
          if (method === "POST") {
            if (typeof pid !== "string") {
              return json(
                { error: "property_id is required in the request body for this table" },
                400,
              );
            }
            if (!allowedPropertyIds.includes(pid)) {
              return json(
                { error: "forbidden: property_id is outside your assigned properties" },
                403,
              );
            }
          } else if (method === "PATCH") {
            // PATCH: reject attempts to move rows between properties.
            if (pid !== undefined && (typeof pid !== "string" || !allowedPropertyIds.includes(pid))) {
              return json(
                { error: "forbidden: cannot set property_id outside your assigned properties" },
                403,
              );
            }
          }
        }
      } catch {
        return json({ error: "invalid JSON body" }, 400);
      }
    }
  }

  const target = `${baseUrl}/rest/v1/${table}${url.search}`;

  const forwardHeaders: Record<string, string> = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": request.headers.get("content-type") ?? "application/json",
  };
  const prefer = request.headers.get("prefer");
  if (prefer) forwardHeaders["Prefer"] = prefer;
  const range = request.headers.get("range");
  if (range) forwardHeaders["Range"] = range;

  const init: RequestInit = { method, headers: forwardHeaders };
  if (bodyText !== undefined) init.body = bodyText;

  const res = await fetch(target, init);
  const body = await res.text();
  const respHeaders: Record<string, string> = {
    "Content-Type": res.headers.get("content-type") ?? "application/json",
  };
  const contentRange = res.headers.get("content-range");
  if (contentRange) respHeaders["Content-Range"] = contentRange;

  return new Response(body, { status: res.status, headers: cors(respHeaders) });
}

export const Route = createFileRoute("/api/public/v1/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors() }),
      GET: async ({ request, params }) => handle(request, params),
      POST: async ({ request, params }) => handle(request, params),
      PATCH: async ({ request, params }) => handle(request, params),
      DELETE: async ({ request, params }) => handle(request, params),
    },
  },
});
