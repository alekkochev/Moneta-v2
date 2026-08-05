// 1) „Влошки" линк во navbar → dropdown со брзо бирање на категории (сите страници)
// 2) Кружно копче „Назад" над производите (сите страници со грид)
import fs from 'fs';

const ROOT_FILES = [
  'index.html', 'cart.html', 'dostava.html', 'kviz.html', 'naracka.html', 'sistem.html', 'uslovi.html',
  'sportski.html', 'kozni.html', 'letni.html', 'zimski.html', 'hunter.html', 'detski.html', 'outdoor.html', 'heelpad.html',
];
const MODEL_FILES = fs.readdirSync('modeli').filter((f) => f.endsWith('.html')).map((f) => `modeli/${f}`);
const ALL_FILES = [...ROOT_FILES, ...MODEL_FILES].filter((f) => fs.existsSync(f));

// мапирање модел → родителска категорија
const PARENT = {
  'active-gel': 'sportski', 'anatomiX': 'sportski', 'memosole': 'sportski', 'sport-style': 'sportski', 'sportex': 'sportski', 'x-treme': 'sportski',
  'heel-pad': 'kozni', 'heel-pad-fix': 'kozni', 'heel-pad-grip': 'kozni', 'topas': 'kozni', 'soft-gel': 'kozni', 'vital': 'kozni', 'relax': 'kozni',
  'simona': 'letni', 'carbon': 'letni',
  'thermo-alu': 'zimski',
  'hunter-outdoor': 'hunter', 'hunter-flex': 'hunter', 'hunter-camo': 'hunter',
  'duck': 'detski',
};

function readWithBom(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let content = buf.toString('utf8');
  if (hasBom) content = content.replace(/^\uFEFF/, '');
  return { content, hasBom };
}
function writeWithBom(file, content, hasBom) {
  fs.writeFileSync(file, hasBom ? '\uFEFF' + content : content, 'utf8');
}

function navDropdown(prefix, active) {
  const cats = [
    ['sportski', 'Спортски', 'Sportive', 'Sports'],
    ['kozni', 'Кожни', 'Lëkure', 'Leather'],
    ['letni', 'Летни', 'Verore', 'Summer'],
    ['zimski', 'Зимски', 'Dimëror', 'Winter'],
    ['hunter', 'HUNTER', 'HUNTER', 'HUNTER'],
    ['detski', 'Детски', 'Për fëmijë', 'Kids'],
  ];
  const items = cats
    .map(([slug, mk, sq, en]) => `      <a href="${prefix}${slug}.html" role="menuitem" data-mk="${mk}" data-sq="${sq}" data-en="${en}">${mk}</a>`)
    .join('\n');
  return `<li class="navbar__dd">
                    <button type="button" class="navbar__dd-trigger${active ? ' is-active' : ''}" aria-haspopup="true" aria-expanded="false" data-mk="Влошки" data-sq="Tabana" data-en="Insoles">Влошки
                        <svg class="navbar__dd-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div class="navbar__dd-menu" role="menu">
${items}
                    </div>
                </li>`;
}

function backToolbar(href) {
  return `<div class="categories-toolbar">
                    <a href="${href}" class="btn-back" onclick="history.back(); return false;" aria-label="Назад" title="Назад" data-mk-title="Назад" data-sq-title="Prapa" data-en-title="Back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </a>
                </div>`;
}

const NAV_RE = /<li><a href="(\.\.\/|\.\/)index\.html#kategorii"( class="is-active")? data-mk="Влошки" data-sq="Tabana" data-en="Insoles">Влошки<\/a><\/li>/;
const GRID = '<div class="categories__grid grid-3">';

let navCount = 0, backCount = 0;
for (const file of ALL_FILES) {
  const { content, hasBom } = readWithBom(file);
  let updated = content;
  let changed = false;

  // 1) Навигациски dropdown
  updated = updated.replace(NAV_RE, (m, prefix, active) => {
    navCount++;
    changed = true;
    return navDropdown(prefix, !!active);
  });

  // 2) Копче Назад (само каде има грид)
  if (updated.includes(GRID)) {
    const isRoot = !file.startsWith('modeli/');
    let href;
    if (isRoot) {
      href = './index.html';
    } else {
      const slug = file.replace('modeli/', '').replace('.html', '');
      href = '../' + (PARENT[slug] || 'index') + '.html';
    }
    if (updated.includes('class="categories-toolbar"')) {
      updated = updated.replace(/<div class="categories-toolbar">[\s\S]*?<\/div>\s*/, backToolbar(href) + '\n');
      changed = true;
      backCount++;
    } else {
      updated = updated.replace(GRID, backToolbar(href) + '\n        ' + GRID);
      changed = true;
      backCount++;
    }
  }

  if (changed) writeWithBom(file, updated, hasBom);
  console.log(`✓ ${file}${changed ? '' : ' (без промена)'}`);
}
console.log(`\nНавигациски dropdown: ${navCount} | Копчиња Назад: ${backCount}`);
