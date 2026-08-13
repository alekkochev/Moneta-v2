-- ========================================
-- ПОПУСТИ — временска рамка
-- ========================================
-- 1) Додади колона discount_until (крај на попустот)
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_until timestamptz;

-- ========================================
-- 2) ПОСТАВИ 3 ПРОИЗВОДИ НА ПОПУСТ (пример: -30%)
-- discount = 30 значи 30% попуст
-- discount_until = крај на месецот
-- ========================================
-- Крај на тековниот месец (автоматски пресметано)
UPDATE products SET discount = 30, discount_until = (date_trunc('month', now()) + interval '1 month' - interval '1 day' + interval '23 hours 59 minutes')::timestamptz
WHERE slug = 'x-treme';

UPDATE products SET discount = 30, discount_until = (date_trunc('month', now()) + interval '1 month' - interval '1 day' + interval '23 hours 59 minutes')::timestamptz
WHERE slug = 'hunter-flex';

UPDATE products SET discount = 30, discount_until = (date_trunc('month', now()) + interval '1 month' - interval '1 day' + interval '23 hours 59 minutes')::timestamptz
WHERE slug = 'hunter-outdoor';

-- ========================================
-- 3) ПРОВЕРКА — кои производи се на попуст?
-- ========================================
SELECT slug, name_mk, price, discount, discount_until
FROM products
WHERE discount > 0 AND (discount_until IS NULL OR discount_until > now());

-- ========================================
-- 4) ТРГНИ ПОПУСТ (врати на нормала)
-- ========================================
-- Само смени discount = 0 (или NULL) за конкретен производ:
-- UPDATE products SET discount = 0, discount_until = NULL WHERE slug = 'x-treme';
