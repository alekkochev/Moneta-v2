// Corrected SEO audit part 2: OG check + missing alt + canonical + noindex
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

all.forEach((f) => {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const hasOg = html.includes('property="og:title"') && html.includes('property="og:image"') && html.includes('property="og:url"');
  const hasTw = html.includes('name="twitter:card"');
  const hasCanonical = html.includes('rel="canonical"');
  const noindex = html.includes('name="robots" content="noindex');

  // Find images without alt
  const imgRe = /<img\s[^>]*>/g;
  const imgs = html.match(imgRe) || [];
  const noAlt = imgs.filter((i) => !/alt=/.test(i));

  let flags = [];
  if (!hasOg) flags.push('NO-OG');
  if (!hasTw) flags.push('NO-TW');
  if (!hasCanonical) flags.push('NO-CANON');
  if (noindex) flags.push('NOINDEX');
  if (noAlt.length) flags.push(`NOALT:${noAlt.length}/${imgs.length}`);

  if (flags.length) {
    console.log(`${flags.join(' ')} | ${f}`);
    noAlt.forEach((img) => {
      const src = (img.match(/src="([^"]*)"/) || [])[1] || '?';
      const snippet = img.trim().slice(0, 90);
      console.log(`    missing alt: ${snippet}`);
    });
  }
});

console.log('\n=== Done ===');
