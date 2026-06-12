import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function send(chat_id: number, text: string) {
  return fetch(`${GATEWAY}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

const fmt = (n: number) => Number(n ?? 0).toLocaleString("ar-SA");

export const Route = createFileRoute("/api/public/telegram/daily-report")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // build report
          const date = new Date().toISOString().slice(0, 10);
          const { data: rpt } = await supabaseAdmin.rpc("get_daily_report" as never, { _date: date } as never);
          const r: any = rpt ?? {};
          const { data: ident } = await supabaseAdmin
            .from("building_identity" as never)
            .select("building_name")
            .limit(1)
            .maybeSingle();
          const bname = (ident as any)?.building_name ?? "البرج";

          const text = [
            `📊 <b>${bname} — التقرير اليومي</b>`,
            `📅 ${date}`,
            ``,
            `👥 <b>الزوار</b>: داخل ${fmt(r.visitors_in)} | خرجوا ${fmt(r.visitors_out)} | لم يخرجوا ${fmt(r.visitors_still_inside)}`,
            `🛠 <b>أوامر العمل</b>: جديد ${fmt(r.wo_new)} | مغلق ${fmt(r.wo_closed)} | متأخر ${fmt(r.wo_overdue_open)}`,
            `🎫 <b>التذاكر</b>: جديد ${fmt(r.tickets_new)} | مغلق ${fmt(r.tickets_closed)}`,
            `🚨 <b>الأمن</b>: حوادث ${fmt(r.incidents_new)} | جولات ${fmt(r.patrols)}`,
            `💰 <b>المدفوعات المستلمة</b>: ${fmt(r.payments_received)} ر.س`,
            `💸 <b>المصروفات</b>: جديدة ${fmt(r.expenses_new)} ر.س | مدفوعة ${fmt(r.expenses_paid)} ر.س`,
            `📝 <b>أحداث اليوم</b>: ${Array.isArray(r.events) ? r.events.length : 0}`,
          ].join("\n");

          // send to super_admin + owner subscribers
          const { data: roleRows } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .in("role", ["super_admin", "owner"] as any);
          const userIds = (roleRows ?? []).map((r: any) => r.user_id);
          if (userIds.length === 0) return Response.json({ ok: true, sent: 0 });

          const { data: subs } = await supabaseAdmin
            .from("telegram_subscribers" as never)
            .select("chat_id,enabled")
            .in("user_id", userIds);
          const targets = ((subs ?? []) as any[]).filter((s) => s.enabled).map((s) => s.chat_id as number);

          await Promise.all(targets.map((cid) => send(cid, text)));
          return Response.json({ ok: true, sent: targets.length });
        } catch (e) {
          console.error("daily report error", e);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
      GET: async () => new Response("daily-report OK"),
    },
  },
});
