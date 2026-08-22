-- ========================================
-- Hunter Camo — врати нумерички големини + задржи „Универзална"
-- Клиент: броевите (35–47) треба да останат, ПЛУС универзална (cut-to-fit, се сече со ножици).
-- Безбедно да се пушти повеќе пати (on conflict do update).
-- ========================================

-- 1) Врати ги нумеричките големини за hunter-camo (35–47)
insert into public.product_sizes (product_id, size, qty)
select id, s.size, s.qty
from public.products
cross join (values
    ('35', 2), ('36', 3), ('37', 4), ('38', 5), ('39', 6),
    ('40', 7), ('41', 3), ('42', 4), ('43', 2), ('44', 1),
    ('45', 1), ('46', 1), ('47', 1)
) as s(size, qty)
where slug = 'hunter-camo'
on conflict (product_id, size) do update set qty = excluded.qty;

-- 2) Осигурај дека универзалната големина останува (cut-to-fit)
insert into public.product_sizes (product_id, size, qty)
select id, 'univerzalna', 10
from public.products
where slug = 'hunter-camo'
on conflict (product_id, size) do update set qty = excluded.qty;
