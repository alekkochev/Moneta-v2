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
      Deno.env.get("MONETA_SERVICE_ROLE") || "",
      { auth: { persistSession: false } }
    );

    if (action === "auth") return json({ ok: true });

    // ---- Листа: сите производи + залихи + категории ----
    if (action === "list_all") {
      const [{ data: products, error: e1 }, { data: sizes, error: e2 }] = await Promise.all([
        sb.from("products").select("*").order("sort_order", { ascending: true }),
        sb.from("product_sizes").select("product_id,size,qty"),
      ]);
      if (e1 || e2) return json({ ok: false, error: (e1 || e2)?.message || "list error" }, 500);
      // Категориите не смеат да го блокираат list_all ако табелата уште не е креирана
      let categories: unknown[] = [];
      const { data: cats, error: e3 } = await sb
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!e3) categories = cats || [];
      return json({ ok: true, products: products || [], sizes: sizes || [], categories });
    }

    // ---- Листа само категории ----
    if (action === "list_categories") {
      const { data: categories, error } = await sb
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, categories: categories || [] });
    }

    // ---- Зачувај категорија (нова или изменета, под-категорија преку parent_id) ----
    if (action === "save_category") {
      const c = payload.category || {};
      const slug = String(c.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
      if (!slug) return json({ ok: false, error: "Недостасува код (slug)" }, 400);
      if (!String(c.name_mk || "").trim()) return json({ ok: false, error: "Внеси име (МК)" }, 400);

      const row: Record<string, unknown> = {
        slug,
        name_mk: String(c.name_mk || slug).trim(),
        name_sq: String(c.name_sq || "").trim(),
        name_en: String(c.name_en || "").trim(),
        image: String(c.image || "").trim(),
        sort_order: num(c.sort_order),
        active: c.active !== false,
        updated_at: new Date().toISOString(),
      };
      const parent = String(c.parent_id || "").trim();
      if (parent) {
        // Ако parent е slug → пронајди id; ако е id → користи директно
        const { data: parentCat } = await sb
          .from("categories")
          .select("id")
          .or(`slug.eq.${parent},id.eq.${parent}`)
          .maybeSingle();
        if (parentCat) row.parent_id = parentCat.id;
      } else {
        row.parent_id = null;
      }

      const { data: existing } = await sb.from("categories").select("id").eq("slug", slug).maybeSingle();
      if (existing) {
        await sb.from("categories").update(row).eq("id", existing.id);
      } else {
        await sb.from("categories").insert(row);
      }
      const { data: cat } = await sb.from("categories").select("*").eq("slug", slug).maybeSingle();
      return json({ ok: true, category: cat || null });
    }

    // ---- Избриши категорија: производите одат во „ostanato“ ----
    if (action === "delete_category") {
      const slug = String(payload.slug || "");
      if (!slug) return json({ ok: false, error: "Недостасува код (slug)" }, 400);
      const { data: cat } = await sb.from("categories").select("id").eq("slug", slug).maybeSingle();
      if (!cat) return json({ ok: true, deleted: 0 });

      // Под-категориите стануваат корен категории
      await sb.from("categories").update({ parent_id: null }).eq("parent_id", cat.id);
      // Производите одат во „ostanato“ (доколку постои)
      const { data: ostanato } = await sb.from("categories").select("slug").eq("slug", "ostanato").maybeSingle();
      await sb.from("products").update({ category: ostanato ? "ostanato" : slug }).eq("category", slug);
      const { error } = await sb.from("categories").delete().eq("id", cat.id);
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, deleted: 1 });
    }

    // ---- Зачувај производ (нов или изменет) ----
    if (action === "save_product") {
      const p = payload.product || {};
      const slug = String(p.slug || "").trim().toLowerCase().replace(/\s+/g, "-");
      if (!slug) return json({ ok: false, error: "Недостасува код (slug)" }, 400);

      const cat = String(p.category || "ostanato").trim().toLowerCase().replace(/\s+/g, "-") || "ostanato";

      const row: Record<string, unknown> = {
        slug,
        name_mk: String(p.name_mk || slug),
        name_sq: String(p.name_sq || ""),
        name_en: String(p.name_en || slug),
        category: cat,
        short_desc_mk: String(p.short_desc_mk || ""),
        short_desc_sq: String(p.short_desc_sq || ""),
        short_desc_en: String(p.short_desc_en || ""),
        price: num(p.price),
        image: String(p.image || `./images/cards/${slug}.webp`),
        thumbnail: String(p.thumbnail || `images/cards/${slug}.webp`),
        active: p.active !== false,
        sort_order: num(p.sort_order),
        discount: num(p.discount),
      };
      // Спецификации: jsonb array [{label:{mk,sq,en}, value:{mk,sq,en}}]
      if (Array.isArray(p.specs)) {
        row.specs = JSON.stringify(p.specs.filter((s: any) => s && (s.label?.mk || s.value?.mk)));
      } else if (p.specs !== undefined) {
        row.specs = JSON.stringify([]);
      }
      if (p.discount_from !== undefined) {
        row.discount_from = p.discount_from ? new Date(p.discount_from).toISOString() : null;
      }
      if (p.discount_until !== undefined) {
        row.discount_until = p.discount_until ? new Date(p.discount_until).toISOString() : null;
      }

      // Ако категоријата е нова (ја нема во categories) → автоматски ја создаваме
      const { data: catRow } = await sb.from("categories").select("id").eq("slug", cat).maybeSingle();
      if (!catRow && cat !== "ostanato") {
        await sb.from("categories").insert({
          slug: cat,
          name_mk: cat,
          name_sq: "",
          name_en: "",
          sort_order: 50,
        }).select().then(async ({ error }) => {
          if (error) console.warn("auto-create category failed", error.message);
        });
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

    // ---- Качи слика во Storage (product-images) ----
    if (action === "upload_image") {
      const filename = String(payload.filename || "").replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase().slice(0, 120);
      const b64 = String(payload.base64 || "");
      if (!filename || !b64) return json({ ok: false, error: "Недостасува слика" }, 400);

      // Дозволени типови
      const dataUrl = b64.match(/^data:([^;]+);base64,(.+)$/);
      let contentType = "image/webp";
      let base64Data = b64;
      if (dataUrl) {
        contentType = dataUrl[1];
        base64Data = dataUrl[2];
      }
      if (!/^image\/(png|jpe?g|webp|gif)$/i.test(contentType)) {
        return json({ ok: false, error: "Дозволени се само слики (PNG/JPG/WEBP/GIF)" }, 400);
      }

      // Име: ако нема екстензија, додај од contentType
      let safeName = filename;
      if (!/\.(png|jpe?g|webp|gif)$/i.test(safeName)) {
        const ext = contentType === "image/png" ? "png" : contentType === "image/jpeg" ? "jpg" : contentType === "image/gif" ? "gif" : "webp";
        safeName = safeName + "." + ext;
      }

      // Декодирај base64 → bytes
      let bytes: Uint8Array;
      try {
        const bin = atob(base64Data);
        bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      } catch (e) {
        return json({ ok: false, error: "Невалидна слика (base64)" }, 400);
      }
      if (bytes.length > 5 * 1024 * 1024) {
        return json({ ok: false, error: "Сликата е поголема од 5 MB" }, 400);
      }

      const { error } = await sb.storage.from("product-images").upload(safeName, bytes, {
        contentType,
        upsert: true,
      });
      if (error) return json({ ok: false, error: error.message }, 500);

      const publicUrl = sb.storage.from("product-images").getPublicUrl(safeName).data.publicUrl;
      return json({ ok: true, url: publicUrl });
    }

    return json({ ok: false, error: "Непозната акција" }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
