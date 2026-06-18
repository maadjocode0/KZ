-- =====================================================================
-- KZ CAFÉ LOUNGE — Supabase setup (fresh project, idempotent)
-- Run in your Supabase dashboard:  SQL Editor → New query → paste → Run
-- Project: ecbhkcnhgyrppqzrczsz
-- Safe to re-run: every statement is "if not exists" / drop-then-create.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ORDERS — customer orders + live status
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  table_number   text,
  items          jsonb not null default '[]',          -- [{ name, price, qty }]
  total          numeric not null default 0,
  status         text not null default 'pending',       -- pending | preparing | done | cancelled
  notes          text,
  table_verified boolean not null default false,         -- confirmed by scanning the table QR
  created_at     timestamptz not null default now()
);

-- In case the table pre-existed without these columns:
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists table_verified boolean not null default false;

-- status CHECK constraint (drop any old one, re-add with all 4 values)
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'orders_status_check') then
    alter table public.orders drop constraint orders_status_check;
  end if;
end $$;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending','preparing','done','cancelled'));

-- ---------------------------------------------------------------------
-- 2) MENU_ITEMS — back-office: availability + price override per item
--    Keyed by the item name as it appears in menu-data.js.
-- ---------------------------------------------------------------------
create table if not exists public.menu_items (
  name           text primary key,
  available      boolean not null default true,
  price_override numeric,            -- null = use the price coded in menu-data.js
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) CATEGORY_IMAGES — custom photo per menu category
-- ---------------------------------------------------------------------
create table if not exists public.category_images (
  category   text primary key,
  image_url  text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) FEEDBACK — customer service rating (1-5) submitted from track.html
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid,
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 5) ROW LEVEL SECURITY
--    Wipe ANY pre-existing policies first — RLS policies combine with OR,
--    so a leftover "allow all" policy would silently grant everything.
-- =====================================================================
do $$
declare pol record;
begin
  for pol in select policyname, tablename from pg_policies
             where schemaname = 'public'
               and tablename in ('orders','menu_items','category_images','feedback') loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

alter table public.orders          enable row level security;
alter table public.menu_items      enable row level security;
alter table public.category_images enable row level security;
alter table public.feedback        enable row level security;

-- Customers (anon): place + read orders (read needed for tracking). No update/delete.
create policy "orders_anon_insert" on public.orders for insert to anon          with check (true);
create policy "orders_anon_select" on public.orders for select to anon          using (true);
create policy "orders_auth_all"    on public.orders for all    to authenticated using (true) with check (true);

-- Menu overrides + category photos: public read, staff write.
create policy "menu_anon_select"   on public.menu_items      for select to anon          using (true);
create policy "menu_auth_all"      on public.menu_items      for all    to authenticated using (true) with check (true);
create policy "catimg_anon_select" on public.category_images for select to anon          using (true);
create policy "catimg_auth_all"    on public.category_images for all    to authenticated using (true) with check (true);

-- Feedback: anon may submit (rating 1-5), only staff may read.
create policy "feedback_anon_insert" on public.feedback for insert to anon          with check (rating between 1 and 5);
create policy "feedback_auth_all"    on public.feedback for all    to authenticated using (true) with check (true);

-- =====================================================================
-- 6) STORAGE — public bucket for uploaded category/dish photos, staff-only writes
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

drop policy if exists "menu_photos_public_read" on storage.objects;
create policy "menu_photos_public_read" on storage.objects
  for select to public using (bucket_id = 'menu-photos');

drop policy if exists "menu_photos_auth_insert" on storage.objects;
create policy "menu_photos_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-photos');

drop policy if exists "menu_photos_auth_update" on storage.objects;
create policy "menu_photos_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'menu-photos') with check (bucket_id = 'menu-photos');

drop policy if exists "menu_photos_auth_delete" on storage.objects;
create policy "menu_photos_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-photos');

-- =====================================================================
-- ROLLBACK (only if the app breaks after enabling RLS) — run as needed:
-- alter table public.orders          disable row level security;
-- alter table public.menu_items      disable row level security;
-- alter table public.category_images disable row level security;
-- alter table public.feedback        disable row level security;
-- =====================================================================
