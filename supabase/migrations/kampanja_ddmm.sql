-- ========================================
-- КАМПАНИЈА СО ДАТУМИ ВО ФОРМАТ dd.mm.yyyy
-- Пример: кампања од 15.08.2026 до 20.08.2026, попуст -30%
-- ========================================
-- Во SQL Editor можеш да пишуваш датуми во твојот формат
-- со to_timestamp('15.08.2026 00:00', 'DD.MM.YYYY HH24:MI').
-- 'Europe/Skopje' = македонско време (само ја смета промената летно/зимско).

-- 1) Обезбеди колони (безбедно)
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_from timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_until timestamptz;

-- 2) КАМПАНИЈА: 15.08.2026 00:00 → 20.08.2026 23:59, попуст 30%
UPDATE products SET
  discount       = 30,
  discount_from  = to_timestamp('15.08.2026 00:00', 'DD.MM.YYYY HH24:MI') AT TIME ZONE 'Europe/Skopje',
  discount_until = to_timestamp('20.08.2026 23:59', 'DD.MM.YYYY HH24:MI') AT TIME ZONE 'Europe/Skopje'
WHERE slug = 'x-treme';

-- Ист пример за друг производ (попуст 20%):
UPDATE products SET
  discount       = 20,
  discount_from  = to_timestamp('15.08.2026 00:00', 'DD.MM.YYYY HH24:MI') AT TIME ZONE 'Europe/Skopje',
  discount_until = to_timestamp('20.08.2026 23:59', 'DD.MM.YYYY HH24:MI') AT TIME ZONE 'Europe/Skopje'
WHERE slug = 'duck';

-- 3) Проверка (датумите овде се прикажуваат ISO, тоа е нормално)
SELECT slug, discount, discount_from, discount_until
FROM products
WHERE discount > 0;

-- ========================================
-- НАПОМЕНА ЗА TABLE EDITOR:
-- Во мрежата на Supabase (Table Editor) форматот е ФИКСЕН:
-- YYYY-MM-DD HH:mm:ss+ZZ (ISO) — не може да се смени во dd.mm.yyyy.
-- За dd.mm.yyyy формат користи го SQL Editor-от (примерите погоре).
-- ========================================
