-- Seed: производи + залиха (генерирано од stock.json)
insert into public.products (slug, name_mk, name_en, category, price, image, sort_order) values
  ('active-gel', 'Active Gel', 'Active Gel', 'sportski', 620, './images/cards/active-gel.webp', 1),
  ('anatomiX', 'AnatomiX', 'AnatomiX', 'sportski', 430, './images/cards/anatomiX.webp', 2),
  ('sport-style', 'Sport Style', 'Sport Style', 'sportski', 300, './images/cards/sport-style.webp', 3),
  ('sportex', 'Sportex', 'Sportex', 'sportski', 230, './images/cards/sportex.webp', 4),
  ('topas', 'Topas', 'Topas', 'kozni', 490, './images/cards/topas.webp', 5),
  ('vital', 'Vital', 'Vital', 'kozni', 450, './images/cards/vital.webp', 6),
  ('relax', 'Relax', 'Relax', 'kozni', 570, './images/cards/relax.webp', 7),
  ('soft-gel', 'Soft Gel', 'Soft Gel', 'kozni', 820, './images/cards/soft-gel.webp', 8),
  ('carbon', 'Carbon', 'Carbon', 'letni', 170, './images/cards/carbon.webp', 9),
  ('simona', 'Simona', 'Simona', 'letni', 120, './images/cards/simona.webp', 10),
  ('thermo-alu', 'Thermo Alu', 'Thermo Alu', 'zimski', 210, './images/cards/thermo-alu.webp', 11),
  ('hunter-camo', 'Hunter CAMO', 'Hunter CAMO', 'hunter', 330, './images/cards/hunter-camo.webp', 12),
  ('hunter-flex', 'Hunter FLEX', 'Hunter FLEX', 'hunter', 330, './images/cards/hunter-flex.webp', 13),
  ('hunter-outdoor', 'Hunter OUTDOOR', 'Hunter OUTDOOR', 'hunter', 330, './images/cards/hunter-outdoor.webp', 14),
  ('duck', 'Duck', 'Duck', 'detski', 490, './images/cards/duck.webp', 15),
  ('heel-pad', 'Heel Pad', 'Heel Pad', 'kozni', 250, './images/cards/heel-pad.webp', 16),
  ('heel-pad-fix', 'Heel Pad FIX', 'Heel Pad FIX', 'kozni', 210, './images/cards/heel-pad-fix.webp', 17),
  ('heel-pad-grip', 'Heel Pad Grip', 'Heel Pad Grip', 'kozni', 100, './images/cards/heel-pad-grip.webp', 18),
  ('memosole', 'MEMOSOLE', 'MEMOSOLE', 'sportski', 400, './images/cards/memosole.webp', 19),
  ('x-treme', 'X-TREME', 'X-TREME', 'sportski', 420, './images/cards/x-treme.webp', 20)
;

-- Залиха по големина
insert into public.product_sizes (product_id, size, qty)
  select p.id, 'z35-41', 1 from public.products p where p.slug = 'active-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, 'm42-45', 1 from public.products p where p.slug = 'active-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 3 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 2 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 10 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 1 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 7 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 4 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 2 from public.products p where p.slug = 'anatomiX';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 4 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 1 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 5 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 9 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 2 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 3 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 5 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'sport-style';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 6 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 3 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 7 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 1 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 1 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 5 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 2 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'sportex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 2 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 5 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 7 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 8 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 3 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 1 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 2 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'topas';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 3 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 4 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 6 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 7 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 2 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 1 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 3 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'vital';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 5 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 6 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 4 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 3 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 1 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 3 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'relax';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 4 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 3 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 8 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 5 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 1 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 1 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 2 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 3 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'soft-gel';
insert into public.product_sizes (product_id, size, qty)
  select p.id, 'univerzalna', 1 from public.products p where p.slug = 'carbon';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 6 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 5 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 7 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 4 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 2 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 1 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'simona';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 3 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 4 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 7 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 8 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 2 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 1 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'thermo-alu';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 2 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '36', 3 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 4 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 5 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 6 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '40', 7 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 3 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 4 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 2 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '44', 1 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '47', 1 from public.products p where p.slug = 'hunter-camo';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 1 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '36', 3 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 5 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 6 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 7 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '40', 4 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 2 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 1 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '44', 1 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '47', 1 from public.products p where p.slug = 'hunter-flex';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 3 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '36', 4 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 5 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 6 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 7 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '40', 8 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 4 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 3 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '44', 1 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '47', 1 from public.products p where p.slug = 'hunter-outdoor';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '27', 1 from public.products p where p.slug = 'duck';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '29', 1 from public.products p where p.slug = 'duck';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '30', 1 from public.products p where p.slug = 'duck';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '32', 1 from public.products p where p.slug = 'duck';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '34', 1 from public.products p where p.slug = 'duck';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 8 from public.products p where p.slug = 'duck';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35-37', 30 from public.products p where p.slug = 'heel-pad';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38-40', 22 from public.products p where p.slug = 'heel-pad';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41-43', 12 from public.products p where p.slug = 'heel-pad';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '44-46', 4 from public.products p where p.slug = 'heel-pad';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35-37', 21 from public.products p where p.slug = 'heel-pad-fix';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38-40', 12 from public.products p where p.slug = 'heel-pad-fix';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41-43', 4 from public.products p where p.slug = 'heel-pad-fix';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '44-46', 3 from public.products p where p.slug = 'heel-pad-fix';
insert into public.product_sizes (product_id, size, qty)
  select p.id, 'univerzalna', 1 from public.products p where p.slug = 'heel-pad-grip';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35-36', 6 from public.products p where p.slug = 'memosole';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37-38', 8 from public.products p where p.slug = 'memosole';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39-40', 10 from public.products p where p.slug = 'memosole';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41-42', 3 from public.products p where p.slug = 'memosole';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43-44', 2 from public.products p where p.slug = 'memosole';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45-46', 2 from public.products p where p.slug = 'memosole';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '35', 1 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '37', 4 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '38', 5 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '39', 6 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '41', 3 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '42', 2 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '43', 1 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '45', 1 from public.products p where p.slug = 'x-treme';
insert into public.product_sizes (product_id, size, qty)
  select p.id, '46', 1 from public.products p where p.slug = 'x-treme';
