// ============================================================
// МОНЕТА v.2 — перформанс оптимизација (Lighthouse / TBT)
// 1) gtag.js (GA4) + Meta Pixel → одложено вчитување
//    (requestIdleCallback со timeout / load+тајмаут / прва интеракција)
//    Stub-функциите gtag() и fbq() остануваат синхрони за да не
//    се скршат event-повиците во script.js и naracka.html.
// 2) chatbot.js (chat виџет, 125KB) → вчитување по idle или
//    прва интеракција, наместо при DOMContentLoaded.
// Стартување: node scripts/perf-lazy-scripts.mjs
// ============================================================
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

// ---------- Шаблони ----------
const ANALYTICS_RE = /<!-- Google tag \(gtag\.js\) -->[\s\S]*?<!-- End Meta Pixel Code -->/;
const CHAT_RE = /<script src="([^"]*chatbot\.js\?v=15)" defer><\/script>/;

const ANALYTICS_NEW = `<!-- Google tag (gtag.js) + Meta Pixel — одложено вчитување (не блокира рендерирање) -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  function initMonetaAnalytics(){
    if (window.__monetaAnalyticsLoaded) return; window.__monetaAnalyticsLoaded = true;
    var g = document.createElement('script'); g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=G-YEDJMPTEZG';
    document.head.appendChild(g);
    gtag('js', new Date());
    gtag('config', 'G-YEDJMPTEZG');
    var f = document.createElement('script'); f.async = true;
    f.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(f);
    fbq('init', '3399617573559080');
    fbq('track', 'PageView');
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(initMonetaAnalytics, { timeout: 3000 });
  } else if (document.readyState === 'complete') {
    setTimeout(initMonetaAnalytics, 1500);
  } else {
    window.addEventListener('load', function(){ setTimeout(initMonetaAnalytics, 1000); }, { once: true, passive: true });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, initMonetaAnalytics, { once: true, passive: true });
  });
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=3399617573559080&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;

const chatNew = (prefix) => `<script>
  // Chat асистент — вчитај по idle/интеракција (не ја заглавува главната нишка)
  (function () {
    var done = false;
    function loadBot() {
      if (done) return; done = true;
      var el = document.createElement('script');
      el.async = true; el.src = '${prefix}chatbot.js?v=15';
      document.body.appendChild(el);
    }
    if ('requestIdleCallback' in window) requestIdleCallback(loadBot, { timeout: 3000 });
    else if (document.readyState === 'complete') setTimeout(loadBot, 2000);
    else window.addEventListener('load', function () { setTimeout(loadBot, 1500); }, { once: true, passive: true });
    ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, loadBot, { once: true, passive: true });
    });
  })();
</script>`;

// ---------- Најди ги сите HTML фајлови (без резервни/библиотеки/тестови) ----------
const SKIP_DIRS = new Set([
  'node_modules', 'vendor', 'docs', '.git', '.github',
  '_design-backup-20260804-082029', '_pgbackup', '_pginfo'
]);

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full);
    } else if (name.endsWith('.html') && !name.startsWith('_')) {
      files.push(full);
    }
  }
})(root);

// ---------- Примени ги промените ----------
let changed = 0;
for (const f of files) {
  const orig = readFileSync(f, 'utf8');
  let text = orig;
  let did = false;

  if (ANALYTICS_RE.test(text)) {
    text = text.replace(ANALYTICS_RE, ANALYTICS_NEW);
    did = true;
  }

  const cm = text.match(CHAT_RE);
  if (cm) {
    const prefix = cm[1].replace('chatbot.js?v=15', '');
    text = text.replace(CHAT_RE, chatNew(prefix));
    did = true;
  }

  if (did && text !== orig) {
    writeFileSync(f, text, 'utf8');
    changed++;
    console.log('CHANGED:', f.replace(root, '.'));
  }
}
console.log('TOTAL CHANGED FILES:', changed);
