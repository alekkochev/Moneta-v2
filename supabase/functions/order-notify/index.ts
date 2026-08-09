// ========================================
// МОНЕТА — order-notify (Supabase Edge Function)
// Се повикува од naracka.html по зачувување на нарачката во базата.
// Испраќа автоматски мејл за НОВА НАРАЧКА до примачите (ORDER_EMAILS).
//
// Потребни secrets (supabase secrets set):
//   RESEND_API_KEY  — API клуч од resend.com
//   SENDER_EMAIL    — верификуван испраќач во Resend (on@vloski.mk)
//   ORDER_EMAILS    — примачи, разделени со запирка (на пр. nudalsmudals@gmail.com,aposus@gmail.com)
//   ALLOWED_ORIGIN  — (опционално, default *)
// ========================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const VAT_RATE = parseFloat(Deno.env.get("VAT_RATE") || "0.18") || 0.18;
const ORDER_EMAILS = (Deno.env.get("ORDER_EMAILS") || "nudalsmudals@gmail.com,aposus@gmail.com")
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

function makeInvoiceNumber(now: Date): string {
  return (
    "INV-" + now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") + "-" +
    String(Math.floor(Math.random() * 9000) + 1000)
  );
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
    if (ORDER_EMAILS.length === 0) {
      return json({ error: "No order recipients configured" }, 500);
    }

    const invNo = makeInvoiceNumber(new Date());

    // Кратка потврда во мејлот; сите детали се во приложената испратница (PDF).
    const text =
      "Нова нарачка — МОНЕТА (www.vloski.mk)\n" +
      "========================================\n\n" +
      "Почитувани,\n\n" +
      "Успешно е направена нарачка од МОНЕТА (www.vloski.mk).\n" +
      "Сите детали за нарачката се наоѓаат во приложената испратница (PDF).\n\n" +
      "Испратница: " + invNo + "\n" +
      "Купувач: " + (body.name || "-") + "\n" +
      "Телефон: " + (body.phone || "-") + "\n";

    // PDF испратницата ја генерира прелистувачот (invoice-pdf.js) и ја праќа како base64
    const pdfBase64 = String(body.pdfBase64 || "");

    const emailPayload: any = {
      from: SENDER_EMAIL,
      to: ORDER_EMAILS,
      subject: `🛒 Испратница ${invNo} — Нова нарачка — МОНЕТА`,
      text,
    };
    if (pdfBase64) {
      emailPayload.attachments = [{ filename: invNo + ".pdf", content: pdfBase64 }];
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend error:", detail);
      return json({ error: "Resend failed", detail: String(detail).slice(0, 500) }, 500);
    }

    return json({ ok: true, invoice: invNo, pdf: !!pdfBase64 });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
