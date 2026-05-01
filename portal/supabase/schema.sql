-- Hello Studio Portal — database schema
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run.
-- It is idempotent (safe to re-run) for everything except seed data.

-- ============================================================
-- 1. PROFILES — extends auth.users with role + display name
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- Trigger: when a new auth user is created, copy them into profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. PRODUCTS — webinars, worksheets, courses
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('webinar','worksheet','course')),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  -- Stripe IDs are populated when the admin creates a product (see /api/admin/products)
  stripe_product_id text,
  stripe_price_id text,
  -- For worksheets: a path in Supabase Storage. For courses/webinars: a URL or a content slug.
  delivery_url text,
  cover_image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_active_idx on public.products(active) where active;
create index if not exists products_type_idx on public.products(type);

-- ============================================================
-- 3. ORDERS + ORDER_ITEMS
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'usd',
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  customer_email text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  price_cents integer not null,
  product_name_snapshot text not null,
  product_type_snapshot text not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_product_idx on public.order_items(product_id);

-- ============================================================
-- 4. ENTITLEMENTS — what content each user can access
-- ============================================================
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists entitlements_user_idx on public.entitlements(user_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- Pattern: customers see only their own data; admins see all.
-- (Service-role key bypasses RLS — used by the webhook + admin actions.)
-- ============================================================

-- Helper: am I an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---- profiles ----
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- ---- products ----
alter table public.products enable row level security;

-- Public can read active products
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (active = true or public.is_admin());

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- orders ----
alter table public.orders enable row level security;

drop policy if exists "orders_select_owner_or_admin" on public.orders;
create policy "orders_select_owner_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

-- Inserts/updates happen via the service role only (webhook). No client policies needed.

-- ---- order_items ----
alter table public.order_items enable row level security;

drop policy if exists "order_items_select_owner_or_admin" on public.order_items;
create policy "order_items_select_owner_or_admin" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- ---- entitlements ----
alter table public.entitlements enable row level security;

drop policy if exists "entitlements_select_owner_or_admin" on public.entitlements;
create policy "entitlements_select_owner_or_admin" on public.entitlements
  for select using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- 6. ADMIN ANALYTICS VIEW (for /admin overview KPIs)
-- ============================================================
create or replace view public.admin_kpis as
select
  (select count(*) from public.profiles) as total_customers,
  (select count(*) from public.profiles where created_at > now() - interval '30 days') as new_customers_30d,
  (select count(*) from public.orders where status = 'paid') as total_paid_orders,
  (select coalesce(sum(total_cents), 0) from public.orders where status = 'paid') as lifetime_revenue_cents,
  (select coalesce(sum(total_cents), 0) from public.orders
    where status = 'paid' and paid_at > now() - interval '30 days') as revenue_30d_cents,
  (select coalesce(sum(total_cents), 0) from public.orders
    where status = 'paid' and paid_at > now() - interval '7 days') as revenue_7d_cents;

-- This view only returns one row, and only admins should see it.
revoke all on public.admin_kpis from anon, authenticated;
grant select on public.admin_kpis to authenticated;
-- (RLS doesn't apply to views; we restrict via wrapping queries in app code with admin check.)

-- ============================================================
-- 7. SEED DATA (optional — uncomment to start with sample products)
-- ============================================================
-- insert into public.products (type, name, description, price_cents, active) values
--   ('worksheet', 'Hiring Decision Framework', 'A printable worksheet to walk through any clinician hire decision systematically.', 1900, true),
--   ('webinar',   'Setting Self-Pay Fees Without the Cringe', '60-minute live workshop on pricing your group practice services.', 4900, true),
--   ('course',    'Group Practice Studio (GPS) Foundations', 'The full course on running a heart-centered group practice — 8 modules.', 49700, false);

-- ============================================================
-- 8. FIRST-TIME ADMIN SETUP
-- After signing up your own account in the running app, run THIS one statement
-- (replace the email) to grant yourself admin role:
-- ============================================================
-- update public.profiles set role = 'admin' where email = 'hello@hellostudio.online';
