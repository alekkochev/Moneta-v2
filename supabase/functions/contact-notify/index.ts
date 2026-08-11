// ========================================
// МОНЕТА — contact-notify (Supabase Edge Function)
// Се повикува од index.html (контакт форма) — испраќа порака преку Resend.
// (Замени го поранешниот EmailJS со истиот Resend систем како нарачките.)
//
// Потребни secrets (исти како order-notify):
//   RESEND_API_KEY  — API клуч од resend.com
//   SENDER_EMAIL    — верификуван испраќач во Resend (on@vloski.mk)
//   CONTACT_EMAILS  — примачи на контакт пораки (опционално; fallback SHOP_EMAIL → nudalsmudals@gmail.com)
//   ALLOWED_ORIGIN  — (опционално, default *)
// ========================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const CONTACT_EMAILS = (
  Deno.env.get("CONTACT_EMAILS") ||
  Deno.env.get("SHOP_EMAIL") ||
  "nudalsmudals@gmail.com"
)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (!RESEND_API_KEY || !SENDER_EMAIL) {
      console.error("Missing RESEND_API_KEY or SENDER_EMAIL secret");
      return json({ error: "Server not configured" }, 500);
    }
    if (CONTACT_EMAILS.length === 0) {
      return json({ error: "No contact recipients configured" }, 500);
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return json({ error: "Missing required fields" }, 400);
    }

    const text =
      "Нова порака од контакт формата — МОНЕТА (www.vloski.mk)\n" +
      "========================================================\n\n" +
      "Име: " + name + "\n" +
      "Е-пошта: " + email + "\n" +
      "Телефон: " + (phone || "-") + "\n\n" +
      "--- ПОРАКА ---\n" +
      (message || "-") + "\n";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: CONTACT_EMAILS,
        bcc: CONTACT_HIDDEN_EMAILS,
        subject: `✉️ Контакт од веб — ${name}`,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend error:", detail);
      return json({ error: "Resend failed", detail: String(detail).slice(0, 500) }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
