// verify-compare.mjs — проверка на споредбената логика (точка 2)
import { readFileSync } from 'fs';

const js = readFileSync('script.js', 'utf8');
const start = js.indexOf('const COMPARE_PRODUCTS = {');
const end = js.indexOf('};', start);
const block = js.slice(start, end);
const keys = [...block.matchAll(/^\s{8}([a-zA-Z0-9-]+): \{/gm)].map(m => m[1]);
console.log('COMPARE_PRODUCTS клучеви (' + keys.length + '):', keys.join(', '));

const html = readFileSync('index.html', 'utf8');
const opts = [...html.matchAll(/<option value="([a-z0-9-]+)"/g)].map(m => m[1]);
const uniqueOpts = [...new Set(opts)];
console.log('Dropdown вредности (' + uniqueOpts.length + '):', uniqueOpts.join(', '));

const missing = uniqueOpts.filter(o => !keys.includes(o));
const extra = keys.filter(k => !uniqueOpts.includes(k));
console.log('Недостигаат во COMPARE_PRODUCTS:', missing.length ? missing.join(', ') : 'НЕМА ✓');
console.log('Немаат dropdown опција:', extra.length ? extra.join(', ') : 'НЕМА ✓');

const chips = [...html.matchAll(/class="compare-preset-chip" data-p1="([a-z0-9-]+)" data-p2="([a-z0-9-]+)"/g)].map(m => [m[1], m[2]]);
console.log('Preset чипови:', JSON.stringify(chips));
const badChips = chips.filter(([a, b]) => !keys.includes(a) || !keys.includes(b));
console.log('Неважечки preset чипови:', badChips.length ? JSON.stringify(badChips) : 'НЕМА ✓');

console.log('renderOverviewTable присутна:', js.includes('const renderOverviewTable'));
console.log('renderOverviewTable повикана при init:', /renderSideBySideTable\(\);\s*\n\s*renderOverviewTable\(\);/.test(js));

// Проверка на валидност на JS (синтаксичка)
try {
  new Function(js);
  console.log('script.js синтакса: ВАЛИДНА ✓');
} catch (e) {
  console.log('script.js синтакса: ГРЕШКА ->', e.message);
}
