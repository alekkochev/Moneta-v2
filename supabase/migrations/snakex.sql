-- ========================================
-- SnakeX — активирај производ во Supabase
-- Ефект: SnakeX станува видлив на сајтот со сите атрибути
-- (цена, попусти, залиха, пребарување, споредби),
-- но со залиха qty = 0 → СИВ и НЕДОСТАПЕН за купување.
-- ========================================

-- 1) Обезбеди колони за попустите (безбедно — ништо не менува ако постојат)
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_from timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_until timestamptz;

-- 2) Додади SnakeX во products (ако веќе не постои)
INSERT INTO products (
  slug, name_mk, name_en, category,
  short_desc_mk, short_desc_en,
  price, image, thumbnail,
  active, sort_order, discount
)
SELECT
  'snakex', 'SnakeX', 'SnakeX', 'sportski',
  'Премиум спортска влошка RUN & HIKING со активен јаглен, рециклирана пена и двојна густина.',
  'Premium RUN & HIKING sports insole with activated charcoal, recycled foam and dual density.',
  890,
  './images/cards/snakex.png',
  'images/cards/snakex.png',
  true, 21, 0
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'snakex');

-- 3) Залиха: сите големини со qty = 0
--    → страната автоматски го прикажува како сив со значка
--    „Нема на залиха" и без можност за купување
INSERT INTO product_sizes (product_id, size, qty)
SELECT p.id, s.size, 0
FROM products p
CROSS JOIN unnest(ARRAY['35','36','37','38','39','40','41','42','43','44','45','46','47','48']) AS s(size)
WHERE p.slug = 'snakex'
  AND NOT EXISTS (
    SELECT 1 FROM product_sizes ps
    WHERE ps.product_id = p.id AND ps.size = s.size
  );

-- ========================================
-- ПРОВЕРКА
-- ========================================
SELECT p.slug, p.name_mk, p.price, p.active, p.sort_order, p.discount
FROM products p WHERE p.slug = 'snakex';

SELECT ps.size, ps.qty
FROM product_sizes ps
JOIN products p ON p.id = ps.product_id
WHERE p.slug = 'snakex'
ORDER BY ps.size::int;

-- ========================================
-- КОГА SnakeX ЌЕ СТАНЕ ДОСТАПЕН (пуштен во продажба)
-- Само смени ги qty вредностите на големините:
-- ========================================
-- UPDATE product_sizes SET qty = 30
-- WHERE product_id = (SELECT id FROM products WHERE slug = 'snakex');
