// Отстрани `open` од првото details (Клучни карактеристики) на сите 20 модел-страници
import fs from 'fs';

const FILES = fs.readdirSync('modeli').filter(f => f.endsWith('.html')).map(f => `modeli/${f}`);

function readWithBom(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let content = buf.toString('utf8');
  if (hasBom) content = content.replace(/^\uFEFF/, '');
  return { content, hasBom };
}

function writeWithBom(file, content, hasBom) {
  fs.writeFileSync(file, hasBom ? '\uFEFF' + content : content, 'utf8');
}

let total = 0;
for (const file of FILES) {
  const { content, hasBom } = readWithBom(file);
  // Само првото појавување
  if (content.includes('<details class="model-acc__item" open>')) {
    const updated = content.replace('<details class="model-acc__item" open>', '<details class="model-acc__item">');
    writeWithBom(file, updated, hasBom);
    console.log(`✓ ${file}: open отстранет`);
    total++;
  } else {
    console.log(`— ${file}: нема open`);
  }
}
console.log(`\nВкупно: ${total} страници.`);
