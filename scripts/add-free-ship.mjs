import { readFileSync, writeFileSync, readdirSync } from 'fs';

const models = readdirSync('modeli').filter(f => f.endsWith('.html'));

models.forEach(fn => {
    let html = readFileSync('modeli/' + fn, 'utf8');
    
    // Check if free-ship logic already added
    if (html.includes('updateModelFreeShip')) {
        console.log('SKIP:', fn, '(already has free-ship logic)');
        return;
    }
    
    // Add free-ship logic before the closing of the size-selector script
    // Find: grid.addEventListener("click"... ending with });\n    })();\n    <\/script>
    const freeShipCode = `
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
    
    html = html.replace(
        /(\/\* --- FREE SHIPPING LOGIC ---[\s\S]*?window\.addEventListener\('storage', updateModelFreeShip\);)|\n    <\/script>\n<\/body>/,
        freeShipCode + '\n    </script>\n</body>'
    );
    
    // If the above didn't match (no free-ship logic exists yet), add before closing script
    if (!html.includes('updateModelFreeShip')) {
        html = html.replace(
            /(\s*<\/script>\s*\n\s*<\/body>)/,
            freeShipCode + '\n    </script>\n</body>'
        );
    }
    
    writeFileSync('modeli/' + fn, html, 'utf8');
    console.log('OK:', fn, '+ free-ship logic');
});

console.log('DONE');
