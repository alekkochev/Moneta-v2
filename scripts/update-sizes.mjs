// ============================================================
// update-sizes.mjs — Точка 1: Корекција на големини по модел
// Извор на вистина: постоечката страна https://www.insoles.mk
// Правила (од клиентот):
//   1. Големините како ПОЕДИНЕЧНИ броеви (опсезите се распаѓаат)
//   2. Универзалните модели (Carbon, Heel Pad Grip) → само „Универзална“
//   3. Active Gel → „Женски 35–41“ / „Машки 42–45“
// ============================================================
import { readFileSync, writeFileSync, readdirSync } from 'fs';

const SIZE_12 = ['35','36','37','38','39','40','41','42','43','44','45','46'];
const SIZE_13 = ['35','36','37','38','39','40','41','42','43','44','45','46','47'];
const SIZE_9  = ['35','37','38','39','41','42','43','45','46'];
const SIZE_8  = ['35','37','39','41','42','43','45','46'];
const DUCK    = ['27','29','30','32','34','35'];

const TARGET = {
  'memosole':       SIZE_12,
  'heel-pad':       SIZE_12,
  'heel-pad-fix':   SIZE_12,
  'hunter-camo':    SIZE_13,
  'hunter-flex':    SIZE_13,
  'hunter-outdoor': SIZE_13,
  'active-gel':     [['z35-41','Женски 35–41'], ['m42-45','Машки 42–45']],
  'anatomiX':       SIZE_8,
  'sport-style':    SIZE_9,
  'sportex':        SIZE_9,
  'x-treme':        SIZE_9,
  'topas':          SIZE_9,
  'soft-gel':       SIZE_9,
  'vital':          SIZE_9,
  'relax':          SIZE_9,
  'simona':         SIZE_9,
  'thermo-alu':     SIZE_9,
  'carbon':         [['univerzalna','Универзална']],
  'heel-pad-grip':  [['univerzalna','Универзална']],
  'duck':           DUCK,
};

// ---------- 1) stock.json ----------
const stockPath = 'stock.json';
const stock = JSON.parse(readFileSync(stockPath, 'utf8'));

for (const [key, items] of Object.entries(TARGET)) {
  const model = stock[key];
  if (!model) { console.log('SKIP stock (no model):', key); continue; }
  const newSizes = {};
  for (const it of items) {
    const sz = Array.isArray(it) ? it[0] : it;
    const cur = model.sizes && model.sizes[sz];
    newSizes[sz] = (typeof cur === 'number' && cur > 0) ? cur : 1;
  }
  model.sizes = newSizes;
}
writeFileSync(stockPath, JSON.stringify(stock, null, 2) + '\n', 'utf8');
console.log('stock.json -> OK');

// ---------- 2) modeli/*.html ----------
const modelFiles = readdirSync('modeli').filter(f => f.endsWith('.html'));
for (const fn of modelFiles) {
  const key = fn.replace('.html', '');
  const items = TARGET[key];
  if (!items) { console.log('SKIP (no target):', fn); continue; }

  let html = readFileSync('modeli/' + fn, 'utf8');

  // 2a) Замени ги копчињата во size grid
  const gridRe = /(<div class="size-selector__grid" data-size-grid>)([\s\S]*?)(\s*<\/div>)/;
  if (!gridRe.test(html)) { console.log('WARN (no grid):', fn); continue; }

  html = html.replace(gridRe, (m, open, inner, close) => {
    const btnIndent = (inner.match(/\n(\s*)<button/) || [null, '                                    '])[1];
    const divIndent = btnIndent.length >= 4 ? btnIndent.slice(0, -4) : '';
    const btns = items.map((it) => {
      const sz = Array.isArray(it) ? it[0] : it;
      const label = Array.isArray(it) ? it[1] : it;
      return btnIndent + '<button type="button" class="size-btn" data-size="' + sz + '">' + label + '</button>';
    }).join('\n');
    return open + '\n' + btns + '\n' + divIndent + '</div>';
  });

  // 2b) Прилагоди го inline JS (го користи ТЕКСТОТ на копчето, не data-size)
  //     за да функционираат „Универзална“ и „Женски/Машки“ опциите
  html = html.replace(/selectedSize = btn\.dataset\.size;/g, 'selectedSize = btn.textContent.trim();');
  html = html.replace(
    /hint\.textContent = ['"]Избран број: ['"] \+ selectedSize;/g,
    "hint.textContent = 'Избрана големина: ' + selectedSize;"
  );
  html = html.replace(
    /cart\.dataset\.nameMk = nameMk \+ ['"] бр\.['"] \+ selectedSize;/g,
    "cart.dataset.nameMk = nameMk + ' (' + selectedSize + ')';"
  );
  html = html.replace(
    /cart\.dataset\.nameEn = nameEn \+ ['"] sz\.['"] \+ selectedSize;/g,
    "cart.dataset.nameEn = nameEn + ' (' + selectedSize + ')';"
  );

  writeFileSync('modeli/' + fn, html, 'utf8');
  console.log('OK:', fn);
}
console.log('DONE');
