// ============================================================
// СИМНИ „МОНЕТА водич за влошки" од navbar на сите страници
// (root *.html + modeli/*.html). Водичот сега е на vodic.html,
// а влезот е преку hero копчето.
// ============================================================
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const files = [];
for (const name of fs.readdirSync(root)) {
    if (name.endsWith('.html')) files.push(path.join(root, name));
}
const modeliDir = path.join(root, 'modeli');
if (fs.existsSync(modeliDir)) {
    for (const name of fs.readdirSync(modeliDir)) {
        if (name.endsWith('.html')) files.push(path.join(modeliDir, name));
    }
}

// Ги покрива и ./kviz.html и ../kviz.html варијантите
const RE = /\s*<li class="navbar__guide-item">\s*<a href="(?:\.\.\/|\.\/)kviz\.html" class="navbar__guide-btn">[\s\S]*?<\/a>\s*<\/li>/;

let done = 0;
let skipped = 0;
for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    if (!RE.test(html)) {
        skipped++;
        console.log('⚠️  (нема guide-item) ' + path.relative(root, file));
        continue;
    }
    html = html.replace(RE, '');
    fs.writeFileSync(file, html, 'utf8');
    done++;
    console.log('✅', path.relative(root, file));
}
console.log(`\n=== Готово! Отстранети: ${done}, прескокнати: ${skipped} ===`);
