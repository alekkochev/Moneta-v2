-- ========================================
-- МОНЕТА — табели за производи, залиха, нарачки, согласности
-- ========================================

-- Производи
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_mk text not null,
  name_en text not null default '',
  category text not null default 'sportski',
  short_desc_mk text default '',
  short_desc_en text default '',
  price numeric not null default 0,
  old_price numeric,
  image text default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Залиха по големина (на пр. "35-36", "40"...)
create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  qty int not null default 0,
  unique(product_id, size)
);

-- Нарачки
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  note text,
  payment text,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  delivery numeric not null default 0,
  marketing_consent boolean not null default false,
  terms_accepted boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- Маркетинг согласности (заштита на лични податоци / GDPR)
create table if not exists public.news_consents (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  consent boolean not null default false,
  terms_ok boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========================================
-- RLS (Row Level Security)
-- ========================================
alter table public.products enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders enable row level security;
alter table public.news_consents enable row level security;

-- Јавно читање (сајтот) — производи + залиха
create policy "public read products" on public.products
  for select using (true);
create policy "public read sizes" on public.product_sizes
  for select using (true);

-- Анонимни може да праќаат нарачки + согласности (формите)
create policy "public insert orders" on public.orders
  for insert with check (true);
create policy "public insert consents" on public.news_consents
  for insert with check (true);

-- Само логиран корисник (клиентот/админ) управува со производи + залиха
create policy "admin manage products" on public.products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin manage sizes" on public.product_sizes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Само логиран корисник ги гледа нарачките + согласностите
create policy "admin read orders" on public.orders
  for select using (auth.role() = 'authenticated');
create policy "admin read consents" on public.news_consents
  for select using (auth.role() = 'authenticated');
