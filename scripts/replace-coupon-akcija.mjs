// ============================================================
// ЗАМЕНИ купон копчето во navbar со новото копче „Акција" (дизајн)
//  - Линкот кон Supabase следи подоцна (сега href="#")
//  - Обработува: root *.html + modeli/*.html
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

const NEW_BLOCK = `<li class="navbar__coupon-item">
                        <!-- TODO: линк кон Supabase (акциска страница) -->
                        <a href="#" class="navbar__akcija" aria-label="Акција" title="Акција" data-mk-aria="Акција" data-sq-aria="Aksion" data-en-aria="Sale" data-mk-title="Акција" data-sq-title="Aksion" data-en-title="Sale">
                            <span data-mk="Акција" data-sq="Aksion" data-en="SALE">Акција</span>
                        </a>
                    </li>`;

// Стариот блок: <li class="navbar__coupon-item"> … <button … id="promoTrigger"> … </button> </li>
const RE = /<li class="navbar__coupon-item">\s*<button type="button" class="navbar__coupon" id="promoTrigger"[\s\S]*?<\/button>\s*<\/li>/;

let done = 0;
let skipped = 0;
for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    if (!RE.test(html)) {
        skipped++;
        console.log('⚠️  (нема купон копче) ' + path.relative(root, file));
        continue;
    }
    html = html.replace(RE, NEW_BLOCK);
    fs.writeFileSync(file, html, 'utf8');
    done++;
    console.log('✅', path.relative(root, file));
}

console.log(`\n=== Готово! Заменети: ${done}, прескокнати: ${skipped} ===`);
