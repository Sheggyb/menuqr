-- ============================================================
-- MenuQR — Supabase Schema (complete, idempotent)
-- Paste this into: supabase.com → your project → SQL Editor → Run
-- Safe to run on a fresh project AND on an existing MenuQR database.
-- ============================================================

-- ------------------------------------------------------------
-- RESTAURANTS
-- ------------------------------------------------------------
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text not null unique,
  logo_url text,
  accent_color text default '#E85D2F',
  quick_actions text[] not null default '{waiter,bill,refill}',
  venue_type text not null default 'table_service'
    check (venue_type in ('table_service','cafe','takeaway')),
  currency text not null default 'SEK',
  accepts_payments boolean not null default true,
  created_at timestamptz default now()
);
-- Upgrade path for databases created from the old schema
alter table restaurants add column if not exists quick_actions text[] not null default '{waiter,bill,refill}';
alter table restaurants add column if not exists venue_type text not null default 'table_service';
alter table restaurants add column if not exists currency text not null default 'SEK';
-- Pre-pay gate switch. true = the guest menu routes orders through Stripe and the
-- ticket only reaches the kitchen once paid; false = order straight through as before.
alter table restaurants add column if not exists accepts_payments boolean not null default true;

alter table restaurants enable row level security;
drop policy if exists "Owner full access" on restaurants;
create policy "Owner full access" on restaurants
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------
create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  token text not null unique,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table restaurant_tables enable row level security;
drop policy if exists "Owner manage tables" on restaurant_tables;
create policy "Owner manage tables" on restaurant_tables
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
-- Guests can read active tables by token (no auth)
drop policy if exists "Public read tables by token" on restaurant_tables;
-- NOTE: public read of table tokens removed (2026-08 audit 1.2) — guest menu
-- reads server-side via admin client, so no anon policy is needed.

-- ------------------------------------------------------------
-- MENU CATEGORIES
-- ------------------------------------------------------------
create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  icon text default '🍽️',
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table menu_categories enable row level security;
drop policy if exists "Owner manage categories" on menu_categories;
create policy "Owner manage categories" on menu_categories
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
drop policy if exists "Public read categories" on menu_categories;
-- NOTE: public read of categories removed (2026-08 audit 1.2).

-- ------------------------------------------------------------
-- MENU ITEMS
-- ------------------------------------------------------------
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  category_id uuid references menu_categories(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2),
  image_url text,
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table menu_items enable row level security;
drop policy if exists "Owner manage items" on menu_items;
create policy "Owner manage items" on menu_items
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
drop policy if exists "Public read available items" on menu_items;
-- NOTE: public read of menu items removed (2026-08 audit 1.2).

-- ------------------------------------------------------------
-- MENU ITEM OPTIONS (choice groups per item — e.g. meat choice on kebabs)
-- ------------------------------------------------------------
create table if not exists menu_item_options (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  item_id uuid references menu_items(id) on delete cascade not null,
  name text not null,
  -- 'choice'      → guest picks exactly one (optionally required)
  -- 'ingredients' → all included by default, guest removes or asks for extra
  -- 'allergens'   → display only; EU 1169/2011 requires allergen info at the
  --                 point the guest chooses
  type text not null default 'choice' check (type in ('choice','ingredients','allergens')),
  is_required boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
-- Upgrade path for databases created before the type column existed
alter table menu_item_options add column if not exists type text not null default 'choice';
-- Widen the type constraint on databases created before 'allergens' existed.
-- Drop + re-add is the only way to extend an inline check; both the create-table
-- and add-column forms produce this constraint name.
alter table menu_item_options drop constraint if exists menu_item_options_type_check;
alter table menu_item_options add constraint menu_item_options_type_check
  check (type in ('choice','ingredients','allergens'));
alter table menu_item_options enable row level security;
drop policy if exists "Owner manage item options" on menu_item_options;
create policy "Owner manage item options" on menu_item_options
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );

create table if not exists menu_item_option_choices (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  option_id uuid references menu_item_options(id) on delete cascade not null,
  label text not null,
  price_delta numeric(10,2) not null default 0,
  -- Sold out today (e.g. out of nöt) — hidden from guests without deleting the row
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
-- Upgrade path for databases created before per-choice availability existed
alter table menu_item_option_choices add column if not exists is_available boolean not null default true;
alter table menu_item_option_choices enable row level security;
drop policy if exists "Owner manage option choices" on menu_item_option_choices;
create policy "Owner manage option choices" on menu_item_option_choices
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );

-- ------------------------------------------------------------
-- TABLE REQUESTS (orders / waiter / bill / refill)
-- ------------------------------------------------------------
create table if not exists table_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  table_id uuid references restaurant_tables(id) on delete cascade not null,
  type text not null check (type in ('item_request','refill','waiter','bill')),
  item_id uuid references menu_items(id) on delete set null,
  item_name text,
  note text,
  total_price numeric(10,2),
  status text not null default 'pending' check (status in ('pending','seen','done')),
  created_at timestamptz default now()
);
-- Upgrade path for databases created before the total_price column existed
alter table table_requests add column if not exists total_price numeric(10,2);
-- Payment gate. 'not_required' preserves today's behaviour exactly: an order is
-- created and reaches the kitchen immediately. Stripe will create orders as
-- 'awaiting' and a webhook will flip them to 'paid'; the boards already filter
-- 'awaiting' out so an unpaid ticket can never reach the kitchen.
alter table table_requests add column if not exists payment_status text not null default 'not_required';
alter table table_requests drop constraint if exists table_requests_payment_status_check;
alter table table_requests add constraint table_requests_payment_status_check
  check (payment_status in ('not_required','awaiting','paid','failed'));
-- Status transition timestamps. Nothing reads these yet, but real prep-time and
-- time-to-serve history starts accumulating from the moment they exist, which is
-- why they land now rather than with the Stats UI that will use them.
alter table table_requests add column if not exists seen_at timestamptz;
alter table table_requests add column if not exists done_at timestamptz;
alter table table_requests enable row level security;
drop policy if exists "Owner manage requests" on table_requests;
create policy "Owner manage requests" on table_requests
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
-- Guests insert requests through the API (validated + rate limited server-side)
drop policy if exists "Public insert requests" on table_requests;
-- NOTE: public insert of table_requests removed (2026-08 audit 1.1) — guests
-- order via POST /api/order (admin client), never directly.

-- ------------------------------------------------------------
-- ORDER ITEMS (one row per dish in an order)
--
-- Before this table an order existed only as a packed string in
-- table_requests.item_name ("x2 Kebab Brödet [Fläsk, − lök | no mayo]") plus a
-- total the BROWSER calculated. The server never looked a price up, so the
-- guest decided what their meal cost — harmless while nothing charges money,
-- fatal the moment Stripe does.
--
-- unit_price is computed server-side in /api/order from menu_items.price plus
-- the chosen menu_item_option_choices.price_delta values. Never accepted from
-- a client.
-- ------------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  request_id uuid references table_requests(id) on delete cascade not null,
  -- Kept nullable on purpose: deleting a menu item must not delete order history
  item_id uuid references menu_items(id) on delete set null,
  -- The dish name as ordered, so a later rename does not rewrite history
  name_snapshot text not null,
  quantity int not null default 1,
  unit_price numeric(10,2),
  -- { choices: [{id,label,price_delta}], removed: [{id,label}], extra: [{id,label}] }
  selected_options jsonb not null default '[]'::jsonb,
  note text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table order_items enable row level security;
drop policy if exists "Owner manage order items" on order_items;
create policy "Owner manage order items" on order_items
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
-- Guests never touch this table directly; /api/order writes it with the
-- service-role client, same as table_requests.

-- ------------------------------------------------------------
-- TABLE SESSIONS (guest approval flow)
-- Guests never touch this table directly — all guest access goes
-- through the API routes, which use the service-role key server-side.
-- ------------------------------------------------------------
create table if not exists table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references restaurant_tables(id) on delete cascade not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  session_id uuid not null unique,
  status text not null default 'pending' check (status in ('pending','active','closed')),
  created_at timestamptz default now()
);
alter table table_sessions enable row level security;
drop policy if exists "Owner manage sessions" on table_sessions;
create policy "Owner manage sessions" on table_sessions
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
create index if not exists idx_table_requests_restaurant_status on table_requests (restaurant_id, status);
create index if not exists idx_table_requests_created_at on table_requests (created_at);
create index if not exists idx_table_sessions_session_id on table_sessions (session_id);
create index if not exists idx_table_sessions_restaurant_status on table_sessions (restaurant_id, status);
create index if not exists idx_table_sessions_table_id on table_sessions (table_id);
create index if not exists idx_restaurant_tables_token on restaurant_tables (token);
create index if not exists idx_menu_items_category on menu_items (category_id);
create index if not exists idx_menu_categories_restaurant on menu_categories (restaurant_id);
create index if not exists idx_menu_item_options_item on menu_item_options (item_id);
create index if not exists idx_menu_item_option_choices_option on menu_item_option_choices (option_id);
create index if not exists idx_order_items_request on order_items (request_id);
create index if not exists idx_order_items_restaurant on order_items (restaurant_id);

-- ------------------------------------------------------------
-- STATUS TIMESTAMPS
--
-- seen_at / done_at are stamped by a trigger rather than by the app, because
-- there are three writers (the Live Orders board, the Kitchen board, and the
-- Supabase table editor when someone fixes a row by hand) and a column that is
-- only sometimes filled in is worse than no column at all.
--
-- Deliberately NOT backfilling seen_at when an order jumps pending → done: it
-- genuinely never passed through "preparing", and inventing a timestamp would
-- make average prep time look better than it is. Reverting a status clears the
-- stamps it invalidates, so the row never claims to have been finished before
-- it was finished.
-- ------------------------------------------------------------
create or replace function stamp_request_status() returns trigger as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'seen' then
      if new.seen_at is null then new.seen_at := now(); end if;
      new.done_at := null;
    elsif new.status = 'done' then
      if new.done_at is null then new.done_at := now(); end if;
    elsif new.status = 'pending' then
      new.seen_at := null;
      new.done_at := null;
    end if;
  end if;
  return new;
end;
$$ language plpgsql set search_path = public, pg_temp;

drop trigger if exists trg_stamp_request_status on table_requests;
create trigger trg_stamp_request_status
  before update on table_requests
  for each row execute function stamp_request_status();

-- ------------------------------------------------------------
-- REALTIME
-- (add tables to the publication only if not already members)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'table_requests'
  ) then
    alter publication supabase_realtime add table table_requests;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'table_sessions'
  ) then
    alter publication supabase_realtime add table table_sessions;
  end if;
end $$;
