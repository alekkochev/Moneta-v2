// scripts/test-order-email.mjs
// Тест: испраќа тест-нарачка со кирилица (UTF-8) до edge функцијата order-notify
const url = 'https://wkpkrnjrtpywuzemirbw.supabase.co/functions/v1/order-notify';
const payload = {
  name: 'Тест Клиент',
  phone: '+38970123456',
  email: 'test@moneta.local',
  city: 'Скопје',
  address: 'ул. Тест 5',
  note: 'Тест нарачка со попусти',
  payment: 'Плаќање при преземање (готово)',
  items: [
    { slug: 'simona', name: 'Simona (Летни)', code: '981034', sizes: { '35': 1 }, qty: 1, price: 120 },
    { slug: 'carbon', name: 'Carbon (Летни)', code: '201063', sizes: { univerzalna: 2 }, qty: 2, price: 170 },
    { slug: 'duck', name: 'Duck (Детски)', code: '201068', sizes: { '30': 1, '34': 1 }, qty: 2, price: 490 },
    { slug: 'memosole', name: 'MEMOSOLE (Спортски)', code: '16012', sizes: { '39-40': 1 }, qty: 1, price: 400 },
  ],
  total: 1870,
  delivery: 0,
  marketing_consent: true,
};
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
console.log('STATUS:', res.status);
console.log(await res.text());
