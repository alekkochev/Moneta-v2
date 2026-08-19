-- ========================================
-- Hunter Camo — универзална големина (univerzalna)
-- Додава залиха за „Универзална" (cut-to-fit) на hunter-camo,
-- истовремено ги отстранува старите нумерички големини.
-- Безбедно да се пушти повеќе пати (on conflict do nothing).
-- ========================================

-- 1) Отстрани ги старите нумерички големини за hunter-camo
delete from public.product_sizes
where product_id = (select id from public.products where slug = 'hunter-camo')
  and size <> 'univerzalna';

-- 2) Внеси ја универзалната големина
insert into public.product_sizes (product_id, size, qty)
select id, 'univerzalna', 10
from public.products
where slug = 'hunter-camo'
on conflict (product_id, size) do update set qty = excluded.qty;
