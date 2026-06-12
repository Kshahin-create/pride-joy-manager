import { createFileRoute } from "@tanstack/react-router";
import { getResource, canMethod, type ApiMethod } from "@/lib/api-resources";

// Proxy route: /api/public/v1/<table>?<filters>
//
// Flow:
//  1. Read API key from `Authorization: Bearer pjk_...`
//  2. Verify it via the `verify_api_key` RPC → returns user_id
//  3. Look up user roles
//  4. Check the resource map allows this method for those roles
//  5. Forward the request to Supabase Data API with the service role key
//     (we already did role-based gating above)

const ALLOWED_METHODS: ApiMethod[] = ["GET", "POST", "PATCH", "DELETE"];

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

  // 5. Forward to PostgREST using service role
  const baseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const url = new URL(request.url);
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
  if (method !== "GET" && method !== "DELETE") {
    init.body = await request.text();
  }

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
