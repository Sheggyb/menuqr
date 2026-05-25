-- ============================================================
-- MenuQR — Supabase Schema
-- Paste this into: supabase.com → your project → SQL Editor → Run
-- ============================================================

-- RESTAURANTS
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text not null unique,
  logo_url text,
  accent_color text default '#E85D2F',
  created_at timestamptz default now()
);
alter table restaurants enable row level security;
create policy "Owner full access" on restaurants
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- TABLES
create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  token text not null unique,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table restaurant_tables enable row level security;
create policy "Owner manage tables" on restaurant_tables
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
-- Guests can read active tables by token (no auth)
create policy "Public read tables by token" on restaurant_tables
  for select using (is_active = true);

-- MENU CATEGORIES
create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  icon text default '🍽️',
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table menu_categories enable row level security;
create policy "Owner manage categories" on menu_categories
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
create policy "Public read categories" on menu_categories
  for select using (true);

-- MENU ITEMS
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
create policy "Owner manage items" on menu_items
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
create policy "Public read available items" on menu_items
  for select using (is_available = true);

-- TABLE REQUESTS
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
-- Owner reads + updates all requests for their restaurant
create policy "Owner manage requests" on table_requests
  for all using (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  ) with check (
    auth.uid() = (select owner_id from restaurants where id = restaurant_id)
  );
-- Guests can insert requests (no auth needed)
create policy "Public insert requests" on table_requests
  for insert with check (true);

-- ENABLE REALTIME
-- Run this in the Supabase dashboard: Database → Replication → enable table_requests
-- Or via SQL:
alter publication supabase_realtime add table table_requests;
