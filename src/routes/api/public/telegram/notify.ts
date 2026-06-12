import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

const ICONS: Record<string, string> = {
  contract_expiring: "📄",
  invoice_overdue: "💸",
  document_expiring: "📑",
  training_expiring: "🎓",
  work_order_overdue: "⏰",
  asset_critical_failure: "🚨",
  ticket_emergency: "🆘",
};

async function send(chat_id: number, text: string, link?: string) {
  const reply_markup = link
    ? { inline_keyboard: [[{ text: "فتح في التطبيق", url: `https://taam.taskinaqaria.com${link}` }]] }
    : undefined;
  return fetch(`${GATEWAY}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup }),
  });
}

export const Route = createFileRoute("/api/public/telegram/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { notification_id } = (await request.json().catch(() => ({}))) as { notification_id?: string };
          if (!notification_id) return Response.json({ ok: false, error: "missing id" }, { status: 400 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: n } = await supabaseAdmin
            .from("notifications")
            .select("*")
            .eq("id", notification_id)
            .maybeSingle();
          if (!n) return Response.json({ ok: false, error: "not found" });

          const role = (n as any).target_role as string;
          // find user_ids with this role + their telegram subscribers
          const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", role as any);
          const userIds = (roleRows ?? []).map((r: any) => r.user_id);
          // super_admin and owner always also receive
          const { data: adminRows } = await supabaseAdmin.from("user_roles").select("user_id").in("role", ["super_admin"] as any);
          const adminIds = (adminRows ?? []).map((r: any) => r.user_id);
          const all = Array.from(new Set([...userIds, ...adminIds]));
          if (all.length === 0) return Response.json({ ok: true, sent: 0 });

          const { data: subs } = await supabaseAdmin
            .from("telegram_subscribers" as never)
            .select("chat_id,enabled")
            .in("user_id", all);
          const targets = ((subs ?? []) as any[]).filter((s) => s.enabled).map((s) => s.chat_id as number);
          if (targets.length === 0) return Response.json({ ok: true, sent: 0 });

          const icon = ICONS[(n as any).notification_type] ?? "🔔";
          const text = `${icon} <b>${(n as any).title}</b>\n${(n as any).body ?? ""}`;
          const link = (n as any).link as string | null;

          await Promise.all(targets.map((cid) => send(cid, text, link ?? undefined)));
          return Response.json({ ok: true, sent: targets.length });
        } catch (e) {
          console.error("notify error", e);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
