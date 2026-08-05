// Врати го копчето „Назад" на категориските страници (→ index / главните 6 категории)
import fs from 'fs';

const files = ['sportski.html', 'kozni.html', 'letni.html', 'zimski.html', 'hunter.html', 'detski.html', 'outdoor.html', 'heelpad.html'];
const GRID = '<div class="categories__grid grid-3">';

function readBom(f) {
  const b = fs.readFileSync(f);
  const h = b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF;
  let c = b.toString('utf8');
  if (h) c = c.replace(/^\uFEFF/, '');
  return { c, h };
}
function writeBom(f, c, h) { fs.writeFileSync(f, h ? '\uFEFF' + c : c, 'utf8'); }

function toolbar() {
  return `<div class="categories-toolbar">
                    <a href="./index.html" class="btn-back" onclick="history.back(); return false;" aria-label="Назад" title="Назад" data-mk-title="Назад" data-sq-title="Prapa" data-en-title="Back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </a>
                </div>`;
}

let n = 0;
for (const f of files) {
  const { c, h } = readBom(f);
  if (c.includes('categories-toolbar')) {
    console.log('— already has toolbar:', f);
    continue;
  }
  if (!c.includes(GRID)) { console.log('— no grid:', f); continue; }
  writeBom(f, c.replace(GRID, toolbar() + '\n        ' + GRID), h);
  console.log('✓ added to', f);
  n++;
}
console.log('Added:', n);
