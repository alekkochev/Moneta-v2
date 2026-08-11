/**
 * ============================================================
 * МОНЕТА — Google Sheets ↔ Supabase синхронизација
 * ============================================================
 * Оваа скрипта ја прикачувате на вашиот Google Excel Sheet
 * (Extensions → Apps Script → залепете го овој код).
 *
 * После тоа во Sheet-от ќе имате мени:
 *   „МОНЕТА" → „Синхронизирај во Supabase" (ажурира + додава нови)
 *   „МОНЕТА" → „Синхронизирај со бришење"  (ажурира + додава + БРИШЕ редови
 *                                             што сте ги избришале во sheet-от)
 *
 * Потребни се 2 таба во sheet-от:
 *   „Производи"  — колони: slug | name_mk | name_en | name_sq | price |
 *                          old_price | discount | image | active | sort_order
 *   „Залиха"     — колони: slug | size | qty        (slug = производ)
 *
 * 1 ред во „Производи" = 1 производ (првиот ред е наслов/колони).
 * 1 ред во „Залиха"   = 1 големина за тој производ.
 * ============================================================
 */

// ── ОВДЕ ВНЕСЕТЕ ГИ ВАШИТЕ ПОДАТОЦИ (види водич чекор 5) ──
const SUPABASE_URL = "https://wkpkrnjrtpywuzemirbw.supabase.co";
const SERVICE_ROLE_KEY = "ЗАМЕНИ_СО_SERVICE_ROLE_КЛУЧ_ОД_SUPABASE";
// ──────────────────────────────────────────────────────────

function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu("МОНЕТА");
  menu.addItem("Синхронизирај во Supabase", "syncProducts");
  menu.addItem("Синхронизирај со бришење", "syncProductsWithDelete");
  menu.addItem("Провери поврзаност", "testConnection");
  menu.addToUi();
}

/** Функција за проверка дали сè е поставено. */
function testConnection() {
  if (SERVICE_ROLE_KEY === "ЗАМЕНИ_СО_SERVICE_ROLE_КЛУЧ_ОД_SUPABASE") {
    SpreadsheetApp.getUi().alert("Прво внесете го SERVICE_ROLE_KEY во кодот (чекор 5 од водичот).");
    return;
  }
  try {
    const r = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/products?select=id&limit=1", {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: "Bearer " + SERVICE_ROLE_KEY },
    });
    SpreadsheetApp.getUi().alert("✅ Поврзаноста е ОК! Supabase одговара.");
  } catch (e) {
    SpreadsheetApp.getUi().alert("❌ Грешка: " + e.message);
  }
}

/** Прочитај таб од sheet-от во низа објекти (прв ред = имиња на колони). */
function readSheet_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Не постои таб „" + sheetName + "“ во sheet-от!");
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h).trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = {};
    let empty = true;
    headers.forEach((h, ci) => {
      const v = values[i][ci];
      row[h] = v === "" || v === null || v === undefined ? "" : String(v).trim();
      if (row[h] !== "") empty = false;
    });
    if (!empty) rows.push(row);
  }
  return rows;
}

function apiHeaders_() {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: "Bearer " + SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function api_(path, method, body) {
  const opts = { method: method, headers: apiHeaders_(), muteHttpExceptions: true };
  if (body !== undefined) opts.payload = JSON.stringify(body);
  const res = UrlFetchApp.fetch(SUPABASE_URL + path, opts);
  const text = res.getContentText();
  const data = text ? JSON.parse(text) : null;
  if (res.getResponseCode() >= 400) {
    throw new Error(method + " " + path + " → " + res.getResponseCode() + " " + text);
  }
  return data;
}

/** Добиј { slug: id } од Supabase. */
function getSlugMap_() {
  const rows = api_("/rest/v1/products?select=id,slug", "GET");
  const m = {};
  (rows || []).forEach((r) => (m[r.slug] = r.id));
  return m;
}

/** Напиши еден производ во Supabase (insert или update по slug). */
function upsertProduct_(p, slugMap) {
  const payload = {
    slug: p.slug,
    name_mk: p.name_mk || "",
    name_en: p.name_en || "",
    name_sq: p.name_sq || "",
    price: parseFloat(p.price) || 0,
    old_price: parseFloat(p.old_price) || 0,
    discount: parseFloat(p.discount) || 0,
    image: p.image || "",
    active: p.active === "" ? true : String(p.active).toLowerCase() === "true" || p.active === "1" || p.active === "да",
    sort_order: parseInt(p.sort_order) || 0,
  };
  if (slugMap[p.slug] !== undefined) {
    api_("/rest/v1/products?slug=eq." + encodeURIComponent(p.slug), "PATCH", payload);
    return { type: "update", slug: p.slug };
  }
  const created = api_("/rest/v1/products", "POST", payload);
  slugMap[p.slug] = created[0]?.id;
  return { type: "insert", slug: p.slug };
}

/** Напиши една големина (insert или update по product_id+size). */
function upsertSize_(slug, size, qty, slugMap, sizeKeys) {
  const pid = slugMap[slug];
  if (!pid) throw new Error("Непознат slug „" + slug + "“ — прво синхронизирај ги производите.");
  const key = pid + "|" + size;
  const payload = { product_id: pid, size: String(size), qty: parseInt(qty) || 0 };
  if (sizeKeys.has(key)) {
    api_("/rest/v1/product_sizes?product_id=eq." + pid + "&size=eq." + encodeURIComponent(size), "PATCH", payload);
    return { type: "update", key: key };
  }
  api_("/rest/v1/product_sizes", "POST", payload);
  sizeKeys.add(key);
  return { type: "insert", key: key };
}

function doSync_(withDelete) {
  const ui = SpreadsheetApp.getUi();
  if (SERVICE_ROLE_KEY === "ЗАМЕНИ_СО_SERVICE_ROLE_КЛУЧ_ОД_SUPABASE") {
    ui.alert("Прво внесете го SERVICE_ROLE_KEY во кодот (чекор 5 од водичот).");
    return;
  }

  const products = readSheet_("Производи");
  const sizes = readSheet_("Залиха");

  const slugMap = getSlugMap_();
  const sizeKeys = new Set();
  api_("/rest/v1/product_sizes?select=product_id,size", "GET").forEach((r) => {
    sizeKeys.add(r.product_id + "|" + r.size);
  });

  let insP = 0, updP = 0, insS = 0, updS = 0, delP = 0, delS = 0;

  // 1) Производи
  for (const p of products) {
    if (!p.slug) continue;
    const r = upsertProduct_(p, slugMap);
    if (r.type === "insert") insP++; else updP++;
  }
  // 2) Големини
  for (const s of sizes) {
    if (!s.slug || !s.size) continue;
    const r = upsertSize_(s.slug, s.size, s.qty, slugMap, sizeKeys);
    if (r.type === "insert") insS++; else updS++;
  }
  // 3) Бришење (само ако е побарано)
  if (withDelete) {
    const sheetSlugs = new Set(products.map((p) => p.slug).filter(Boolean));
    Object.entries(slugMap).forEach(([slug, id]) => {
      if (!sheetSlugs.has(slug)) {
        api_("/rest/v1/products?slug=eq." + encodeURIComponent(slug), "DELETE");
        delP++;
      }
    });
    const sheetKeys = new Set();
    sizes.forEach((s) => {
      if (slugMap[s.slug] && s.size) sheetKeys.add(slugMap[s.slug] + "|" + s.size);
    });
    [...sizeKeys].forEach((key) => {
      if (!sheetKeys.has(key)) {
        const [pid, size] = key.split("|");
        api_("/rest/v1/product_sizes?product_id=eq." + pid + "&size=eq." + encodeURIComponent(size), "DELETE");
        delS++;
      }
    });
  }

  ui.alert(
    "✅ Синхронизацијата заврши!\n\n" +
      "Производи: +" + insP + " нови, " + updP + " ажурирани" + (delP ? ", " + delP + " избришани" : "") + "\n" +
      "Големини:  +" + insS + " нови, " + updS + " ажурирани" + (delS ? ", " + delS + " избришани" : "")
  );
}

function syncProducts() { doSync_(false); }
function syncProductsWithDelete() { doSync_(true); }
