// ============================================================
// ДОДАЈ GA4 + Meta Pixel на сите HTML страници (root + modeli/)
//  - GA4 Measurement ID: G-YEDJMPTEZG
//  - Meta Pixel ID:      3399617573559080
//  - Внесува веднаш по <head>, идемпотентно (нема дуплирање)
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

const SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YEDJMPTEZG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YEDJMPTEZG');
</script>

<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '3399617573559080');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=3399617573559080&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;

let done = 0;
let skipped = 0;
for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    // Идемпотентност: ако веќе има gtag или fbq init — прескокни
    if (html.includes('G-YEDJMPTEZG') || html.includes("fbq('init'")) {
        skipped++;
        continue;
    }
    if (!html.includes('<head>')) {
        skipped++;
        continue;
    }
    html = html.replace(/<head>/, '<head>\n' + SNIPPET);
    fs.writeFileSync(file, html, 'utf8');
    done++;
    console.log('✅', path.relative(root, file));
}

console.log(`\n=== Готово! GA4 + Meta Pixel: ${done}, прескокнати: ${skipped} ===`);
