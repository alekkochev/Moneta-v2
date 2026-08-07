// ============================================================
// Врати го текстот на копчето „Акција" на ЕДЕН РЕД
// (го отстранува <br> поделениот текст)
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

const OLD = '<span data-lang-html data-mk="Акци<br>ија" data-sq="Aksion" data-en="SALE">Акци<br>ија</span>';
const NEW = '<span data-mk="Акција" data-sq="Aksion" data-en="SALE">Акција</span>';

let done = 0;
for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes(OLD)) continue;
    html = html.replace(OLD, NEW);
    fs.writeFileSync(file, html, 'utf8');
    done++;
    console.log('✅', path.relative(root, file));
}
console.log(`\n=== Готово! Ажурирани: ${done} ===`);
