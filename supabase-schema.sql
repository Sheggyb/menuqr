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
  created_at timestamptz default now()
);
-- Upgrade path for databases created from the old schema
alter table restaurants add column if not exists quick_actions text[] not null default '{waiter,bill,refill}';
alter table restaurants add column if not exists venue_type text not null default 'table_service';
alter table restaurants add column if not exists currency text not null default 'SEK';

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
  is_required boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
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
  option_id uuid references menu_item_options(id) on delete cascade not null,
  label text not null,
  price_delta numeric(10,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
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
  status text not null default 'pending' check (status in ('pending','seen','done')),
  created_at timestamptz default now()
);
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
