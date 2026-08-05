// Отстрани го копчето „Назад" од категориските страници (останува само на моделите)
import fs from 'fs';

const files = ['sportski.html', 'kozni.html', 'letni.html', 'zimski.html', 'hunter.html', 'detski.html', 'outdoor.html', 'heelpad.html'];
const TOOLBAR_RE = /<div class="categories-toolbar">[\s\S]*?<\/div>\s*/;

function readBom(f) {
  const b = fs.readFileSync(f);
  const h = b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF;
  let c = b.toString('utf8');
  if (h) c = c.replace(/^\uFEFF/, '');
  return { c, h };
}
function writeBom(f, c, h) { fs.writeFileSync(f, h ? '\uFEFF' + c : c, 'utf8'); }

let n = 0;
for (const f of files) {
  const { c, h } = readBom(f);
  if (c.includes('categories-toolbar')) {
    writeBom(f, c.replace(TOOLBAR_RE, ''), h);
    console.log('✓ removed from', f);
    n++;
  } else {
    console.log('— no toolbar in', f);
  }
}
console.log('Removed:', n);
