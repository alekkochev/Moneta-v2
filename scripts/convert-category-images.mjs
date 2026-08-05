// Конвертирај ги новите 600×600 слики (images/moneta novi sliki) во отсечени
// (trim до влошката) webp за главните категориски карти на index.html.
// Старите слики се бекапираат како <ime>-old.webp.
// Категории → претставнички модели:
//   Спортски → active-gel | Кожни → topas | Летни → simona
//   Зимски → thermo-alu | HUNTER → hunter-camo | Детски → duck
import sharp from 'sharp';
import fs from 'fs';

const mappings = [
  ['MO11_281111_active_gel_web.png', 'Sportski.webp'],
  ['MO44_281044_topas_web.png', 'Kozni.webp'],
  ['MO34_981034_simona_web.png', 'Letni.webp'],
  ['MO62_201062_thermo_alu_web.png', 'thermo_alu.webp'],
  ['MO85_140405_hunter_camo_web.png', 'hunter_vloski.webp'],
  ['MO68_201068_duck_web.png', 'detski.webp'],
];

const srcDir = 'images/moneta novi sliki';
const dstDir = 'images/cards';

for (const [src, dst] of mappings) {
  const srcPath = `${srcDir}/${src}`;
  const dstPath = `${dstDir}/${dst}`;
  const oldPath = dstPath.replace(/\.webp$/, '-old.webp');
  if (fs.existsSync(dstPath) && !fs.existsSync(oldPath)) {
    fs.copyFileSync(dstPath, oldPath);
    console.log(`backup: ${oldPath}`);
  }
  const info = await sharp(srcPath).trim().webp({ quality: 80 }).toFile(dstPath);
  console.log(`OK ${dst}: ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB`);
}
