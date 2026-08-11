// Смени го прагот за бесплатна достава од 1.000 на 2.000 во сите текстови
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const targets = [];
const walk = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((ent) => {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.figma') return;
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(fp);
    else if (ent.name.endsWith('.html') || ent.name === 'chatbot.js' || ent.name === 'script.js') targets.push(fp);
  });
};
walk(root);

// Замена-парови: [од, до]
const REPLACEMENTS = [
  // Македонски
  ['над 1.000 ден.', 'над 2.000 ден.'],
  ['над 1.000 денари', 'над 2.000 денари'],
  ['Бесплатно над 1.000 ден.', 'Бесплатно над 2.000 ден.'],
  ['БЕСПЛАТНА достава за нарачки над 1.000 ден.', 'БЕСПЛАТНА достава за нарачки над 2.000 ден.'],
  ['над 1.000 ден.', 'над 2.000 ден.'],
  // Албански
  ['mbi 1.000 den.', 'mbi 2.000 den.'],
  ['Falas mbi 1.000 den.', 'Falas mbi 2.000 den.'],
  ['mbi 1.000 denarë', 'mbi 2.000 denarë'],
  // Англиски
  ['over 1,000 MKD', 'over 2,000 MKD'],
  ['Free over 1,000 MKD', 'Free over 2,000 MKD'],
];

let changed = 0;
targets.forEach((fp) => {
  let content = fs.readFileSync(fp, 'utf8');
  const before = content;
  REPLACEMENTS.forEach(([from, to]) => {
    content = content.split(from).join(to);
  });
  if (content !== before) {
    fs.writeFileSync(fp, content, 'utf8');
    changed++;
    console.log('✓', path.relative(root, fp));
  }
});

console.log('\nСменети фајлови:', changed);
