-- Esquema inicial compatible con PostgreSQL. No contiene datos reales.
create type public.user_role as enum ('buyer','seller','creator','admin');
create type public.review_status as enum ('draft','pending','approved','changes_requested','suspended');
create type public.product_kind as enum ('physical','digital');
create type public.order_status as enum ('draft','confirmed','preparing','shipped','delivered','cancelled','disputed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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

-- Mantiene updated_at correcto sin depender del navegador.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Cada alta de Supabase Auth recibe automáticamente un perfil comprador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Mi cuenta')
  );

  insert into public.account_roles (account_id, role)
  values (new.id, 'buyer');

  if new.raw_user_meta_data ->> 'requested_role' in ('seller', 'creator') then
    insert into public.account_roles (account_id, role)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'requested_role')::public.user_role
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Funciones auxiliares para políticas. SECURITY DEFINER evita recursión de RLS.
create or replace function public.has_role(requested_role public.user_role)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.account_roles
    where account_id = auth.uid() and role = requested_role
  );
$$;

revoke all on function public.has_role(public.user_role) from public;
grant execute on function public.has_role(public.user_role) to anon, authenticated;

-- RLS: no hay acceso implícito. Cada tabla declara quién puede leer o modificar.
alter table public.profiles enable row level security;
alter table public.account_roles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.campaigns enable row level security;
alter table public.creator_content enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.review_events enable row level security;

create policy "profiles_read_own_or_admin"
on public.profiles for select to authenticated
using (id = auth.uid() or public.has_role('admin'));

create policy "profiles_update_own_or_admin"
on public.profiles for update to authenticated
using (id = auth.uid() or public.has_role('admin'))
with check (id = auth.uid() or public.has_role('admin'));

create policy "roles_read_own_or_admin"
on public.account_roles for select to authenticated
using (account_id = auth.uid() or public.has_role('admin'));

create policy "roles_admin_manage"
on public.account_roles for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "approved_sellers_are_public"
on public.seller_profiles for select to anon, authenticated
using (status = 'approved' or account_id = auth.uid() or public.has_role('admin'));

create policy "seller_profile_create_own"
on public.seller_profiles for insert to authenticated
with check (account_id = auth.uid() and status in ('draft', 'pending'));

create policy "seller_profile_update_own_or_admin"
on public.seller_profiles for update to authenticated
using (account_id = auth.uid() or public.has_role('admin'))
with check (
  (account_id = auth.uid() and status in ('draft', 'pending'))
  or public.has_role('admin')
);

create policy "approved_creators_are_public"
on public.creator_profiles for select to anon, authenticated
using (status = 'approved' or account_id = auth.uid() or public.has_role('admin'));

create policy "creator_profile_create_own"
on public.creator_profiles for insert to authenticated
with check (account_id = auth.uid() and status in ('draft', 'pending'));

create policy "creator_profile_update_own_or_admin"
on public.creator_profiles for update to authenticated
using (account_id = auth.uid() or public.has_role('admin'))
with check (
  (account_id = auth.uid() and status in ('draft', 'pending'))
  or public.has_role('admin')
);

create policy "approved_products_are_public"
on public.products for select to anon, authenticated
using (
  status = 'approved'
  or exists (
    select 1 from public.seller_profiles seller
    where seller.id = seller_id and seller.account_id = auth.uid()
  )
  or public.has_role('admin')
);

create policy "sellers_create_products"
on public.products for insert to authenticated
with check (
  status in ('draft', 'pending')
  and exists (
    select 1 from public.seller_profiles seller
    where seller.id = seller_id and seller.account_id = auth.uid()
  )
);

create policy "sellers_update_products"
on public.products for update to authenticated
using (
  exists (
    select 1 from public.seller_profiles seller
    where seller.id = seller_id and seller.account_id = auth.uid()
  )
  or public.has_role('admin')
)
with check (
  (
    status in ('draft', 'pending')
    and exists (
      select 1 from public.seller_profiles seller
      where seller.id = seller_id and seller.account_id = auth.uid()
    )
  )
  or public.has_role('admin')
);

create policy "product_media_follows_product"
on public.product_media for select to anon, authenticated
using (
  exists (
    select 1 from public.products product
    where product.id = product_id and product.status = 'approved'
  )
  or exists (
    select 1
    from public.products product
    join public.seller_profiles seller on seller.id = product.seller_id
    where product.id = product_id and seller.account_id = auth.uid()
  )
  or public.has_role('admin')
);

create policy "sellers_manage_product_media"
on public.product_media for all to authenticated
using (
  exists (
    select 1
    from public.products product
    join public.seller_profiles seller on seller.id = product.seller_id
    where product.id = product_id and seller.account_id = auth.uid()
  )
  or public.has_role('admin')
)
with check (
  exists (
    select 1
    from public.products product
    join public.seller_profiles seller on seller.id = product.seller_id
    where product.id = product_id and seller.account_id = auth.uid()
  )
  or public.has_role('admin')
);

create policy "approved_campaigns_are_public"
on public.campaigns for select to anon, authenticated
using (status = 'approved' or public.has_role('admin'));

create policy "campaigns_admin_manage"
on public.campaigns for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

create policy "approved_content_is_public"
on public.creator_content for select to anon, authenticated
using (
  status = 'approved'
  or exists (
    select 1 from public.creator_profiles creator
    where creator.id = creator_id and creator.account_id = auth.uid()
  )
  or public.has_role('admin')
);

create policy "creators_create_content"
on public.creator_content for insert to authenticated
with check (
  status in ('draft', 'pending')
  and exists (
    select 1 from public.creator_profiles creator
    where creator.id = creator_id and creator.account_id = auth.uid()
  )
);

create policy "creators_update_content"
on public.creator_content for update to authenticated
using (
  exists (
    select 1 from public.creator_profiles creator
    where creator.id = creator_id and creator.account_id = auth.uid()
  )
  or public.has_role('admin')
)
with check (
  (
    status in ('draft', 'pending')
    and exists (
      select 1 from public.creator_profiles creator
      where creator.id = creator_id and creator.account_id = auth.uid()
    )
  )
  or public.has_role('admin')
);

create policy "buyers_read_own_orders"
on public.orders for select to authenticated
using (buyer_id = auth.uid() or public.has_role('admin'));

create policy "buyers_create_own_orders"
on public.orders for insert to authenticated
with check (buyer_id = auth.uid() and status = 'draft');

create policy "buyers_update_draft_orders"
on public.orders for update to authenticated
using ((buyer_id = auth.uid() and status = 'draft') or public.has_role('admin'))
with check (buyer_id = auth.uid() or public.has_role('admin'));

create policy "buyers_read_own_items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders order_record
    where order_record.id = order_id and order_record.buyer_id = auth.uid()
  )
  or exists (
    select 1 from public.seller_profiles seller
    where seller.id = seller_id and seller.account_id = auth.uid()
  )
  or public.has_role('admin')
);

create policy "buyers_add_items_to_draft"
on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.orders order_record
    where order_record.id = order_id
      and order_record.buyer_id = auth.uid()
      and order_record.status = 'draft'
  )
);

create policy "reviews_admin_only"
on public.review_events for all to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

-- Privilegios de API. RLS sigue siendo la autoridad final para cada fila.
grant usage on schema public to anon, authenticated;
grant select on public.seller_profiles, public.creator_profiles, public.products,
  public.product_media, public.campaigns, public.creator_content to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
