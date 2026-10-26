-- Pilot core. Grant ownership only through a trusted operator, never user metadata.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table private.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.admins enable row level security;

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 100),
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null check (length(category) between 1 and 80),
  neighborhood text not null check (length(neighborhood) between 1 and 120),
  address text not null default '' check (length(address) <= 500),
  description text not null default '' check (length(description) <= 2000),
  visibility text not null default 'hidden' check (visibility in ('public', 'hidden')),
  created_at timestamptz not null default now()
);

create table public.shop_memberships (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff', 'viewer')),
  verified_at timestamptz not null,
  primary key (shop_id, user_id)
);
create index memberships_user_idx on public.shop_memberships(user_id);

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.admins where user_id = (select auth.uid()));
$$;
create function private.has_shop_access(target uuid, editing boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shop_memberships
    where shop_id = target and user_id = (select auth.uid())
    and (not editing or role in ('owner', 'staff')));
$$;
revoke all on function private.is_admin() from public;
revoke all on function private.has_shop_access(uuid, boolean) from public;
grant execute on function private.is_admin(), private.has_shop_access(uuid, boolean) to authenticated;

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 3000),
  price_minor integer check (price_minor between 0 and 100000000),
  currency text not null default 'INR' check (currency = 'INR'),
  quantity numeric(12,3) check (quantity > 0 and quantity <= 1000000),
  unit text check (length(unit) between 1 and 40),
  starts_at timestamptz,
  expires_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'withdrawn')),
  moderation_status text not null default 'visible' check (moderation_status in ('visible', 'hidden')),
  source_type text not null default 'text' check (source_type in ('text', 'photo', 'voice')),
  created_by uuid not null default auth.uid() references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or starts_at is null or expires_at > starts_at),
  check (status <> 'published' or (approved_by is not null and approved_at is not null and expires_at is not null)),
  unique (id, shop_id)
);
create index offers_shop_idx on public.offers(shop_id);
create index offers_public_idx on public.offers(shop_id, expires_at) where status = 'published' and moderation_status = 'visible';

create table public.offer_sources (
  offer_id uuid primary key,
  shop_id uuid not null,
  storage_path text,
  transcript text check (length(transcript) <= 30000),
  extracted_fields jsonb not null default '{}',
  corrections jsonb not null default '{}',
  foreign key (offer_id, shop_id) references public.offers(id, shop_id) on delete cascade
);
create index offer_sources_shop_idx on public.offer_sources(shop_id);

create table public.audit_events (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops(id),
  actor_id uuid,
  entity_id uuid not null,
  action text not null,
  details jsonb not null,
  occurred_at timestamptz not null default now()
);
create index audit_shop_idx on public.audit_events(shop_id, occurred_at);

create function private.audit_offer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  insert into public.audit_events(shop_id, actor_id, entity_id, action, details)
  values (new.shop_id, auth.uid(), new.id, tg_op,
    jsonb_build_object('before', case when tg_op = 'UPDATE' then to_jsonb(old) else null end, 'after', to_jsonb(new)));
  return new;
end;
$$;
revoke all on function private.audit_offer() from public;
create trigger audit_offer before insert or update on public.offers for each row execute function private.audit_offer();

alter table public.shops enable row level security;
alter table public.shop_memberships enable row level security;
alter table public.offers enable row level security;
alter table public.offer_sources enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.shops, public.shop_memberships, public.offers, public.offer_sources, public.audit_events from anon, authenticated;
grant select on public.shops, public.shop_memberships, public.offers, public.offer_sources, public.audit_events to authenticated;
-- Only draft editing is available in this milestone. Publication gets its own approval RPC later.
grant insert (shop_id, title, description, price_minor, currency, quantity, unit, starts_at, expires_at, source_type) on public.offers to authenticated;
grant update (title, description, price_minor, currency, quantity, unit, starts_at, expires_at) on public.offers to authenticated;

create policy shops_read on public.shops for select to authenticated
  using (private.has_shop_access(id) or private.is_admin());
create policy membership_read on public.shop_memberships for select to authenticated
  using (user_id = auth.uid() or private.is_admin());
create policy offers_read on public.offers for select to authenticated
  using (private.has_shop_access(shop_id) or private.is_admin());
create policy draft_insert on public.offers for insert to authenticated
  with check (private.has_shop_access(shop_id, true) and status = 'draft' and created_by = auth.uid());
create policy draft_update on public.offers for update to authenticated
  using (private.has_shop_access(shop_id, true) and status = 'draft')
  with check (private.has_shop_access(shop_id, true) and status = 'draft');
create policy sources_read on public.offer_sources for select to authenticated
  using (private.has_shop_access(shop_id) or private.is_admin());
create policy audit_read on public.audit_events for select to authenticated
  using (private.has_shop_access(shop_id) or private.is_admin());

-- Deliberate definer views: only these safe columns/filtered rows are public.
-- Base tables remain inaccessible to anon; owner-only metadata is never projected.
create view public.public_shops with (security_barrier = true) as
  select id, slug, name, category, neighborhood, address, description
  from public.shops where visibility = 'public';
create view public.public_offers with (security_barrier = true) as
  select o.id, o.shop_id, o.title, o.description, o.price_minor, o.currency,
    o.quantity, o.unit, o.starts_at, o.expires_at
  from public.offers o join public.shops s on s.id = o.shop_id
  where s.visibility = 'public' and o.status = 'published' and o.moderation_status = 'visible'
    and o.approved_at is not null and o.approved_by is not null
    and (o.starts_at is null or o.starts_at <= now()) and o.expires_at > now();
revoke all on public.public_shops, public.public_offers from public, anon, authenticated;
grant select on public.public_shops, public.public_offers to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('offer-sources', 'offer-sources', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']);
-- Paths are <shop UUID>/<filename>. String comparison avoids unsafe UUID casts.
create function private.media_access(object_name text, editing boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shop_memberships
    where shop_id::text = split_part(object_name, '/', 1) and user_id = (select auth.uid())
    and (not editing or role in ('owner', 'staff')));
$$;
revoke all on function private.media_access(text, boolean) from public;
grant execute on function private.media_access(text, boolean) to authenticated;
create policy source_media_read on storage.objects for select to authenticated
  using (bucket_id = 'offer-sources' and (private.media_access(name) or private.is_admin()));
create policy source_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'offer-sources' and private.media_access(name, true));
create policy source_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'offer-sources' and private.media_access(name, true));

create function public.current_user_is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$ select private.is_admin(); $$;
revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;
