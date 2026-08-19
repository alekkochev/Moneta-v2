-- ========================================
-- МОНЕТА — Категории (со под-категории), 3-јазични полиња, спецификации
-- Додава:
--   1. categories табела (parent_id = под-категорија)
--   2. products: name_sq, short_desc_sq, specs (jsonb)
--   3. RLS за categories
-- Безбедно да се пушти повеќе пати.
-- ========================================

-- 1) Нови колони на products (3-ти јазик + спецификации)
alter table public.products add column if not exists name_sq text default '';
alter table public.products add column if not exists short_desc_sq text default '';
alter table public.products add column if not exists specs jsonb default '[]'::jsonb;

-- 2) Категории (slug, под-категорија преку parent_id, имиња на 3 јазика)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  parent_id uuid references public.categories(id) on delete set null,
  name_mk text not null,
  name_sq text default '',
  name_en text default '',
  image text default '',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Seed: постоечки категории (имаат статички страници / ги користи сајтот)
insert into public.categories (slug, name_mk, name_sq, name_en, sort_order) values
  ('sportski', 'Спортски', 'Sportive', 'Sports', 1),
  ('kozni',    'Кожни',    'Lëkure',   'Leather', 2),
  ('letni',    'Летни',    'Verore',   'Summer', 3),
  ('zimski',   'Зимски',   'Dimëror',  'Winter', 4),
  ('hunter',   'HUNTER',   'HUNTER',   'HUNTER', 5),
  ('detski',   'Детски',   'Për fëmijë', 'Kids', 6),
  ('heelpad',  'Heel Pad', 'Heel Pad', 'Heel Pad', 7),
  ('outdoor',  'Outdoor',  'Outdoor',  'Outdoor', 8),
  ('ostanato', 'Останато', 'Të tjera', 'Other', 99)
on conflict (slug) do nothing;

-- 4) RLS
alter table public.categories enable row level security;

-- Јавно читање (сајтот + конзола преку edge function со service_role)
create policy "public read categories" on public.categories
  for select using (true);
