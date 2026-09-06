-- ============================================
-- products: 3-јазични колони + спецификации (поправка на prod)
-- Причина: миграцијата 20260819000001 не била применета на prod,
-- па секое save_product (попусти/едитирање) тивко паѓаше
-- (PostgREST: "Could not find the 'name_sq' column of 'products'").
-- Безбедно да се пушти повеќе пати (IF NOT EXISTS).
-- ============================================
alter table public.products add column if not exists name_sq text default '';
alter table public.products add column if not exists short_desc_sq text default '';
alter table public.products add column if not exists specs jsonb default '[]'::jsonb;
