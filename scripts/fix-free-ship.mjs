import { readFileSync, writeFileSync, readdirSync } from 'fs';

const models = readdirSync('modeli').filter(f => f.endsWith('.html'));

const newFreeShipCode = `
        // --- FREE SHIPPING LOGIC ---
        function updateModelFreeShip() {
            const freeShip = document.querySelector('.model-freeship');
            const text = document.querySelector('[data-free-ship-text]');
            if (!freeShip || !text) return;
            let total = 0;
            try {
                const raw = localStorage.getItem('moneta_cart');
                if (raw) {
                    const cart = JSON.parse(raw);
                    total = Object.values(cart).reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
                }
            } catch(e) {}
            const threshold = 1000;
            if (total >= threshold) {
                freeShip.classList.add('is-reached');
                text.textContent = '🎉 Имате БЕСПЛАТНА достава!';
            } else if (total > 0) {
                freeShip.classList.remove('is-reached');
                text.textContent = 'Уште ' + (threshold - total) + ' ден. за бесплатна достава';
            } else {
                freeShip.classList.remove('is-reached');
                text.textContent = 'Бесплатна достава за нарачки над 1.000 ден.';
            }
        }
        updateModelFreeShip();
        window.addEventListener('storage', updateModelFreeShip);
        document.addEventListener('monetaCartUpdated', updateModelFreeShip);`;

models.forEach(fn => {
    let html = readFileSync('modeli/' + fn, 'utf8');
    
    // Replace existing free-ship logic (old version) with new version
    if (html.includes('// --- FREE SHIPPING LOGIC ---')) {
        html = html.replace(
            /\/\/ --- FREE SHIPPING LOGIC ---[\s\S]*?document\.addEventListener\('monetaCartUpdated', updateModelFreeShip\);/,
            newFreeShipCode.trim()
        );
        writeFileSync('modeli/' + fn, html, 'utf8');
        console.log('FIXED:', fn);
    } else {
        console.log('SKIP:', fn, '(no free-ship logic found)');
    }
});

console.log('DONE');
