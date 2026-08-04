import { readFileSync, writeFileSync, readdirSync } from 'fs';

const stock = JSON.parse(readFileSync('stock.json', 'utf8'));
const models = readdirSync('modeli').filter(f => f.endsWith('.html'));

models.forEach(fn => {
    const key = fn.replace('.html', '');
    const model = stock[key];
    if (!model) { console.log('SKIP (no stock):', fn); return; }

    let html = readFileSync('modeli/' + fn, 'utf8');
    let changed = false;

    // 1. Update model-price
    const priceMk = 'Цена: ' + model.price + ' ден.';
    const priceSq = 'Çmimi: ' + model.price + ' den.';
    const priceEn = 'Price: ' + model.price + ' MKD';
    html = html.replace(
        /<div class="model-price"[^>]*>.*?<\/div>/,
        '<div class="model-price" data-mk="' + priceMk + '" data-sq="' + priceSq + '" data-en="' + priceEn + '">' + priceMk + '</div>'
    );

    // 2. Update model-cart data attributes
    html = html.replace(
        /(<div class="model-cart"[^>]*?)data-price="[^"]*"/,
        '$1data-price="' + model.price + '"'
    );
    html = html.replace(
        /(<div class="model-cart"[^>]*?)data-code="[^"]*"/,
        '$1data-code="' + model.code + '"'
    );

    // 3. Add size selector if not present
    if (!html.includes('size-selector')) {
        html = html.replace(
            /(<div class="order-bar">)([\s\S]*?)(<div class="model-cart"[^>]*>)/,
            '$1<div class="order-bar__top">$2$3'
        );
        html = html.replace(
            /(<\/div>\s*<\/div>\s*)(<div class="model-freeship")/,
            '</div></div>\n' + getSizeSelectorHTML(key) + '\n</div>\n$2'
        );
        changed = true;
    }

    // 4. Add JS if not present
    if (!html.includes('SIZE SELECTOR LOGIC')) {
        html = html.replace('</body>', getSizeSelectorJS() + '\n</body>');
        changed = true;
    }

    if (changed) {
        writeFileSync('modeli/' + fn, html, 'utf8');
        console.log('OK:', fn, '-', model.price, 'MKD');
    } else {
        console.log('SKIP:', fn, '(already done)');
    }
});

function getSizeSelectorHTML(key) {
    return (
        '\n                            <!-- SIZE SELECTOR -->\n' +
        '                            <div class="size-selector" data-model="' + key + '">\n' +
        '                                <div class="size-selector__label">\n' +
        '                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0l12.6 12.6z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>\n' +
        '                                    <span data-mk="Избери број:" data-sq="Zgjidh numrin:" data-en="Select size:">Избери број:</span>\n' +
        '                                </div>\n' +
        '                                <div class="size-selector__grid" data-size-grid>\n' +
        '                                    <button type="button" class="size-btn" data-size="35">35</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="36">36</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="37">37</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="38">38</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="39">39</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="40">40</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="41">41</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="42">42</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="43">43</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="44">44</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="45">45</button>\n' +
        '                                    <button type="button" class="size-btn" data-size="46">46</button>\n' +
        '                                </div>\n' +
        '                                <div class="size-selector__hint" data-size-hint></div>\n' +
        '                            </div>'
    );
}

function getSizeSelectorJS() {
    return (
        '\n    <!-- SIZE SELECTOR LOGIC (inline - does not modify script.js) -->\n' +
        '    <script>\n' +
        '    (function() {\n' +
        '        const MODEL = document.querySelector(".size-selector")?.dataset.model;\n' +
        '        if (!MODEL) return;\n' +
        '        const grid = document.querySelector("[data-size-grid]");\n' +
        '        const hint = document.querySelector("[data-size-hint]");\n' +
        '        const cart = document.querySelector(".model-cart");\n' +
        '        let selectedSize = null;\n' +
        '        fetch("../stock.json")\n' +
        '            .then(r => r.json())\n' +
        '            .then(data => {\n' +
        '                const model = data[MODEL];\n' +
        '                if (!model) return;\n' +
        '                const priceEl = document.querySelector(".model-price");\n' +
        '                if (priceEl) {\n' +
        '                    const mk = "Цена: " + model.price + " ден.";\n' +
        '                    const sq = "\u00c7mimi: " + model.price + " den.";\n' +
        '                    const en = "Price: " + model.price + " MKD";\n' +
        '                    priceEl.setAttribute("data-mk", mk);\n' +
        '                    priceEl.setAttribute("data-sq", sq);\n' +
        '                    priceEl.setAttribute("data-en", en);\n' +
        '                    priceEl.textContent = mk;\n' +
        '                }\n' +
        '                if (cart) { cart.dataset.price = model.price; cart.dataset.code = model.code; }\n' +
        '                const sizes = model.sizes;\n' +
        '                grid.querySelectorAll(".size-btn").forEach(btn => {\n' +
        '                    const sz = btn.dataset.size;\n' +
        '                    if (!sizes[sz] || sizes[sz] <= 0) {\n' +
        '                        btn.classList.add("size-btn--disabled");\n' +
        '                        btn.setAttribute("aria-disabled", "true");\n' +
        '                        btn.tabIndex = -1;\n' +
        '                    }\n' +
        '                });\n' +
        '                if (cart) cart.classList.add("model-cart--disabled");\n' +
        '            })\n' +
        '            .catch(() => { if (hint) { hint.textContent = "Грешка при вчитување на залихите."; hint.classList.add("error"); } });\n' +
        '        grid.addEventListener("click", (e) => {\n' +
        '            const btn = e.target.closest(".size-btn");\n' +
        '            if (!btn || btn.classList.contains("size-btn--disabled")) return;\n' +
        '            grid.querySelectorAll(".size-btn--selected").forEach(b => b.classList.remove("size-btn--selected"));\n' +
        '            btn.classList.add("size-btn--selected");\n' +
        '            selectedSize = btn.dataset.size;\n' +
        '            if (hint) { hint.textContent = "Избран број: " + selectedSize; hint.classList.add("success"); hint.classList.remove("error"); }\n' +
        '            if (cart) {\n' +
        '                cart.classList.remove("model-cart--disabled");\n' +
        '                const nameMk = cart.dataset.nameMk || MODEL;\n' +
        '                const nameEn = cart.dataset.nameEn || MODEL;\n' +
        '                cart.dataset.nameMk = nameMk + " бр." + selectedSize;\n' +
        '                cart.dataset.nameEn = nameEn + " sz." + selectedSize;\n' +
        '                cart.dataset.size = selectedSize;\n' +
        '            }\n' +
        '        });\n' +
        '    })();\n' +
        '    <\/script>'
    );
}

console.log('DONE - processed', models.length, 'files');
