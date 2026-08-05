// validate-compare.mjs — темелна валидација на COMPARE_PRODUCTS
import { readFileSync } from 'fs';

const js = readFileSync('script.js', 'utf8');
const start = js.indexOf('const COMPARE_PRODUCTS = {');
const end = js.indexOf('};', start) + 2;
const block = js.slice(start, end);

let COMPARE_PRODUCTS;
try {
  COMPARE_PRODUCTS = Function(block + '; return COMPARE_PRODUCTS;')();
} catch (e) {
  console.log('FATAL: не може да се парсира COMPARE_PRODUCTS ->', e.message);
  process.exit(1);
}

const keys = Object.keys(COMPARE_PRODUCTS);
console.log('Модели:', keys.length);

const required = ['material', 'purpose', 'archSupport', 'shockAbsorption', 'thickness', 'keyFeature', 'footwear', 'odorControl', 'care', 'fatigue'];
let problems = 0;

for (const k of keys) {
  const m = COMPARE_PRODUCTS[k];
  const errs = [];
  if (!m.name || !m.name.mk || !m.name.en) errs.push('name');
  if (!m.image || !/^\.\/images\/cards\//.test(m.image)) errs.push('image:' + m.image);
  if (!m.link) errs.push('link');
  if (!m.price) errs.push('price');
  if (!m.category) errs.push('category');
  for (const r of required) {
    const s = m.specs && m.specs[r];
    if (!s) errs.push('specs.' + r);
    else if (!s.mk || !s.en) errs.push('specs.' + r + ' (превод)');
  }
  const arch = m.specs && m.specs.archSupport;
  if (arch && !arch.badgeClass) errs.push('archSupport.badgeClass');
  const shock = m.specs && m.specs.shockAbsorption;
  if (shock && !shock.stars) errs.push('shockAbsorption.stars');
  if (errs.length) { problems++; console.log('  ПРОБЛЕМ', k + ':', errs.join(', ')); }
}

console.log(problems ? 'НАЈДЕНИ ПРОБЛЕМИ: ' + problems : 'СИТЕ 20 МОДЕЛИ СЕ ПОТПОЛНИ ✓');

// Пример-извадок за еден модел
console.log('\nПример (active-gel):', JSON.stringify(COMPARE_PRODUCTS['active-gel'], null, 1));
