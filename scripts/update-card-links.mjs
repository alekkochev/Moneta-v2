// Ажурирање на card__link во сите grid-3 карти:
// „Погледни →" → „<Име на производот> →" (како главните карти каде стои името)
// Обработува: 6 категориски страници + 20 модел страници (поврзани производи)
import fs from 'fs';
import path from 'path';

const FILES = [
  'sportski.html', 'kozni.html', 'letni.html', 'zimski.html', 'hunter.html', 'detski.html',
  ...fs.readdirSync('modeli').filter(f => f.endsWith('.html')).map(f => `modeli/${f}`),
];

const RE = /<h4>([^<]+)<\/h4>([\s\S]*?)<span class="card__link" data-mk="Погледни →" data-sq="Shiko →" data-en="View →">Погледни →<\/span>/g;

function readWithBom(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let content = buf.toString('utf8');
  if (hasBom) content = content.replace(/^\uFEFF/, '');
  return { content, hasBom };
}

function writeWithBom(file, content, hasBom) {
  let out = content;
  if (hasBom) out = '\uFEFF' + out;
  fs.writeFileSync(file, out, 'utf8');
}

let total = 0;
for (const file of FILES) {
  if (!fs.existsSync(file)) continue;
  const { content, hasBom } = readWithBom(file);
  let count = 0;
  const updated = content.replace(RE, (m, name, rest) => {
    count++;
    return `<h4>${name}</h4>${rest}<span class="card__link" data-mk="${name} →" data-sq="${name} →" data-en="${name} →">${name} →</span>`;
  });
  writeWithBom(file, updated, hasBom);
  if (count > 0) {
    console.log(`✓ ${file}: ${count} картички ажурирани`);
    total += count;
  }
}
console.log(`\nВкупно: ${total} картички.`);
