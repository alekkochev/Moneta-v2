// ========================================
// МОНЕТА — track-order (Supabase Edge Function)
// Форма „Следете ја вашата нарачка" во index.html:
// клиентот внесува е-пошта + број на нарачка → барањето
// се испраќа на мејлот на продавницата (info@calivita.mk).
// Кодот за следење потоа рачно го внесува продавачот и
// му го враќа на клиентскиот мејл.
//
// Потребни secrets (supabase secrets set):
//   RESEND_API_KEY  — API клуч од resend.com
//   SENDER_EMAIL    — верификуван испраќач во Resend (на пр. on@calivita.mk)
//   SHOP_EMAIL      — (опционално, default info@calivita.mk)
//   ALLOWED_ORIGIN  — (опционално, default *)
// ========================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");
const SHOP_EMAIL = Deno.env.get("SHOP_EMAIL") || "info@calivita.mk";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { email, orderNumber } = await req.json().catch(() => ({}));

    if (!email || !EMAIL_RE.test(String(email))) {
      return json({ error: "Invalid email" }, 400);
    }
    const order = String(orderNumber || "").trim();
    if (!order) {
      return json({ error: "Missing order number" }, 400);
    }

    if (!RESEND_API_KEY || !SENDER_EMAIL) {
      console.error("Missing RESEND_API_KEY or SENDER_EMAIL secret");
      return json({ error: "Server not configured" }, 500);
    }

    const subject = `📦 Барање за код за следење — нарачка ${order}`;
    const text =
      "Испратете ми код за следење на нарачката на мојот мејл.\n\n" +
      "Број на нарачка: " + order + "\n" +
      "Клиентски мејл: " + email + "\n\n" +
      "Ова барање е испратено преку формуларот „Следете ја вашата нарачка" на moneta-v2-orpin.vercel.app.\n" +
      "Ве молиме рачно внесете го кодот за следење и испратете му го на клиентскиот мејл.";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [SHOP_EMAIL],
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", res.status, errText);
      return json({ error: "Email sending failed" }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("track-order error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
