# Build Brief — QR Menu & Ordering System for Restaurants/Cafés

A reusable spec to rebuild this product for a new client. It is a **QR-code menu + self-ordering + kitchen/POS dashboard** web app. Customers scan a QR at their table, browse the menu, order from their phone; staff see orders live, manage the menu, and read analytics. Reference build: "Tanit Lounge" (a café in Megrine, Tunisia).

---

## 1. Product summary

- Each table has a printed **QR code**. Scanning it opens the menu with the table number pre-filled.
- The customer browses a **categorized menu**, adds items to a cart, optionally adds a note, **confirms their table by re-scanning the QR with the in-app camera** (anti-fraud), and sends the order.
- The customer gets a **live order-tracking page** (Received → Preparing → Ready) and is asked to **rate the service** when the order is done.
- **Staff** log in to a **POS dashboard** that shows incoming orders in real time (sound + browser notification on new orders), with statuses, late-order warnings, and daily stats.
- Staff also get a **menu back-office** (mark items sold-out, override prices, upload a photo per category) and a **sales report** (revenue, top items, by category, by day, customer satisfaction).
- Installable as a **PWA** (add to home screen, works offline for the shell).

---

## 2. Users

- **Customer** (anonymous, on their phone): pages `index.html` (menu), `cart.html` (cart/checkout), `track.html` (order tracking).
- **Staff** (logged in): `login.html`, `pos.html` (orders), `admin.html` (menu management), `report.html` (analytics), `qr.html` (table QR generator).

---

## 3. Tech stack & hosting

- **Frontend:** plain **HTML + CSS + vanilla JS**. No framework, no build step, no bundler. Just static files. (Chosen for simplicity, zero maintenance, instant deploys.)
- **Backend:** **Supabase** — Postgres + auto REST API (PostgREST) + Auth + Storage. No custom server code.
- **Hosting:** **Vercel**, auto-deploying from the `main` branch of a GitHub repo. Push to `main` = live in ~1 min. (GitHub Pages also works; any static host works.)
- **External libs via CDN:** Font Awesome (icons), Google Fonts, `qrcodejs` (generate QR codes), `jsQR` (read QR codes from camera).

Everything requires **HTTPS** in production (Vercel provides it) — service workers and the camera API only work on a secure context.

---

## 4. File structure

```
index.html        menu page                → menu-data.js, supabase.js, script.js
cart.html         cart + checkout + scan   → jsQR (CDN), supabase.js, cart-script.js
track.html        customer order tracking  → supabase.js, track-script.js
login.html        staff login (inline JS)
pos.html          staff orders dashboard   → supabase.js, pos-script.js
admin.html        menu back-office         → menu-data.js, supabase.js, admin-script.js
report.html       sales analytics          → menu-data.js, supabase.js, report-script.js
qr.html           table QR generator (self-contained, qrcodejs CDN)

menu-data.js      SHARED: MENU_DATA + helpers (loaded by index/admin/report)
supabase.js       SHARED: all REST/Auth/Storage helpers + service-worker registration

script.js         menu rendering, cart logic, variants, sold-out/price overrides
cart-script.js    cart rendering, table confirm (scan + manual), order submit
pos-script.js     live orders, statuses, sound/notifications, auth guard
admin-script.js   availability/price toggles, category photo upload
report-script.js  KPIs, top items, by category, by day, satisfaction
track-script.js   poll order status, notify customer, rating widget

styles.css cart.css pos.css admin.css report.css track.css   (one per area)
manifest.json sw.js icon.svg favicon.svg                      (PWA assets)
supabase-setup.sql   one-shot DB schema + RLS + storage setup
```

**Shared-module pattern:** `menu-data.js` holds the menu and pure helpers (`formatPrice`, `slugify`, `baseName`, `itemCategory`, `flatMenuItems`). It is loaded BEFORE `script.js`/`admin-script.js`/`report-script.js` so they share one source of truth. `supabase.js` holds every network call and is loaded on every page.

---

## 5. Feature list

### Customer-facing
1. **Categorized menu** with collapsible categories, per-category cover photo, sticky category nav with scroll-spy, and live **search**.
2. **Item variants** — an item can have multiple sizes/options (e.g. Burger Simple/Double, Grillade "1 personne"/"2 personnes"). Each variant is its own orderable line at its own price.
3. **Add to cart** with inline quantity steppers and a floating cart badge.
4. **Sold-out items** show an "Épuisé" badge and can't be ordered (controlled live from the back-office).
5. **Cart** with quantity editing, total, a **note to the kitchen**, and order validation (max items/qty, 30s anti-double-submit cooldown).
6. **Table confirmation by camera QR scan** (anti-fraud): the customer scans the QR on their table; the app reads the table number and marks the order **verified**. Manual entry is a fallback but is flagged "non vérifiée".
7. **Order tracking page** with a live stepper (Reçue → En préparation → Prête), auto-refresh every 5s, and **browser notification + sound** when the status changes.
8. **Service rating** — when the order is marked done, the tracking page shows a 1–5 emoji rating that feeds the staff report.
9. **"Track my order" floating button** on the menu so the customer can return to tracking after leaving it.
10. **PWA**: installable, offline app shell.

### Staff-facing
11. **Login** (Supabase Auth email/password), with real token validation on every protected page.
12. **POS / orders dashboard**: live polling every 5s, **sound + desktop notification** on new orders, filter tabs (pending / preparing / done / cancelled / all), per-day stats (pending, preparing, done, cancelled, revenue), **late-order warning** (>10 min), customer note display, and a **table-verified badge** (QR-scanned vs manual). Status flow buttons: Commencer → Terminé, plus Annuler.
13. **Menu back-office**: per-item **sold-out toggle** and **price override**, and a **photo per category** (upload from phone — auto-resized — or paste a URL, or reset to default). Stored in Supabase, reflected live on the public menu.
14. **Sales report**: revenue, orders served, average ticket, cancellations, **top 10 items**, **revenue by category**, **revenue by day**, and **customer satisfaction** (average + distribution), with Today / 7d / 30d / All ranges.
15. **Table QR generator**: enter a table count, generates a printable QR per table pointing to `index.html?table=N`.

---

## 6. Data model (Supabase) + full SQL

Four tables + one public storage bucket. Run this once in the Supabase SQL editor.

```sql
-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_number text,
  items jsonb not null default '[]',          -- [{ name, price, qty }]
  total numeric not null default 0,
  status text not null default 'pending',     -- pending | preparing | done | cancelled
  notes text,
  table_verified boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending','preparing','done','cancelled'));

-- MENU OVERRIDES (availability + price per item name)
create table if not exists public.menu_items (
  name text primary key,
  available boolean not null default true,
  price_override numeric,
  updated_at timestamptz not null default now()
);

-- CATEGORY PHOTOS
create table if not exists public.category_images (
  category text primary key,
  image_url text,
  updated_at timestamptz not null default now()
);

-- FEEDBACK (1-5 service rating)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

-- ===== ROW LEVEL SECURITY =====
-- IMPORTANT: drop any pre-existing policies first (a leftover "allow all"
-- policy combines with OR and silently grants everything).
do $$
declare pol record;
begin
  for pol in select policyname, tablename from pg_policies
             where schemaname='public'
               and tablename in ('orders','menu_items','category_images','feedback') loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

alter table public.orders          enable row level security;
alter table public.menu_items      enable row level security;
alter table public.category_images enable row level security;
alter table public.feedback        enable row level security;

-- Customers (anon): place + read orders (read needed for tracking), nothing else.
create policy "orders_anon_insert" on public.orders for insert to anon with check (true);
create policy "orders_anon_select" on public.orders for select to anon using (true);
create policy "orders_auth_all"    on public.orders for all to authenticated using (true) with check (true);

-- Menu overrides + category photos: public read, staff write.
create policy "menu_anon_select"   on public.menu_items      for select to anon using (true);
create policy "menu_auth_all"      on public.menu_items      for all to authenticated using (true) with check (true);
create policy "catimg_anon_select" on public.category_images for select to anon using (true);
create policy "catimg_auth_all"    on public.category_images for all to authenticated using (true) with check (true);

-- Feedback: anon may submit (rating 1-5), only staff may read.
create policy "feedback_anon_insert" on public.feedback for insert to anon with check (rating between 1 and 5);
create policy "feedback_auth_all"    on public.feedback for all to authenticated using (true) with check (true);

-- STORAGE: public bucket for uploaded category photos, staff-only writes.
insert into storage.buckets (id, name, public) values ('menu-photos','menu-photos', true)
on conflict (id) do nothing;
create policy "menu_photos_public_read" on storage.objects for select to public using (bucket_id='menu-photos');
create policy "menu_photos_auth_insert" on storage.objects for insert to authenticated with check (bucket_id='menu-photos');
create policy "menu_photos_auth_update" on storage.objects for update to authenticated using (bucket_id='menu-photos') with check (bucket_id='menu-photos');
create policy "menu_photos_auth_delete" on storage.objects for delete to authenticated using (bucket_id='menu-photos');
```

The menu structure itself (categories, items, prices, descriptions, variants) lives in **`menu-data.js`** as a JS array — `menu_items`/`category_images` only store **overrides** on top of it. Example shape:

```js
const MENU_DATA = [
  { category: "Burgers", image: "", items: [
    { name: "Beef Burger", desc: "", variants: [ { label: "Simple", price: 13 }, { label: "Double", price: 18 } ] },
    { name: "Chicken Sandwich", price: 10, desc: "Grilled, lettuce, sauce" }
  ]},
  // ... more categories
];
```

---

## 7. Security & auth model

- **Anonymous customers** use Supabase's public **publishable/anon key** (hard-coded in `supabase.js` — this is safe and by design; RLS protects the data).
- **Staff** authenticate via Supabase Auth (email/password). The access token is kept in `sessionStorage` and **validated against `/auth/v1/user`** on every protected page (not just checked for existence).
- RLS guarantees: anyone can place/track an order and read the menu, but only logged-in staff can change order status, edit the menu, upload photos, or read feedback.

---

## 8. Key implementation details & gotchas (read before building)

These are the non-obvious things that cost time to get right:

1. **Resilient order insert.** `createOrder` sends the full payload (`notes`, `table_verified`) but **retries with a minimal payload** if it fails — so ordering keeps working even before the DB migration adds those columns. Apply the same idea to any new optional column.
2. **Feedback insert must use `Prefer: return=minimal`.** Anon has INSERT but no SELECT on `feedback`; the default `return=representation` would try to read the row back and fail with 401. Insert without returning the row.
3. **RLS: wipe old policies first.** When a table was created via the Supabase Table Editor, it often already has a permissive "allow all" policy. Policies combine with **OR**, so a leftover one silently grants everything. Always `drop policy` for all existing policies before creating the restrictive set (see the `do $$` block above).
4. **Validate the token, don't just check it exists.** A guard that only checks `sessionStorage` has a token is trivially bypassable. Call `/auth/v1/user`; also treat the publishable key as NOT a valid user token.
5. **Variant system + cart identity.** The cart keys items by their **display name**. A variant line is stored as `"Base Name (Variant)"`. ⚠️ Two different items that share the exact same name (across categories) will merge in the cart and mis-highlight in the menu. Keep item names unique (or refactor to a composite key if you want true per-line identity).
6. **Service worker cache busting.** `sw.js` uses a `CACHE = "name-vN"` constant and stale-while-revalidate. **Bump the version on every deploy** or returning users see stale files for one extra load. The `activate` handler deletes old caches.
7. **Camera QR scanner.** Needs HTTPS; call `getUserMedia({video:{facingMode:"environment"}})` **from a user gesture**; decode frames with **jsQR** (iOS Safari has no `BarcodeDetector`); the `<video>` needs `playsinline muted autoplay` or iOS won't play it inline. Parse the table number out of the scanned URL's `?table=` param.
8. **Supabase Auth email confirmation.** If "Confirm email" is ON, new staff can't log in until confirmed. Disable it in Auth settings — and note that disabling does NOT retroactively confirm already-created users, so create the staff account *after* disabling.
9. **Photo uploads** are downscaled client-side (canvas → JPEG ~0.82, max ~1000px wide) before uploading to Storage, then the public URL is saved in `category_images`.
10. **Order routing trust.** The table number is the only routing key. The camera-scan "verified" flag + the POS badge is what lets staff trust it; manual entry is allowed but flagged.

---

## 9. Per-client customization checklist

Everything client-specific is isolated:

- **Branding & theme:** CSS variables in `styles.css` `:root` (`--accent`, `--green`, `--bg`, `--surface`, …); fonts (Google Fonts link); `icon.svg` + `favicon.svg`; PWA name/colors in `manifest.json`; hero text + contact section + Google Maps embed in `index.html`; brand name in topbars.
- **Menu:** replace `MENU_DATA` and `CATEGORY_PLACEHOLDERS` in `menu-data.js`.
- **Currency:** `formatPrice` (replace `"DT"`).
- **Language:** all UI strings are French — translate as needed.
- **Table range:** validation (`1–50`) in `cart-script.js` and `qr.html`.
- **Supabase:** new project → put its URL + publishable key in `supabase.js` → run `supabase-setup.sql` → create a staff account → disable email confirmation.
- **Hosting:** new Vercel project pointed at the repo (production branch `main`).

---

## 10. Setup & deployment (new client, end to end)

1. Create a Supabase project. Copy its **Project URL** and **publishable (anon) key** into `supabase.js`.
2. Open the Supabase **SQL editor**, paste & run `supabase-setup.sql`.
3. In **Authentication → Providers → Email**, turn **off "Confirm email"**. Then create the staff account (sign up `staff@client.tn` with a password) — it's auto-confirmed.
4. Edit `menu-data.js` (the menu) and the branding (section 9).
5. Push to GitHub `main`; connect the repo to **Vercel** (auto-deploys).
6. Open `…/qr.html` **on the live domain**, set the table count, print the QR codes, place them on the tables.
7. Staff log in at `…/login.html` → POS at `…/pos.html`.

---

## 11. Known limitations / future ideas

- Cart identifies items by name (duplicate names across categories merge) — fine if names are unique; refactor to composite keys otherwise.
- Live updates use **5s polling**, not realtime/push. Could use Supabase Realtime, or web-push for notifications when the tab is closed.
- **No online payment** — payment happens at the table/counter. Could integrate a payment provider.
- Single staff role (no per-waiter accounts/permissions).
- Menu *structure* (categories/items) is edited in code; the back-office only manages availability, price, and photos. Could migrate the full menu into the DB with CRUD if a client needs to add items themselves.

---

*Build target: latest Claude models. This system was built iteratively with Claude Code — give this brief to a new session and it can scaffold the whole thing, then customize per the client.*
