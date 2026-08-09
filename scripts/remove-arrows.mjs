// scripts/remove-arrows.mjs — ги отстранува декоративните „ →" од копчињата/линковите
// во сите HTML фајлови (освен slajdovi.html — внатрешна презентациска страница со
// инструкции за стрелките на тастатурата ← / →).
// Пуштање: node scripts/remove-arrows.mjs  (од коренот на проектот)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const SKIP_FILES = new Set(['slajdovi.html']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'vendor', '_design-backup-20260804-082029', '_pgbackup', '_pginfo']);

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.html')) files.push(p);
  }
}
walk(ROOT);

let total = 0;
for (const f of files) {
  const base = f.split(/[\\/]/).pop();
  if (SKIP_FILES.has(base)) continue;
  const orig = readFileSync(f, 'utf8');
  const next = orig.replace(/\s*→\s*/g, '');
  if (next !== orig) {
    writeFileSync(f, next);
    const n = (orig.match(/→/g) || []).length;
    total += n;
    console.log(base + ': ' + n + ' arrow(s) removed');
  }
}
console.log('TOTAL arrows removed: ' + total);
