// Генерира SQL за ажурирање на product_sizes од клиентската XLSX листа
// Користење: node scripts/import-stock.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// --- 1. Продукти (slug → id) ---
const PRODUCTS = {
  'active-gel': 'b8346bab-b22c-4c85-b156-18448b212896',
  'anatomiX': 'a376faae-610f-47ba-af28-83c8aeb418ab',
  'sport-style': 'd155aaf8-d5ae-4061-97bf-dac245b1b9e3',
  'sportex': '0969774a-55f5-4d32-9446-91f3b3324f24',
  'topas': 'e0ee7805-4fb2-4f00-b81a-c26a35e57ada',
  'vital': '1ec66dae-b71e-4e90-92ab-07ae215bd3e6',
  'relax': '368d9ca7-044b-40e9-b9a3-f7ab502d95d1',
  'soft-gel': '9e47becb-9e32-408a-a0da-1d5c4a39a200',
  'carbon': 'f4b236ce-d74a-4b7a-9935-283c21755c03',
  'simona': 'b07dcb97-62d3-4ed8-8b5f-5aa4275838d6',
  'thermo-alu': '82658b5b-a968-4ba8-b0d7-7e30f2adfc52',
  'hunter-camo': 'b1a2488f-c31f-4fe9-9a4f-c3a8312c2d67',
  'hunter-flex': 'fd66e7c2-e47c-4126-8e8b-53baeb1ef8ba',
  'hunter-outdoor': '8c5d8d39-483a-404c-a38a-bc730ae8d57c',
  'duck': '46c65ee3-2e82-44e6-80ec-45f46b156314',
  'heel-pad': '2f10834a-4ab9-4af6-b655-2467e85d569d',
  'heel-pad-fix': '0abe7145-3693-47c4-9d0e-6e134dfe3f1b',
  'heel-pad-grip': '95644acc-53e5-4546-8596-c5950265dfcb',
  'memosole': '81b330b6-4786-4a1a-b0e1-a73217890bbe',
  'x-treme': '0de0018a-807c-4ebe-be58-2a84d4219308',
};

// --- 2. Големини (slug → листа на size клучеви од HTML копчињата) ---
const SIZE_KEYS = {
  'active-gel': ['z35-41', 'm42-45'],
  'anatomiX': ['35', '37', '39', '41', '42', '43', '45', '46'],
  'sport-style': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'sportex': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'topas': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'vital': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'relax': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'soft-gel': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'carbon': ['univerzalna'],
  'simona': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'thermo-alu': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
  'hunter-camo': ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
  'hunter-flex': ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
  'hunter-outdoor': ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
  'duck': ['27', '29', '30', '32', '34', '35'],
  'heel-pad': ['35-37', '38-40', '41-43', '44-46'],
  'heel-pad-fix': ['35-37', '38-40', '41-43', '44-46'],
  'heel-pad-grip': ['univerzalna'],
  'memosole': ['35-36', '37-38', '39-40', '41-42', '43-44', '45-46'],
  'x-treme': ['35', '37', '38', '39', '41', '42', '43', '45', '46'],
};

// --- 3. Мапирање XLSX ред → { slug, sizeKey } по CODE ---
// Клуч = CODE (на пр. MO0235, MO13AL, MO63AL, MO8235)
const CODE_MAP = {
  // AnatomiX
  'MO0235': ['anatomiX', '35'], 'MO0237': ['anatomiX', '37'], 'MO0238': ['anatomiX', '38'],
  'MO0239': ['anatomiX', '39'], 'MO0241': ['anatomiX', '41'], 'MO0242': ['anatomiX', '42'],
  'MO0243': ['anatomiX', '43'], 'MO0245': ['anatomiX', '45'], 'MO0246': ['anatomiX', '46'],
  // Vital
  'MO0435': ['vital', '35'], 'MO0437': ['vital', '37'], 'MO0438': ['vital', '38'], 'MO0439': ['vital', '39'],
  'MO0441': ['vital', '41'], 'MO0442': ['vital', '42'], 'MO0443': ['vital', '43'], 'MO0445': ['vital', '45'], 'MO0446': ['vital', '46'],
  // X-treme
  'MO0535': ['x-treme', '35'], 'MO0537': ['x-treme', '37'], 'MO0538': ['x-treme', '38'], 'MO0539': ['x-treme', '39'],
  'MO0541': ['x-treme', '41'], 'MO0542': ['x-treme', '42'], 'MO0543': ['x-treme', '43'], 'MO0545': ['x-treme', '45'], 'MO0546': ['x-treme', '46'],
  // Soft Gel
  'MO0835': ['soft-gel', '35'], 'MO0837': ['soft-gel', '37'], 'MO0838': ['soft-gel', '38'], 'MO0839': ['soft-gel', '39'],
  'MO0841': ['soft-gel', '41'], 'MO0842': ['soft-gel', '42'], 'MO0843': ['soft-gel', '43'], 'MO0845': ['soft-gel', '45'], 'MO0846': ['soft-gel', '46'],
  // Sportex
  'MO1035': ['sportex', '35'], 'MO1037': ['sportex', '37'], 'MO1038': ['sportex', '38'], 'MO1039': ['sportex', '39'],
  'MO1041': ['sportex', '41'], 'MO1042': ['sportex', '42'], 'MO1043': ['sportex', '43'], 'MO1045': ['sportex', '45'], 'MO1046': ['sportex', '46'],
  // Active gel (37-41 → z35-41, 42-45 → m42-45)
  'MO1137': ['active-gel', 'z35-41'], 'MO1142': ['active-gel', 'm42-45'],
  // Memosole (големина → опсег)
  'MO1235': ['memosole', '35-36'], 'MO1237': ['memosole', '37-38'], 'MO1239': ['memosole', '39-40'],
  'MO1241': ['memosole', '41-42'], 'MO1243': ['memosole', '43-44'], 'MO1245': ['memosole', '45-46'],
  // Heel Grip
  'MO13AL': ['heel-pad-grip', 'univerzalna'],
  // Heel Pad Fix (големина → опсег)
  'MO1735': ['heel-pad-fix', '35-37'], 'MO1738': ['heel-pad-fix', '38-40'], 'MO1741': ['heel-pad-fix', '41-43'],
  'MO1744': ['heel-pad-fix', '44-46'], 'MO1746': ['heel-pad-fix', '44-46'],
  // Heel Pad (големина → опсег)
  'MO3135': ['heel-pad', '35-37'], 'MO3138': ['heel-pad', '38-40'], 'MO3141': ['heel-pad', '41-43'], 'MO3144': ['heel-pad', '44-46'],
  // Simona
  'MO3435': ['simona', '35'], 'MO3437': ['simona', '37'], 'MO3438': ['simona', '38'], 'MO3439': ['simona', '39'],
  'MO3441': ['simona', '41'], 'MO3442': ['simona', '42'], 'MO3443': ['simona', '43'], 'MO3445': ['simona', '45'], 'MO3446': ['simona', '46'],
  // Topas
  'MO4435': ['topas', '35'], 'MO4437': ['topas', '37'], 'MO4438': ['topas', '38'], 'MO4439': ['topas', '39'],
  'MO4441': ['topas', '41'], 'MO4442': ['topas', '42'], 'MO4443': ['topas', '43'], 'MO4445': ['topas', '45'], 'MO4446': ['topas', '46'],
  // Thermo Alu
  'MO6235': ['thermo-alu', '35'], 'MO6237': ['thermo-alu', '37'], 'MO6238': ['thermo-alu', '38'], 'MO6239': ['thermo-alu', '39'],
  'MO6241': ['thermo-alu', '41'], 'MO6242': ['thermo-alu', '42'], 'MO6243': ['thermo-alu', '43'], 'MO6245': ['thermo-alu', '45'], 'MO6246': ['thermo-alu', '46'],
  // Carbon
  'MO63AL': ['carbon', 'univerzalna'],
  // Duck
  'MO6827': ['duck', '27'], 'MO6829': ['duck', '29'], 'MO6830': ['duck', '30'], 'MO6832': ['duck', '32'],
  'MO6834': ['duck', '34'], 'MO6835': ['duck', '35'],
  // Sport Style
  'MO6935': ['sport-style', '35'], 'MO6937': ['sport-style', '37'], 'MO6938': ['sport-style', '38'], 'MO6939': ['sport-style', '39'],
  'MO6941': ['sport-style', '41'], 'MO6942': ['sport-style', '42'], 'MO6943': ['sport-style', '43'], 'MO6945': ['sport-style', '45'], 'MO6946': ['sport-style', '46'],
  // Hunter-Outdoor
  'MO8235': ['hunter-outdoor', '35'], 'MO8238': ['hunter-outdoor', '38'], 'MO8240': ['hunter-outdoor', '40'],
  'MO8242': ['hunter-outdoor', '42'], 'MO8244': ['hunter-outdoor', '44'], 'MO8246': ['hunter-outdoor', '46'],
  // Hunter-Camo
  'MO8535': ['hunter-camo', '35'], 'MO8538': ['hunter-camo', '38'], 'MO8540': ['hunter-camo', '40'],
  'MO8542': ['hunter-camo', '42'], 'MO8544': ['hunter-camo', '44'], 'MO8546': ['hunter-camo', '46'],
  // Hunter-Flex
  'MO8635': ['hunter-flex', '35'], 'MO8638': ['hunter-flex', '38'], 'MO8640': ['hunter-flex', '40'],
  'MO8644': ['hunter-flex', '44'], 'MO8646': ['hunter-flex', '46'],
  // Relax
  'MO9035': ['relax', '35'], 'MO9037': ['relax', '37'], 'MO9038': ['relax', '38'], 'MO9039': ['relax', '39'],
  'MO9041': ['relax', '41'], 'MO9042': ['relax', '42'], 'MO9043': ['relax', '43'], 'MO9045': ['relax', '45'], 'MO9046': ['relax', '46'],
};

// --- 4. Читање на XLSX ---
const xlsxPath = process.argv[2] || 'C:/Users/alekk/Downloads/moneta qty 082026.xlsx';
const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(1);

// code → qty (последната вредност победува; Active gel има дупликат ред 27 и 0 → земаме 27)
const qtyByCode = {};
rows.forEach((r) => {
  const code = String(r[1] || '').trim();
  const qty = Number(r[3] || 0);
  if (code && !isNaN(qty)) {
    if (code in qtyByCode) {
      qtyByCode[code] = Math.max(qtyByCode[code], qty);
    } else {
      qtyByCode[code] = qty;
    }
  }
});

// --- 5. Градење на целосна слика: за секој производ, секоја големина → qty ---
const final = {}; // slug → { size: qty }
Object.keys(SIZE_KEYS).forEach((slug) => {
  final[slug] = {};
  SIZE_KEYS[slug].forEach((size) => {
    final[slug][size] = 0; // default 0 → недостапен
  });
});

Object.entries(qtyByCode).forEach(([code, qty]) => {
  const map = CODE_MAP[code];
  if (!map) {
    console.log('⚠️ Непознат код (нема мапирање):', code, 'qty=' + qty);
    return;
  }
  const [slug, size] = map;
  if (final[slug] && size in final[slug]) {
    final[slug][size] += qty; // собирај — повеќе кодови може да водат кон иста големина (на пр. 44 и 46 → 44-46)
  } else {
    console.log(`⚠️ Големина ${size} не постои во копчињата за ${slug} (qty=${qty})`);
  }
});

// --- 6. Генерирање SQL ---
let sql = '-- Автоматски генерирано: залиха од клиентската листа (moneta qty 082026)\n';
sql += '-- Датум: ' + new Date().toISOString().slice(0, 10) + '\n\n';
sql += 'BEGIN;\n\n';
sql += 'DELETE FROM product_sizes;\n\n';

const values = [];
Object.entries(final).forEach(([slug, sizes]) => {
  Object.entries(sizes).forEach(([size, qty]) => {
    values.push(`('${PRODUCTS[slug]}', '${size.replace(/'/g, "''")}', ${qty})`);
  });
});
sql += 'INSERT INTO product_sizes (product_id, size, qty) VALUES\n  ' + values.join(',\n  ') + ';\n\n';
sql += 'COMMIT;\n';

const outFile = path.join(root, 'supabase', 'stock-update.sql');
fs.writeFileSync(outFile, sql, 'utf8');

// --- 7. Резиме ---
console.log('\n=== РЕЗИМЕ ===');
let total = 0;
Object.entries(final).forEach(([slug, sizes]) => {
  const t = Object.values(sizes).reduce((a, b) => a + b, 0);
  total += t;
  const parts = Object.entries(sizes).map(([s, q]) => `${s}=${q}`).join(' ');
  console.log(slug.padEnd(18), '→', parts);
});
console.log('\nВкупна залиха:', total);
console.log('SQL зачуван во:', outFile);
