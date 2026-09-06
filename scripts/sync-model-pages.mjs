// sync-model-pages.mjs — еднократна локална алатка:
// 1) Ги трга stock.json прекривањата од СИТЕ модел-страници (modeli/*.html)
//    — цената/залихата/големините доаѓаат само од Supabase (конзолата).
// 2) Ги бампнува ?v= на styles.css и script.js (v20260906a) на сите *.html.
// Пуштање: node scripts/sync-model-pages.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const STOCK_BLOCK_OLD = `        let selectedSize = null;
        fetch("../stock.json")
            .then(r => r.json())
            .then(data => {
                const model = data[MODEL];
                if (!model) return;
                const priceEl = document.querySelector(".model-price");
                if (priceEl) {
                    const mk = "Цена: " + model.price + " ден.";
                    const sq = "Çmimi: " + model.price + " den.";
                    const en = "Price: " + model.price + " MKD";
                    priceEl.setAttribute("data-mk", mk);
                    priceEl.setAttribute("data-sq", sq);
                    priceEl.setAttribute("data-en", en);
                    priceEl.textContent = mk;
                }
                if (cart) { cart.dataset.price = model.price; cart.dataset.code = model.code; }
                const sizes = model.sizes;
                grid.querySelectorAll(".size-btn").forEach(btn => {
                    const sz = btn.dataset.size;
                    if (!sizes[sz] || sizes[sz] <= 0) {
                        btn.classList.add("size-btn--disabled");
                        btn.setAttribute("aria-disabled", "true");
                        btn.tabIndex = -1;
                    }
                });
                if (cart) cart.classList.add("model-cart--disabled");
            })
            .catch(() => { if (hint) { hint.textContent = "Грешка при вчитување на залихите."; hint.classList.add("error"); } });`;

const STOCK_BLOCK_NEW = `        let selectedSize = null;
        // Големините и залихата ги вчитува script.js директно од Supabase (конзолата) —
        // тука нема stock.json (двоен извор предизвикуваше race со цените/попустите).
        if (cart) cart.classList.add("model-cart--disabled");`;

const NEW_VER = "v20260906g";
const EOL = (c) => (c.includes("\r\n") ? "\r\n" : "\n");

let changed = 0;
let bumped = 0;

// 1) Модел-страници
const modeliDir = join(root, "modeli");
for (const name of readdirSync(modeliDir).filter((n) => n.endsWith(".html"))) {
  const file = join(modeliDir, name);
  const raw = readFileSync(file, "utf8");
  const eol = EOL(raw);
  const norm = raw.replace(/\r\n/g, "\n");
  let dirty = false;
  let out = norm;
  if (out.includes(STOCK_BLOCK_OLD)) {
    out = out.replace(STOCK_BLOCK_OLD, STOCK_BLOCK_NEW);
    changed++;
    dirty = true;
  }
  const bumpedVer = out
    .replace(/(styles\.css\?v=)[^"')\s]+/g, "$1" + NEW_VER)
    .replace(/(script\.js\?v=)[^"')\s]+/g, "$1" + NEW_VER);
  if (bumpedVer !== out) dirty = true;
  if (dirty) {
    writeFileSync(file, eol === "\r\n" ? bumpedVer.replace(/\n/g, "\r\n") : bumpedVer, "utf8");
    bumped++;
  }
}

// 1b) Варијанта со единични наводници (active-gel, snakex …) — генерален regex
for (const name of readdirSync(modeliDir).filter((n) => n.endsWith(".html"))) {
  const file = join(modeliDir, name);
  const raw = readFileSync(file, "utf8");
  if (!raw.includes("Fetch stock data")) continue;
  const eol = EOL(raw);
  const norm = raw.replace(/\r\n/g, "\n");
  const out = norm.replace(
    /(let selectedSize = null;)[\s\S]*?(?=\n\s*grid\.addEventListener\()/,
    '$1\n\n        // Големините и залихата ги вчитува script.js од Supabase (конзолата)\n        if (cart) cart.classList.add("model-cart--disabled");'
  );
  writeFileSync(file, eol === "\r\n" ? out.replace(/\n/g, "\r\n") : out, "utf8");
  changed++;
  bumped++;
}

// 2) Корен *.html
for (const name of readdirSync(root).filter((n) => n.endsWith(".html"))) {
  const file = join(root, name);
  const raw = readFileSync(file, "utf8");
  const eol = EOL(raw);
  const norm = raw.replace(/\r\n/g, "\n");
  const out = norm
    .replace(/(styles\.css\?v=)[^"')\s]+/g, "$1" + NEW_VER)
    .replace(/(script\.js\?v=)[^"')\s]+/g, "$1" + NEW_VER);
  if (out !== norm) {
    writeFileSync(file, eol === "\r\n" ? out.replace(/\n/g, "\r\n") : out, "utf8");
    bumped++;
  }
}

console.log(`OK — stock.json отстранет од ${changed} модел-страници, ?v= бампнат на ${bumped} страници.`);
