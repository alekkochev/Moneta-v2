-- ========================================
-- ПОПУСТИ — календар (од / до) и % попуст
-- ========================================
-- Колони:
--   discount        = % попуст (0 = нема попуст, 30 = -30%)
--   discount_from   = кога почнува попустот (може да стои во иднина!)
--   discount_until  = кога завршува попустот
-- Ако discount_from е празен -> попустот важи веднаш.
-- Ако discount_until е празен -> важи без краен рок (додека не смениш).
-- ========================================

-- 1) Додади ги колоните (еднаш — се извршува безбедно и ако веќе постојат)
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_until timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_from timestamptz;

-- ========================================
-- 2) КАЛЕНДАР — планирај попусти однапред
--    Напиши ги датумите во формат: 'ГГГГ-ММ-ДД ЧЧ:ММ+02'
--    (+02 = македонско летно сметање на времето, +01 = зимско)
-- ========================================

-- Пример А: попуст што почнува ОД 20-ти август и трае ДО крајот на месецот
UPDATE products SET discount = 30,
  discount_from  = '2026-08-20 00:00+02',
  discount_until = '2026-08-31 23:59+02'
WHERE slug = 'x-treme';

-- Пример Б: попуст само следната недела (од понеделник до недела)
UPDATE products SET discount = 20,
  discount_from  = '2026-08-17 00:00+02',
  discount_until = '2026-08-23 23:59+02'
WHERE slug = 'duck';

-- Пример В: попуст што почнува ВЕДНАШ и трае до крај на месецот
-- (discount_from се остава празен/без него)
UPDATE products SET discount = 30,
  discount_until = (date_trunc('month', now()) + interval '1 month' - interval '1 day' + interval '23 hours 59 minutes')::timestamptz
WHERE slug = 'hunter-flex';

-- Пример Г: попуст БЕЗ краен рок (важи додека рачно не го тргнеш)
UPDATE products SET discount = 15, discount_from = NULL, discount_until = NULL
WHERE slug = 'hunter-outdoor';

-- ========================================
-- 3) ПРОВЕРКА — кои производи СЕГА се на попуст, кои се закажани, кои истечени?
-- ========================================
-- Активни во моментов:
SELECT slug, name_mk, price, discount, discount_from, discount_until
FROM products
WHERE discount > 0
  AND (discount_from IS NULL OR discount_from <= now())
  AND (discount_until IS NULL OR discount_until > now());

-- Закажани за иднина (планот):
SELECT slug, name_mk, discount, discount_from, discount_until
FROM products
WHERE discount > 0 AND discount_from > now();

-- ========================================
-- 4) ТРГНИ ПОПУСТ (врати на нормала)
-- ========================================
-- UPDATE products SET discount = 0, discount_from = NULL, discount_until = NULL WHERE slug = 'x-treme';
