import fs from 'fs';
import path from 'path';

// ============================================================
// FIX DOUBLE-ENCODED (mojibake) HTML FILES
//
// The files were corrupted by decoding UTF-8 bytes as
// Windows-1252 (with raw passthrough for undefined bytes) and
// re-saving as UTF-8. This reverses that: maps each char back
// to its byte (reverse W1252), then decodes the byte stream as UTF-8.
// ============================================================

const W1252 = {
  0x80: '\u20AC', 0x82: '\u201A', 0x83: '\u0192', 0x84: '\u201E', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160',
  0x8B: '\u2039', 0x8C: '\u0152', 0x8E: '\u017D', 0x91: '\u2018', 0x92: '\u2019',
  0x93: '\u201C', 0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A', 0x9C: '\u0153',
  0x9E: '\u017E', 0x9F: '\u0178'
};
const REV = new Map(Object.entries(W1252).map(([b, ch]) => [ch, parseInt(b)]));

export function decodeCorrupted(str) {
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) { bytes.push(cp); continue; }
    const b = REV.get(ch);
    if (b !== undefined) { bytes.push(b); continue; }
    if (cp >= 0x80 && cp <= 0xFF) { bytes.push(cp); continue; }
    bytes.push(...Buffer.from(ch, 'utf8')); // keep any non-corruption char
  }
  return Buffer.from(bytes).toString('utf8');
}

function isCorrupted(str) {
  let cyrillic = 0, mojibake = 0;
  for (const c of str) {
    const cp = c.codePointAt(0);
    if (cp >= 0x0400 && cp <= 0x04FF) cyrillic++;
    else if (cp >= 0x00C0 && cp <= 0x00FF) mojibake++;
  }
  return cyrillic === 0 && mojibake > 0;
}

const root = process.argv[2] || '.';
const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));

let fixed = 0, skipped = 0;
for (const f of files) {
  const fp = path.join(root, f);
  let raw = fs.readFileSync(fp, 'utf8');
  // strip BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  if (!isCorrupted(raw)) { skipped++; continue; }

  const decoded = decodeCorrupted(raw);
  if (/[\uFFFD]/.test(decoded)) {
    console.log(`WARN ${f}: decoded output contains U+FFFD replacement chars (possible lossy data)`);
  }
  // write clean UTF-8 without BOM
  fs.writeFileSync(fp, decoded, 'utf8');
  console.log(`FIXED ${f} (${raw.length} -> ${decoded.length} chars)`);
  fixed++;
}
console.log(`\nDone: ${fixed} fixed, ${skipped} skipped.`);
