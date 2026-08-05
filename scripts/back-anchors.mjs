// Back копчињата да водат до првиот ред производи (ајнкор): категорија → #kategorii, модел → #modeli
import fs from 'fs';

const cats = ['sportski.html', 'kozni.html', 'letni.html', 'zimski.html', 'hunter.html', 'detski.html', 'outdoor.html', 'heelpad.html'];
const models = fs.readdirSync('modeli').filter((f) => f.endsWith('.html')).map((f) => `modeli/${f}`);

function rb(f) {
  const b = fs.readFileSync(f);
  const h = b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF;
  let c = b.toString('utf8');
  if (h) c = c.replace(/^\uFEFF/, '');
  return { c, h };
}
function wb(f, c, h) { fs.writeFileSync(f, h ? '\uFEFF' + c : c, 'utf8'); }

let n = 0;
for (const f of cats) {
  const { c, h } = rb(f);
  const u = c.replace('href="./index.html" class="btn-back"', 'href="./index.html#kategorii" class="btn-back"');
  if (u !== c) { wb(f, u, h); n++; console.log('cat:', f); }
}
for (const f of models) {
  const { c, h } = rb(f);
  const u = c.replace(/(href="\.\.\/[a-z-]+\.html)(" class="btn-back")/, '$1#modeli$2');
  if (u !== c) { wb(f, u, h); n++; console.log('model:', f); } else { console.log('NOCHANGE:', f); }
}
console.log('Updated:', n);
