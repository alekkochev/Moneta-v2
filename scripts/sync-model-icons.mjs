/**
 * sync-model-icons.mjs
 * Ги ПРЕЗАПИШУВА функционалните икони (model-icons) на сите модел страници
 * со точниот редослед КАКО НА АМБАЛАЖАТА (ревизија 2026-08-07).
 *
 * Run: node scripts/sync-model-icons.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODELI = path.join(ROOT, 'modeli');

// Клуч: [файл (URL-encoded), labelMk, labelSq, labelEn]
const IC = {
  anatomska: ['anatomska%20vloska.webp', 'Анатомска', 'Anatomike', 'Anatomical'],
  pritisok: ['apsorpcija%20na%20pritisok.webp', 'Апсорпција на удари', 'Thithje goditjesh', 'Shock absorb'],
  apsorpcija: ['apsorpcija.webp', 'Апсорпција', 'Thithje', 'Absorption'],
  gel: ['gel%20vloska.webp', 'Гел', 'Xhel', 'Gel'],
  koza: ['koza.webp', 'Кожа', 'Lëkurë', 'Leather'],
  medicinski: ['medicinski_svojstva.webp', 'Здравје', 'Shëndetësore', 'Health'],
  perenje: ['moznost%20za%20perenje.webp', 'Перење', 'Larje', 'Washable'],
  polar: ['polar%28ultra%20zimski%29.webp', 'Полар', 'Polar', 'Polar'],
  prirodni: ['prirodni%20materijali.webp', 'Природни', 'Natyrale', 'Natural'],
  mirisi: ['protiv%20losi%20mirisi.webp', 'Анти-мирис', 'Kundër erës', 'Anti-odor'],
  aroma: ['so%20aroma.webp', 'Арома', 'Me aromë', 'Aroma'],
  univerzalen: ['univerzalen%20broj.webp', 'Универзален', 'Universal', 'Universal'],
  antibakteriska: ['antibakteriska.svg', 'Антибактеријaлна', 'Antibakteriale', 'Antibacterial'],
  komfort: ['komfort.svg', 'Комфорт', 'Komfort', 'Comfort'],
  perduv: ['perduv.webp', 'Комфорт', 'Komfort', 'Comfort'],
  memorska: ['memorska.svg', 'Мемориска', 'Memorike', 'Memory'],
  izolacija: ['izolacija.svg', 'Изолација', 'Izolim', 'Insulation']
};

// Финален редослед по модел — како на амбалажата (ревизија 2026-08-07)
const MODEL_ICONS = {
  'memosole': ['pritisok', 'mirisi', 'perduv', 'memorska'],
  'active-gel': ['anatomska', 'pritisok', 'apsorpcija', 'mirisi', 'antibakteriska'],
  'anatomiX': ['anatomska', 'apsorpcija', 'antibakteriska', 'perenje'],
  'carbon': ['apsorpcija', 'mirisi', 'univerzalen', 'antibakteriska'],
  'sport-style': ['anatomska', 'apsorpcija', 'aroma', 'prirodni'],
  'sportex': ['anatomska', 'pritisok', 'apsorpcija', 'mirisi', 'antibakteriska'],
  'x-treme': ['anatomska', 'apsorpcija', 'pritisok'],
  'heel-pad': ['anatomska', 'koza', 'medicinski', 'pritisok'],
  'heel-pad-fix': ['anatomska', 'koza', 'medicinski', 'pritisok'],
  'heel-pad-grip': ['koza', 'univerzalen', 'pritisok'],
  'topas': ['anatomska', 'apsorpcija', 'koza', 'medicinski'],
  'soft-gel': ['anatomska', 'apsorpcija', 'koza', 'medicinski', 'gel'],
  'vital': ['anatomska', 'apsorpcija', 'koza', 'medicinski'],
  'relax': ['anatomska', 'apsorpcija', 'koza', 'medicinski'],
  'simona': ['apsorpcija', 'aroma', 'mirisi', 'perenje'],
  'thermo-alu': ['anatomska', 'apsorpcija', 'koza', 'medicinski', 'polar'],
  'hunter-outdoor': ['antibakteriska', 'apsorpcija', 'anatomska', 'perenje'],
  'hunter-flex': ['izolacija', 'apsorpcija', 'anatomska', 'pritisok'],
  'hunter-camo': ['antibakteriska', 'apsorpcija', 'anatomska', 'perenje'],
  'duck': ['anatomska', 'apsorpcija', 'medicinski']
};

function buildBlock(icons) {
  const items = icons
    .map((k) => {
      const [file, mk, sq, en] = IC[k];
      return `                <div class="model-icons__item">
                    <img src="../images/icons/${file}" alt="${mk}" loading="lazy" width="30" height="30">
                    <span data-mk="${mk}" data-sq="${sq}" data-en="${en}">${mk}</span>
                </div>`;
    })
    .join('\n');
  return `                <div class="model-icons">
${items}
                </div>`;
}

let done = 0;
let skipped = 0;
for (const [slug, icons] of Object.entries(MODEL_ICONS)) {
  const file = path.join(MODELI, slug + '.html');
  try {
    let html = await fs.readFile(file, 'utf8');
    const re = /<div class="model-icons">[\s\S]*?<\/div>\s*<\/div>/;
    if (!re.test(html)) {
      console.log('⚠️  (нема model-icons блок) ' + slug);
      skipped++;
      continue;
    }
    html = html.replace(re, buildBlock(icons));
    await fs.writeFile(file, html, 'utf8');
    console.log('✅', slug, '(' + icons.length + ' икони)');
    done++;
  } catch (e) {
    console.error('❌', slug, e.message);
  }
}

console.log(`\n=== Готово! Синхронизирани: ${done}, прескокнати: ${skipped} ===`);
