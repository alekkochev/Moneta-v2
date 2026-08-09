/* ============================================================
   МОНЕТА АСИСТЕНТ — chat widget (наше, без надворешен API)
   Правила: одговара од информациите на сајтот (FAQ, достава,
   плаќање, модели, категории) + живи цени од Supabase (MonetaData).
   Јазици: MK / SQ / EN (по document.documentElement.lang).
   ============================================================ */
(function () {
  'use strict';
  if (window.MonetaBot) return;

  // ---------- Јазик ----------
  function L() { return (document.documentElement.lang || 'mk').toLowerCase(); }
  function t(mk, sq, en) { return L() === 'en' ? en : (L() === 'sq' ? sq : mk); }

  // ---------- Безбедно прикажување ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ============================================================
  // ЗНАЕЊЕ (knowledge base) — сите информации од страницата
  // ============================================================
  const FAQ = [
    {
      kw: ['големин', 'број', 'броеви', 'size', 'gjas'],
      q: t('Како да ја изберам вистинската големина?', 'Si të zgjedh madhësinë e duhur?', 'How do I choose the right size?'),
      a: t(
        'Влошките се изработени според стандардните европски броеви на обувки (35-46). Препорачуваме да го изберете истиот број што го носите најчесто.',
        'Tabanët bëhen sipas numrave standardë evropianë të këpucëve (35-46). Rekomandojmë të zgjidhni të njëjtin numër që mbani më shpesh.',
        'Insoles are made in standard European shoe sizes (35-46). We recommend choosing the same size you wear most often.')
    },
    {
      kw: ['тра', 'трае', 'живот', 'колку долго', 'last', 'zgjat'],
      q: t('Колку траат влошките?', 'Sa zgjasin tabanët?', 'How long do the insoles last?'),
      a: t(
        'Со редовно користење, очекуваниот век на влошките е помеѓу 6 и 12 месеци, зависно од тежината, активноста и подлогата.',
        'Me përdorim të rregullt, jetëgjatësia e pritshme e tabanëve është 6-12 muaj, në varësi të peshës, aktivitetit dhe sipërfaqes.',
        'With regular use, the expected lifespan is between 6 and 12 months, depending on weight, activity and surface.')
    },
    {
      kw: ['сеч', 'скрат', 'ножиц', 'прилагод', 'поткаструва', 'cut', 'prit'],
      q: t('Може ли да се скратат влошките?', 'A mund të shkurtohen tabanët?', 'Can the insoles be cut to size?'),
      a: t(
        'Повеќето спортски, летни и зимски модели имаат означени испрекинати линии за поткастрување. Најдобро: извадете ја старата влошка, преклопете ја врз МОНЕТА и скратете го вишокот на прстите.',
        'Shumica e modeleve sportive, verore dhe dimërore kanë vija të shënuara për shkurtim. Mënyra më e mirë: nxirreni tabanin e vjetër, vendoseni mbi MONETA dhe shkurtojeni tepricën.',
        'Most sports, summer and winter models have marked cut lines. Best: take out your old insole, place it on the MONETA and trim the excess at the toes.')
    },
    {
      kw: ['чист', 'одржува', 'пере', 'прање', 'care', 'wash', 'pastrim'],
      q: t('Како да ги чистам влошките?', 'Si t\'i pastroj tabanët?', 'How do I clean the insoles?'),
      a: t(
        'Кожни: малку влажна крпа + средство за нега на кожа. Текстилни/гел: влажна крпа + благ сапун. НЕ перете во машина и НЕ сушете на радијатор.',
        'Lëkurë: leckë pak të lagur + produkt për kujdesin e lëkurës. Tekstile/xhel: leckë e lagur + sapun i butë. MOS lani në makinë dhe MOS thani në radiator.',
        'Leather: slightly damp cloth + leather care product. Textile/gel: damp cloth + mild soap. Do NOT machine wash and do NOT dry on a radiator.')
    },
    {
      kw: ['прилагодува', 'притисок', 'навик', 'adapt', 'presion'],
      q: t('Колку време е потребно за прилагодување?', 'Sa kohë duhet për t\'u përshtatur?', 'How long does it take to adapt?'),
      a: t(
        'Повеќето чувствуваат олеснување веднаш. Ако прв пат носите анатомски влошки, нормално е благ притисок во првите 2-3 дена.',
        'Shumica ndjejnë lehtësim menjëherë. Nëse mbani për herë të parë tabanë anatomikë, është normale një presion i lehtë në 2-3 ditët e para.',
        'Most feel relief immediately. If this is your first time with anatomical insoles, a slight pressure in the first 2-3 days is normal.')
    },
    {
      kw: ['одговара', 'чевли', 'патик', 'сите видови', 'fit', 'këpucë'],
      q: t('Одговараат ли за сите чевли?', 'A përshtaten me të gjitha këpucët?', 'Do they fit all shoes?'),
      a: t(
        'Да — имаме специјализирани линии: спортски (со апсорпција на удари), танки кожни (за елегантни/деловни), термо зимски, летни и детски модели.',
        'Po — kemi linja të specializuara: sportive (me thithje goditjesh), lëkurë të holla (për elegante/biznes), termike dimërore, verore dhe modele për fëmijë.',
        'Yes — we have specialized lines: sports (shock absorbing), thin leather (for elegant/business), thermal winter, summer and kids models.')
    }
  ];

  const INFO = {
    delivery: t(
      '🚚 Достава за 48 часа низ цела Македонија. Трошок: 160 ден. — БЕСПЛАТНА за нарачки над 1.000 ден. Испораката ја врши партнерска курирска служба.',
      '🚚 Dorëzim brenda 48 orëve në të gjithë Maqedoninë. Kostoja: 160 den. — FALAS për porosi mbi 1.000 den. Dorëzimin e kryen shërbimi kurier partner.',
      '🚚 Delivery within 48 hours across Macedonia. Cost: 160 MKD — FREE for orders over 1,000 MKD. Delivered by our partner courier service.'),
    payment: t(
      '💵 Плаќање при преземање (готово) — плаќате кога ќе ја примите пратката од курирот.',
      '💵 Pagesë në dorëzim (para në dorë) — paguani kur e merrni parcelën nga kurieri.',
      '💵 Cash on delivery — you pay when you receive the shipment from the courier.'),
    sizes: t(
      '👟 Влошките се во стандардни европски броеви (35-46). Изберете го истиот број што го носите најчесто.',
      '👟 Tabanët janë në numra standardë evropianë (35-46). Zgjidhni të njëjtin numër që mbani më shpesh.',
      '👟 Insoles come in standard European sizes (35-46). Choose the size you wear most often.'),
    care: t(
      '🧼 Кожни: влажна крпа. Текстилни/гел: влажна крпа + благ сапун. НЕ во машина, НЕ на радијатор.',
      '🧼 Lëkurë: leckë e lagur. Tekstile/xhel: leckë e lagur + sapun i butë. JO në makinë, JO në radiator.',
      '🧼 Leather: damp cloth. Textile/gel: damp cloth + mild soap. NOT machine, NOT radiator.'),
    contact: t(
      '📞 Контакт: +389 76 454 957 / +389 2 323 00 88 • Е-пошта: info@calivita.mk • Скопје, ул. св. Кирил и Методиј бр. 20 (МАК-ФИТ ДООЕЛ / Calivita)',
      '📞 Kontakt: +389 76 454 957 / +389 2 323 00 88 • Email: info@calivita.mk • Shkup, rr. Shën Kirili dhe Metodi nr. 20 (MAK-FIT SH.P.K. / Calivita)',
      '📞 Contact: +389 76 454 957 / +389 2 323 00 88 • Email: info@calivita.mk • Skopje, 20 Sv. Kiril i Metodij St. (MAK-FIT DOOEL / Calivita)'),
    guide: t(
      '🧭 МОНЕТА водич за влошки: квиз за избор, водич за големини и споредба на модели → vodic.html',
      '🧭 Udhëzuesi MONETA: kuiz për zgjedhje, udhëzues për madhësi dhe krahasim modelesh → vodic.html',
      '🧭 MONETA insole guide: quiz, size guide and model comparison → vodic.html'),
    greeting: t(
      'Здраво! 👋 Јас сум МОНЕТА асистент. Можам да ти помогнам со големини, достава, цени и модели. Што те интересира?',
      'Përshëndetje! 👋 Unë jam asistenti MONETA. Mund të të ndihmoj me madhësitë, dorëzimin, çmimet dhe modelet. Çfarë të intereson?',
      'Hello! 👋 I am the MONETA assistant. I can help with sizes, delivery, prices and models. What are you interested in?'),
    fallback: t(
      'Извини, не најдов одговор на тоа прашање. 😊 Пробај да прашаш за големини, достава, цени, модели или контакт — или напиши ни на info@calivita.mk / +389 76 454 957.',
      'Më fal, nuk gjeta përgjigje për këtë pyetje. 😊 Provo të pyesësh për madhësi, dorëzim, çmime, modele ose kontakt — ose na shkruaj në info@calivita.mk / +389 76 454 957.',
      'Sorry, I could not find an answer to that. 😊 Try asking about sizes, delivery, prices, models or contact — or write us at info@calivita.mk / +389 76 454 957.')
  };

  // Категории (од сајтот)
  const CATEGORIES = [
    { id: 'sportski', link: './sportski.html' },
    { id: 'kozni', link: './kozni.html' },
    { id: 'letni', link: './letni.html' },
    { id: 'zimski', link: './zimski.html' },
    { id: 'hunter', link: './hunter.html' },
    { id: 'detski', link: './detski.html' },
    { id: 'heelpad', link: './heelpad.html' }
  ];

  // Кратки описи на модели (дополнително на живите цени од Supabase)
  const MODEL_HIGHLIGHTS = {
    'active-gel': 'Активен гел за амортизација; се сече по големина.',
    'anatomiX': 'Премиум RUN & HIKING; перење до 30°C.',
    'memosole': 'Мемориска пена што се прилагодува на стапалото.',
    'sport-style': 'Памучен фротир + пластичен носач за стабилност.',
    'sportex': 'Воздушно перниче во петата + алое вера.',
    'x-treme': '4-слојна конструкција со WAP амортизирачка зона.',
    'topas': '3/4 дизајн за елегантни чевли со ограничен простор.',
    'vital': 'Карбосан перниче за дополнителен комфор на петата.',
    'relax': 'Перфорирана кожа + пластичен носач.',
    'soft-gel': 'Кожа + гел перничиња во зоните на најголем контакт.',
    'heel-pad': 'Самолепливо перниче за амортизација на петата.',
    'heel-pad-fix': 'Формирачко перниче за стабилно позиционирање на петата.',
    'heel-pad-grip': 'Универзален самолеплив grip против лизгање.',
    'carbon': 'Активен јаглен; универзална — се сече по големина.',
    'simona': '100% памук + ароматична пена.',
    'thermo-alu': 'Волна + алуминиумска изолација од ладен под.',
    'hunter-camo': 'Камуфлажен дизајн + латекс со активен јаглен.',
    'hunter-flex': '3-слојна: Cambrella + алуминиум + филц (топлина).',
    'hunter-outdoor': '4-слојна со Viscolat мемориска пена.',
    'duck': '100% памучен фротир; ароматизирана латекс пена.'
  };

  // ============================================================
  // ДВИЖОК (engine) — препознавање намера по клучни зборови
  // ============================================================
  function normalize(s) { return String(s || '').toLowerCase().replace(/[^а-шѓѕјќљњџa-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim(); }

  function findModel(text) {
    const prods = (window.MonetaData && window.MonetaData.products) ? Object.values(window.MonetaData.products) : [];
    const list = prods.length ? prods : Object.keys(MODEL_HIGHLIGHTS).map(function (slug) { return { slug: slug, name_mk: slug, name_en: slug }; });
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const names = [p.name_mk, p.name_en, p.slug].filter(Boolean).map(function (n) { return n.toLowerCase(); });
      for (let j = 0; j < names.length; j++) {
        if (text.indexOf(names[j]) !== -1) return p;
      }
    }
    return null;
  }

  function findCategory(text) {
    const map = {
      'спорт': 'sportski', 'трча': 'sportski', 'фитнес': 'sportski',
      'кожн': 'kozni', 'елегант': 'kozni', 'деловн': 'kozni',
      'летн': 'letni', 'карбон': 'letni', 'симон': 'letni',
      'зимск': 'zimski', 'термо': 'zimski', 'топлин': 'zimski',
      'hunter': 'hunter', 'лов': 'hunter',
      'детск': 'detski', 'деца': 'detski', 'дик': 'detski',
      'пета': 'heelpad', 'heel': 'heelpad'
    };
    for (const k in map) { if (text.indexOf(k) !== -1) return map[k]; }
    return null;
  }

  function modelAnswer(p) {
    const prods = (window.MonetaData && window.MonetaData.products) || {};
    const db = prods[p.slug];
    const price = db ? Number(db.price) : null;
    const name = (L() === 'en' ? (p.name_en || p.name_mk) : (p.name_mk || p.name_en)) || p.slug;
    const highlight = MODEL_HIGHLIGHTS[p.slug] || '';
    let out = '🏷️ ' + name + (highlight ? ' — ' + highlight : '');
    if (price) out += '\n💰 Цена: ' + price.toLocaleString('mk-MK') + ' ден.';
    out += '\n🔗 Погледни: modeli/' + p.slug + '.html';
    return out;
  }

  function categoriesAnswer(cat) {
    const c = CATEGORIES.filter(function (x) { return x.id === cat; })[0];
    if (!c) return null;
    const tCat = t(
      { sportski: 'Спортски влошки', kozni: 'Кожни влошки', letni: 'Летни влошки', zimski: 'Зимски влошки', hunter: 'HUNTER влошки', detski: 'Детски влошки', heelpad: 'Heel Pad влошки' }[cat],
      { sportski: 'Tabana sportive', kozni: 'Tabana lëkure', letni: 'Tabana verore', zimski: 'Tabana dimërore', hunter: 'Tabanë HUNTER', detski: 'Tabana për fëmijë', heelpad: 'Tabanë Heel Pad' }[cat],
      { sportski: 'Sports insoles', kozni: 'Leather insoles', letni: 'Summer insoles', zimski: 'Winter insoles', hunter: 'HUNTER insoles', detski: 'Kids insoles', heelpad: 'Heel Pad insoles' }[cat]
    );
    return '🗂️ ' + tCat + ' → ' + c.link;
  }

  const INTENTS = [
    {
      id: 'delivery', kw: ['достава', 'испорак', 'достав', 'курир', '48', 'ispak', 'dorëzim', 'dërges', 'delivery', 'ship'],
      answer: function () { return INFO.delivery; }
    },
    {
      id: 'payment', kw: ['плаќање', 'плаќа', 'плати', 'готово', 'card', 'paguaj', 'pagesë', 'payment', 'pay'],
      answer: function () { return INFO.payment; }
    },
    {
      id: 'sizes', kw: ['големин', 'број', 'броеви', 'бројка', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', 'size', 'madhësi'],
      answer: function () { return INFO.sizes; }
    },
    {
      id: 'care', kw: ['чист', 'пере', 'прање', 'одржува', 'сапун', 'радијатор', 'исчист', 'изми', 'wash', 'pastr', 'kujdes', 'larje'],
      answer: function () { return INFO.care; }
    },
    {
      id: 'contact', kw: ['контакт', 'телефон', 'мејл', 'email', 'адрес', 'локац', 'каде', 'kontakt', 'telefon', 'address'],
      answer: function () { return INFO.contact; }
    },
    {
      id: 'guide', kw: ['водич', 'квиз', 'споредб', 'која влошка', 'препорача', 'guide', 'udhëz', 'kuiz', 'krahas'],
      answer: function () { return INFO.guide + '\n🔗 vodic.html'; }
    },
    {
      id: 'models', kw: ['модел', 'влошк', 'модели', 'производ', 'табан', 'model', 'produkt', 'insole'],
      answer: function (text) {
        const p = findModel(text);
        if (p) return modelAnswer(p);
        const cat = findCategory(text);
        if (cat) return categoriesAnswer(cat);
        return t(
          'Имаме 20 модели во категории: 🏃 Спортски, 👞 Кожни, ☀️ Летни, ❄️ Зимски, 🏔️ HUNTER, 👶 Детски и 🔧 Heel Pad. Побарај конкретен модел или категорија!',
          'Kemi 20 modele në kategori: 🏃 Sportive, 👞 Lëkure, ☀️ Verore, ❄️ Dimërore, 🏔️ HUNTER, 👶 Për fëmijë dhe 🔧 Heel Pad. Kërko një model ose kategori!',
          'We have 20 models in categories: 🏃 Sports, 👞 Leather, ☀️ Summer, ❄️ Winter, 🏔️ HUNTER, 👶 Kids and 🔧 Heel Pad. Ask for a specific model or category!');
      }
    },
    {
      id: 'prices', kw: ['цен', 'чини', 'колку', 'попуст', 'den', 'çmim', 'kushton', 'price', 'cost'],
      answer: function (text) {
        const p = findModel(text);
        if (p) return modelAnswer(p);
        return t(
          '💰 Цените можеш да ги видиш на секоја модел-страница (од 100 до 820 ден.). Кажи кој модел те интересира, па ќе ти ја кажам цената!',
          '💰 Çmimet mund t\'i shohësh në çdo faqe modeli (nga 100 deri 820 den.). Më thuaj cili model të intereson!',
          '💰 You can see prices on each model page (from 100 to 820 MKD). Tell me which model interests you!');
      }
    },
    {
      id: 'greeting', kw: ['здраво', 'здраво', 'привет', 'zdravo', 'поздрав', 'hi', 'hello', 'hey', 'përshëndetje', 'aló', 'alo'],
      answer: function () { return INFO.greeting; }
    },
    {
      id: 'thanks', kw: ['благодар', 'фала', 'thanks', 'thank', 'faleminderit', 'фале', 'ти фала'],
      answer: function () {
        return t('Нема на што! 😊 Ако ти треба нешто друго, тука сум.', 'S\'ka përse! 😊 Nëse të duhet diçka tjetër, jam këtu.', 'You\'re welcome! 😊 If you need anything else, I\'m here.');
      }
    }
  ];

  function answer(text) {
    const norm = normalize(text);
    // 1) Прво — FAQ (поконкретни прашања од сајтот)
    let bestFaq = null, bestFaqScore = 0;
    FAQ.forEach(function (f) {
      let s = 0;
      f.kw.forEach(function (k) { if (norm.indexOf(k) !== -1) s += k.length; });
      if (s > bestFaqScore) { bestFaqScore = s; bestFaq = f; }
    });
    if (bestFaq && bestFaqScore > 0) return bestFaq.q + '\n' + bestFaq.a;
    // 2) Потоа — општи намери
    let best = null, bestScore = 0;
    INTENTS.forEach(function (int) {
      let score = 0;
      int.kw.forEach(function (k) { if (norm.indexOf(k) !== -1) score += k.length; });
      if (score > bestScore) { bestScore = score; best = int; }
    });
    if (!best) return INFO.fallback;
    return best.answer(norm) || INFO.fallback;
  }

  // ============================================================
  // ИНТЕРФЕЈС (widget) — копче + прозорец + пораки + брзи одговори
  // ============================================================
  const QUICK = [
    ['🚚', 'Достава', 'Dorëzimi', 'Delivery'],
    ['💰', 'Цени', 'Çmimet', 'Prices'],
    ['👟', 'Големини', 'Madhësitë', 'Sizes'],
    ['🏷️', 'Модели', 'Modelet', 'Models'],
    ['💵', 'Плаќање', 'Pagesa', 'Payment'],
    ['📞', 'Контакт', 'Kontakt', 'Contact']
  ];

  // CSS (инјектирано)
  const CSS = [
    '#monetaBotBtn{position:fixed;bottom:22px;right:22px;z-index:9990;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,#EC1752,#C4123F);color:#fff;box-shadow:0 10px 26px rgba(236,23,82,.4);display:flex;align-items:center;justify-content:center;transition:transform .18s ease;}',
    '#monetaBotBtn:hover{transform:scale(1.08);}',
    '#monetaBotBtn svg{width:26px;height:26px;}',
    '#monetaBotBtn.is-open{transform:rotate(90deg);}',
    '#monetaBotWin{position:fixed;bottom:96px;right:22px;z-index:9990;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 130px));background:#fff;border:1px solid #efe9e6;border-radius:22px;box-shadow:0 24px 60px rgba(23,23,28,.22);display:none;flex-direction:column;overflow:hidden;font-family:inherit;}',
    '#monetaBotWin.is-open{display:flex;animation:botIn .22s ease;}',
    '@keyframes botIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '#monetaBotHead{background:linear-gradient(135deg,#EC1752,#C4123F);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '#monetaBotHead .b-avatar{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:17px;}',
    '#monetaBotHead .b-title{font-weight:800;font-size:15px;line-height:1.2;}',
    '#monetaBotHead .b-sub{font-size:11px;opacity:.85;}',
    '#monetaBotHead .b-close{margin-left:auto;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;}',
    '#monetaBotBody{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#faf7f6;}',
    '.b-msg{max-width:82%;padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.45;white-space:pre-line;}',
    '.b-msg.b-bot{background:#fff;border:1px solid #efe9e6;border-bottom-left-radius:5px;align-self:flex-start;}',
    '.b-msg.b-user{background:linear-gradient(135deg,#EC1752,#C4123F);color:#fff;border-bottom-right-radius:5px;align-self:flex-end;}',
    '.b-typing{display:inline-flex;gap:4px;padding:12px 14px;}',
    '.b-typing span{width:7px;height:7px;border-radius:50%;background:#EC1752;animation:blink 1.2s infinite;}',
    '.b-typing span:nth-child(2){animation-delay:.2s}.b-typing span:nth-child(3){animation-delay:.4s}',
    '@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}',
    '#monetaBotChips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 10px;background:#faf7f6;}',
    '.b-chip{border:1px solid rgba(236,23,82,.35);background:#fff;color:#EC1752;border-radius:999px;padding:7px 12px;font-size:12.5px;font-weight:700;cursor:pointer;transition:background .15s;}',
    '.b-chip:hover{background:rgba(236,23,82,.08);}',
    '#monetaBotInput{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #efe9e6;background:#fff;flex-shrink:0;}',
    '#monetaBotInput input{flex:1;border:1px solid #e8e1de;border-radius:12px;padding:10px 12px;font-size:13.5px;outline:none;}',
    '#monetaBotInput input:focus{border-color:rgba(236,23,82,.5);}',
    '#monetaBotSend{border:none;border-radius:12px;background:linear-gradient(135deg,#EC1752,#C4123F);color:#fff;width:42px;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '#monetaBotSend svg{width:18px;height:18px;}',
    '@media (max-width:480px){#monetaBotBtn{bottom:16px;right:16px;}#monetaBotWin{right:8px;bottom:84px;width:calc(100vw - 16px);}}'
  ].join('');

  function injectCss() {
    if (document.getElementById('monetaBotStyle')) return;
    const st = document.createElement('style');
    st.id = 'monetaBotStyle';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const TPL = [
    '<button id="monetaBotBtn" aria-label="МОНЕТА асистент" title="МОНЕТА асистент">',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '</button>',
    '<div id="monetaBotWin" role="dialog" aria-label="МОНЕТА асистент">',
    '<div id="monetaBotHead">',
    '<span class="b-avatar">🤖</span>',
    '<div><div class="b-title" data-b="title">МОНЕТА асистент</div><div class="b-sub" data-b="sub">Одговара веднаш · 24/7</div></div>',
    '<button class="b-close" id="monetaBotClose" aria-label="Затвори">×</button>',
    '</div>',
    '<div id="monetaBotBody"></div>',
    '<div id="monetaBotChips"></div>',
    '<div id="monetaBotInput">',
    '<input id="monetaBotText" type="text" autocomplete="off" placeholder="Напиши прашање...">',
    '<button id="monetaBotSend" aria-label="Испрати"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>',
    '</div>',
    '</div>'
  ].join('');

  function build() {
    injectCss();
    const holder = document.createElement('div');
    holder.id = 'monetaBotRoot';
    holder.innerHTML = TPL;
    document.body.appendChild(holder);

    const win = document.getElementById('monetaBotWin');
    const body = document.getElementById('monetaBotBody');
    const chips = document.getElementById('monetaBotChips');
    const input = document.getElementById('monetaBotText');
    const btn = document.getElementById('monetaBotBtn');
    const close = document.getElementById('monetaBotClose');
    const send = document.getElementById('monetaBotSend');
    let first = true;

    function addMsg(text, who) {
      const div = document.createElement('div');
      div.className = 'b-msg ' + (who === 'user' ? 'b-user' : 'b-bot');
      div.innerHTML = esc(text).replace(/\n/g, '<br>');
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    function typing(cb) {
      const d = document.createElement('div');
      d.className = 'b-msg b-bot b-typing';
      d.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
      setTimeout(function () { d.remove(); cb(); }, 550 + Math.random() * 350);
    }

    function renderChips() {
      chips.innerHTML = QUICK.map(function (c) {
        const label = L() === 'en' ? c[3] : (L() === 'sq' ? c[2] : c[1]);
        return '<button class="b-chip" data-q="' + c[1] + '">' + c[0] + ' ' + esc(label) + '</button>';
      }).join('');
    }

    function open() {
      win.classList.add('is-open');
      btn.classList.add('is-open');
      if (first) {
        first = false;
        typing(function () {
          addMsg(INFO.greeting, 'bot');
          renderChips();
        });
      } else {
        renderChips();
      }
      input.focus();
    }
    function closeWin() {
      win.classList.remove('is-open');
      btn.classList.remove('is-open');
    }
    function ask(text) {
      const q = String(text || '').trim();
      if (!q) return;
      addMsg(q, 'user');
      input.value = '';
      chips.innerHTML = '';
      typing(function () { addMsg(answer(q), 'bot'); renderChips(); });
    }

    btn.addEventListener('click', function () {
      if (win.classList.contains('is-open')) closeWin(); else open();
    });
    close.addEventListener('click', closeWin);
    send.addEventListener('click', function () { ask(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(input.value); });
    chips.addEventListener('click', function (e) {
      const b = e.target.closest('.b-chip');
      if (b) ask(b.getAttribute('data-q'));
    });

    // Промена на јазик → ажурирај го насловот и копчињата
    function refreshLang() {
      const title = document.querySelector('[data-b="title"]');
      const sub = document.querySelector('[data-b="sub"]');
      const ph = input;
      if (title) title.textContent = t('МОНЕТА асистент', 'Asistenti MONETA', 'MONETA assistant');
      if (sub) sub.textContent = t('Одговара веднаш · 24/7', 'Përgjigjet menjëherë · 24/7', 'Answers instantly · 24/7');
      if (ph) ph.placeholder = t('Напиши прашање...', 'Shkruaj pyetje...', 'Type a question...');
      renderChips();
    }
    refreshLang();
    if (window.MonetaLangCallbacks) window.MonetaLangCallbacks.push(refreshLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  window.MonetaBot = { answer: answer };
})();
