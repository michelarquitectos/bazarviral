-- Esquema inicial compatible con PostgreSQL. No contiene datos reales.
create type public.user_role as enum ('buyer','seller','creator','admin');
create type public.review_status as enum ('draft','pending','approved','changes_requested','suspended');
create type public.product_kind as enum ('physical','digital');
create type public.order_status as enum ('draft','confirmed','preparing','shipped','delivered','cancelled','disputed');

create table public.profiles (
  id uuid primary key,
  display_name text not null,
  avatar_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_roles (
  account_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (account_id,role)
);

create table public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.profiles(id) on delete cascade,
  store_name text not null,
  slug text not null unique,
  bio text not null,
  category text not null,
  status public.review_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.profiles(id) on delete cascade,
  creator_name text not null,
  handle text not null unique,
  bio text not null,
  topics text[] not null default '{}',
  status public.review_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  kind public.product_kind not null,
  price_cents integer not null check (price_cents>0),
  currency char(3) not null default 'MXN',
  stock integer check (stock is null or stock>=0),
  status public.review_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  position integer not null default 0
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.review_status not null default 'draft',
  commission_basis_points integer not null check (commission_basis_points between 0 and 10000),
  attribution_days integer not null check (attribution_days>0),
  starts_at timestamptz,
  ends_at timestamptz
);

create table public.creator_content (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null,
  description text not null,
  media_path text,
  external_url text,
  disclosure text not null,
  status public.review_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  status public.order_status not null default 'draft',
  currency char(3) not null default 'MXN',
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  seller_id uuid not null references public.seller_profiles(id),
  quantity integer not null check (quantity>0),
  unit_price_cents integer not null check (unit_price_cents>0),
  product_snapshot jsonb not null
);

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  reviewer_id uuid references public.profiles(id),
  from_status public.review_status,
  to_status public.review_status not null,
  reason text,
  created_at timestamptz not null default now()
);

create index products_seller_idx on public.products(seller_id);
create index products_status_idx on public.products(status);
create index content_creator_idx on public.creator_content(creator_id);
create index orders_buyer_idx on public.orders(buyer_id);
