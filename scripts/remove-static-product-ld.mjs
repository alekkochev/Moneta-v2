// Remove static Product JSON-LD blocks from all model pages
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'modeli');

let removed = 0;
let failed = 0;

fs.readdirSync(dir)
  .filter((f) => f.endsWith('.html'))
  .forEach((file) => {
    const fp = path.join(dir, file);
    let html = fs.readFileSync(fp, 'utf8');

    // Match the static Product JSON-LD block and remove it
    const re = /<script type="application\/ld\+json">\s*\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"Product"[\s\S]*?<\/script>/g;
    const before = html.length;
    html = html.replace(re, '');

    if (html.length !== before) {
      fs.writeFileSync(fp, html, 'utf8');
      removed++;
    } else {
      console.log('NOT MATCHED:', file);
      failed++;
    }
  });

console.log(`Removed static Product JSON-LD from ${removed} files. Not matched: ${failed}`);
