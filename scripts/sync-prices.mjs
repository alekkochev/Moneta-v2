// Точка 9: Синхронизација на цените со постоечката страна (извор на вистина)
// Ги ажурира: stock.json + modeli/*.html (data-price, прикажана цена MK/SQ/EN)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Целни цени од https://www.insoles.mk (потврдени 2026-08-05)
const PRICES = {
  'active-gel': 620,
  'anatomiX': 430,
  'sport-style': 300,
  'sportex': 230,
  'x-treme': 420,
  'topas': 490,
  'vital': 450,
  'relax': 570,
  'soft-gel': 820,
  'carbon': 170,
  'simona': 120,
  'thermo-alu': 210,
  'hunter-camo': 330,
  'hunter-flex': 330,
  'hunter-outdoor': 330,
  'duck': 490,
  'heel-pad': 250,
  'heel-pad-fix': 210,
  'heel-pad-grip': 100,
  'memosole': 400,
};

// 1) stock.json
const stockPath = join(root, 'stock.json');
const stock = JSON.parse(readFileSync(stockPath, 'utf8'));
let stockChanged = 0;
for (const [model, price] of Object.entries(PRICES)) {
  if (stock[model] && stock[model].price !== price) {
    console.log(`stock.json: ${model} ${stock[model].price} -> ${price}`);
    stock[model].price = price;
    stockChanged++;
  }
}
writeFileSync(stockPath, JSON.stringify(stock, null, 2) + '\n');
console.log(`stock.json: ${stockChanged} промени`);

// 2) modeli/*.html
let htmlChanged = 0;
for (const [model, price] of Object.entries(PRICES)) {
  const file = join(root, 'modeli', `${model}.html`);
  let html;
  try { html = readFileSync(file, 'utf8'); } catch { continue; }

  const oldDataPrice = (html.match(/data-price="(\d+)"/) || [])[1];
  if (!oldDataPrice) { console.log(`[SKIP] ${model}: нема data-price`); continue; }

  const oldN = oldDataPrice;
  if (String(oldN) === String(price)) continue; // веќе точно

  const rePrice = new RegExp(`data-mk="Цена: ${oldN} ден\\." data-sq="Çmimi: ${oldN} den\\." data-en="Price: ${oldN} MKD">Цена: ${oldN} ден\\.`);
  const newPriceBlock = `data-mk="Цена: ${price} ден." data-sq="Çmimi: ${price} den." data-en="Price: ${price} MKD">Цена: ${price} ден.`;

  let next = html.replace(`data-price="${oldN}"`, `data-price="${price}"`);
  next = next.replace(rePrice, newPriceBlock);

  if (next !== html) {
    writeFileSync(file, next);
    console.log(`${model}.html: data-price ${oldN} -> ${price} (+ цена MK/SQ/EN)`);
    htmlChanged++;
  } else {
    console.log(`[ПАЗИ] ${model}.html: data-price заменет но блокот со цена не е најден`);
  }
}
console.log(`modeli/*.html: ${htmlChanged} фајла променети`);
console.log('Готово.');
