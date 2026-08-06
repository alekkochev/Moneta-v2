-- Колона за ИЗРЕЧЕН (фиксен) попуст во денари
-- Ако discount > 0 → значката покажува „−{discount} ден." (наместо процент)
-- Пример: price=450, discount=50 → стара цена се пресметува како 500, значка „−50 ден."
alter table public.products
  add column if not exists discount integer not null default 0;

-- Демо: Vital со изречен попуст од 50 ден.
update public.products set discount = 50 where slug = 'vital';
