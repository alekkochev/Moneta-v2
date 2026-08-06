-- Тест: стара цена (попуст) за неколку производи (демо на значката)
-- Клиентот подоцна самиот ќе ги менува во Supabase Studio
update public.products set old_price = 150 where slug = 'simona';   -- 120 → 150 = −20%
update public.products set old_price = 200 where slug = 'carbon';   -- 170 → 200 = −15%
update public.products set old_price = 500 where slug = 'duck';     -- 490 → 500 = −2%
