-- ============================================
-- konzola_admin — ресетирање на лозинка за МОНЕТА Конзола
-- Еден ред (id=1): salt + hash (PBKDF2) откако ќе се изврши прво ресетирање.
-- reset_token / reset_expires — еднократен линк (30 мин) испратен на info@calivita.mk
-- ============================================
create table if not exists public.konzola_admin (
  id            int primary key default 1 check (id = 1),
  salt          text not null default '',
  hash          text not null default '',
  reset_token   text,
  reset_expires timestamptz,
  updated_at    timestamptz default now()
);

insert into public.konzola_admin (id) values (1)
on conflict (id) do nothing;

-- Само service_role (edge функцията) смее да ја чита/менува оваа табела
alter table public.konzola_admin enable row level security;
drop policy if exists "konzola_admin_service_only" on public.konzola_admin;
create policy "konzola_admin_service_only"
  on public.konzola_admin
  for all
  to service_role
  using (true)
  with check (true);
