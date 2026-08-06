// invoice-pdf.js — генерира професионална PDF ФАКТУРА (со ДДВ) во прелистувачот.
// Се користи од naracka.html. pdfmake се вчитува од CDN при прва употреба (Roboto = кирилица).
(function () {
  'use strict';

  var PDFMAKE_URL = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/pdfmake.min.js';
  var VFS_URL = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/vfs_fonts.js';

  var libPromise = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Не можам да го вчитам: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function fmt(n) {
    return n.toLocaleString('mk-MK') + ' ден.';
  }

  function sizesText(it) {
    if (!it.sizes || typeof it.sizes !== 'object') return '';
    return Object.keys(it.sizes)
      .filter(function (s) { return Number(it.sizes[s]) > 0; })
      .map(function (s) { return s + ' × ' + it.sizes[s]; })
      .join(', ');
  }

  function buildDocDef(order, invNo, vatRate, dateStr) {
    var items = Array.isArray(order.items) ? order.items : [];
    var goods = items.reduce(function (s, it) { return s + (Number(it.price) || 0) * (Number(it.qty) || 0); }, 0);
    var taxBase = Math.round((goods / (1 + vatRate)) * 100) / 100;
    var vat = Math.round((goods - taxBase) * 100) / 100;
    var delivery = Number(order.delivery) || 0;
    var grand = goods + delivery;

    var tableBody = [[
      { text: '#', style: 'th' },
      { text: 'Производ', style: 'th' },
      { text: 'Големина', style: 'th' },
      { text: 'Кол.', style: 'th' },
      { text: 'Цена', style: 'th' },
      { text: 'Износ', style: 'th' },
    ]];
    items.forEach(function (it, i) {
      var price = Number(it.price) || 0;
      var qty = Number(it.qty) || 0;
      tableBody.push([
        String(i + 1),
        String(it.name || it.slug || '?'),
        sizesText(it) || '-',
        String(qty),
        fmt(price),
        { text: fmt(price * qty), bold: true },
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
              stack: [
                { text: 'МОНЕТА', fontSize: 26, bold: true, color: '#EC1752' },
                { text: 'Анатомски влошки', fontSize: 11, color: '#808080' },
              ],
            },
            {
              width: 'auto',
              alignment: 'right',
              stack: [
                { text: 'ФАКТУРА', fontSize: 24, bold: true, color: '#212124' },
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
                { columns: [{ width: '*', text: 'Основица (без ДДВ):', fontSize: 10 }, { width: 'auto', text: fmt(taxBase), fontSize: 10 }] },
                { columns: [{ width: '*', text: 'ДДВ (' + Math.round(vatRate * 100) + '%):', fontSize: 10 }, { width: 'auto', text: fmt(vat), fontSize: 10 }], margin: [0, 3, 0, 0] },
                { columns: [{ width: '*', text: 'Вкупно производи:', fontSize: 10 }, { width: 'auto', text: fmt(goods), fontSize: 10 }], margin: [0, 3, 0, 0] },
                { columns: [{ width: '*', text: 'Достава:', fontSize: 10 }, { width: 'auto', text: delivery === 0 ? 'БЕСПЛАТНА' : fmt(delivery), fontSize: 10 }], margin: [0, 3, 0, 0] },
                { canvas: [{ type: 'line', x1: 0, y1: 3, x2: 235, y2: 3, lineWidth: 1.5, lineColor: '#EC1752' }], margin: [0, 6, 0, 4] },
                { columns: [{ width: '*', text: 'ВКУПНО ЗА ПЛАЌАЊЕ:', fontSize: 11, bold: true, color: '#EC1752' }, { width: 'auto', text: fmt(grand), fontSize: 11, bold: true, color: '#EC1752' }] },
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
        if (!libPromise) {
          libPromise = Promise.all([loadScript(PDFMAKE_URL), loadScript(VFS_URL)]);
        }
        await libPromise;
        var now = new Date();
        var invNo = 'INV-' + now.getFullYear()
          + String(now.getMonth() + 1).padStart(2, '0')
          + String(now.getDate()).padStart(2, '0') + '-'
          + String(Math.floor(Math.random() * 9000) + 1000);
        var dateStr = now.toLocaleDateString('mk-MK');
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
