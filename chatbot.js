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

  // ---------- Живи цени од Supabase (fallback ако MonetaData не е вчитано) ----------
  function ensurePrices() {
    if (window.MonetaData && window.MonetaData.products && Object.keys(window.MonetaData.products).length) return;
    var SUPABASE_URL = 'https://wkpkrnjrtpywuzemirbw.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcHBybmpydHB5d3V6ZW1pcmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMjYzNjgsImV4cCI6MjA1OTgwMjM2OH0.fGkOnLxqcoyBxfhTsFAVmf0Fw4Gq0Z7QyVWomxWvkVg'; // анонимен public key — безбедно за front-end
    fetch(SUPABASE_URL + '/rest/v1/products?select=slug,name_mk,name_en,code,price,old_price,discount', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    })
    .then(function (r) { return r.json(); })
    .then(function (prods) {
      if (!window.MonetaData) window.MonetaData = {};
      if (!window.MonetaData.products) window.MonetaData.products = {};
      prods.forEach(function (p) {
        window.MonetaData.products[p.slug] = p;
      });
    })
    .catch(function () { /* тивко — MonetaData ќе биде достапно од script.js */ });
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
      kw: ['трае', 'траат', 'живот', 'колку долго', 'last', 'zgjat'],
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

  // ============================================================
  // ДЕТАЛНИ ОПИСИ НА МОДЕЛИ (полна содржина од страниците)
  // ============================================================
  const MODEL_DETAILS = {
    'active-gel': { cat: 'sportski', tag: ['🏃 Спортска — гел амортизација', '🏃 Sportive — amortizim xhel', '🏃 Sports — gel cushioning'], desc: ['Спортска влошка од активен гел што ја апсорбира силата на удар при секој чекор и значително го намалува заморот во нозете.', 'Taban sportiv me xhel aktiv që thith forcën e goditjes në çdo hap dhe redukton ndjeshëm lodhjen e këmbëve.', 'Sports insole with active gel that absorbs impact force with every step and significantly reduces leg fatigue.'], target: ['Идеална за трчање, фитнес и секојдневен тренинг — за спортисти и активни луѓе кои сакаат мека амортизација.', 'Ideale për vrapim, fitnes dhe stërvitje të përditshme — për sportistë dhe njerëz aktivë që duan amortizim të butë.', 'Ideal for running, fitness and daily training — for athletes and active people who want soft cushioning.'], specs: ['Активен гел за амортизација', 'Се сече по големина', 'За спортски патики'] },
    'anatomiX': { cat: 'sportski', tag: ['🏃 Премиум RUN & HIKING', '🏃 Premium RUN & HIKING', '🏃 Premium RUN & HIKING'], desc: ['Премиум влошка од линијата RUN & HIKING со рециклирана антибактериска пена — за интензивни тренинзи и планинарење.', 'Taban premium nga linja RUN & HIKING me shkumë antibakteriale të ricikluar — për stërvitje intensive dhe alpinizëm.', 'Premium insole from the RUN & HIKING line with recycled antibacterial foam — for intense training and hiking.'], target: ['За тркачи и планинари кои бараат издржливост, стабилност и заштита при долги напори.', 'Për vrapues dhe alpinistë që kërkojnë qëndrueshmëri, stabilitet dhe mbrojtje në përpjekje të gjata.', 'For runners and hikers who need durability, stability and protection on long efforts.'], specs: ['Рециклирана антибактериска пена', 'Се пере до 30°C', 'За RUN & HIKING'] },
    'carbon': { cat: 'letni', tag: ['☀️ Летна — активен јаглен', '☀️ Verore — karbon aktiv', '☀️ Summer — activated charcoal'], desc: ['Летна влошка со активен јаглен — анти-габична и перфорирана за максимална вентилација и свежина.', 'Taban veror me karbon aktiv — antifungal dhe i shpuar për ventilim dhe freski maksimale.', 'Summer insole with activated charcoal — anti-fungal and perforated for maximum ventilation and freshness.'], target: ['Совршена за летни обувки, патики и обувки без чорапи — за свежина и против мирис и потење.', 'E përkryer për këpucë verore, atlete dhe këpucë pa çorape — për freski dhe kundër erës dhe djersës.', 'Perfect for summer shoes, sneakers and no-sock footwear — for freshness and against odor and sweat.'], specs: ['Активен јаглен', 'Анти-габична', 'Универзална — се сече по големина'] },
    'duck': { cat: 'detski', tag: ['👶 Детска', '👶 Për fëmijë', '👶 Kids'], desc: ['Детска анатомска влошка од 100% памук со латекс и карбосан калап за правилен развој на детското стапало.', 'Taban anatomik për fëmijë prej 100% pambuku me lateks dhe kallëp karboni për zhvillim të duhur të këmbës.', 'Kids anatomical insole of 100% cotton with latex and carbon mold for proper foot development.'], target: ['За деца во развој — за училиште, патики и секојдневно носење.', 'Për fëmijë në rritje — për shkollë, atlete dhe përdorim të përditshëm.', 'For growing kids — for school, sneakers and daily wear.'], specs: ['100% памук', 'Латекс + карбосан калап', 'Правилен развој на стапалото'] },
    'heel-pad': { cat: 'heelpad', tag: ['🔧 Heel Pad — за пета', '🔧 Heel Pad — për thembër', '🔧 Heel Pad — for heel'], desc: ['Кожна влошка за пета со карбосан перниче и самолеплив слој — амортизација токму таму каде што боли.', 'Taban lëkure për thembër me jastëk karboni dhe shtresë vetëngjitëse — amortizim pikërisht aty ku dhemb.', 'Leather heel insole with carbon cushion and self-adhesive layer — cushioning right where it hurts.'], target: ['За болка во петата и чевли со тврда пета — брзо олеснување.', 'Për dhimbje thembrash dhe këpucë me thembër të fortë — lehtësim i shpejtë.', 'For heel pain and hard-heeled shoes — quick relief.'], specs: ['Карбосан перниче', 'Самолеплив слој', 'Се става директно во чевлот'] },
    'heel-pad-fix': { cat: 'heelpad', tag: ['🔧 Heel Pad FIX', '🔧 Heel Pad FIX', '🔧 Heel Pad FIX'], desc: ['Кожна влошка за пета со карбосан перниче и ЗАЈАКНАТ самолеплив слој — се држи цврсто на место.', 'Taban lëkure për thembër me jastëk karboni dhe shtresë vetëngjitëse të PËRFORCUAR — mbahet fort në vend.', 'Leather heel insole with carbon cushion and REINFORCED self-adhesive layer — holds firmly in place.'], target: ['За стабилно позиционирање на петата и долготрајно носење без поместување.', 'Për pozicionim të qëndrueshëm të thembrës dhe përdorim afatgjatë pa lëvizje.', 'For stable heel positioning and long-lasting wear without shifting.'], specs: ['Зајакнат самолеплив слој', 'Карбосан перниче', 'Стабилно позиционирање'] },
    'heel-pad-grip': { cat: 'heelpad', tag: ['🔧 Heel Pad GRIP', '🔧 Heel Pad GRIP', '🔧 Heel Pad GRIP'], desc: ['Самолепливо перниче за пета од мека кожа со карбосан пена — против лизгање и триење.', 'Jastëk vetëngjitës për thembër prej lëkure të butë me shkumë karboni — kundër rrëshqitjes dhe fërkimit.', 'Self-adhesive heel cushion of soft leather with carbon foam — against slipping and friction.'], target: ['За чевли кои се лизгаат на петата и за заштита од жулење.', 'Për këpucë që rrëshqasin në thembër dhe mbrojtje nga gërryerja.', 'For shoes that slip at the heel and protection from chafing.'], specs: ['Универзален', 'Самолеплив', 'Против лизгање'] },
    'hunter-camo': { cat: 'hunter', tag: ['🏔️ HUNTER — камуфлажна', '🏔️ HUNTER — kamuflazh', '🏔️ HUNTER — camouflage'], desc: ['Камуфлажна влошка со перфорирана PES ткаенина и латекс пена со активен јаглен — за најтешки услови.', 'Taban kamuflazh me pëlhurë PES të shpuar dhe shkumë lateksi me karbon aktiv — për kushtet më të vështira.', 'Camouflage insole with perforated PES fabric and latex foam with activated charcoal — for the toughest conditions.'], target: ['За лов, планинарење и outdoor активности — стабилност и свежина во секој терен.', 'Për gjueti, alpinizëm dhe aktivitete outdoor — stabilitet dhe freski në çdo terren.', 'For hunting, hiking and outdoor activities — stability and freshness on any terrain.'], specs: ['Перфорирана PES ткаенина', 'Латекс со активен јаглен', 'Камуфлажен дизајн'] },
    'hunter-flex': { cat: 'hunter', tag: ['🏔️ HUNTER — термо', '🏔️ HUNTER — termik', '🏔️ HUNTER — thermal'], desc: ['Термо влошка со Cambrella ткаенина, алуминиумска фолија и филц — топлина за зимски активности.', 'Taban termik me pëlhurë Cambrella, fletë alumini dhe shami — ngrohtësi për aktivitete dimërore.', 'Thermal insole with Cambrella fabric, aluminum foil and felt — warmth for winter activities.'], target: ['За лов и планинарење во зима, ладно време и снежни услови.', 'Për gjueti dhe alpinizëm në dimër, mot të ftohtë dhe kushte me borë.', 'For hunting and hiking in winter, cold weather and snowy conditions.'], specs: ['3-слојна: Cambrella + алуминиум + филц', 'Топлинска изолација', 'За зимски активности'] },
    'hunter-outdoor': { cat: 'hunter', tag: ['🏔️ HUNTER — outdoor', '🏔️ HUNTER — outdoor', '🏔️ HUNTER — outdoor'], desc: ['Анатомска влошка со Viscolat мемориска пена, PES филц и алуминиумска фолија — за пролет/есен.', 'Taban anatomik me shkumë memorie Viscolat, shami PES dhe fletë alumini — për pranverë/vjeshtë.', 'Anatomical insole with Viscolat memory foam, PES felt and aluminum foil — for spring/autumn.'], target: ['За лов и outdoor во преодни сезони — удобност и изолација во едно.', 'Për gjueti dhe outdoor në stinë të ndërmjetme — rehati dhe izolim në një.', 'For hunting and outdoor in transitional seasons — comfort and insulation in one.'], specs: ['4-слојна со Viscolat мемориска пена', 'PES филц + алуминиум', 'За пролет/есен'] },
    'memosole': { cat: 'sportski', tag: ['🧠 MEMOSOLE — мемориска пена', '🧠 MEMOSOLE — shkumë memorie', '🧠 MEMOSOLE — memory foam'], desc: ['Влошка со мемориска пена што се прилагодува точно на обликот на вашето стапало + латекс со активен јаглен за свежина.', 'Taban me shkumë memorie që përshtatet saktësisht me formën e këmbës suaj + lateks me karbon aktiv për freski.', 'Insole with memory foam that molds exactly to your foot shape + latex with activated charcoal for freshness.'], target: ['За секојдневен комфор — за луѓе кои сакаат влошка по мерка на својата нога.', 'Për rehati të përditshme — për njerëz që duan taban të përshtatur me këmbën e tyre.', 'For everyday comfort — for people who want a custom-molded insole.'], specs: ['Мемориска пена (прилагодување)', 'Латекс со активен јаглен', 'Универзален комфор'] },
    'relax': { cat: 'kozni', tag: ['👞 Кожна — Relax', '👞 Lëkure — Relax', '👞 Leather — Relax'], desc: ['Анатомска кожна влошка од перфорирана јагнешка кожа со латекс со активен јаглен и пластичен носач.', 'Taban anatomik lëkure prej lëkure delesh të shpuar me lateks me karbon aktiv dhe mbajtëse plastike.', 'Anatomical leather insole of perforated lambskin with activated charcoal latex and plastic arch support.'], target: ['За секојдневни и деловни чевли — удобност за целиот работен ден.', 'Për këpucë të përditshme dhe biznes — rehati për tërë ditën e punës.', 'For everyday and business shoes — comfort for the whole workday.'], specs: ['Перфорирана јагнешка кожа', 'Латекс со активен јаглен', 'Пластичен носач'] },
    'simona': { cat: 'letni', tag: ['☀️ Летна — Simona', '☀️ Verore — Simona', '☀️ Summer — Simona'], desc: ['Летни памучни влошки од 100% памук со латекс со активен јаглен и ароматична карбосан пена.', 'Tabanë verorë prej 100% pambuku me lateks me karbon aktiv dhe shkumë karboni aromatike.', 'Summer cotton insoles of 100% cotton with activated charcoal latex and aromatic carbon foam.'], target: ['За летни чевли и балетанки — лесни, дишечки и со пријатен мирис.', 'Për këpucë verore dhe baletina — të lehta, që marrin frymë dhe me aromë të këndshme.', 'For summer shoes and flats — light, breathable and with a pleasant scent.'], specs: ['100% памук', 'Ароматична карбосан пена', 'Латекс со активен јаглен'] },
    'soft-gel': { cat: 'kozni', tag: ['👞 Кожна + гел — Soft Gel', '👞 Lëkure + xhel — Soft Gel', '👞 Leather + gel — Soft Gel'], desc: ['Комбинација од јагнешка кожа, гел перничиња и активен јаглен — максимална удобност и свежина.', 'Kombinim prej lëkure delesh, jastëkësh xhel dhe karboni aktiv — rehati dhe freski maksimale.', 'A combination of lambskin, gel cushions and activated charcoal — maximum comfort and freshness.'], target: ['За највисок комфор — за луѓе со чувствителни стапала кои сакаат врвна удобност.', 'Për rehatinë më të lartë — për njerëz me këmbë të ndjeshme që duan rehati maksimale.', 'For the highest comfort — for people with sensitive feet who want premium comfort.'], specs: ['Јагнешка кожа', 'Гел перничиња во зоните на контакт', 'Активен јаглен'] },
    'sport-style': { cat: 'sportski', tag: ['🏃 Спортска — Sport Style', '🏃 Sportive — Sport Style', '🏃 Sports — Sport Style'], desc: ['Анатомска влошка од памучен фротир со латекс пена и пластичен носач — стабилност при секој чекор.', 'Taban anatomik prej pambuku terri me shkumë lateksi dhe mbajtëse plastike — stabilitet në çdo hap.', 'Anatomical insole of cotton terry with latex foam and plastic support — stability with every step.'], target: ['За секојдневни патики и спортски чевли — за активни луѓе.', 'Për atlete dhe këpucë sportive të përditshme — për njerëz aktivë.', 'For everyday sneakers and sports shoes — for active people.'], specs: ['Памучен фротир', 'Латекс пена', 'Пластичен носач'] },
    'sportex': { cat: 'sportski', tag: ['🏃 Спортска — Sportex', '🏃 Sportive — Sportex', '🏃 Sports — Sportex'], desc: ['Спортска влошка со воздушно перниче во петата, антибактериски материјали и ароматичен ефект на алое вера.', 'Taban sportiv me jastëk ajri në thembër, materiale antibakteriale dhe efekt aromatik aloe vera.', 'Sports insole with an air cushion in the heel, antibacterial materials and a soothing aloe vera effect.'], target: ['За трчање и тренинг — апсорпција на удари и свежина во едно.', 'Për vrap dhe stërvitje — thithje goditjesh dhe freski në një.', 'For running and training — shock absorption and freshness in one.'], specs: ['Воздушно перниче во петата', 'Антибактериски материјали', 'Ефект на алое вера'] },
    'thermo-alu': { cat: 'zimski', tag: ['❄️ Зимска — Thermo Alu', '❄️ Dimërore — Thermo Alu', '❄️ Winter — Thermo Alu'], desc: ['Зимска влошка од 100% волна со латекс пена и алуминиумска фолија — топлинска изолација од ладен под.', 'Taban dimëror prej 100% leshi me shkumë lateksi dhe fletë alumini — izolim termik nga dyshemeja e ftohtë.', 'Winter insole of 100% wool with latex foam and aluminum foil — thermal insulation from cold floors.'], target: ['За зимски чизми и обувки — топли стапала во најладните денови.', 'Për çizme dhe këpucë dimërore — këmbë të ngrohta në ditët më të ftohta.', 'For winter boots and shoes — warm feet on the coldest days.'], specs: ['100% волна', 'Алуминиумска фолија (изолација)', 'Латекс пена'] },
    'topas': { cat: 'kozni', tag: ['👞 Кожна — Topas (3/4)', '👞 Lëkure — Topas (3/4)', '👞 Leather — Topas (3/4)'], desc: ['3/4 кратка влошка за елегантни чевли од перфорирана јагнешка кожа со анатомски носач.', 'Taban i shkurtër 3/4 për këpucë elegante prej lëkure delesh të shpuar me mbajtëse anatomike.', '3/4 short insole for elegant shoes of perforated lambskin with anatomical arch support.'], target: ['За тесни, елегантни и деловни чевли со ограничен простор.', 'Për këpucë të ngushta, elegante dhe biznes me hapësirë të kufizuar.', 'For narrow, elegant and business shoes with limited space.'], specs: ['3/4 дизајн', 'Перфорирана јагнешка кожа', 'Анатомски носач'] },
    'vital': { cat: 'kozni', tag: ['👞 Кожна — Vital', '👞 Lëkure — Vital', '👞 Leather — Vital'], desc: ['Кожна влошка од перфорирана кожа со латекс со активен јаглен и карбосан перниче за петата.', 'Taban lëkure prej lëkure të shpuar me lateks me karbon aktiv dhe jastëk karboni për thembrën.', 'Leather insole of perforated leather with activated charcoal latex and a carbon heel cushion.'], target: ['За секојдневни чевли — комфор на петата и свежина.', 'Për këpucë të përditshme — rehati thembrash dhe freski.', 'For everyday shoes — heel comfort and freshness.'], specs: ['Перфорирана кожа', 'Карбосан перниче', 'Латекс со активен јаглен'] },
    'x-treme': { cat: 'sportski', tag: ['🏃 Премиум — X-TREME', '🏃 Premium — X-TREME', '🏃 Premium — X-TREME'], desc: ['Премиум 4-слојна спортска влошка со WAP материјал и амортизирачка зона — за екстремни напори.', 'Taban sportiv premium me 4 shtresa me material WAP dhe zonë amortizimi — për përpjekje ekstreme.', 'Premium 4-layer sports insole with WAP material and cushioning zone — for extreme efforts.'], target: ['За outdoor активности, тешки тренинзи и долги маршеви.', 'Për aktivitete outdoor, stërvitje të rënda dhe marshime të gjata.', 'For outdoor activities, heavy training and long marches.'], specs: ['4-слојна конструкција', 'WAP амортизирачка зона', 'За outdoor'] }
  };

  // Модели со универзална големина (fallback ако MonetaData сè уште не е вчитан)
  const UNIVERSAL = ['carbon', 'heel-pad', 'heel-pad-fix', 'heel-pad-grip'];

  // ============================================================
  // ПРЕПОРАКИ — врз основа на потребата/симптомот на корисникот
  // ============================================================
  const RECS = [
    { id: 'umor', kw: ['умор', 'уморн', 'замор', 'морни', 'нозе', 'ноги', 'tired', 'fatigue', 'lodh'], strong: ['умор', 'уморн', 'замор', 'tired', 'fatigue', 'lodh'], models: ['soft-gel', 'memosole', 'active-gel', 'x-treme'], title: t('🦶 За уморни нозе', '🦶 Për këmbë të lodhura', '🦶 For tired feet'), text: t('При умор и тежина во нозете најважна е амортизацијата и мекоста. Овие модели ја апсорбираат силата при одење и го намалуваат заморот преку денот:', 'Me lodhje dhe rëndim në këmbë, më e rëndësishme është amortizimi dhe butësia. Këto modele thithin forcën gjatë ecjes dhe reduktojnë lodhjen gjatë ditës:', 'For fatigue and heaviness in the legs, cushioning and softness matter most. These models absorb force while walking and reduce daily fatigue:'), clarify: t('Каде најмногу чувствувате замор — во целото стапало, петиците или предниот дел? Дали сте на нозе цел ден или после одредена активност?', 'Ku ndjeni më shumë lodhje — në të gjithë këmbën, thembrat apo pjesën e përparme? A jeni në këmbë gjithë ditën apo pas një aktiviteti?', 'Where do you feel the most fatigue — the whole foot, the heels or the front? Are you on your feet all day or after a specific activity?'), details: ['стое', 'стојам', 'одење', 'одам', 'трча', 'работа', 'тренинг', 'фитнес', 'цел ден', 'часа', 'саати', 'after', 'kada', 'koga'] },
    { id: 'peta', kw: ['пета', 'петица', 'болка', 'бол', 'болки', 'paine', 'heel', 'thembr', 'dhimbje'], strong: ['пета', 'петица', 'болка', 'бол', 'болки', 'paine', 'heel', 'thembr', 'dhimbje'], models: ['heel-pad', 'heel-pad-fix', 'heel-pad-grip', 'vital'], title: t('👟 Болка во стапалото', '👟 Dhimbje këmbe', '👟 Foot pain'), text: t('За болка во стапалото имаме неколку решенија зависно од тоа каде и како ве боли:', 'Për dhimbje këmbe kemi disa zgjidhje në varësi se ku dhe si ju dhemb:', 'For foot pain we have several solutions depending on where and how it hurts:'), clarify: t('Во кој дел од стапалото ја чувствувате болката — под петата, во средината (свод) или во предниот дел? Каков е интензитетот — остра, тапа или повремена болка? Дали ве боли при одење, трчање или цело време?', 'Në cilën pjesë të këmbës e ndjeni dhimbjen — nën thembër, në mes (hark) apo në pjesën e përparme? Cili është intensiteti — i mprehtë, i shurdhët apo i përkohshëm? A ju dhemb gjatë ecjes, vrapimit apo gjithë kohës?', 'In which part of the foot do you feel the pain — under the heel, in the middle (arch) or in the front? What is the intensity — sharp, dull or occasional? Does it hurt when walking, running or all the time?'), details: ['пета', 'петица', 'petic', 'под', 'табан', 'сред', 'свод', 'пред', 'прсти', 'пал', 'ostra', 'тапа', 'tapa', 'поврем', 'постојан', 'при одењ', 'при трча', 'цел ден', 'kada', 'koga', 'duri'] },
    { id: 'trcanje', kw: ['трча', 'трчање', 'тренинг', 'спорт', 'фитнес', 'вежба', 'run', 'running', 'training', 'sport', 'vrap', 'stërvit'], strong: ['трча', 'трчање', 'тренинг', 'спорт', 'спортски', 'sport', 'run', 'running', 'vrap'], models: ['anatomiX', 'active-gel', 'sportex', 'x-treme'], title: t('🏃 За трчање и тренинг', '🏃 Për vrap dhe stërvitje', '🏃 For running & training'), text: t('За трчање и спорт најважна е апсорпцијата на удари и стабилноста на стапалото. Овие модели се создадени за тоа:', 'Për vrap dhe sport, më e rëndësishme është thithja e goditjeve dhe stabiliteti i këmbës. Këto modele janë krijuar për këtë:', 'For running and sports, shock absorption and foot stability matter most. These models are made for that:'), clarify: t('Каков тип на активност — трчање, фитнес, тимски спортови? На каква подлога тренирате (асфалт, трева, сала)? Колку често и колку долго?', 'Çfarë lloj aktiviteti — vrapim, fitnes, sporte ekipore? Në çfarë sipërfaqe stërviteni (asfalt, bar, sallë)? Sa shpesh dhe sa gjatë?', 'What type of activity — running, fitness, team sports? On what surface (asphalt, grass, gym)? How often and how long?'), details: ['трча', 'трчам', 'тренинг', 'фитнес', 'спорт', 'вежба', 'run', 'асфалт', 'трева', 'сала', 'днев', 'недел', 'километ', 'минут', 'часа'] },
    { id: 'planina', kw: ['планинаре', 'лов', 'ловец', 'outdoor', 'hiking', 'hunt', 'planin', 'priroda', 'terren'], strong: ['планинаре', 'лов', 'outdoor', 'hiking', 'hunt'], models: ['hunter-camo', 'hunter-outdoor', 'hunter-flex', 'anatomiX'], title: t('🏔️ За планинарење и лов', '🏔️ Për alpinizëm dhe gjueti', '🏔️ For hiking & hunting'), text: t('За планинарење, лов и outdoor активности ви требаат издржливи влошки со добра изолација и стабилност:', 'Për alpinizëm, gjueti dhe aktivitete outdoor ju duhen tabanë të qëndrueshëm me izolim dhe stabilitet të mirë:', 'For hiking, hunting and outdoor activities you need durable insoles with good insulation and stability:'), clarify: t('Дали одите на планинарење, лов или долги прошетки во природа? Во кој период од годината најчесто — пролет, лето, есен или зима? Колку часови траат активностите?', 'A shkoni në alpinizëm, gjueti apo shëtitje të gjata në natyrë? Në cilën periudhë të vitit më shpesh — pranverë, verë, vjeshtë apo dimër? Sa orë zgjasin aktivitetet?', 'Do you go hiking, hunting or long nature walks? In which season mostly — spring, summer, autumn or winter? How many hours do your activities last?'), details: ['планинаре', 'лов', 'outdoor', 'hiking', 'hunt', 'mount', 'teren', 'тешки', 'пролет', 'есен', 'зима', 'лето', 'часа', 'ден'] },
    { id: 'rabota', kw: ['канцелар', 'работа', 'работ', 'служб', 'цел ден', 'стоење', 'стои', 'work', 'office', 'pune', 'qëndro'], strong: ['канцелар', 'работа', 'цел ден', 'work', 'office'], models: ['relax', 'vital', 'topas', 'soft-gel'], title: t('💼 За цел ден на нозе', '💼 Për tërë ditën në këmbë', '💼 For all day on your feet'), text: t('Ако цел ден стоите или одите на работа, најважни се комфорот и потпората на сводот. Кожните модели се најдобар избор:', 'Nëse tërë ditën qëndroni ose ecni në punë, më e rëndësishme është rehatia dhe mbështetja e harkut. Modelet lëkure janë zgjedhja më e mirë:', 'If you stand or walk all day at work, comfort and arch support matter most. Leather models are the best choice:'), clarify: t('Каков тип на работа — канцеларија, продавница, болница? Во какви обувки сте најчесто — елегантни, работни или патики? Колку часа дневно стоите/одите?', 'Çfarë lloj pune — zyrë, dyqan, spital? Në çfarë këpucësh jeni më shpesh — elegante, pune apo atlete? Sa orë në ditë qëndroni/ecni?', 'What type of work — office, shop, hospital? What shoes do you wear most — elegant, work or sneakers? How many hours do you stand/walk daily?'), details: ['канцелар', 'работа', 'продав', 'фабри', 'болниц', 'училиш', 'стое', 'стојам', 'цел ден', 'часа', 'елегант', 'работ', 'патики'] },
    { id: 'elegant', kw: ['елегант', 'деловн', 'балетанки', 'штикли', 'високи', 'свечен', 'elegant', 'business', 'thekë', 'taka'], strong: ['елегант', 'деловн', 'штикли', 'elegant', 'business'], models: ['topas', 'vital', 'relax', 'soft-gel'], title: t('👠 За елегантни чевли', '👠 Për këpucë elegante', '👠 For elegant shoes'), text: t('За елегантни и тесни чевли најдобро одговараат тенки кожни влошки кои не заземаат простор:', 'Për këpucë elegante dhe të ngushta më të mirat janë tabanët e hollë prej lëkure që nuk zënë hapësirë:', 'For elegant and narrow shoes, thin leather insoles that take no space are best:'), details: ['елегант', 'деловн', 'балетанки', 'штикли', 'потпети', 'рамни', 'тесни', '3/4', 'topas', 'број', 'голем'] },
    { id: 'zima', kw: ['зима', 'зимск', 'студ', 'студен', 'ладни', 'ладно', 'ladno', 'winter', 'cold', 'ftoht', 'dimër'], strong: ['зима', 'зимск', 'студ', 'ладни', 'winter', 'cold'], models: ['thermo-alu', 'hunter-flex'], title: t('❄️ За зима и ладно време', '❄️ Për dimër dhe mot të ftohtë', '❄️ For winter & cold weather'), text: t('За ладни стапала во зима препорачуваме термо влошки со топлинска изолација:', 'Për këmbë të ftohta në dimër rekomandojmë tabanë termikë me izolim termik:', 'For cold feet in winter we recommend thermal insoles with insulation:'), details: ['зимски', 'зима', 'чизма', 'скија', 'студен', 'ладно', 'мраз', 'снег', 'winter', 'boots', 'cold'] },
    { id: 'leto', kw: ['лето', 'летн', 'топло', 'мирис', 'мириз', 'потење', 'пот', 'зно', 'sweat', 'odor', 'smell', 'summer', 'verë', 'nxeht'], strong: ['лето', 'летн', 'мирис', 'потење', 'sweat', 'smell'], models: ['carbon', 'simona', 'sportex', 'active-gel'], title: t('☀️ За лето и свежина', '☀️ Për verë dhe freski', '☀️ For summer & freshness'), text: t('За лето, потење и мирис најважна е вентилацијата и активниот јаглен:', 'Për verë, djersë dhe erë, më e rëndësishme është ventilimi dhe karboni aktiv:', 'For summer, sweat and odor, ventilation and activated charcoal matter most:'), details: ['летни', 'лето', 'топло', 'мирис', 'пот', 'зно', 'без чорап', 'verë', 'патики'] },
    { id: 'deca', kw: ['деца', 'дете', 'детск', 'дечиња', 'kids', 'child', 'fëmij', 'femij'], strong: ['деца', 'детск', 'дете', 'kids', 'fëmij'], models: ['duck'], title: t('👶 За деца', '👶 Për fëmijë', '👶 For kids'), text: t('За правилен развој на детското стапало препорачуваме анатомска детска влошка:', 'Për zhvillim të duhur të këmbës së fëmijës rekomandojmë tabanin anatomik për fëmijë:', 'For proper development of kids feet we recommend the anatomical kids insole:'), details: ['дете', 'детск', 'детињ', 'син', 'ќерка', 'години', 'училиш', 'возраст', 'голем', 'број', 'age', 'years', 'kids', 'child'] },
    { id: 'zglo', kw: ['колена', 'колен', 'зглоб', 'рбет', 'грб', 'knee', 'joint', 'back', 'gju'], strong: ['колена', 'зглоб', 'рбет', 'knee', 'joint'], models: ['soft-gel', 'active-gel', 'x-treme'], title: t('🦵 За колена и зглобови', '🦵 Për gjunjë dhe nyje', '🦵 For knees & joints'), text: t('Амортизацијата на удари ја намалува оптовареноста на колената, зглобовите и на рбетот. Овие модели даваат најдобра заштита:', 'Thithja e goditjeve redukton ngarkesën në gjunjë, nyje dhe shtyllë. Këto modele japin mbrojtjen më të mirë:', 'Shock absorption reduces the load on knees, joints and spine. These models give the best protection:'), clarify: t('Каде најмногу чувствувате оптоварување — во колената, зглобовите или грбот? Дали болката се јавува после одредена активност (трчање, долго одење, стоење)?', 'Ku e ndjeni më shumë ngarkesën — në gjunjë, kyçe apo shpinë? A shfaqet dhimbja pas një aktiviteti të caktuar (vrapim, ecje e gjatë, qëndrim)?', 'Where do you feel the most load — knees, joints or back? Does the pain appear after a specific activity (running, long walking, standing)?'), details: ['колена', 'колен', 'зглоб', 'рбет', 'грб', 'после', 'по трча', 'од стое', 'при оде', 'kada', 'posle'] }
  ];

  // ============================================================
  // ДВИЖОК (engine) — препознавање намера
  // Разбира: кирилица + латиница (транслитерација) + помали грешки
  // ============================================================

  // Латиница → Кирилица (македонска)
  function toCyr(s) {
    const digraphs = { 'sh': 'ш', 'zh': 'ж', 'ch': 'ч', 'dzh': 'џ', 'gj': 'ѓ', 'kj': 'ќ', 'lj': 'љ', 'nj': 'њ', 'dj': 'ѓ' };
    const singles = { 'a': 'а', 'b': 'б', 'c': 'ц', 'd': 'д', 'e': 'е', 'f': 'ф', 'g': 'г', 'h': 'х', 'i': 'и', 'j': 'ј', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'q': 'к', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс', 'y': 'ј', 'z': 'з', 'č': 'ч', 'ć': 'ќ', 'š': 'ш', 'ž': 'ж', 'đ': 'ѓ', 'ç': 'ц', 'ë': 'е' };
    let out = '';
    const lower = String(s || '').toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      const three = lower.substr(i, 3);
      const two = lower.substr(i, 2);
      if (digraphs[three]) { out += digraphs[three]; i += 2; continue; }
      if (digraphs[two]) { out += digraphs[two]; i += 1; continue; }
      out += singles[lower[i]] || lower[i];
    }
    return out;
  }

  // „Омекнување": ш≈с, ж≈з, ч≈ц, ќ≈к, ѓ≈г, љ≈л, њ≈н (најчести неформални замени)
  function soften(s) {
    return toCyr(s)
      .replace(/ш/g, 'с').replace(/ж/g, 'з').replace(/ч/g, 'ц')
      .replace(/ќ/g, 'к').replace(/ѓ/g, 'г').replace(/љ/g, 'л')
      .replace(/њ/g, 'н').replace(/ѕ/g, 'з');
  }

  // Леванштајн растојание — толеранција на грешки при пишување
  function editDist(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const d = [];
    for (let i = 0; i <= m; i++) d[i] = [i];
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return d[m][n];
  }

  // Форми на еден збор: оригинал + омекната кирилица
  function forms(s) {
    const raw = String(s || '').toLowerCase().trim();
    const soft = soften(raw);
    return raw === soft ? [raw] : [raw, soft];
  }

  function matchAny(word, kw) {
    const wf = forms(word), kf = forms(kw);
    for (let i = 0; i < wf.length; i++) {
      for (let j = 0; j < kf.length; j++) {
        const w = wf[i], k = kf[j];
        if (!w || !k) continue;
        // Омекнатата форма на клучниот збор мора да е доволно долга —
        // кратки омекнати форми (на пр. wash→вас) даваат лажни совпаѓања
        if (j === 1 && k.length < 4) continue;
        // 1) субниз — нормален случај (зборот го содржи клучниот збор)
        if (w.indexOf(k) !== -1) return true;
        // 2) строго fuzzy — само подолги зборови, со ИСТ почеток (2 букви)
        if (w.length >= 4 && k.length >= 4 && w[0] === k[0] && w[1] === k[1]) {
          const tol = w.length <= 6 ? 1 : 2;
          if (Math.abs(w.length - k.length) <= tol && editDist(w, k) <= tol) return true;
        }
      }
    }
    return false;
  }

  function kwScore(words, kw) {
    let s = 0;
    words.forEach(function (w) { if (matchAny(w, kw)) s += Math.max(1, String(kw).length); });
    return s;
  }

  function normalize(s) {
    const raw = String(s || '').toLowerCase().replace(/[^а-шѓѕјќљњџa-z0-9çë\s]/gi, ' ').replace(/\s+/g, ' ').trim();
    return { raw: raw, cyr: soften(raw), words: raw.split(' ').filter(Boolean) };
  }

  function findModel(n) {
    const prods = (window.MonetaData && window.MonetaData.products) ? Object.values(window.MonetaData.products) : [];
    const list = prods.length ? prods : Object.keys(MODEL_DETAILS).map(function (slug) { return { slug: slug, name_mk: slug, name_en: slug }; });
    const inText = function (name) {
      const f = forms(name);
      for (let j = 0; j < f.length; j++) {
        if (n.raw.indexOf(f[j]) !== -1 || n.cyr.indexOf(f[j]) !== -1) return true;
      }
      return false;
    };
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (inText(p.name_mk) || inText(p.name_en) || inText(p.slug)) return p;
    }
    // fallback: некој збор од прашањето е дел од име на модел (на пр. „active")
    const words = n.raw.split(' ').filter(function (w) { return w.length >= 4; });
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const allNames = [p.name_mk, p.name_en, p.slug].filter(Boolean).map(function (x) { return x.toLowerCase(); });
      for (let w = 0; w < words.length; w++) {
        for (let a = 0; a < allNames.length; a++) {
          if (allNames[a].indexOf(words[w]) !== -1) return p;
        }
      }
    }
    return null;
  }

  function findCategory(n) {
    const map = {
      'спорт': 'sportski', 'трча': 'sportski', 'фитнес': 'sportski',
      'кожн': 'kozni', 'елегант': 'kozni', 'деловн': 'kozni',
      'летн': 'letni', 'карбон': 'letni', 'симон': 'letni',
      'зимск': 'zimski', 'термо': 'zimski', 'топлин': 'zimski',
      'хунтер': 'hunter', 'хантер': 'hunter', 'лов': 'hunter',
      'детск': 'detski', 'деца': 'detski',
      'пета': 'heelpad', 'хил': 'heelpad'
    };
    for (const k in map) {
      if (n.cyr.indexOf(k) !== -1 || n.cyr.indexOf(soften(k)) !== -1) return map[k];
    }
    return null;
  }

  function modelData(slug) {
    const prods = (window.MonetaData && window.MonetaData.products) || {};
    const db = prods[slug];
    const d = MODEL_DETAILS[slug] || { cat: '', tag: ['', '', ''], desc: ['', '', ''], target: ['', '', ''], specs: ['', '', ''] };
    const li = L() === 'en' ? 2 : (L() === 'sq' ? 1 : 0);
    var price = db ? Number(db.price) : null;
    var oldPrice = db ? Number(db.old_price) : 0;
    var discCol = db ? Number(db.discount) : 0; // колона discount од Supabase → %
    // Пресметај % попуст: од old_price или од discount колоната
    var discPct = 0;
    if (oldPrice > price && oldPrice > 0) {
      discPct = Math.round((1 - price / oldPrice) * 100);
    } else if (discCol > 0) {
      // discount колона: ако < 100 → %, инаку → денари (backward compat)
      discPct = discCol < 100 ? discCol : Math.round(discCol / price * 100);
      oldPrice = discPct > 0 ? Math.round(price / (1 - discPct / 100)) : 0;
    }
    if (oldPrice <= price) oldPrice = 0;
    return {
      slug: slug,
      name: (L() === 'en' ? (db && (db.name_en || db.name_mk)) : (db && (db.name_mk || db.name_en))) || slug,
      price: price,
      oldPrice: oldPrice,
      discountPct: discPct,
      cat: d.cat,
      tag: d.tag[li] || '',
      desc: d.desc[li] || '',
      target: d.target[li] || '',
      specs: Array.isArray(d.specs) ? d.specs : []
    };
  }

  // Враќа листа на производи со попуст (од MonetaData / Supabase)
  function getDiscountedProducts() {
    const prods = (window.MonetaData && window.MonetaData.products) || {};
    const discounted = [];
    Object.keys(prods).forEach(function (slug) {
      const m = modelData(slug);
      if (m.discountPct > 0) discounted.push(m);
    });
    discounted.sort(function (a, b) { return b.discountPct - a.discountPct; });
    return discounted;
  }

  function imgPath(slug) {
    return (/\/modeli\//.test(window.location.pathname) ? '../' : './') + 'images/cards/' + slug + '.webp';
  }

  function modelCardHtml(m) {
    var priceHtml = '';
    if (m.price) {
      if (m.oldPrice > 0) {
        priceHtml = '<div class="b-card__price">💰 <span class="b-card__price-old">' + m.oldPrice.toLocaleString('mk-MK') + ' ден.</span> ' + m.price.toLocaleString('mk-MK') + ' ден. <span class="b-card__discount-badge">−' + m.discountPct + '%</span></div>';
      } else {
        priceHtml = '<div class="b-card__price">💰 ' + m.price.toLocaleString('mk-MK') + ' ден.</div>';
      }
    }
    var discBadgeImg = m.discountPct > 0 ? '<div class="b-thumb__discount">-' + m.discountPct + '%</div>' : '';
    const target = m.target ? '<div class="b-card__target">🎯 ' + esc(m.target) + '</div>' : '';
    return '<div class="b-card">'
      + '<div class="b-card__imgwrap"><img src="' + imgPath(m.slug) + '" alt="' + esc(m.name) + '" loading="lazy" data-zoom="' + esc(m.slug) + '">' + discBadgeImg + '<span class="b-card__zoom">🔍</span></div>'
      + '<div class="b-card__body">'
      + '<div class="b-card__name">' + esc(m.name) + '</div>'
      + (m.tag ? '<div class="b-card__tag">' + esc(m.tag) + '</div>' : '')
      + priceHtml
      + '<div class="b-card__desc">' + esc(m.desc) + '</div>'
      + target
      + '<div class="b-card__actions">'
      + '<button class="b-chip" data-action="specs" data-slug="' + esc(m.slug) + '">🔍 ' + esc(t('Карактеристики', 'Karakteristikat', 'Specs')) + '</button>'
      + '<button class="b-chip" data-action="add" data-slug="' + esc(m.slug) + '">🛒 ' + esc(t('Додај во кошничка', 'Shto në shportë', 'Add to cart')) + '</button>'
      + '<a class="b-chip b-chip--link" href="' + imgPath(m.slug).replace(/images\/cards.*/, '') + 'modeli/' + esc(m.slug) + '.html" target="_blank" rel="noopener">↗ ' + esc(t('На сајтот', 'Në faqe', 'On site')) + '</a>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function modelAnswer(p) {
    return { html: modelCardHtml(modelData(p.slug)), chips: [] };
  }

  function modelSpecsText(slug) {
    const m = modelData(slug);
    const lines = (m.specs || []).map(function (s) { return '• ' + s; }).join('\n');
    return m.name + '\n' + lines + (m.price ? '\n💰 Цена: ' + m.price.toLocaleString('mk-MK') + ' ден.' : '');
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
      // 🏷️ ПРАШАЊЕ ЗА ПОПУСТИ — чита од Supabase (MonetaData) која моментално има попуст
      id: 'discounts', kw: ['попуст', 'намален', 'акци', 'снижен', 'поевти', 'евтино', 'продажб', 'распродажб', 'discount', 'sale', 'deal', 'offer', 'promo', 'zbrit', 'ofer'],
      answer: function () {
        const discounted = getDiscountedProducts();
        if (!discounted.length) {
          return t(
            '🎯 Моментално немаме активни попусти. Сите производи се по редовна цена. Проверете повторно или контактирајте нè за специјални понуди: info@calivita.mk 📩',
            '🎯 Aktualisht nuk kemi zbritje aktive. Të gjitha produktet janë me çmim të rregullt. Kontrolloni përsëri ose na kontaktoni për oferta speciale: info@calivita.mk 📩',
            '🎯 We currently have no active discounts. All products are at regular price. Check again or contact us for special offers: info@calivita.mk 📩');
        }
        var lines = [t('🏷️ **Производи на попуст:**', '🏷️ **Produkte me zbritje:**', '🏷️ **Discounted products:**'), ''];
        discounted.forEach(function (m) {
          var line = '• **' + m.name + '** — 💰 ' + m.price.toLocaleString('mk-MK') + ' ден.';
          if (m.oldPrice > 0) {
            line += ' ~~' + m.oldPrice.toLocaleString('mk-MK') + ' ден.~~';
          }
          line += '  🏷️ **−' + m.discountPct + '%**';
          lines.push(line);
        });
        lines.push('');
        lines.push(t(
          'Напиши ми го името на моделот (пр. „' + discounted[0].name + '") за детали и онлајн нарачка! 🛒',
          'Më shkruaj emrin e modelit (p.sh. „' + discounted[0].name + '") për detaje dhe porosi online! 🛒',
          'Write me the model name (e.g. "' + discounted[0].name + '") for details and online ordering! 🛒'));
        return lines.join('\n');
      }
    },
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
      answer: function (n) {
        const p = findModel(n);
        if (p) return modelAnswer(p);
        const cat = findCategory(n);
        if (cat) return categoriesAnswer(cat);
        return t(
          'Имаме 20 модели во категории: 🏃 Спортски, 👞 Кожни, ☀️ Летни, ❄️ Зимски, 🏔️ HUNTER, 👶 Детски и 🔧 Heel Pad. Побарај конкретен модел или категорија!',
          'Kemi 20 modele në kategori: 🏃 Sportive, 👞 Lëkure, ☀️ Verore, ❄️ Dimërore, 🏔️ HUNTER, 👶 Për fëmijë dhe 🔧 Heel Pad. Kërko një model ose kategori!',
          'We have 20 models in categories: 🏃 Sports, 👞 Leather, ☀️ Summer, ❄️ Winter, 🏔️ HUNTER, 👶 Kids and 🔧 Heel Pad. Ask for a specific model or category!');
      }
    },
    {
      id: 'prices', kw: ['цен', 'чини', 'колку', 'ден', 'çmim', 'kushton', 'price', 'cost'],
      answer: function (n) {
        const p = findModel(n);
        if (p) return modelAnswer(p);
        // Провери дали има попусти → спомни ги во одговорот
        const discounted = getDiscountedProducts();
        var extra = '';
        if (discounted.length) {
          var names = discounted.slice(0, 3).map(function (d) { return d.name + ' (−' + d.discountPct + '%)'; }).join(', ');
          if (discounted.length > 3) names += t(' и уште ' + (discounted.length - 3), ' dhe ' + (discounted.length - 3) + ' të tjerë', ' and ' + (discounted.length - 3) + ' more');
          extra = '\n\n🏷️ ' + t('Моментално на попуст: ' + names + '. Пиши „попуст" за цела листа!', 'Aktualisht me zbritje: ' + names + '. Shkruaj „zbritje" për listën!', 'Currently discounted: ' + names + '. Write "discount" for the full list!');
        }
        return t(
          '💰 Цените се од 100 до 820 ден. (во зависност од моделот). Кажи кој модел те интересира за точна цена!' + extra,
          '💰 Çmimet janë nga 100 deri 820 den. (në varësi të modelit). Më thuaj cili model të intereson për çmimin e saktë!' + extra,
          '💰 Prices range from 100 to 820 MKD (depending on the model). Tell me which model interests you for the exact price!' + extra);
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

  // ============================================================
  // БАЗА НА ПРОИЗВОДИ — структурирани атрибути за Recommendation Engine
  // (acts / problems / shoes = кодови; support/cushion/comfort = 1-3)
  // ============================================================
  const PRODUCT_ATTRS = {
    'active-gel': { acts: ['sports', 'running', 'standing', 'daily'], problems: ['fatigue', 'joint'], shoes: ['sport_shoe', 'everyday_shoe'], support: 2, cushion: 3, comfort: 3, materials: 'активен гел', tech: 'гел амортизација' },
    'anatomiX': { acts: ['running', 'hiking', 'sports'], problems: ['fatigue', 'joint'], shoes: ['sport_shoe'], support: 3, cushion: 3, comfort: 2, materials: 'рециклирана антибактериска пена', tech: 'RUN & HIKING' },
    'carbon': { acts: ['summer', 'daily'], problems: ['odor', 'sweat'], shoes: ['summer_shoe', 'everyday_shoe'], support: 1, cushion: 1, comfort: 2, materials: 'латекс + активен јаглен', tech: 'анти-габична' },
    'duck': { acts: ['kids', 'daily'], problems: ['flat'], shoes: ['kids'], support: 2, cushion: 2, comfort: 2, materials: '100% памук', tech: 'карбосан калап' },
    'heel-pad': { acts: ['walking', 'daily'], problems: ['heel'], shoes: ['everyday_shoe', 'work_shoe', 'elegant_shoe'], support: 1, cushion: 2, comfort: 2, materials: 'кожа + карбосан перниче', tech: 'самолеплив слој' },
    'heel-pad-fix': { acts: ['walking', 'daily'], problems: ['heel'], shoes: ['everyday_shoe', 'work_shoe'], support: 2, cushion: 2, comfort: 2, materials: 'кожа + карбосан перниче', tech: 'зајакнат самолеплив' },
    'heel-pad-grip': { acts: ['walking', 'daily'], problems: ['friction', 'heel'], shoes: ['everyday_shoe'], support: 1, cushion: 1, comfort: 1, materials: 'мека кожа + карбосан пена', tech: 'самолеплив grip' },
    'hunter-camo': { acts: ['hiking', 'sports'], problems: ['odor', 'sweat', 'fatigue'], shoes: [], support: 3, cushion: 3, comfort: 2, materials: 'PES ткаенина + латекс', tech: 'активен јаглен' },
    'hunter-flex': { acts: ['hiking', 'winter'], problems: ['cold'], shoes: ['winter_shoe'], support: 3, cushion: 2, comfort: 2, materials: 'Cambrella + алуминиум + филц', tech: 'термо изолација' },
    'hunter-outdoor': { acts: ['hiking'], problems: ['fatigue', 'cold'], shoes: [], support: 3, cushion: 3, comfort: 3, materials: 'Viscolat мемориска пена', tech: 'PES филц + алуминиум' },
    'memosole': { acts: ['daily', 'standing', 'walking'], problems: ['fatigue', 'arch'], shoes: ['everyday_shoe', 'work_shoe'], support: 2, cushion: 3, comfort: 3, materials: 'мемориска пена + латекс', tech: 'прилагодување на стапалото' },
    'relax': { acts: ['daily', 'standing', 'walking', 'work'], problems: ['fatigue', 'heel', 'odor'], shoes: ['work_shoe', 'everyday_shoe', 'elegant_shoe'], support: 2, cushion: 2, comfort: 3, materials: 'јагнешка кожа + латекс', tech: 'пластичен носач' },
    'simona': { acts: ['summer', 'daily'], problems: ['odor', 'sweat'], shoes: ['summer_shoe', 'everyday_shoe'], support: 1, cushion: 1, comfort: 2, materials: '100% памук', tech: 'ароматична пена' },
    'soft-gel': { acts: ['daily', 'standing', 'walking', 'work'], problems: ['fatigue', 'heel', 'arch', 'joint'], shoes: ['work_shoe', 'everyday_shoe', 'elegant_shoe'], support: 3, cushion: 3, comfort: 3, materials: 'јагнешка кожа + гел', tech: 'гел перничиња' },
    'sport-style': { acts: ['sports', 'daily'], problems: ['fatigue'], shoes: ['sport_shoe', 'everyday_shoe'], support: 2, cushion: 2, comfort: 2, materials: 'памучен фротир + латекс', tech: 'пластичен носач' },
    'sportex': { acts: ['sports', 'running'], problems: ['fatigue', 'heel', 'joint'], shoes: ['sport_shoe'], support: 2, cushion: 3, comfort: 2, materials: 'антибактериски материјали', tech: 'воздушно перниче + алое вера' },
    'thermo-alu': { acts: ['winter', 'daily'], problems: ['cold'], shoes: ['winter_shoe'], support: 2, cushion: 2, comfort: 2, materials: '100% волна + латекс', tech: 'алуминиумска изолација' },
    'topas': { acts: ['daily', 'standing', 'work'], problems: ['fatigue', 'arch'], shoes: ['elegant_shoe'], support: 2, cushion: 1, comfort: 2, materials: 'перфорирана јагнешка кожа', tech: '3/4 анатомски носач' },
    'vital': { acts: ['daily', 'standing', 'work'], problems: ['heel', 'fatigue', 'odor'], shoes: ['work_shoe', 'everyday_shoe', 'elegant_shoe'], support: 2, cushion: 2, comfort: 2, materials: 'перфорирана кожа + латекс', tech: 'карбосан перниче' },
    'x-treme': { acts: ['sports', 'running', 'hiking'], problems: ['fatigue', 'joint'], shoes: ['sport_shoe'], support: 3, cushion: 3, comfort: 2, materials: 'WAP 4-слојна', tech: 'амортизирачка зона' }
  };

  // Етикети за човечки приказ на сигналите (за објаснувањето „зошто")
  const SIGNAL_LABELS = {
    sports: 'спорт', running: 'трчање', standing: 'долго стоење', walking: 'одење', hiking: 'планинарење', kids: 'деца', daily: 'секојдневно носење', winter: 'зима/студ', summer: 'лето/топло',
    fatigue: 'замор на стапала', heel: 'болка во пета', arch: 'потпора на свод', odor: 'мирис', sweat: 'потење', cold: 'ладни стапала', joint: 'оптоварување на зглобови', friction: 'лизгање/жулење', flat: 'рамни стапала',
    sport_shoe: 'спортски обувки', work_shoe: 'работни обувки', elegant_shoe: 'елегантни чевли', winter_shoe: 'зимски обувки', summer_shoe: 'летни обувки', everyday_shoe: 'секојдневни обувки',
    comfort: 'удобност', support: 'поддршка'
  };

  // Мапирање текст → сигнали (што корисникот ги бара)
  const SIGNAL_MAP = {
    running: ['трча', 'run', 'vrap'],
    sports: ['спорт', 'фитнес', 'тренинг', 'вежба', 'sport', 'training', 'fitness'],
    standing: ['стое', 'стојам', 'стоиш', 'стој', 'standing', 'qëndro'],
    walking: ['одам', 'одењ', 'хода', 'walk', 'ecje'],
    hiking: ['планинаре', 'лов', 'hiking', 'hunt', 'outdoor', 'mount'],
    kids: ['деца', 'детск', 'дете', 'kids', 'fëmij'],
    daily: ['секојднев', 'дневн', 'daily'],
    winter: ['зима', 'зимск', 'ладн', 'winter', 'cold', 'ftoht'],
    summer: ['лето', 'летн', 'summer', 'verë'],
    fatigue: ['умор', 'замор', 'морн', 'tired', 'fatigue', 'lodh'],
    heel: ['пета', 'петиц', 'heel', 'thembr'],
    arch: ['свод', 'рамни', 'flat', 'hark'],
    odor: ['мирис', 'мириз', 'odor', 'smell'],
    sweat: ['пот', 'зно', 'sweat', 'djers'],
    cold: ['ладн', 'студ', 'cold', 'ftoht'],
    joint: ['колен', 'зглоб', 'рбет', 'knee', 'joint'],
    friction: ['лизга', 'жули', 'friction', 'rrëshqit'],
    sport_shoe: ['спортски', 'патики', 'sport', 'atlete'],
    work_shoe: ['работн', 'work', 'pune'],
    elegant_shoe: ['елегант', 'деловн', 'балетанки', 'штикли', 'elegant', 'business'],
    winter_shoe: ['чизма', 'зимски', 'boots', 'çizme'],
    summer_shoe: ['летни', 'sandal', 'verore'],
    everyday_shoe: ['секојдневн', 'everyday']
  };

  // Медицински термини → не даваме дијагноза (спецификација #10)
  const MEDICAL_KW = ['дијабет', 'артрит', 'невропат', 'циркулаци', 'тромб', 'херни', 'тумор', 'операц', 'рана', 'отиц', 'воспалени', 'ревма', 'остеопороз', 'диабет', 'arthritis', 'diabetes', 'neuropath', 'circulation', 'swelling', 'infection', 'reuma'];

  // Разговорна состојба — памти ако треба дообјаснување пред препорака (#4 од спецификацијата)
  let clarifyState = null;

  function isTooVague(n, rec) {
    if (!rec.details || !rec.details.length) return false;
    if (clarifyState && clarifyState.id === rec.id) return false; // веќе прашавме, сега корисникот одговори
    const allWords = (n.raw + ' ' + n.cyr).split(/\s+/).filter(function (w) { return w.length > 1; });
    return !rec.details.some(function (d) {
      for (let wi = 0; wi < allWords.length; wi++) {
        if (matchAny(allWords[wi], d)) return true;
      }
      return false;
    });
  }

  // ============================================================
  // RECOMMENDATION ENGINE — оценува производи по сигнали, врвни 3 со %
  // ============================================================
  function extractSignals(n) {
    const signals = [];
    Object.keys(SIGNAL_MAP).forEach(function (sig) {
      SIGNAL_MAP[sig].forEach(function (kw) {
        if (kwScore(n.words, kw) > 0) signals.push(sig);
      });
    });
    return Array.from(new Set(signals));
  }

  function scoreProduct(slug, signals) {
    const a = PRODUCT_ATTRS[slug];
    if (!a) return 0;
    let s = 0;
    signals.forEach(function (sig) {
      if (a.acts.indexOf(sig) !== -1) s += 2;
      if (a.problems.indexOf(sig) !== -1) s += 2;
      if (a.shoes.indexOf(sig) !== -1) s += 2;
      if (sig === 'comfort' && a.comfort >= 2) s += 2;
      if (sig === 'support' && a.support >= 2) s += 2;
    });
    return s;
  }

  function recExplain(ranked, signals) {
    const top = ranked[0];
    const m = modelData(top.slug);
    const a = PRODUCT_ATTRS[top.slug] || {};
    const sigHuman = (signals || []).map(function (s) { return SIGNAL_LABELS[s]; }).filter(Boolean).join(', ');
    const pct = '';
    const benefits = (Array.isArray(m.specs) && m.specs.length ? m.specs.slice(0, 3).join(', ') : (a.tech || '')).replace(/\.$/, '');
    const reason = (m.desc || '').replace(/\.$/, '');
    return t(
      'Според тоа што ми кажавте — ' + (sigHuman || 'вашите потреби') + ' — најмногу би ви ја препорачал ' + m.name + '. Причина: ' + reason + '. За вас особено се важни: ' + benefits + '.',
      'Sipas asaj që më thatë — ' + (sigHuman || 'nevojat tuaja') + ' — më shumë do t\'ju rekomandoja ' + m.name + ' (' + pct + '% përputhje). Arsyeja: ' + reason + '. Për ju veçanërisht: ' + benefits + '.',
      'Based on what you told me — ' + (sigHuman || 'your needs') + ' — I would most recommend ' + m.name + ' (' + pct + '% match). Reason: ' + reason + '. Especially important for you: ' + benefits + '.'
    );
  }

  function recResult(title, text, ranked) {
    const IS_MODELI = /\/modeli\//.test(window.location.pathname);
    const base = IS_MODELI ? '../' : './';
    let thumbs = '<div class="b-thumbs">';
    const chips = [];
    ranked.forEach(function (r) {
      const m = modelData(r.slug);
      var discBadge = m.discountPct > 0 ? '<div class="b-thumb__discount">-' + m.discountPct + '%</div>' : '';
      var priceHtml = m.price ? m.price.toLocaleString('mk-MK') + ' ден.' : '';
      if (m.oldPrice > 0 && m.price) {
        priceHtml = '<span class="b-thumb__price-old">' + m.oldPrice.toLocaleString('mk-MK') + ' ден.</span> '
          + m.price.toLocaleString('mk-MK') + ' ден.';
      }
      thumbs += '<div class="b-thumb" data-model="' + esc(r.slug) + '">'
        + '<div class="b-thumb__img"><img src="' + base + 'images/cards/' + r.slug + '.webp" alt="' + esc(m.name) + '" loading="lazy" data-zoom="' + esc(r.slug) + '">' + discBadge + '</div>'
        + '<div class="b-thumb__info">'
        + '<div class="b-thumb__name">' + esc(m.name) + '</div>'
        + '<div class="b-thumb__price">' + priceHtml + '</div>'
        + '<div class="b-thumb__desc">' + esc((m.desc || '').slice(0, 55)) + '</div>'
        + '</div>'
        + '</div>';
    });
    thumbs += '</div>';
    return {
      html: '<div class="b-rec">'
        + '<div class="b-rec__title">' + esc(title) + '</div>'
        + '<div class="b-rec__text">' + esc(text) + '</div>'
        + thumbs
        + '<div class="b-rec__hint">' + esc(t('Кликни на сликичка за детали и додавање во кошничка.', 'Kliko foton për detaje dhe shtim në shportë.', 'Click a thumbnail for details and adding to cart.')) + '</div>'
        + '</div>',
      chips: []
    };
  }

  function buildRec(rec, n) {
    const signals = extractSignals(n);
    const scored = rec.models.map(function (slug) { return { slug: slug, score: scoreProduct(slug, signals) }; });
    scored.sort(function (a, b) { return b.score - a.score; });
    const top = scored.slice(0, 3);
    const maxS = Math.max(1, scored[0].score);
    top.forEach(function (r) { r.pct = Math.round(r.score / maxS * 100); });
    return recResult(rec.title, rec.text + '\n\n' + recExplain(top, signals), top);
  }

  // ============================================================
  // ПРОДАЖЕН FUNNEL — „сакам влошки" → 2-4 прашања → препорака
  // ============================================================
  const FUNNEL_STEPS = {
    shoe: {
      q: t('Секако! За да ви ја препорачам најсоодветната влошка — за какви обувки ќе ги користите?', 'Sigurisht! Për t\'ju rekomanduar tabanin më të përshtatshëm — për çfarë këpucësh do t\'i përdorni?', 'Of course! To recommend the best insole — what type of shoes will you use them with?'),
      chips: [
        { label: t('🏃 Спортски', '🏃 Sportive', '🏃 Sports'), q: 'Спортски' },
        { label: t('👞 Работни/кожни', '👞 Pune/lëkure', '👞 Work/leather'), q: 'Работни' },
        { label: t('👠 Елегантни', '👠 Elegante', '👠 Elegant'), q: 'Елегантни' },
        { label: t('🥾 Зимски', '🥾 Dimërore', '🥾 Winter'), q: 'Зимски' },
        { label: t('☀️ Летни', '☀️ Verore', '☀️ Summer'), q: 'Летни' },
        { label: t('👶 Детски', '👶 Për fëmijë', '👶 Kids'), q: 'Детски' }
      ]
    },
    activity: {
      q: t('Дали најмногу стоите, одите или комбинирате?', 'A qëndroni më shumë, ecni apo kombinoni?', 'Do you mostly stand, walk or combine?'),
      chips: [
        { label: t('🕐 Стојам', '🕐 Qëndroj', '🕐 I stand'), q: 'Стојам' },
        { label: t('🚶 Одам', '🚶 Eci', '🚶 I walk'), q: 'Одам' },
        { label: t('⚖️ Комбинирам', '⚖️ Kombinoj', '⚖️ I combine'), q: 'Комбинирам' }
      ]
    },
    priority: {
      q: t('Дали барате пред сè удобност и амортизација, или повеќе поддршка и стабилност?', 'Kërkoni mbi të gjitha rehati dhe amortizim, apo më shumë mbështetje dhe stabilitet?', 'Do you want comfort and cushioning above all, or more support and stability?'),
      chips: [
        { label: t('☁️ Удобност', '☁️ Rehati', '☁️ Comfort'), q: 'Удобност' },
        { label: t('🦶 Поддршка', '🦶 Mbështetje', '🦶 Support'), q: 'Поддршка' },
        { label: t('⭐ И двете', '⭐ Të dyja', '⭐ Both'), q: 'И двете' }
      ]
    }
  };
  const GENERIC_KW = ['сакам влошк', 'барам влошк', 'ми треба влошк', 'што да земам', 'препорачај ми', 'препорачај влошк', 'сакам нешто за стапал', 'која влошка', 'која да ја земам', 'koja vloska', 'sakam vloska', 'preporacaj mi', 'which insole', 'what insole', 'i need insole', 'i want insole', 'koji taban', 'me duhet taban'];
  let funnel = null;

  function isGenericShopping(n) {
    return GENERIC_KW.some(function (k) {
      const kf = forms(k);
      for (let i = 0; i < kf.length; i++) {
        if (n.raw.indexOf(kf[i]) !== -1 || n.cyr.indexOf(kf[i]) !== -1) return true;
      }
      return false;
    });
  }

  const DISCOUNT_KW = ['попуст', 'намален', 'намале', 'акци', 'снижен', 'снижу', 'поевти', 'евтино', 'продажб', 'распродажб', 'дискаунт', 'discount', 'sale', 'deal', 'offer', 'promo', 'zbrit', 'ofer', 'акција'];
  function isDiscountQuery(n) {
    return DISCOUNT_KW.some(function (k) {
      return matchAnyInWords(n, k);
    });
  }

  const SIZE_QUERY_KW = ['mm', 'cm', 'милиметр', 'сантиметр', 'должина', 'измер', 'мерењ', 'стопал', 'големина на ног', 'големина на стапал', 'број од', 'бројка', 'број', 'broj', 'долж', 'measure', 'foot size', 'shoe size', 'size chart', 'sizing', 'за noga', 'kolku mm', 'santimetr', 'madhës'];
  const SIZE_GUIDE_MSG = t(
    '📏 За да ја одредите вистинската големина, измерете ја должината на стапалото во милиметри (од пета до најдолгиот прст). Потоа проверете ја табелата во МОНЕТА водичот за големини — таму се мапирани должините со европските броеви (35-46).\n🔗 vodic.html#golemini',
    '📏 Për të përcaktuar madhësinë e duhur, matni gjatësinë e këmbës në milimetra (nga thembra te gishti më i gjatë). Më pas kontrolloni tabelën në udhëzuesin MONETA për madhësi — aty janë të mapuara gjatësitë me numrat evropianë (35-46).\n🔗 vodic.html#golemini',
    '📏 To determine the right size, measure your foot length in millimeters (from heel to longest toe). Then check the table in the MONETA size guide — lengths are mapped to European sizes (35-46).\n🔗 vodic.html#golemini');

  // Табела: EU големина → должина на стапало (мм)
  var SIZE_TABLE = [
    { eu: 28, mm: 170 }, { eu: 29, mm: 177 }, { eu: 30, mm: 183 },
    { eu: 31, mm: 190 }, { eu: 32, mm: 197 }, { eu: 33, mm: 203 },
    { eu: 34, mm: 210 },
    { eu: 35, mm: 225 }, { eu: 36, mm: 232 }, { eu: 37, mm: 240 },
    { eu: 38, mm: 247 }, { eu: 39, mm: 255 }, { eu: 40, mm: 260 },
    { eu: 41, mm: 267 }, { eu: 42, mm: 274 }, { eu: 43, mm: 280 },
    { eu: 44, mm: 287 }, { eu: 45, mm: 295 }, { eu: 46, mm: 302 }
  ];

  function mmToEU(mm) {
    var closest = SIZE_TABLE[0], minDiff = Math.abs(mm - closest.mm);
    for (var i = 1; i < SIZE_TABLE.length; i++) {
      var diff = Math.abs(mm - SIZE_TABLE[i].mm);
      if (diff < minDiff) { minDiff = diff; closest = SIZE_TABLE[i]; }
    }
    return closest;
  }

  function extractNumberFromText(raw) {
    var m = raw.match(/(\d+)\s*(mm|cm|милиметр|сантиметр|см|мм)/i);
    if (m) return { val: parseInt(m[1]), unit: /cm|сантиметр|см/i.test(m[2]) ? 'cm' : 'mm' };
    m = raw.match(/EU\s*(\d+)/i);
    if (m) return { val: parseInt(m[1]), unit: 'eu' };
    m = raw.match(/број\s*(\d+)/i);
    if (m) return { val: parseInt(m[1]), unit: 'eu' };
    m = raw.match(/(\d{3})\b/); // трицифрен број = веројатно mm
    if (m) return { val: parseInt(m[1]), unit: 'mm' };
    m = raw.match(/(\d+)\s*(cm|сm|сантим|centim)/i);
    if (m) return { val: parseInt(m[1]), unit: 'cm' };
    return null;
  }

  function computeSizeAnswer(n) {
    var num = extractNumberFromText(n.raw + ' ' + n.cyr);
    if (!num) return { text: SIZE_GUIDE_MSG, chips: [] };

    var mm = num.unit === 'cm' ? num.val * 10 : num.val;
    if (num.unit === 'eu') {
      // EU големина → mm
      for (var i = 0; i < SIZE_TABLE.length; i++) {
        if (SIZE_TABLE[i].eu >= num.val) { mm = SIZE_TABLE[i].mm; break; }
      }
    }
    var info = mmToEU(mm);
    var cm = (info.mm / 10).toFixed(1);

    if (info.eu < 35) {
      return {
        text: t(
          '📏 За должина на стапало од ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', вашиот EU број е приближно ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). Ова е детска големина. Препорачуваме МОНЕТА Duck — детска анатомска влошка за правилен развој на стапалото. 🦆\n🔗 modeli/duck.html',
          '📏 Për gjatësi të këmbës ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', numri juaj EU është afërsisht ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). Kjo është madhësi për fëmijë. Rekomandojmë MONETA Duck — taban anatomik për fëmijë për zhvillim të duhur të këmbës. 🦆\n🔗 modeli/duck.html',
          '📏 For a foot length of ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', your EU size is approximately ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). This is a kids size. We recommend MONETA Duck — anatomical kids insole for proper foot development. 🦆\n🔗 modeli/duck.html'),
        chips: []
      };
    }
    if (info.eu > 46) {
      return {
        text: t(
          '📏 За должина на стапало од ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', вашиот EU број е приближно ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). За жал, МОНЕТА влошките се достапни до EU 46. Контактирајте нè за специјална нарачка: info@calivita.mk / +389 76 454 957.',
          '📏 Për gjatësi të këmbës ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', numri juaj EU është afërsisht ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). Fatkeqësisht, tabanët MONETA janë të disponueshëm deri në EU 46. Na kontaktoni për porosi speciale: info@calivita.mk / +389 76 454 957.',
          '📏 For a foot length of ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', your EU size is approximately ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). Unfortunately, MONETA insoles are available up to EU 46. Contact us for a special order: info@calivita.mk / +389 76 454 957.'),
        chips: []
      };
    }
    // EU 35-46 — одреди го точниот опсег
    var range = '';
    var ranges = [[35,36],[37,38],[39,40],[41,42],[43,44],[45,46]];
    for (var r = 0; r < ranges.length; r++) {
      if (info.eu >= ranges[r][0] && info.eu <= ranges[r][1]) {
        range = ranges[r][0] + '-' + ranges[r][1];
        break;
      }
    }
    return {
      text: t(
        '📏 За должина на стапало од ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', вашиот EU број е приближно ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). МОНЕТА големина: ' + range + '.\n\nСакате да ви препорачам влошки за спорт, за работа или за секојдневна удобност? 😊',
        '📏 Për gjatësi të këmbës ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', numri juaj EU është afërsisht ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). Madhësia MONETA: ' + range + '.\n\nDëshironi t\'ju rekomandoj tabanë për sport, punë apo rehati të përditshme? 😊',
        '📏 For a foot length of ' + (num.unit === 'eu' ? 'EU ' + num.val : num.val + ' ' + num.unit) + ', your EU size is approximately ' + info.eu + ' (≈ ' + cm + ' cm / ' + info.mm + ' mm). MONETA size: ' + range + '.\n\nWould you like me to recommend insoles for sports, work or everyday comfort? 😊'),
      chips: []
    };
  }

  function isSizeQuery(n) {
    const haystack = n.raw + ' ' + n.cyr;
    return SIZE_QUERY_KW.some(function (k) {
      return haystack.indexOf(k) !== -1;
    });
  }

  function detectShoe(n) {
    const w = n.raw + ' ' + n.cyr;
    if (/(спортск|патик|sport|atlete|trча|run|vrap)/.test(w)) return 'sport';
    if (/(работн|work|pune|кожн|lëkur)/.test(w)) return 'work';
    if (/(елегант|деловн|балетанк|штикли|elegant|business|thekë)/.test(w)) return 'elegant';
    if (/(зимск|чизм|winter|dimër|boots)/.test(w)) return 'winter';
    if (/(летн|sandal|summer|verore|лето)/.test(w)) return 'summer';
    if (/(детск|деца|kids|fëmij)/.test(w)) return 'kids';
    if (/(секојдневн|everyday|daily|обичн)/.test(w)) return 'everyday';
    return null;
  }
  function detectActivity(n) {
    const w = n.raw + ' ' + n.cyr;
    if (/(стое|стојам|стоиш|стој|standing|qëndro)/.test(w)) return 'stand';
    if (/(одам|одењ|хода|walk|ecje|ec)/.test(w)) return 'walk';
    if (/(комбинир|двете|both|mix|të dyja)/.test(w)) return 'mix';
    return null;
  }
  function detectPriority(n) {
    const w = n.raw + ' ' + n.cyr;
    if (/(удобност|comfort|rehat)/.test(w)) return 'comfort';
    if (/(поддршк|стабилн|support|stabilit)/.test(w)) return 'support';
    if (/(двете|both|të dyja)/.test(w)) return 'both';
    return null;
  }

  function funnelAnswersToSignals(answers) {
    const signals = [];
    const add = function (s) { signals.push(s); };
    if (answers.shoe === 'sport') { add('sports'); add('sport_shoe'); }
    if (answers.shoe === 'work') { add('work_shoe'); add('standing'); }
    if (answers.shoe === 'elegant') { add('elegant_shoe'); }
    if (answers.shoe === 'winter') { add('winter'); add('winter_shoe'); }
    if (answers.shoe === 'summer') { add('summer'); add('summer_shoe'); }
    if (answers.shoe === 'kids') { add('kids'); }
    if (answers.shoe === 'everyday') { add('daily'); add('everyday_shoe'); }
    if (answers.activity === 'stand') { add('standing'); }
    if (answers.activity === 'walk') { add('walking'); }
    if (answers.activity === 'mix') { add('standing'); add('walking'); }
    if (answers.priority === 'comfort') { add('comfort'); }
    if (answers.priority === 'support') { add('support'); }
    if (answers.priority === 'both') { add('comfort'); add('support'); }
    return Array.from(new Set(signals));
  }

  function processFunnel(n) {
    const step = funnel.step;
    let ans = null;
    if (step === 'shoe') ans = detectShoe(n);
    else if (step === 'activity') ans = detectActivity(n);
    else if (step === 'priority') ans = detectPriority(n);
    if (!ans) return null;
    funnel.answers[step] = ans;
    if (step === 'shoe') {
      funnel.step = 'activity';
      return { text: FUNNEL_STEPS.activity.q, chips: FUNNEL_STEPS.activity.chips };
    }
    if (step === 'activity') {
      funnel.step = 'priority';
      return { text: FUNNEL_STEPS.priority.q, chips: FUNNEL_STEPS.priority.chips };
    }
    if (step === 'priority') {
      const signals = funnelAnswersToSignals(funnel.answers);
      const scored = Object.keys(PRODUCT_ATTRS).map(function (slug) { return { slug: slug, score: scoreProduct(slug, signals) }; });
      scored.sort(function (a, b) { return b.score - a.score; });
      const top = scored.slice(0, 3);
      const maxS = Math.max(1, top[0].score);
      top.forEach(function (r) { r.pct = Math.round(r.score / maxS * 100); });
      funnel = null; clarifyState = null;
      return recResult(t('🎯 Препорака за вас', '🎯 Rekomandim për ju', '🎯 Recommendation for you'), recExplain(top, signals), top);
    }
    return null;
  }

  function hasStrongOtherIntent(n) {
    for (let i = 0; i < FAQ.length; i++) {
      let s = 0;
      FAQ[i].kw.forEach(function (k) { s += kwScore(n.words, k); });
      if (s >= 5) return true;
    }
    const strongIds = { delivery: 1, payment: 1, sizes: 1, care: 1, contact: 1, guide: 1 };
    for (let j = 0; j < INTENTS.length; j++) {
      const int = INTENTS[j];
      if (!strongIds[int.id]) continue;
      let s = 0;
      int.kw.forEach(function (k) { s += kwScore(n.words, k); });
      if (s >= 5) return true;
    }
    return false;
  }

  function matchAnyInWords(n, kw) {
    const all = (n.raw + ' ' + n.cyr).split(/\s+/).filter(Boolean);
    for (let i = 0; i < all.length; i++) {
      if (matchAny(all[i], kw)) return true;
    }
    return false;
  }

  function answer(text) {
    const n = normalize(text);
    // 0) Медицински теми → НЕ даваме дијагноза (спецификација #10)
    const medHit = MEDICAL_KW.some(function (k) { return matchAnyInWords(n, k); });
    if (medHit) {
      funnel = null; clarifyState = null;
      return {
        text: t(
          'Не можам да поставам медицинска дијагноза. 😊 Оваа влошка е наменета за поддршка/амортизација според карактеристиките наведени за производот. За сериозна, постојана или влошувачка болка препорачуваме консултација со лекар.',
          'Nuk mund të bëj diagnozë mjekësore. 😊 Ky taban është i destinuar për mbështetje/amortizim sipas karakteristikave të produktit. Për dhimbje serioze, të vazhdueshme ose në përkeqësim rekomandojmë konsultim me mjekun.',
          'I cannot make a medical diagnosis. 😊 This insole is designed for support/cushioning per the product characteristics. For serious, persistent or worsening pain we recommend consulting a doctor.'),
        chips: [{ label: t('📞 Контакт', '📞 Kontakt', '📞 Contact'), q: 'контакт' }]
      };
    }
    // 0.5) Активен funnel → обработи го одговорот на клиентот
    if (funnel) {
      const fr = processFunnel(n);
      if (fr) return fr;
      if (hasStrongOtherIntent(n) || findModel(n) || findCategory(n)) {
        funnel = null;
      } else {
        const st = FUNNEL_STEPS[funnel.step];
        return { text: t('Не те разбрав точно. ', 'Nuk të kuptova saktësisht. ', 'I did not understand exactly. ') + st.q, chips: st.chips };
      }
    }
    // 0.7) Прашање за големина/мерење → пресметај и предложи број
    if (isSizeQuery(n)) {
      clarifyState = null; funnel = null;
      return computeSizeAnswer(n);
    }
    // 1) Прво — FAQ (поконкретни прашања од сајтот)
    let bestFaq = null, bestFaqScore = 0;
    FAQ.forEach(function (f) {
      let s = 0;
      f.kw.forEach(function (k) { s += kwScore(n.words, k); });
      if (s > bestFaqScore) { bestFaqScore = s; bestFaq = f; }
    });
    if (bestFaq && bestFaqScore > 0) {
      clarifyState = null;
      return { text: bestFaq.q + '\n' + bestFaq.a };
    }
    // 1.5) Препораки — врз основа на потребата (умор, болка, спорт, сезона...)
    let bestRec = null, bestRecScore = 0;
    RECS.forEach(function (rec) {
      let s = 0, strong = 0;
      rec.kw.forEach(function (k) {
        if (kwScore(n.words, k) > 0) { s++; if (rec.strong.indexOf(k) !== -1) strong++; }
      });
      const sc = s * 3 + strong * 5;
      if (sc > bestRecScore) { bestRecScore = sc; bestRec = rec; }
    });
    // 1.2) Генеричко „сакам влошки" → започни продажен funnel (2-4 прашања)
    if (isGenericShopping(n) && (!bestRec || bestRecScore < 8)) {
      funnel = { step: 'shoe', answers: {} };
      clarifyState = null;
      return { text: FUNNEL_STEPS.shoe.q, chips: FUNNEL_STEPS.shoe.chips };
    }
    if (bestRec && bestRecScore >= 8) {
      // #4 ПРАШАЈ ПРЕД ДА ПРЕПОРАЧАШ: ако прашањето е премногу општо → дообјаснување
      if (isTooVague(n, bestRec)) {
        clarifyState = { id: bestRec.id };
        return { text: bestRec.clarify || bestRec.text, chips: [] };
      }
      clarifyState = null;
      return buildRec(bestRec, n);
    }
    clarifyState = null;
    // 1.8) Прашање за попуст/акција → провери Supabase и врати листа (пред општите намери)
    if (isDiscountQuery(n)) {
      const discInt = INTENTS[0]; // discounts е прв во низата
      return { text: discInt.answer(n), chips: [] };
    }
    // 2) Потоа — општи намери
    let best = null, bestScore = 0;
    INTENTS.forEach(function (int) {
      let score = 0;
      int.kw.forEach(function (k) { score += kwScore(n.words, k); });
      if (score > bestScore) { bestScore = score; best = int; }
    });
    if (!best || bestScore === 0) {
      // Сепак пробај: конкретен модел или категорија напишани сами (на пр. „memosole")
      const p = findModel(n);
      if (p) return modelAnswer(p);
      const cat = findCategory(n);
      if (cat) return { text: categoriesAnswer(cat) };
      return { text: INFO.fallback };
    }
    const a = best.answer(n);
    if (a && typeof a === 'object') return a;
    return { text: a };
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
    '#monetaBotHead .b-m-logo{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;animation:mPulse 2s ease-in-out infinite;}',
    '@keyframes mPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}',
    '#monetaBotHead .b-avatar{display:none;}',
    '#monetaBotHead .b-title{font-weight:800;font-size:15px;line-height:1.2;}',
    '#monetaBotHead .b-sub{font-size:11px;opacity:.85;}',
    '#monetaBotHead .b-close{margin-left:auto;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;}',
    '#monetaBotBody{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px;display:flex;flex-direction:column;gap:10px;background:#faf7f6;}',
    '.b-msg{max-width:82%;padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.45;white-space:pre-line;}',
    '.b-msg.b-bot{background:#fff;border:1px solid #efe9e6;border-bottom-left-radius:5px;align-self:flex-start;}',
    '.b-msg.b-user{background:linear-gradient(135deg,#EC1752,#C4123F);color:#fff;border-bottom-right-radius:5px;align-self:flex-end;}',
    '.b-typing{display:inline-flex;gap:4px;padding:12px 14px;}',
    '.b-typing span{width:7px;height:7px;border-radius:50%;background:#EC1752;animation:blink 1.2s infinite;}',
    '.b-typing span:nth-child(2){animation-delay:.2s}.b-typing span:nth-child(3){animation-delay:.4s}',
    '@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}',
    '#monetaBotChips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 10px;background:#faf7f6;}',
    '.b-chip{border:1px solid rgba(236,23,82,.35);background:#fff;color:#EC1752;border-radius:999px;padding:7px 12px;font-size:12.5px;font-weight:400;cursor:pointer;transition:background .15s;}',
    '.b-chip:hover{background:rgba(236,23,82,.08);}',
    '.b-chip--fb{border-color:rgba(236,23,82,.2);color:#7a6f6a;font-size:11px;font-weight:400;}',
    '.b-chip--done{background:#f0f0f0;pointer-events:none;}',
    '.b-rec{padding:2px 0;}',
    '.b-rec__title{font-weight:800;font-size:14px;margin-bottom:4px;}',
    '.b-rec__text{font-size:12.5px;color:#4a4a4a;line-height:1.45;margin-bottom:10px;}',
    '.b-thumbs{display:flex;flex-direction:column;gap:8px;margin:4px 0;}',
    '.b-thumb{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #efe9e6;border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .14s ease,box-shadow .14s ease;padding:8px;}',
    '.b-thumb:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.07);}',
    '.b-thumb__img{width:64px;height:64px;flex-shrink:0;border-radius:10px;overflow:hidden;position:relative;}',
    '.b-thumb__img img{display:block;width:100%;height:100%;object-fit:cover;}',
    '.b-thumb__match{display:none;}',
    '.b-thumb__discount{position:absolute;top:4px;right:4px;background:#EC1752;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:999px;z-index:2;}',
    '.b-thumb__price-old{text-decoration:line-through;color:#a09893;font-size:10.5px;margin-right:4px;}',
    '.b-thumb__info{flex:1;min-width:0;}',
    '.b-thumb__name{font-size:12.5px;font-weight:600;line-height:1.2;}',
    '.b-thumb__price{font-size:12px;font-weight:600;color:#17171c;margin-top:2px;}',
    '.b-thumb__desc{font-size:11px;color:#6a6360;line-height:1.3;margin-top:3px;}',
    '.b-rec__hint{font-size:11px;color:#9a918b;margin-top:8px;}',
    '#monetaBotCart{display:none;}',
    '.b-msg.b-bot.is-card{max-width:100%;padding:0;background:transparent;border:none;border-bottom-left-radius:0;}',
    '.b-card{background:#fff;border:1px solid #efe9e6;border-radius:14px;overflow:hidden;display:flex;gap:0;}',
    '.b-card__imgwrap{width:120px;flex-shrink:0;position:relative;cursor:zoom-in;overflow:hidden;}',
    '.b-card__imgwrap img{display:block;width:100%;height:100%;object-fit:cover;aspect-ratio:3/4;}',
    '.b-card__zoom{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.55);color:#fff;font-size:10.5px;padding:3px 8px;border-radius:999px;pointer-events:none;}',
    '.b-card__body{flex:1;min-width:0;padding:8px 10px 8px;}',
    '.b-card__name{font-weight:700;font-size:14px;}',
    '.b-card__tag{font-size:11px;color:#EC1752;font-weight:600;margin-top:1px;}',
    '.b-card__desc{font-size:12.5px;color:#4a4a4a;line-height:1.45;margin-top:6px;}',
    '.b-card__target{font-size:12px;color:#7a6f6a;margin-top:5px;}',
    '.b-card__price{font-weight:700;font-size:13.5px;margin-top:6px;color:#17171c;}',
    '.b-card__price-old{text-decoration:line-through;color:#9e9490;font-weight:400;font-size:12px;margin-right:4px;}',
    '.b-card__discount-badge{display:inline-block;background:#EC1752;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;margin-left:6px;vertical-align:middle;}',
    '.b-card__actions{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}',
    '.b-chip--link{display:inline-flex;align-items:center;text-decoration:none;}',
    '#monetaBotZoom{position:fixed;inset:0;z-index:10030;background:rgba(10,8,12,.82);display:none;align-items:center;justify-content:center;padding:24px;}',
    '#monetaBotZoom.is-open{display:flex;animation:botFade .18s ease;}',
    '@keyframes botFade{from{opacity:0}to{opacity:1}}',
    '#monetaBotZoom img{max-width:min(640px,92vw);max-height:62vh;border-radius:14px 14px 0 0;box-shadow:0 20px 60px rgba(0,0,0,.5);object-fit:contain;}',
    '#monetaBotZoom .b-zoom__footer{background:#fff;border-radius:0 0 14px 14px;padding:14px 16px;max-width:min(640px,92vw);text-align:left;}',
    '#monetaBotZoom .b-zoom__name{font-weight:800;font-size:15px;margin-bottom:4px;}',
    '#monetaBotZoom .b-zoom__price{font-weight:800;font-size:14px;color:#17171c;margin-bottom:8px;}',
    '#monetaBotZoom .b-zoom__specs{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;color:#5a5552;margin-bottom:10px;}',
    '#monetaBotZoom .b-zoom__link{display:inline-block;background:linear-gradient(135deg,#EC1752,#C4123F);color:#fff;font-weight:700;font-size:13px;padding:7px 14px;border-radius:999px;text-decoration:none;margin-top:4px;}',
    '#monetaBotZoom .b-zoom__link:hover{opacity:.9;}',
    '#monetaBotZoom .b-zoom-close{position:absolute;top:16px;right:20px;background:rgba(255,255,255,.15);border:none;color:#fff;font-size:26px;width:44px;height:44px;border-radius:50%;cursor:pointer;line-height:1;}',
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
    '<div id="monetaBotBackdrop" style="display:none;position:fixed;inset:0;z-index:9989;"></div>',
    '<button id="monetaBotBtn" aria-label="МОНЕТА асистент" title="МОНЕТА асистент">',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '</button>',
    '<div id="monetaBotWin" role="dialog" aria-label="МОНЕТА асистент">',
    '<div id="monetaBotHead">',
    '<span class="b-m-logo">M</span>',
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
    '</div>',
    '<div id="monetaBotZoom"><button class="b-zoom-close" aria-label="Затвори">×</button><img id="monetaBotZoomImg" alt=""><div class="b-zoom__footer" id="monetaBotZoomFooter"><div class="b-zoom__name" id="monetaBotZoomName"></div><div class="b-zoom__price" id="monetaBotZoomPrice"></div><div class="b-zoom__specs" id="monetaBotZoomSpecs"></div><a class="b-zoom__link" id="monetaBotZoomLink" href="#" target="_blank" rel="noopener">↗ ' + t('Погледни на сајтот','Në faqe','View on site') + '</a></div></div>'
  ].join('');

  function base() {
    return /\/modeli\//.test(window.location.pathname) ? '../' : './';
  }

  function build() {
    ensurePrices();
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
    const zoom = document.getElementById('monetaBotZoom');
    const zoomImg = document.getElementById('monetaBotZoomImg');
    let first = true;

    function addMsg(content, who, isCard) {
      const div = document.createElement('div');
      div.className = 'b-msg ' + (who === 'user' ? 'b-user' : 'b-bot') + (isCard ? ' is-card' : '');
      if (isCard) {
        div.innerHTML = content; // доверлив HTML од нашите картички (esc-нат)
      } else {
        div.innerHTML = esc(content).replace(/\n/g, '<br>');
      }
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

    function renderChipsArr(arr) {
      chips.innerHTML = (arr || []).map(function (c) {
        if (c.action === 'size') {
          return '<button class="b-chip" data-action="size" data-slug="' + esc(c.slug) + '" data-size="' + esc(c.size) + '">' + esc(c.label) + '</button>';
        }
        return '<button class="b-chip" data-q="' + esc(c.q == null ? '' : c.q) + '">' + esc(c.label) + '</button>';
      }).join('');
    }

    function open() {
      win.classList.add('is-open');
      btn.classList.add('is-open');
      const bd = document.getElementById('monetaBotBackdrop');
      if (bd) bd.style.display = 'block';
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
      const bd = document.getElementById('monetaBotBackdrop');
      if (bd) bd.style.display = 'none';
    }
    var lastUserQ = '';

    function logFallback(question) {
      try {
        var arr = JSON.parse(localStorage.getItem('moneta_bot_log') || '[]');
        arr.push({ q: question, t: new Date().toISOString() });
        if (arr.length > 200) arr = arr.slice(-100);
        localStorage.setItem('moneta_bot_log', JSON.stringify(arr));
      } catch (e) { /* ignore */ }
    }

    function ask(text) {
      const q = String(text || '').trim();
      if (!q) return;
      lastUserQ = q;
      addMsg(q, 'user');
      input.value = '';
      chips.innerHTML = '';
      typing(function () {
        const res = answer(q) || { text: INFO.fallback };
        if (res.html) {
          addMsg(res.html, 'bot', true);
        } else {
          addMsg(res.text || '', 'bot');
        }
        if (res.chips && res.chips.length) {
          renderChipsArr(res.chips);
        } else if (res.text === INFO.fallback) {
          logFallback(q); // логирај непознати прашања
          chips.innerHTML = '<button class="b-chip" data-q="контакт">📞 ' + esc(t('Разговарај со нас', 'Flisni me ne', 'Talk to us')) + '</button>'
            + '<button class="b-chip b-chip--fb" data-fb="no">👎 ' + esc(t('Не помогна', 'Nuk ndihmoi', 'Not helpful')) + '</button>';
        } else {
          renderChips();
          // фидбек чип после секој нормален одговор
          chips.innerHTML += '<button class="b-chip b-chip--fb" data-fb="yes">👍 ' + esc(t('Корисно', 'E dobishme', 'Helpful')) + '</button>'
            + '<button class="b-chip b-chip--fb" data-fb="no">👎 ' + esc(t('Не', 'Jo', 'No')) + '</button>';
        }
      });
    }

    // ---- Лет-анимација: магента "м" лета кон кошничката (1.5 сек) ----
    function flyToCart() {
      const cartEl = document.querySelector('.navbar__cart');
      if (!cartEl) return;
      const btn = document.getElementById('monetaBotBtn');
      const from = btn ? btn.getBoundingClientRect() : { left: 100, top: window.innerHeight - 80 };
      const to = cartEl.getBoundingClientRect();
      const m = document.createElement('div');
      m.textContent = 'm';
      m.style.cssText = 'position:fixed;left:' + from.left + 'px;top:' + from.top + 'px;font-size:28px;font-weight:800;color:#EC1752;z-index:10025;pointer-events:none;transition:all 1.5s cubic-bezier(.25,.1,.25,1);';
      document.body.appendChild(m);
      requestAnimationFrame(function () {
        m.style.left = (to.left + to.width / 2 - 14) + 'px';
        m.style.top = (to.top + to.height / 2 - 14) + 'px';
        m.style.fontSize = '14px';
        m.style.opacity = '0.3';
      });
      setTimeout(function () { m.remove(); }, 1550);
    }
    function addToCart(slug, size, qty) {
      if (!window.MonetaCart) return false;
      const prods = (window.MonetaData && window.MonetaData.products) || {};
      const db = prods[slug];
      const cart = window.MonetaCart.getCart();
      const it = cart[slug] || {
        slug: slug,
        code: (db && db.code) || slug,
        price: Number(db && db.price) || 0,
        nameMk: (db && db.name_mk) || slug,
        nameEn: (db && db.name_en) || slug,
        sizes: {}, size: '', qty: 0
      };
      it.sizes = it.sizes || {};
      const sk = size || 'univerzalna';
      it.sizes[sk] = (it.sizes[sk] || 0) + (qty || 1);
      it.size = sk;
      it.qty = Object.values(it.sizes).reduce(function (a, b) { return a + (b || 0); }, 0);
      cart[slug] = it;
      window.MonetaCart.setCart(cart);
      if (window.MonetaCart.renderNavBadges) window.MonetaCart.renderNavBadges();
      if (window.MonetaCart.renderFreeShip) window.MonetaCart.renderFreeShip(cart);
      if (window.MonetaCartOnChange) window.MonetaCartOnChange(cart);
      return true;
    }
    function startAddFlow(slug) {
      let sizes = [];
      const sd = window.MonetaData && window.MonetaData.sizes && window.MonetaData.sizes[slug];
      if (sd && Object.keys(sd).length) {
        sizes = Object.keys(sd);
      } else if (UNIVERSAL.indexOf(slug) !== -1) {
        sizes = ['univerzalna'];
      } else {
        sizes = ['35-36', '37-38', '39-40', '41-42', '43-44', '45-46'];
      }
      const m = modelData(slug);
      addMsg('🛒 ' + m.name + ' — ' + t('која големина?', 'cila madhësi?', 'which size?'), 'bot');
      renderChipsArr(sizes.map(function (s) {
        const label = s === 'univerzalna' ? t('Универзална', 'Universale', 'Universal') : s;
        return { label: label, action: 'size', slug: slug, size: s };
      }));
    }
    function addWithSize(slug, size) {
      const ok = addToCart(slug, size, 1);
      const m = modelData(slug);
      if (ok) {
        const sizeLabel = size === 'univerzalna' ? t('Универзална', 'Universale', 'Universal') : size;
        addMsg('✅ ' + t('Додадено во кошничката:', 'U shtua në shportë:', 'Added to your cart:') + ' ' + m.name + ' (' + sizeLabel + ')', 'bot');
        renderChipsArr([
          { label: '🛒 ' + t('Отвори кошничка', 'Hap shportën', 'Open cart'), q: 'OPEN_CART' },
          { label: t('Продолжи', 'Vazhdo', 'Continue'), q: '' }
        ]);
        flyToCart();
      } else {
        addMsg('⚠️ ' + t('Не можев да го додадам. Пробај повторно.', 'Nuk munda ta shtoja. Provo përsëri.', 'Could not add it. Try again.'), 'bot');
      }
    }

    // ---- Лет-анимација кон кошничката на сајтот (горе-десно) ----
    function flyToCart(srcEl) {
      const cartEl = document.querySelector('.navbar__cart');
      if (!cartEl) return;
      const from = srcEl.getBoundingClientRect();
      const to = cartEl.getBoundingClientRect();
      const img = srcEl.cloneNode(true);
      img.style.cssText = 'position:fixed;left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px;object-fit:cover;border-radius:10px;z-index:10020;pointer-events:none;transition:all .8s cubic-bezier(.5,-0.2,.6,.5);box-shadow:0 8px 24px rgba(0,0,0,.3);';
      document.body.appendChild(img);
      requestAnimationFrame(function () {
        img.style.left = (to.left + to.width / 2 - from.width / 2) + 'px';
        img.style.top = (to.top + to.height / 2 - from.height / 2) + 'px';
        img.style.width = '28px';
        img.style.height = '28px';
        img.style.opacity = '0.35';
        img.style.borderRadius = '50%';
      });
      setTimeout(function () { img.remove(); }, 850);
    }

    // ---- Зголемена слика (preview надвор од рамките на чатот) ----
    function openZoom(slug) {
      zoomImg.src = imgPath(slug);
      const m = modelData(slug);
      const zName = document.getElementById('monetaBotZoomName');
      const zPrice = document.getElementById('monetaBotZoomPrice');
      const zSpecs = document.getElementById('monetaBotZoomSpecs');
      const zLink = document.getElementById('monetaBotZoomLink');
      if (zName) zName.textContent = m.name;
      if (zPrice) zPrice.textContent = m.price ? '💰 ' + m.price.toLocaleString('mk-MK') + ' ден.' : '';
      if (zSpecs) zSpecs.innerHTML = (Array.isArray(m.specs) ? m.specs : []).map(function (s) { return '<span>• ' + esc(s) + '</span>'; }).join('');
      if (zLink) zLink.href = imgPath(slug).replace(/images\/cards.*/, '') + 'modeli/' + slug + '.html';
      zoom.classList.add('is-open');
    }
    function closeZoom() {
      zoom.classList.remove('is-open');
    }

    // ---- Настани ----
    btn.addEventListener('click', function () {
      if (win.classList.contains('is-open')) closeWin(); else open();
    });
    const backdrop = document.getElementById('monetaBotBackdrop');
    if (backdrop) backdrop.addEventListener('click', closeWin);
    close.addEventListener('click', closeWin);
    send.addEventListener('click', function () { ask(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(input.value); });
    chips.addEventListener('click', function (e) {
      const b = e.target.closest('.b-chip');
      if (!b) return;
      const fb = b.getAttribute('data-fb');
      if (fb) {
        // логирај фидбек
        try {
          var flog = JSON.parse(localStorage.getItem('moneta_bot_feedback') || '[]');
          flog.push({ fb: fb, q: lastUserQ, t: new Date().toISOString() });
          if (flog.length > 200) flog = flog.slice(-100);
          localStorage.setItem('moneta_bot_feedback', JSON.stringify(flog));
        } catch (ex) { /* ignore */ }
        b.textContent = fb === 'yes' ? '✅ ' + t('Фала!', 'Faleminderit!', 'Thanks!') : '✅ ' + t('Забележано', 'Shënuar', 'Noted');
        b.classList.add('b-chip--done');
        return;
      }
      const act = b.getAttribute('data-action');
      if (act === 'size') {
        addWithSize(b.getAttribute('data-slug'), b.getAttribute('data-size'));
        return;
      }
      const q = b.getAttribute('data-q') || '';
      if (q === 'OPEN_CART') { window.location.href = base() + 'cart.html'; return; }
      ask(q);
    });
    // Акции во картичките (во body) + зголемување на слика + клик на thumbnail
    body.addEventListener('click', function (e) {
      // Картичка-акции (спецификации, додај во кошничка)
      const chip = e.target.closest('.b-chip');
      if (chip) {
        const act = chip.getAttribute('data-action');
        const slug = chip.getAttribute('data-slug');
        if (act === 'specs' && slug) {
          addMsg(modelSpecsText(slug), 'bot');
          renderChips();
          return;
        }
        if (act === 'add' && slug) {
          startAddFlow(slug);
          return;
        }
        return;
      }
      // Thumbnail-сликичка (отвори модел-картичка)
      const thumb = e.target.closest('.b-thumb');
      if (thumb) {
        const slug = thumb.getAttribute('data-model');
        if (slug) ask(slug);
        return;
      }
      // Зголемување на слика
      const zi = e.target.closest('[data-zoom]');
      if (zi) openZoom(zi.getAttribute('data-zoom'));
    });
    if (zoom) zoom.addEventListener('click', function (e) {
      if (e.target === zoom || e.target.closest('.b-zoom-close')) closeZoom();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeZoom(); });

    // Промена на јазик → ажурирај го насловот и копчињата
    function refreshLang() {
      const title = document.querySelector('[data-b="title"]');
      const sub = document.querySelector('[data-b="sub"]');
      if (title) title.textContent = t('МОНЕТА асистент', 'Asistenti MONETA', 'MONETA assistant');
      if (sub) sub.textContent = t('Одговара веднаш · 24/7', 'Përgjigjet menjëherë · 24/7', 'Answers instantly · 24/7');
      if (input) input.placeholder = t('Напиши прашање...', 'Shkruaj pyetje...', 'Type a question...');
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
