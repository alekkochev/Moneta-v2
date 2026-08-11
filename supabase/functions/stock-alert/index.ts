// ========================================
// МОНЕТА — stock-alert (Supabase Edge Function)
// Проверува залиха и испраќа email известување кога некоја големина
// или производ падне на ≤ LOW_STOCK (3) комади.
//
// Потребни secrets:
//   RESEND_API_KEY     — API клуч од resend.com (веќе постои)
//   SENDER_EMAIL       — верификуван испраќач (веќе постои)
//   STOCK_ALERT_EMAIL  — примач (default: vloski.mk@gmail.com)
//   SUPABASE_SERVICE_ROLE_KEY — за читање product_sizes (веќе постои)
//
// Се стартува рачно или преку pg_cron (види stock-alert-cron.sql)
// ========================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");
const ALERT_EMAIL = Deno.env.get("STOCK_ALERT_EMAIL") || "vloski.mk@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const LOW_STOCK = 3; // праг — истиот како на страницата

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

serve(async () => {
  try {
    if (!RESEND_API_KEY || !SENDER_EMAIL || !SUPABASE_URL || !SERVICE_KEY) {
      console.error("Missing required secrets");
      return json({ error: "Server not configured" }, 500);
    }

    // 1. Читај производи + големини
    const h = { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY };
    const [products, sizes] = await Promise.all([
      fetch(SUPABASE_URL + "/rest/v1/products?select=id,slug,name_mk", { headers: h }).then((r) => r.json()),
      fetch(SUPABASE_URL + "/rest/v1/product_sizes?select=product_id,size,qty", { headers: h }).then((r) => r.json()),
    ]);

    const nameById = {};
    (products || []).forEach((p) => { nameById[p.id] = p.name_mk || p.slug; });

    // 2. Најди ниска залиха: големина qty ≤ 3 или производ вкупно ≤ 3
    const lowItems = []; // { name, size, qty }
    const totalByProduct = {};
    (sizes || []).forEach((s) => {
      const qty = Number(s.qty) || 0;
      totalByProduct[s.product_id] = (totalByProduct[s.product_id] || 0) + qty;
      if (qty <= LOW_STOCK) {
        lowItems.push({ name: nameById[s.product_id] || s.product_id, size: s.size, qty });
      }
    });

    // Производи чија ВКУПНА залиха е ≤ 3 (без конкретна големина)
    const lowTotal = Object.entries(totalByProduct)
      .filter(([, q]) => Number(q) <= LOW_STOCK)
      .map(([pid, q]) => ({ name: nameById[pid] || pid, size: "сите", qty: Number(q) }));

    // Комбинирај (без дупликати за ист производ+големина)
    const seen = new Set();
    const allLow = [...lowItems, ...lowTotal].filter((it) => {
      const k = it.name + "|" + it.size;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (allLow.length === 0) {
      return json({ ok: true, message: "Нема ниска залиха", count: 0 });
    }

    // 3. Испрати email
    const rows = allLow
      .map((it) => `• ${it.name} — ${it.size}: ${it.qty} ком.`)
      .join("\n");
    const subject = `⚠️ Ниска залиха (${allLow.length} ставки) — МОНЕТА`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [ALERT_EMAIL],
        subject,
        text: `Следниве производи имаат ниска залиха (≤ ${LOW_STOCK} ком.):\n\n${rows}\n\nПроверете и надополнете ја залихата во Supabase → Table Editor → product_sizes.\n\n— автоматско известување vloski.mk`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", res.status, body);
      return json({ error: "Email failed", detail: body }, 502);
    }

    return json({ ok: true, count: allLow.length, items: allLow });
  } catch (e) {
    console.error("stock-alert error:", e.message);
    return json({ error: e.message }, 500);
  }
});
