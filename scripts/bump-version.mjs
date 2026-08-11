// Bump cache-bust version params for script.js and styles.css across all HTML files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const htmlFiles = [];
const walk = (dir) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((ent) => {
    if (ent.name === 'node_modules' || ent.name === '.git') return;
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(fp);
    else if (ent.name.endsWith('.html')) htmlFiles.push(fp);
  });
};
walk(root);

const NEW_VERSION = '20260814';
let scriptBumped = 0;
let styleBumped = 0;

htmlFiles.forEach((fp) => {
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;
  // script.js?v=XXXXX → script.js?v=20260811
  html = html.replace(/script\.js\?v=[\d]+/g, `script.js?v=${NEW_VERSION}`);
  // styles.css?v=XXXXX → styles.css?v=20260811
  html = html.replace(/styles\.css\?v=[\d]+/g, `styles.css?v=${NEW_VERSION}`);
  if (html !== before) {
    fs.writeFileSync(fp, html, 'utf8');
    if (html.includes(`script.js?v=${NEW_VERSION}`) && before.includes('script.js?v=')) scriptBumped++;
    if (html.includes(`styles.css?v=${NEW_VERSION}`) && before.includes('styles.css?v=')) styleBumped++;
  }
});

console.log(`Bumped script.js in ${scriptBumped} files, styles.css in ${styleBumped} files`);
