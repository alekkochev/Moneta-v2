// Експорт на производи + залиха од Supabase → CSV за Google Sheets
// (табови „Производи" и „Залиха"). Користи го анон клучот (читање).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'google-sheet-sync');

const URL = 'https://wkpkrnjrtpywuzemirbw.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcGtybmpydHB5d3V6ZW1pcmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjkwOTksImV4cCI6MjEwMTU0NTA5OX0.nkeKFm2qQYXEsHY6kkJxqfsOxiSEEQJzLOmnrdMMg8I';

const h = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

async function main() {
  const [products, sizes] = await Promise.all([
    fetch(URL + '/rest/v1/products?select=id,slug,name_mk,name_en,price,old_price,discount,image,active,sort_order&order=sort_order', { headers: h }).then(r => { if (!r.ok) throw new Error('products ' + r.status); return r.json(); }),
    fetch(URL + '/rest/v1/product_sizes?select=product_id,size,qty&order=size', { headers: h }).then(r => { if (!r.ok) throw new Error('sizes ' + r.status); return r.json(); }),
  ]);

  // slug по id
  const idToSlug = {};
  products.forEach(p => { idToSlug[p.id] = p.slug; });

  const prodCsv = [
    'slug,name_mk,name_en,price,old_price,discount,image,active,sort_order',
    ...products.map(p => [
      p.slug, p.name_mk || '', p.name_en || '',
      p.price ?? '', p.old_price ?? '', p.discount ?? '', p.image || '',
      p.active === false ? 'false' : 'true', p.sort_order ?? ''
    ].map(esc).join(','))
  ].join('\n');

  const sizeCsv = [
    'slug,size,qty',
    ...sizes.map(s => [idToSlug[s.product_id] || s.product_id, s.size, s.qty ?? 0].map(esc).join(','))
  ].join('\n');

  fs.mkdirSync(outDir, { recursive: true });
  // UTF-8 BOM за Excel/Sheets да го препознае кирилицата
  fs.writeFileSync(path.join(outDir, 'Производи.csv'), '\uFEFF' + prodCsv, 'utf8');
  fs.writeFileSync(path.join(outDir, 'Залиха.csv'), '\uFEFF' + sizeCsv, 'utf8');

  console.log('Производи:', products.length, 'редови');
  console.log('Залиха:', sizes.length, 'редови');
  console.log('Зачувано во:', outDir);
}

main().catch((e) => { console.error(e); process.exit(1); });
