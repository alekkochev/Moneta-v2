// scripts/update-social-links.mjs
// Ги заменува placeholder линковите на социјалните мрежи во футерот на СИТЕ HTML страници.
// Facebook → https://www.facebook.com/insoles.mk
// Instagram → https://www.instagram.com/moneta_makedonija/
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readWithBom(p) {
  const buf = readFileSync(p);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return { text: buf.subarray(3).toString('utf8'), hasBom: true };
  }
  return { text: buf.toString('utf8'), hasBom: false };
}
function writeWithBom(p, text, hasBom) {
  const buf = hasBom
    ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')])
    : Buffer.from(text, 'utf8');
  writeFileSync(p, buf);
}

const models = [
  'active-gel', 'anatomiX', 'carbon', 'duck', 'heel-pad', 'heel-pad-fix', 'heel-pad-grip',
  'hunter-camo', 'hunter-flex', 'hunter-outdoor', 'memosole', 'relax', 'simona', 'soft-gel',
  'sport-style', 'sportex', 'thermo-alu', 'topas', 'vital', 'x-treme',
];

const files = [
  'index.html', 'cart.html', 'naracka.html', 'dostava.html', 'uslovi.html', 'kviz.html',
  'sistem.html', 'sportski.html', 'kozni.html', 'letni.html', 'zimski.html', 'hunter.html',
  'detski.html', 'outdoor.html', 'heelpad.html',
  ...models.map((m) => `modeli/${m}.html`),
];

const FB = 'https://www.facebook.com/insoles.mk';
const IG = 'https://www.instagram.com/moneta_makedonija/';

let updated = 0;
for (const f of files) {
  const p = join(root, f);
  const { text, hasBom } = readWithBom(p);
  let out = text;
  out = out.replaceAll('href="https://facebook.com"', `href="${FB}"`);
  out = out.replaceAll('href="https://instagram.com"', `href="${IG}"`);
  if (out !== text) {
    writeWithBom(p, out, hasBom);
    updated++;
    console.log('updated:', f);
  }
}
console.log('TOTAL UPDATED:', updated);
