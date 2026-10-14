-- El esquema no se expone a la Data API. Solo accede el backend de Next.js.
create schema if not exists store;
revoke all on schema store from public;
revoke all on schema store from anon, authenticated;

create table store.products (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('Ropa','Calzado','Accesorios','Hogar','Otros')),
  size text not null,
  condition text not null,
  price integer not null check (price between 1 and 100000000),
  images text not null check (jsonb_typeof(images::jsonb) = 'array'),
  status text not null default 'available' check (status in ('available','reserved','hidden','sold')),
  created timestamptz not null default now()
);
create table store.orders (
  id text primary key,
  name text not null,
  phone text not null,
  delivery text not null,
  notes text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  total integer not null check (total > 0),
  created timestamptz not null default now()
);
create table store.order_items (
  id text primary key,
  order_id text not null references store.orders(id),
  product_id text not null references store.products(id),
  title text not null,
  price integer not null check (price > 0),
  reservation text unique references store.products(id),
  check (reservation is null or reservation = product_id)
);
create index products_catalog_idx on store.products (status, created desc);
create index orders_created_idx on store.orders (created desc);
create index orders_phone_created_idx on store.orders (phone, created desc);
create index order_items_order_idx on store.order_items (order_id);
create index order_items_product_idx on store.order_items (product_id);

alter table store.products enable row level security;
alter table store.orders enable row level security;
alter table store.order_items enable row level security;
revoke all on all tables in schema store from public, anon, authenticated;

-- Fotos privadas: el navegador las recibe mediante /api/image/:id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('otra-vuelta-photos', 'otra-vuelta-photos', false, 4000000,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 4000000,
  allowed_mime_types = excluded.allowed_mime_types;
