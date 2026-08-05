// test-cart.mjs — функционален тест на карт системот (Точка 3)
// Верификува: додавање → отстранување → MonetaCartOnChange повик → бројач ресет
import { readFileSync } from 'fs';

// ---- Мокови ----
const listeners = {};
const storage = {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
global.window = {
  addEventListener: (ev, fn) => { listeners['win:' + ev] = fn; },
  location: { pathname: '/test' }
};
global.document = {
  querySelectorAll: () => [],
  addEventListener: (ev, fn) => { listeners[ev] = fn; },
  documentElement: { lang: 'mk' }
};

// ---- Извлечи го CART SYSTEM IIFE од script.js ----
const js = readFileSync('script.js', 'utf8');
const start = js.indexOf('// CART SYSTEM (localStorage)');
const end = js.indexOf('// PRODUCT FINDER QUIZ');
if (start === -1 || end === -1) { console.error('FATAL: IIFE не е најден'); process.exit(1); }
const iife = js.slice(start, end);

// Изврши го IIFE-то
const fn = new Function(iife + '\n; return window;');
const win = fn();

let onChangeCalls = 0;
let lastCart = null;
window.MonetaCartOnChange = (c) => { onChangeCalls++; lastCart = c; };

// ---- Тест 1: Додади 2 артикли преку updateModel ----
const mkCtl = (slug, code, price, nameMk) => {
  const attrs = { 'data-model': slug, 'data-code': code, 'data-price': price, 'data-name-mk': nameMk, 'data-name-en': nameMk };
  return { getAttribute: (a) => attrs[a] || null };
};
win.MonetaCart.updateModel(mkCtl('active-gel', '281111', 620, 'Active Gel'), 1);
win.MonetaCart.updateModel(mkCtl('active-gel', '281111', 620, 'Active Gel'), 1);
win.MonetaCart.updateModel(mkCtl('anatomiX', '281112', 890, 'AnatomiX'), 1);
const cart1 = win.MonetaCart.getCart();
console.log('Тест 1 (додавање):');
console.log('  qty active-gel:', cart1['active-gel'] ? cart1['active-gel'].qty : 0, '(очекувано 2)');
console.log('  qty anatomiX:', cart1['anatomiX'] ? cart1['anatomiX'].qty : 0, '(очекувано 1)');
console.log('  totalQty:', win.MonetaCart.totalQty(cart1), '(очекувано 3)');
console.log('  onChange повици:', onChangeCalls, '(очекувано 3)');

// ---- Тест 2: Отстрани преку removeItem ----
win.MonetaCart.removeItem('active-gel');
const cart2 = win.MonetaCart.getCart();
console.log('\nТест 2 (отстранување):');
console.log('  active-gel во cart:', 'active-gel' in cart2, '(очекувано false — избришан)');
console.log('  anatomiX qty:', cart2['anatomiX'] ? cart2['anatomiX'].qty : 0, '(очекувано 1 — останува)');
console.log('  totalQty:', win.MonetaCart.totalQty(cart2), '(очекувано 1)');
console.log('  onChange повици вкупно:', onChangeCalls, '(очекувано 4)');

// ---- Тест 3: Симулација на клик на „Отстрани“ (делегиран listener) ----
const clickHandler = listeners['click'];
let removeTriggered = false;
if (clickHandler) {
  // маскиран клик на data-cart-remove во data-cart-item="anatomiX"
  const fakeItem = { getAttribute: () => 'anatomiX' };
  const fakeRemoveBtn = { closest: (sel) => sel === '[data-cart-item]' ? fakeItem : null };
  const fakeEvent = { target: { closest: (sel) => sel === '[data-cart-remove]' ? fakeRemoveBtn : null } };
  clickHandler(fakeEvent);
  removeTriggered = !('anatomiX' in win.MonetaCart.getCart());
}
console.log('\nТест 3 (клик „Отстрани“):');
console.log('  anatomiX избришан преку клик:', removeTriggered, '(очекувано true)');
console.log('  cart празна:', win.MonetaCart.totalQty(win.MonetaCart.getCart()) === 0, '(очекувано true)');
console.log('  onChange повици вкупно:', onChangeCalls, '(очекувано 5)');

// ---- Тест 4: pageshow / storage слушатели регистрирани ----
console.log('\nТест 4 (слушатели):');
console.log('  pageshow регистриран:', !!listeners['win:pageshow'], '(очекувано true)');
console.log('  storage регистриран:', !!listeners['win:storage'], '(очекувано true)');
console.log('  renderModelQty изложен:', typeof win.MonetaCart.renderModelQty === 'function', '(очекувано true)');

// ---- Тест 5: pageshow → бројач освежување (без грешка) ----
try {
  listeners['win:pageshow']();
  console.log('\nТест 5 (pageshow): извршен без грешка ✓');
} catch (e) {
  console.log('\nТест 5 (pageshow): ГРЕШКА ->', e.message);
}

const pass = cart1['active-gel'].qty === 2 && cart1['anatomiX'].qty === 1 &&
  !('active-gel' in cart2) && removeTriggered && win.MonetaCart.totalQty(win.MonetaCart.getCart()) === 0 &&
  !!listeners['win:pageshow'] && !!listeners['win:storage'];
console.log('\n===== ' + (pass ? 'СИТЕ ТЕСТОВИ ПОМИНАА ✓' : 'ИМА ПРОБЛЕМИ ✗') + ' =====');
