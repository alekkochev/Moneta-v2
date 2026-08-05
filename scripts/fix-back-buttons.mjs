// 1) Отстрани history.back onclick од сите копчиња (→ директно на целната страница)
// 2) Модели: премести го копчето од „Поврзани производи" (долу) → горе (под breadcrumbs)
import fs from 'fs';

const CAT_FILES = ['sportski.html', 'kozni.html', 'letni.html', 'zimski.html', 'hunter.html', 'detski.html', 'outdoor.html', 'heelpad.html'];
const MODEL_FILES = fs.readdirSync('modeli').filter((f) => f.endsWith('.html')).map((f) => `modeli/${f}`);

const PARENT = {
  'active-gel': 'sportski', 'anatomiX': 'sportski', 'memosole': 'sportski', 'sport-style': 'sportski', 'sportex': 'sportski', 'x-treme': 'sportski',
  'heel-pad': 'kozni', 'heel-pad-fix': 'kozni', 'heel-pad-grip': 'kozni', 'topas': 'kozni', 'soft-gel': 'kozni', 'vital': 'kozni', 'relax': 'kozni',
  'simona': 'letni', 'carbon': 'letni',
  'thermo-alu': 'zimski',
  'hunter-outdoor': 'hunter', 'hunter-flex': 'hunter', 'hunter-camo': 'hunter',
  'duck': 'detski',
};

function readBom(f) {
  const b = fs.readFileSync(f);
  const h = b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF;
  let c = b.toString('utf8');
  if (h) c = c.replace(/^\uFEFF/, '');
  return { c, h };
}
function writeBom(f, c, h) { fs.writeFileSync(f, h ? '\uFEFF' + c : c, 'utf8'); }

function toolbarTop(href) {
  return `<div class="categories-toolbar categories-toolbar--top">
                    <a href="${href}" class="btn-back" aria-label="Назад" title="Назад" data-mk-title="Назад" data-sq-title="Prapa" data-en-title="Back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </a>
                </div>`;
}

const ONCLICK_RE = /\sonclick="history\.back\(\); return false;"/g;
const TOOLBAR_RE = /<div class="categories-toolbar">[\s\S]*?<\/div>\s*/;
// граница: крај на breadcrumbs → почеток на model-layout
const BREADCRUMB_BOUNDARY = /(<div class="system-hero__breadcrumbs">[\s\S]*?<\/div>)\s*(<div class="model-layout">)/;

let cleared = 0, moved = 0;

// Категории — само отстрани onclick
for (const f of CAT_FILES) {
  const { c, h } = readBom(f);
  const u = c.replace(ONCLICK_RE, '');
  if (u !== c) { writeBom(f, u, h); cleared++; console.log('✓ onclick отстранет (категорија):', f); }
}

// Модели — отстрани onclick + премести го копчето горе
for (const f of MODEL_FILES) {
  const { c, h } = readBom(f);
  let u = c;
  // 1) отстрани onclick
  u = u.replace(ONCLICK_RE, '');
  // 2) отстрани го копчето од „Поврзани производи" (пред гридот)
  u = u.replace(TOOLBAR_RE, '');
  // 3) вметни го копчето горе (по breadcrumbs, пред model-layout)
  const slug = f.replace('modeli/', '').replace('.html', '');
  const href = '../' + (PARENT[slug] || 'index') + '.html';
  const boundary = BREADCRUMB_BOUNDARY.exec(u);
  if (boundary) {
    u = u.replace(BREADCRUMB_BOUNDARY, `$1\n\n${toolbarTop(href)}\n\n$2`);
    moved++;
    writeBom(f, u, h);
    console.log('✓ модел:', f, '→ копче горе (' + href + ')');
  } else {
    // нема breadcrumbs? само отстрани onclick
    if (u !== c) { writeBom(f, u, h); console.log('— нема breadcrumbs:', f); }
  }
}
console.log(`\nonclick отстранети: ${cleared} | копчиња преместени горе: ${moved}`);
