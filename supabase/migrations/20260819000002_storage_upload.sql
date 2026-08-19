-- ========================================
-- МОНЕТА — Storage bucket за слики од Конзолата
-- Конзолата (со лозинка) качува слики преку edge function (service role),
-- овде само се креира јавниот bucket + политика за читање.
-- ========================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- Јавно читање на сликите (прелистувачот ги гледа)
create policy if not exists "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');
