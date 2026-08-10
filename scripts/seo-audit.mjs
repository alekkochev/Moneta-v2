// SEO Audit script for MONETA
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, '..');
const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const modeli = fs
  .readdirSync(path.join(root, 'modeli'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => 'modeli/' + f);
const all = [...files, ...modeli];

const titles = new Map(); // track duplicates

all.forEach((f) => {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || 'NO TITLE';
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  const h1Count = (html.match(/<h1[^>]*>/g) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/g) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/g) || []).length;
  const canonical = (html.match(/rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const og = (html.match(/property="og:title"/) || [])[1] ? 'yes' : 'no';
  const twitter = html.includes('name="twitter:card"') ? 'yes' : 'no';
  const imgTotal = (html.match(/<img /g) || []).length;
  const imgNoAlt = (html.match(/<img (?!.*alt=)[^>]*>/g) || []).length;
  const lazy = (html.match(/loading="lazy"/g) || []).length;

  let flags = [];
  if (title.trim().length > 70) flags.push('TITLE>70');
  if (!title.trim()) flags.push('NO-TITLE');
  if (desc.length === 0) flags.push('NO-DESC');
  if (desc.length > 0 && desc.length < 50) flags.push('DESC<50');
  if (h1Count === 0) flags.push('NO-H1');
  if (h1Count > 1) flags.push(`H1x${h1Count}`);
  if (canonical && !canonical.startsWith('https://vloski.mk')) flags.push('CANON-REL');
  if (!canonical) flags.push('NO-CANON');
  if (og === 'no') flags.push('NO-OG');
  if (twitter === 'no') flags.push('NO-TW');
  if (imgTotal > 0 && imgNoAlt > 0) flags.push(`IMG-NOALT:${imgNoAlt}/${imgTotal}`);

  // duplicate title tracking
  const t = title.trim();
  if (titles.has(t)) {
    flags.push(`DUP-TITLE:${titles.get(t)}`);
  } else {
    titles.set(t, f);
  }

  console.log(
    `${flags.length ? flags.join(' ') + ' |' : 'OK            |'} ${f} | H1:${h1Count} H2:${h2Count} H3:${h3Count} | T:"${title.trim().slice(0, 50)}"`
  );
});

console.log('\n=== DUPLICATE TITLES ===');
const dupes = [...titles.entries()].filter(([, f]) => f.includes(','));
// count how many files share each title
const titleFiles = {};
all.forEach((f) => {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '';
  const t = title.trim();
  if (!titleFiles[t]) titleFiles[t] = [];
  titleFiles[t].push(f);
});
Object.entries(titleFiles).forEach(([t, fs]) => {
  if (fs.length > 1) console.log(`DUP (${fs.length}x): "${t}" → ${fs.join(', ')}`);
});
