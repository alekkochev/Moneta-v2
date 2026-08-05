// Конверзија на 20-те модел слики (600×600 PNG) во images/cards/<slug>.webp
// - мануелен trim по алфа праг alpha>200 (рабовите на PNG-овите се полу-транспарентни)
// - webp quality 80
// - бекап на постоечките како <slug>-old.webp
import sharp from 'sharp';
import fs from 'fs';

const SRC_DIR = 'images/moneta novi sliki';
const DST_DIR = 'images/cards';

const MAP = [
  ['active-gel', 'MO11_281111_active_gel_web.png'],
  ['anatomiX', 'MO02_20002_anatomix_web.png'],
  ['carbon', 'MO63_201063_carbon_web.png'],
  ['duck', 'MO68_201068_duck_web.png'],
  ['heel-pad-fix', 'MO17_291117_heel_pad_fix_web.png'],
  ['heel-pad-grip', 'MO13_951013_heel_pad_grip_web.png'],
  ['heel-pad', 'MO31_971031_heel_pad_web.png'],
  ['hunter-camo', 'MO85_140405_hunter_camo_web.png'],
  ['hunter-flex', 'MO86_140406_hunter_flex_web.png'],
  ['hunter-outdoor', 'MO82_140402_hunter_outdoor_web.png'],
  ['memosole', 'MO12_16012_memosole_web.png'],
  ['relax', 'MO90_251090_relax_web.png'],
  ['simona', 'MO34_981034_simona_web.png'],
  ['soft-gel', 'MO08_281108_soft_gel_web.png'],
  ['sport-style', 'MO69_221069_sport_style_web.png'],
  ['sportex', 'MO10_951010_sportex_web.png'],
  ['thermo-alu', 'MO62_201062_thermo_alu_web.png'],
  ['topas', 'MO44_281044_topas_web.png'],
  ['vital', 'MO04_271104_vital_web.png'],
  ['x-treme', 'MO05_21005_x_treme_web.png'],
];

async function trimByAlpha(src) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let minX = W, minY = H, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > 200) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) throw new Error('нема непроѕирни пиксели');
  const w = maxX - minX + 1, h = maxY - minY + 1;
  return { left: minX, top: minY, width: w, height: h };
}

(async () => {
  let ok = 0, skipped = 0;
  for (const [slug, srcFile] of MAP) {
    const src = `${SRC_DIR}/${srcFile}`;
    const dst = `${DST_DIR}/${slug}.webp`;
    if (!fs.existsSync(src)) { console.log('✗ нема извор:', srcFile); skipped++; continue; }
    // бекап на постоечката
    if (fs.existsSync(dst) && !fs.existsSync(`${DST_DIR}/${slug}-old.webp`)) {
      fs.copyFileSync(dst, `${DST_DIR}/${slug}-old.webp`);
    }
    const box = await trimByAlpha(src);
    await sharp(src)
      .extract(box)
      .webp({ quality: 80 })
      .toFile(dst);
    const meta = await sharp(dst).metadata();
    console.log(`✓ ${slug} <- ${srcFile}  → ${meta.width}×${meta.height} ${Math.round(meta.size / 1024)}KB (аспект ${(meta.width / meta.height).toFixed(2)})`);
    ok++;
  }
  console.log(`\nГотово: ${ok} конвертирани, ${skipped} прескокнати.`);
})();
