// Генератор на seed SQL за Supabase — чита stock.json + мапира категории/имиња
// Користење: node scripts/seed-supabase.mjs → генерира supabase/migrations/20260806000001_seed_products.sql
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const stock = JSON.parse(fs.readFileSync(path.join(root, 'stock.json'), 'utf8'));

// slug -> { cat, mk, en }
const META = {
  'active-gel':      { cat: 'sportski', mk: 'Active Gel', en: 'Active Gel' },
  'anatomiX':        { cat: 'sportski', mk: 'AnatomiX', en: 'AnatomiX' },
  'sport-style':     { cat: 'sportski', mk: 'Sport Style', en: 'Sport Style' },
  'sportex':         { cat: 'sportski', mk: 'Sportex', en: 'Sportex' },
  'x-treme':         { cat: 'sportski', mk: 'X-TREME', en: 'X-TREME' },
  'memosole':        { cat: 'sportski', mk: 'MEMOSOLE', en: 'MEMOSOLE' },
  'topas':           { cat: 'kozni', mk: 'Topas', en: 'Topas' },
  'vital':           { cat: 'kozni', mk: 'Vital', en: 'Vital' },
  'relax':           { cat: 'kozni', mk: 'Relax', en: 'Relax' },
  'soft-gel':        { cat: 'kozni', mk: 'Soft Gel', en: 'Soft Gel' },
  'heel-pad':        { cat: 'kozni', mk: 'Heel Pad', en: 'Heel Pad' },
  'heel-pad-fix':    { cat: 'kozni', mk: 'Heel Pad FIX', en: 'Heel Pad FIX' },
  'heel-pad-grip':   { cat: 'kozni', mk: 'Heel Pad Grip', en: 'Heel Pad Grip' },
  'carbon':          { cat: 'letni', mk: 'Carbon', en: 'Carbon' },
  'simona':          { cat: 'letni', mk: 'Simona', en: 'Simona' },
  'thermo-alu':      { cat: 'zimski', mk: 'Thermo Alu', en: 'Thermo Alu' },
  'hunter-camo':     { cat: 'hunter', mk: 'Hunter CAMO', en: 'Hunter CAMO' },
  'hunter-flex':     { cat: 'hunter', mk: 'Hunter FLEX', en: 'Hunter FLEX' },
  'hunter-outdoor':  { cat: 'hunter', mk: 'Hunter OUTDOOR', en: 'Hunter OUTDOOR' },
  'duck':            { cat: 'detski', mk: 'Duck', en: 'Duck' },
};

const esc = (s) => String(s).replace(/'/g, "''");

let out = '-- Seed: производи + залиха (генерирано од stock.json)\n';
out += 'insert into public.products (slug, name_mk, name_en, category, price, image, sort_order) values\n';
const slugs = Object.keys(stock);
const rows = slugs.map((slug, i) => {
  const m = META[slug] || { cat: 'sportski', mk: slug, en: slug };
  const price = stock[slug].price;
  const img = './images/cards/' + slug + '.webp';
  return `  ('${slug}', '${esc(m.mk)}', '${esc(m.en)}', '${m.cat}', ${price}, '${img}', ${i + 1})`;
});
out += rows.join(',\n') + '\n;';

out += '\n\n-- Залиха по големина\n';
slugs.forEach((slug) => {
  const sizes = stock[slug].sizes || {};
  Object.entries(sizes).forEach(([size, qty]) => {
    out += `insert into public.product_sizes (product_id, size, qty)\n  select p.id, '${esc(size)}', ${qty} from public.products p where p.slug = '${slug}';\n`;
  });
});

const outFile = path.join(root, 'supabase', 'migrations', '20260806000001_seed_products.sql');
fs.writeFileSync(outFile, out, 'utf8');
console.log('Генерирано:', outFile);
console.log('Продукти:', slugs.length);
