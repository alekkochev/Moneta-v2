-- ========================================
-- МОНЕТА — закажување на stock-alert функцијата
-- Стартувај го ОВА во Supabase SQL Editor (еднаш)
-- по деплојувањето на функцијата. Ќе проверува секој ден во 08:00.
-- ========================================

-- 1. Овозможи pg_cron (доколку не е веќе)
create extension if not exists pg_cron;

-- 2. Закажи проверка секој ден во 08:00 (Европа/Скопје = UTC+2, па 06:00 UTC)
select cron.schedule(
  'stock-alert-daily',
  '0 6 * * *',
  $$ select net.http_post(
    url := 'https://wkpkrnjrtpywuzemirbw.supabase.co/functions/v1/stock-alert',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) as request_id; $$
);

-- 3. Проверка: список на активни cron работни задачи
select jobid, jobname, schedule from cron.job;

-- 4. Ако треба да го тргнеш закажувањето:
-- select cron.unschedule('stock-alert-daily');

-- Напомена: ако pg_net не е достапен (грешка net.http_post), изврши:
--   create extension if not exists pg_net;
-- па почекај 1-2 мин и пак стартувај ја точка 2.
