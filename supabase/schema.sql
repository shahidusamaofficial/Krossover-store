create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text default '',
  price_pkr integer not null check (price_pkr > 0),
  image_url text,
  sizes text[] not null default '{S,M,L,XL}',
  ceeprinto_design_id integer,
  ceeprinto_product_id integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  status text not null default 'awaiting_confirmation',
  total_pkr integer not null,
  ceeprinto_intake_id integer,
  tracking_number text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  size text not null,
  quantity integer not null check (quantity between 1 and 5),
  unit_price_pkr integer not null
);

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "public can read active products" on products
  for select using (active = true);
-- orders and order_items have no public policies on purpose:
-- only server code using the service role key can read or write them.

insert into products (slug, name, description, price_pkr, sizes) values
  ('crossover-tee', 'Crossover tee', 'Oversized cotton tee with the crossing-paths chest print.', 2450, '{S,M,L,XL}'),
  ('crossover-hoodie', 'Crossover hoodie', 'Heavy fleece hoodie. Icon on the chest, wordmark on the back.', 4250, '{S,M,L,XL}');
