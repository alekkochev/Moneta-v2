-- ========================================
-- МОНЕТА — Отстранување на моделот ANATOMIX
-- (Код 20002, EAN 8586005032526) — повеќе не е во продажба.
-- Изврши го ОВА во Supabase SQL Editor (еднаш).
-- ========================================

-- 1) Избриши ги големините/залихата на AnatomiX
delete from public.product_sizes
where product_id in (select id from public.products where slug = 'anatomiX');

-- 2) Избриши го производот
delete from public.products where slug = 'anatomiX';

-- 3) Проверка: треба да врати 0 редови
select count(*) as anatomix_sizes_left from public.product_sizes ps
where ps.product_id in (select id from public.products where slug = 'anatomiX');

select count(*) as anatomix_products_left from public.products where slug = 'anatomiX';
