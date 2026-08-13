-- ========================================
-- ЧИСТЕЊЕ: отстрани стара old_price вредности
-- Попустот на сајтот сега се води САМО од discount колоната,
-- па old_price повеќе не се користи никаде.
-- (Ова ги трга и лажните „−20% / −15% / −2%" значки кај
--  Simona, Carbon и Duck што произлегуваа од old_price.)
-- ========================================

UPDATE products SET old_price = NULL WHERE old_price IS NOT NULL;

-- Проверка (треба да врати празно):
SELECT slug, old_price FROM products WHERE old_price IS NOT NULL;
