-- =====================================================================
-- TANIT LOUNGE — Supabase setup
-- Run this in your Supabase dashboard:  SQL Editor → New query → paste → Run
-- Project: wuiimhdiqsrvwnoovoxg
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ORDERS — add columns for notes and (optional) a stable order code
-- ---------------------------------------------------------------------
alter table public.orders
  add column if not exists notes text;

-- Whether the customer confirmed their table by scanning its QR (anti-fraud).
alter table public.orders
  add column if not exists table_verified boolean not null default false;

-- The app uses these status values: pending | preparing | done | cancelled
-- If you have a CHECK constraint on status, replace it so "preparing" is allowed:
do $$
begin
  if exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'orders' and column_name = 'status'
      and constraint_name = 'orders_status_check'
  ) then
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

-- =====================================================================
-- 3) SECURITY (Row Level Security)
--    Run this block LAST and test the app right after.
--    Rollback if anything breaks:  the two "disable row level security"
--    lines at the bottom of this file.
-- =====================================================================

-- First wipe ANY pre-existing policies on these tables. (A leftover
-- "allow all" policy from the table's initial setup would otherwise keep
-- granting anon writes, because RLS policies are combined with OR.)
do $$
declare pol record;
begin
  for pol in select policyname, tablename from pg_policies
             where schemaname = 'public' and tablename in ('orders','menu_items') loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- ORDERS ------------------------------------------------------------
alter table public.orders enable row level security;

-- Customers (anon) may place an order and read order(s) — needed for the
-- order-tracking page. They may NOT modify or delete.
create policy "orders_anon_insert" on public.orders
  for insert to anon with check (true);

create policy "orders_anon_select" on public.orders
  for select to anon using (true);

-- Staff (logged-in) may do everything.
create policy "orders_auth_all" on public.orders
  for all to authenticated using (true) with check (true);

-- MENU_ITEMS --------------------------------------------------------
alter table public.menu_items enable row level security;

-- Anyone can read availability / price overrides (the public menu needs it).
create policy "menu_anon_select" on public.menu_items
  for select to anon using (true);

-- Only staff can change availability / prices.
create policy "menu_auth_all" on public.menu_items
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- 4) CATEGORY IMAGES — custom photo per menu category + photo storage
-- ---------------------------------------------------------------------
create table if not exists public.category_images (
  category   text primary key,
  image_url  text,
  updated_at timestamptz not null default now()
);

alter table public.category_images enable row level security;

drop policy if exists "catimg_anon_select" on public.category_images;
create policy "catimg_anon_select" on public.category_images
  for select to anon using (true);

drop policy if exists "catimg_auth_all" on public.category_images;
create policy "catimg_auth_all" on public.category_images
  for all to authenticated using (true) with check (true);

-- Public storage bucket for uploaded dish photos.
insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

-- Anyone can view photos; only staff (authenticated) can upload/replace.
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

-- ---------------------------------------------------------------------
-- 5) FEEDBACK — customer service rating (1-5) submitted from track.html
-- ---------------------------------------------------------------------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid,
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback_anon_insert" on public.feedback;
create policy "feedback_anon_insert" on public.feedback
  for insert to anon with check (rating between 1 and 5);

drop policy if exists "feedback_auth_all" on public.feedback;
create policy "feedback_auth_all" on public.feedback
  for all to authenticated using (true) with check (true);

-- =====================================================================
-- ROLLBACK (only if the app breaks after enabling RLS) — run these two:
-- alter table public.orders disable row level security;
-- alter table public.menu_items disable row level security;
-- =====================================================================
