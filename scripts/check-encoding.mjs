import fs from 'fs';

// Check: count proper Cyrillic (U+0400-U+04FF) vs Latin-1 mojibake chars (U+00C0-U+00FF)
// in a file. Mojibake = original UTF-8 bytes decoded as CP1252 then re-encoded as UTF-8.
// "Влошки" proper = U+0412 U+043B...  mojibake = "Ð'Ð»Ð¾ÑˆÐºÐ¸" = U+00D0 U+2019 U+00D0...

const files = process.argv.slice(2);

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  let cyrillic = 0, latinMojibake = 0, highLatin = 0;
  for (const c of s) {
    const cp = c.codePointAt(0);
    if (cp >= 0x0400 && cp <= 0x04FF) cyrillic++;
    else if (cp >= 0x00C0 && cp <= 0x00FF) { latinMojibake++; if (cp >= 0x00C0 && cp <= 0x00DF) highLatin++; }
  }
  console.log(f);
  console.log('  proper Cyrillic chars:', cyrillic);
  console.log('  Latin-1 mojibake chars:', latinMojibake, '(high half Ð-ß:', highLatin, ')');
  const verdict = cyrillic === 0 && latinMojibake > 0 ? '  ==> MOJIBAKE (MK text corrupted!)' : (cyrillic > 0 ? '  ==> OK (proper Cyrillic present)' : '  ==> no cyrillic/latin-1');
  console.log(verdict);
}
