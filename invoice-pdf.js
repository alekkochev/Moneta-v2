// invoice-pdf.js — генерира професионална PDF ФАКТУРА (со ДДВ) во прелистувачот.
// Се користи од naracka.html. pdfmake се вчитува од CDN при прва употреба (Roboto = кирилица).
(function () {
  'use strict';

  var PDFMAKE_URL = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/pdfmake.min.js';
  var VFS_URL = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/vfs_fonts.js';

  var libPromise = null;
  var MONETA_LOGO = null;

  function loadLogo() {
    if (MONETA_LOGO) return Promise.resolve(MONETA_LOGO);
    return fetch('images/moneta-logo.png')
      .then(function (r) {
        if (!r.ok) throw new Error('лого не е достапно');
        return r.blob();
      })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          var fr = new FileReader();
          fr.onload = function () { MONETA_LOGO = fr.result; resolve(fr.result); };
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
      })
      .catch(function () {
        // Fallback: текстуално лого ако сликата не е достапна
        MONETA_LOGO = null;
        return null;
      });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Не можам да го вчитам: ' + src)); };
      document.head.appendChild(s);
    });
  }

  // ВАЖНО: pdfmake.min.js МОРА да се вчита ПРВО, па дури потоа vfs_fonts.js.
  // Паралелното вчитување (Promise.all) создава трка: ако vfs_fonts.js стигне прв,
  // window.pdfMake останува само {vfs} без createPdf → PDF-от не се генерира.
  function loadLibs() {
    if (libPromise) return libPromise;
    libPromise = loadScript(PDFMAKE_URL).then(function () {
      return loadScript(VFS_URL);
    });
    return libPromise;
  }

  function fmt(n) {
    return n.toLocaleString('mk-MK') + ' ден.';
  }

  // Секоја големина = посебна ставка (ред) во табелата.
  function buildDocDef(order, invNo, vatRate, dateStr) {
    var items = Array.isArray(order.items) ? order.items : [];
    var rows = [];
    items.forEach(function (it) {
      var price = Number(it.price) || 0;
      var name = String(it.name || it.slug || '?');
      var sizes = (it.sizes && typeof it.sizes === 'object') ? it.sizes : {};
      var keys = Object.keys(sizes).filter(function (s) { return Number(sizes[s]) > 0; });
      if (keys.length === 0) {
        var qty = Number(it.qty) || 1;
        rows.push({ name: name, size: '-', qty: qty, price: price });
      } else {
        keys.forEach(function (s) {
          rows.push({ name: name, size: String(s), qty: Number(sizes[s]), price: price });
        });
      }
    });

    // Основица (без ДДВ) + достава; без посебна ДДВ ставка.
    var goods = rows.reduce(function (s, r) { return s + r.price * r.qty; }, 0);
    var taxBase = Math.round(goods * 100) / 100;
    var delivery = Number(order.delivery) || 0;
    var grand = Math.round((taxBase + delivery) * 100) / 100;

    var tableBody = [[
      { text: '#', style: 'th' },
      { text: 'Производ', style: 'th' },
      { text: 'Големина', style: 'th' },
      { text: 'Кол.', style: 'th' },
      { text: 'Цена', style: 'th' },
      { text: 'Износ', style: 'th' },
    ]];
    rows.forEach(function (r, i) {
      tableBody.push([
        String(i + 1),
        r.name,
        r.size,
        String(r.qty),
        fmt(r.price),
        { text: fmt(r.price * r.qty), bold: true },
      ]);
    });

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 60],
      content: [
        {
          columns: [
            {
              width: '*',
              stack: MONETA_LOGO
                ? [
                    { image: MONETA_LOGO, width: 170, alignment: 'left' },
                    { text: 'Анатомски влошки', fontSize: 11, color: '#808080', margin: [2, 4, 0, 0] },
                  ]
                : [
                    { text: 'МОНЕТА', fontSize: 26, bold: true, color: '#EC1752' },
                    { text: 'Анатомски влошки', fontSize: 11, color: '#808080' },
                  ],
            },
            {
              width: 'auto',
              alignment: 'right',
              stack: [
                { text: 'Нарачка', fontSize: 24, bold: true, color: '#212124' },
                { text: 'Број: ' + invNo, fontSize: 10, color: '#808080' },
                { text: 'Датум: ' + dateStr, fontSize: 10, color: '#808080' },
              ],
            },
          ],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 2, lineColor: '#EC1752' }], margin: [0, 6, 0, 16] },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'ПРОДАВАЧ', fontSize: 9, color: '#808080' },
                { text: 'МАК-ФИТ ДООЕЛ (Calivita)', fontSize: 11, bold: true, color: '#212124' },
                { text: 'Скопје, ул. св. Кирил и Методиј бр. 20', fontSize: 10, color: '#212124' },
                { text: 'Тел: +389 76 454 957 / +389 2 323 00 88', fontSize: 10, color: '#212124' },
                { text: 'Е-пошта: info@calivita.mk', fontSize: 10, color: '#212124' },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'КУПУВАЧ', fontSize: 9, color: '#808080' },
                { text: String(order.name || '-'), fontSize: 11, bold: true, color: '#212124' },
                { text: 'Адреса: ' + String(order.address || '-'), fontSize: 10, color: '#212124' },
                { text: 'Град: ' + String(order.city || '-'), fontSize: 10, color: '#212124' },
                { text: 'Тел: ' + String(order.phone || '-'), fontSize: 10, color: '#212124' },
              ],
            },
          ],
          columnGap: 20,
        },
        { text: '', margin: [0, 16, 0, 4] },
        {
          table: {
            headerRows: 1,
            widths: [28, '*', 90, 40, 80, 80],
            body: tableBody,
          },
          layout: {
            hLineWidth: function (i) { return (i === 0 || i === 1) ? 1.2 : 0.5; },
            vLineWidth: function () { return 0.5; },
            hLineColor: function () { return '#E3E0DE'; },
            vLineColor: function () { return '#E3E0DE'; },
            fillColor: function (rowIndex) { return rowIndex === 0 ? '#EC1752' : null; },
            paddingTop: function () { return 6; },
            paddingBottom: function () { return 6; },
          },
        },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 235,
              stack: [
                { columns: [{ width: '*', text: 'Основица:', fontSize: 10 }, { width: 'auto', text: fmt(taxBase), fontSize: 10 }] },
                { columns: [{ width: '*', text: 'Достава:', fontSize: 10 }, { width: 'auto', text: delivery === 0 ? 'БЕСПЛАТНА ДОСТАВА' : fmt(delivery), fontSize: 10 }], margin: [0, 3, 0, 0] },
                { canvas: [{ type: 'line', x1: 0, y1: 3, x2: 235, y2: 3, lineWidth: 1.5, lineColor: '#EC1752' }], margin: [0, 6, 0, 4] },
                { columns: [{ width: '*', text: 'ВКУПНО:', fontSize: 11, bold: true, color: '#EC1752' }, { width: 'auto', text: fmt(grand), fontSize: 11, bold: true, color: '#EC1752' }] },
              ],
            },
          ],
          alignment: 'right',
          margin: [0, 12, 0, 0],
        },
      ],
      footer: function (currentPage, pageCount) {
        return {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'МОНЕТА — Анатомски влошки • www.vloski.mk', fontSize: 9, color: '#808080' },
                { text: 'Благодариме на довербата!', fontSize: 9, bold: true, color: '#EC1752' },
              ],
            },
            { width: 'auto', alignment: 'right', text: currentPage + ' / ' + pageCount, fontSize: 9, color: '#808080' },
          ],
          margin: [40, 14, 40, 0],
        };
      },
      styles: {
        th: { color: '#ffffff', bold: true, fontSize: 10 },
      },
    };
  }

  window.MonetaInvoice = {
    // order: {name, phone, email, city, address, items:[{name, sizes, qty, price}], delivery}
    // vatRate: 0.18 = 18%
    // Враќа { base64, invNo } или null при грешка.
    build: async function (order, vatRate) {
      try {
        await loadLibs();
        var now = new Date();
        var invNo = 'Н-' + now.getFullYear()
          + String(now.getMonth() + 1).padStart(2, '0')
          + String(now.getDate()).padStart(2, '0') + '-'
          + String(Math.floor(Math.random() * 9000) + 1000);
        // Датум во МК формат: 9.авг.2026
        var MK_MONTHS = ['јан.', 'фев.', 'мар.', 'апр.', 'мај.', 'јун.', 'јул.', 'авг.', 'септ.', 'окт.', 'ноем.', 'дек.'];
        var dateStr = now.getDate() + '.' + MK_MONTHS[now.getMonth()] + now.getFullYear();
        await loadLogo();
        var docDef = buildDocDef(order, invNo, vatRate || 0.18, dateStr);
        var b64 = await new Promise(function (resolve, reject) {
          window.pdfMake.createPdf(docDef).getBase64(function (result) {
            resolve(result);
          }, function (err) {
            reject(err || new Error('pdfmake грешка'));
          });
        });
        return { base64: b64, invNo: invNo };
      } catch (e) {
        console.warn('Invoice PDF error:', e);
        return null;
      }
    },
  };
})();
