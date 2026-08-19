-- ========================================
-- Hunter Camo — универзална големина (UNI)
-- Додава залиха за „УНИ" (cut-to-fit) на hunter-camo.
-- Безбедно да се пушти повеќе пати (on conflict do nothing).
-- ========================================
insert into public.product_sizes (product_id, size, qty)
select id, 'UNI', 10
from public.products
where slug = 'hunter-camo'
on conflict (product_id, size) do nothing;
