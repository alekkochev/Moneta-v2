// Check duplicate descriptions, schema presence, broken internal links
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const modeli = fs
  .readdirSync(path.join(root, 'modeli'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => 'modeli/' + f);
const all = [...files, ...modeli];

// 1. Duplicate descriptions
const descMap = new Map();
all.forEach((f) => {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  if (desc.trim()) {
    if (!descMap.has(desc)) descMap.set(desc, []);
    descMap.get(desc).push(f);
  }
});

console.log('=== DUPLICATE DESCRIPTIONS ===');
let dupFound = false;
descMap.forEach((fs2, desc) => {
  if (fs2.length > 1) {
    dupFound = true;
    console.log(`DUP (${fs2.length}x): ${fs2.join(', ')}`);
    console.log(`  → "${desc.slice(0, 80)}..."`);
  }
});
if (!dupFound) console.log('None found ✓');

// 2. Schema presence per page
console.log('\n=== SCHEMA PRESENCE (main pages) ===');
['index.html', 'vodic.html', 'kviz.html', 'dostava.html', 'uslovi.html', 'sistem.html'].forEach((f) => {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const ldBlocks = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).length;
  const types = [];
  (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach((b) => {
    const m = b.match(/"@type"\s*:\s*"([^"]*)"/g) || [];
    m.forEach((t) => types.push(t.replace('"@type": "', '').replace('"', '')));
  });
  console.log(`${f}: ${ldBlocks} block(s), types: [${types.join(', ')}]`);
});

// 3. Check specific schemas on index.html
console.log('\n=== INDEX.HTML KEY SCHEMAS ===');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const checks = {
  Organization: /"@type"\s*:\s*"Organization"/,
  LocalBusiness: /"@type"\s*:\s*"LocalBusiness"|"@type"\s*:\s*"Store"/,
  WebSite: /"@type"\s*:\s*"WebSite"/,
  SearchAction: /SearchAction/,
  BreadcrumbList: /BreadcrumbList/,
  FAQPage: /FAQPage/,
  AggregateRating: /AggregateRating/,
};
Object.entries(checks).forEach(([name, re]) => {
  console.log(`${re.test(indexHtml) ? '✓' : '✗'} ${name}`);
});

// 4. Broken internal links (quick check)
console.log('\n=== BROKEN INTERNAL LINKS (relative href/src) ===');
const allFiles = new Set(all);
const broken = new Set();
const linkRe = /(?:href|src)="(\.\.?\/[^"#]*?\.(?:html|webp|png|jpg|svg|js|css|ico|json|xml))"/g;
all.forEach((f) => {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  let m;
  while ((m = linkRe.exec(html))) {
    let target = m[1];
    // Resolve relative to the page location
    if (target.startsWith('./')) target = target.slice(2);
    if (target.startsWith('../')) {
      // from a modeli/ page: ../X → X
      const parts = target.split('../').filter(Boolean).join('');
      target = parts;
    }
    if (f.startsWith('modeli/') && !target.startsWith('modeli/')) {
      target = target; // already resolved
    }
    // Check existence
    if (!allFiles.has(target) && !fs.existsSync(path.join(root, target))) {
      broken.add(`${f} → ${m[1]}`);
    }
  }
});
if (broken.size === 0) console.log('No broken internal links ✓');
else broken.forEach((b) => console.log(`✗ ${b}`));
