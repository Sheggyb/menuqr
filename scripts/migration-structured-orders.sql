-- MenuQR migration: structured orders + payment gate. Run once in SQL Editor.
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  request_id uuid references table_requests(id) on delete cascade not null,
  item_id uuid references menu_items(id) on delete set null,
  name_snapshot text not null,
  quantity int not null default 1,
  unit_price numeric(10,2),
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

alter table table_requests add column if not exists payment_status text not null default 'not_required';
alter table table_requests drop constraint if exists table_requests_payment_status_check;
alter table table_requests add constraint table_requests_payment_status_check
  check (payment_status in ('not_required','awaiting','paid','failed'));
alter table table_requests add column if not exists seen_at timestamptz;
alter table table_requests add column if not exists done_at timestamptz;

create index if not exists idx_order_items_request on order_items (request_id);
create index if not exists idx_order_items_restaurant on order_items (restaurant_id);

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
