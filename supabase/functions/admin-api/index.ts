// ============================================
// admin-api — backend за „МОНЕТА Конзола“
// Безбедно запишува во Supabase со service_role клуч.
// Лозинката се чува во тајна (secret) ADMIN_PASSWORD.
// ============================================
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const password = String(body?.password || "");
    const action = String(body?.action || "");
    const payload = body?.payload || {};

    // ---- Проверка на лозинка ----
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "";
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    if (action === "auth") return json({ ok: true });

    // ---- Листа: сите производи + залихи ----
    if (action === "list_all") {
      const [{ data: products, error: e1 }, { data: sizes, error: e2 }] = await Promise.all([
        sb.from("products").select("*").order("sort_order", { ascending: true }),
        sb.from("product_sizes").select("product_id,size,qty"),
      ]);
      if (e1 || e2) return json({ ok: false, error: (e1 || e2)?.message || "list error" }, 500);
      return json({ ok: true, products: products || [], sizes: sizes || [] });
    }

    // ---- Зачувај производ (нов или изменет) ----
    if (action === "save_product") {
      const p = payload.product || {};
      const slug = String(p.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
      if (!slug) return json({ ok: false, error: "Недостасува код (slug)" }, 400);

      const row: Record<string, unknown> = {
        slug,
        name_mk: String(p.name_mk || slug),
        name_en: String(p.name_en || slug),
        category: String(p.category || "ostanato"),
        short_desc_mk: String(p.short_desc_mk || ""),
        short_desc_en: String(p.short_desc_en || ""),
        price: num(p.price),
        image: String(p.image || `./images/cards/${slug}.webp`),
        thumbnail: String(p.thumbnail || `images/cards/${slug}.webp`),
        active: p.active !== false,
        sort_order: num(p.sort_order),
        discount: num(p.discount),
      };
      if (p.discount_from !== undefined) {
        row.discount_from = p.discount_from ? new Date(p.discount_from).toISOString() : null;
      }
      if (p.discount_until !== undefined) {
        row.discount_until = p.discount_until ? new Date(p.discount_until).toISOString() : null;
      }

      const { data: existing } = await sb.from("products").select("id").eq("slug", slug).maybeSingle();
      if (existing) {
        await sb.from("products").update(row).eq("id", existing.id);
      } else {
        await sb.from("products").insert(row);
      }
      const { data: prod } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
      return json({ ok: true, product: prod || null });
    }

    // ---- Избриши производ (и неговите залихи) ----
    if (action === "delete_product") {
      const slug = String(payload.slug || "");
      if (!slug) return json({ ok: false, error: "Недостасува код (slug)" }, 400);
      const { data: prod } = await sb.from("products").select("id").eq("slug", slug).maybeSingle();
      if (!prod) return json({ ok: true, deleted: 0 });
      await sb.from("product_sizes").delete().eq("product_id", prod.id);
      const { error } = await sb.from("products").delete().eq("id", prod.id);
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, deleted: 1 });
    }

    // ---- Залиха: зачувај големини за производ ----
    if (action === "save_sizes") {
      const slug = String(payload.slug || "");
      const rows = Array.isArray(payload.sizes) ? payload.sizes : [];
      const remove = Array.isArray(payload.remove) ? payload.remove : [];
      const { data: prod } = await sb.from("products").select("id").eq("slug", slug).maybeSingle();
      if (!prod) return json({ ok: false, error: "Производот не постои" }, 404);

      for (const r of rows) {
        const size = String(r.size || "").trim();
        if (!size) continue;
        const qty = num(r.qty);
        const { data: existingSize } = await sb
          .from("product_sizes").select("product_id,size")
          .eq("product_id", prod.id).eq("size", size).maybeSingle();
        if (existingSize) {
          await sb.from("product_sizes").update({ qty }).eq("product_id", prod.id).eq("size", size);
        } else {
          await sb.from("product_sizes").insert({ product_id: prod.id, size, qty });
        }
      }
      for (const size of remove) {
        await sb.from("product_sizes").delete().eq("product_id", prod.id).eq("size", String(size));
      }
      return json({ ok: true });
    }

    return json({ ok: false, error: "Непозната акција" }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
