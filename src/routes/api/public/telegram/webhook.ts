import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${GATEWAY}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

async function send(chat_id: number, text: string, extra: Record<string, unknown> = {}) {
  return tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });
}

const HELP = `<b>🏢 بوت إدارة برج Pride &amp; Joy</b>

الأوامر المتاحة:
/start &lt;CODE&gt; — ربط حسابك (احصل على الكود من التطبيق)
/me — حالة اشتراكك
/today — تقرير اليوم (للمدير العام/المالية)
/mute — إيقاف الإشعارات مؤقتاً
/unmute — تشغيل الإشعارات
/stop — فك الربط
/help — هذه القائمة`;

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const update: any = await request.json();
          const msg = update.message ?? update.edited_message;
          if (!msg?.chat?.id) return Response.json({ ok: true });

          const chatId: number = msg.chat.id;
          const text: string = (msg.text ?? "").trim();
          const tg_username: string | undefined = msg.from?.username;
          const tg_first_name: string | undefined = msg.from?.first_name;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // touch last_seen for any known subscriber
          await supabaseAdmin
            .from("telegram_subscribers" as never)
            .update({ last_seen_at: new Date().toISOString() } as never)
            .eq("chat_id", chatId);

          const cmd = text.split(/\s+/)[0]?.toLowerCase() ?? "";
          const arg = text.split(/\s+/).slice(1).join(" ").trim();

          // /start CODE
          if (cmd === "/start") {
            if (!arg) {
              await send(chatId, `أهلاً 👋\n\nلربط حسابك: افتح التطبيق → الإدارة → بوت تيليجرام → انسخ الكود ثم أرسل:\n<code>/start ABCD1234</code>`);
              return Response.json({ ok: true });
            }
            const code = arg.toUpperCase().slice(0, 16);
            const { data: link } = await supabaseAdmin
              .from("telegram_link_codes" as never)
              .select("*")
              .eq("code", code)
              .is("used_at", null)
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();
            if (!link) {
              await send(chatId, "❌ الكود غير صحيح أو منتهي الصلاحية.\nأنشئ كوداً جديداً من التطبيق.");
              return Response.json({ ok: true });
            }
            const userId = (link as any).user_id as string;
            await supabaseAdmin
              .from("telegram_subscribers" as never)
              .upsert({
                user_id: userId,
                chat_id: chatId,
                tg_username,
                tg_first_name,
                enabled: true,
                linked_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
              } as never, { onConflict: "user_id" });
            await supabaseAdmin
              .from("telegram_link_codes" as never)
              .update({ used_at: new Date().toISOString() } as never)
              .eq("code", code);
            const { data: prof } = await supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
            const { data: rolesRows } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
            const roles = (rolesRows ?? []).map((r: any) => r.role).join(", ") || "—";
            await send(chatId, `✅ تم ربط حسابك بنجاح\n\n👤 ${prof?.full_name ?? ""}\n🔑 الأدوار: ${roles}\n\nستصلك الإشعارات المتعلقة بدورك تلقائياً.\n${HELP}`);
            return Response.json({ ok: true });
          }

          // find subscriber
          const { data: sub } = await supabaseAdmin
            .from("telegram_subscribers" as never)
            .select("*")
            .eq("chat_id", chatId)
            .maybeSingle();

          if (!sub && cmd !== "/help") {
            await send(chatId, `لم يتم ربط حسابك بعد.\n\n${HELP}`);
            return Response.json({ ok: true });
          }

          if (cmd === "/help") {
            await send(chatId, HELP);
          } else if (cmd === "/me") {
            const userId = (sub as any).user_id as string;
            const { data: prof } = await supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
            const { data: rolesRows } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
            const roles = (rolesRows ?? []).map((r: any) => r.role).join(", ") || "—";
            const en = (sub as any).enabled ? "✅ مفعّلة" : "🔕 موقوفة";
            await send(chatId, `👤 <b>${prof?.full_name ?? ""}</b>\n🔑 الأدوار: ${roles}\n🔔 الإشعارات: ${en}\n💬 chat_id: <code>${chatId}</code>`);
          } else if (cmd === "/mute") {
            await supabaseAdmin.from("telegram_subscribers" as never).update({ enabled: false } as never).eq("chat_id", chatId);
            await send(chatId, "🔕 تم إيقاف الإشعارات. أرسل /unmute للتفعيل.");
          } else if (cmd === "/unmute") {
            await supabaseAdmin.from("telegram_subscribers" as never).update({ enabled: true } as never).eq("chat_id", chatId);
            await send(chatId, "🔔 تم تفعيل الإشعارات.");
          } else if (cmd === "/stop") {
            await supabaseAdmin.from("telegram_subscribers" as never).delete().eq("chat_id", chatId);
            await send(chatId, "👋 تم فك الربط. يمكنك إعادة الربط في أي وقت من التطبيق.");
          } else if (cmd === "/today") {
            const userId = (sub as any).user_id as string;
            const { data: rolesRows } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
            const roles = (rolesRows ?? []).map((r: any) => r.role);
            if (!roles.includes("super_admin") && !roles.includes("owner") && !roles.includes("accountant")) {
              await send(chatId, "🚫 هذا الأمر متاح للمدير العام / المالك / المحاسب فقط.");
              return Response.json({ ok: true });
            }
            const { data: rpt } = await supabaseAdmin.rpc("get_daily_report" as never, { _date: new Date().toISOString().slice(0, 10) } as never);
            const r: any = rpt ?? {};
            const fmt = (n: number) => Number(n ?? 0).toLocaleString("en-US");
            const body = [
              `📊 <b>تقرير اليوم ${r.date ?? ""}</b>`,
              ``,
              `👥 زوار: داخل ${fmt(r.visitors_in)} | خارج ${fmt(r.visitors_out)} | لم يخرجوا ${fmt(r.visitors_still_inside)}`,
              `🛠 أوامر عمل: جديد ${fmt(r.wo_new)} | مغلق ${fmt(r.wo_closed)} | متأخر ${fmt(r.wo_overdue_open)}`,
              `🎫 تذاكر: جديد ${fmt(r.tickets_new)} | مغلق ${fmt(r.tickets_closed)}`,
              `🚨 حوادث: ${fmt(r.incidents_new)} | جولات: ${fmt(r.patrols)}`,
              `💰 مدفوعات: ${fmt(r.payments_received)} ر.س`,
              `💸 مصروفات جديدة: ${fmt(r.expenses_new)} | مدفوعة: ${fmt(r.expenses_paid)}`,
            ].join("\n");
            await send(chatId, body);
          } else {
            await send(chatId, HELP);
          }
          return Response.json({ ok: true });
        } catch (e) {
          console.error("telegram webhook error", e);
          return Response.json({ ok: true });
        }
      },
      GET: async () => new Response("Telegram webhook OK"),
    },
  },
});
