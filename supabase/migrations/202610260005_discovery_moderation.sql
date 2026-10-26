create extension if not exists postgis with schema extensions;
alter table public.shops add column location extensions.geography(Point, 4326);
create index shops_location_idx on public.shops using gist(location) where visibility = 'public';

create function public.discover_shops(p_neighborhood text default null, p_lat double precision default null,
  p_lon double precision default null, p_radius_m integer default 5000, p_limit integer default 30)
returns table(id uuid, slug text, name text, category text, neighborhood text, address text, distance_m integer)
language plpgsql stable security definer set search_path = '' as $$
declare origin extensions.geography;
begin
  if p_limit is null or p_limit not between 1 and 50 or p_radius_m is null or p_radius_m not between 100 and 20000
    or length(coalesce(p_neighborhood, '')) > 120
    or (p_lat is null) <> (p_lon is null)
    or (p_lat is not null and not (p_lat between -90 and 90 and p_lon between -180 and 180)) then
    raise exception 'Invalid discovery bounds' using errcode = '22023';
  end if;
  if p_lat is not null then
    origin := extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326)::extensions.geography;
  elsif nullif(trim(p_neighborhood), '') is null then
    return;
  end if;
  return query select s.id, s.slug, s.name, s.category, s.neighborhood, s.address,
    case when origin is null then null else round(extensions.st_distance(s.location, origin))::integer end
  from public.shops s
  where s.visibility = 'public'
    and (nullif(trim(p_neighborhood), '') is null or lower(s.neighborhood) = lower(trim(p_neighborhood)))
    and (origin is null or (s.location is not null and extensions.st_dwithin(s.location, origin, p_radius_m)))
  order by case when origin is null then 0 else extensions.st_distance(s.location, origin) end, s.name, s.id
  limit p_limit;
end;
$$;
revoke all on function public.discover_shops(text, double precision, double precision, integer, integer) from public;
grant execute on function public.discover_shops(text, double precision, double precision, integer, integer) to anon, authenticated;

create table private.public_rate_buckets (
  scope text not null,
  bucket text not null,
  day date not null default (now() at time zone 'UTC')::date,
  hits integer not null default 1,
  primary key(scope, bucket, day)
);
alter table private.public_rate_buckets enable row level security;
create function private.consume_public_bucket(p_scope text, p_bucket text, p_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare count_now integer;
begin
  delete from private.public_rate_buckets where day < (now() at time zone 'UTC')::date - 1;
  insert into private.public_rate_buckets(scope, bucket) values (p_scope, p_bucket)
  on conflict (scope, bucket, day) do update set hits = private.public_rate_buckets.hits + 1
  returning hits into count_now;
  return count_now <= p_limit;
end;
$$;
revoke all on function private.consume_public_bucket(text, text, integer) from public;

create table public.offer_reports (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id),
  shop_id uuid not null references public.shops(id),
  reason text not null check (reason in ('incorrect_price', 'unavailable_offer', 'misleading', 'inappropriate')),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);
create index reports_status_idx on public.offer_reports(status, created_at desc);
alter table public.offer_reports enable row level security;
revoke all on public.offer_reports from anon, authenticated;
grant select on public.offer_reports to authenticated;
create policy admin_read_reports on public.offer_reports for select to authenticated using (private.is_admin());

create table public.shop_daily_metrics (
  shop_id uuid not null references public.shops(id),
  day date not null default (now() at time zone 'Asia/Kolkata')::date,
  page_views bigint not null default 0,
  primary key(shop_id, day)
);
alter table public.shop_daily_metrics enable row level security;
revoke all on public.shop_daily_metrics from anon, authenticated;
grant select on public.shop_daily_metrics to authenticated;
create policy member_read_metrics on public.shop_daily_metrics for select to authenticated
using (private.has_shop_access(shop_id) or private.is_admin());

-- Server-ingestion only. Public clients cannot spoof rate keys or insert unbounded reports/events directly.
create function public.submit_offer_report(p_offer_id uuid, p_reason text, p_rate_key text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare target_shop uuid; report_id uuid;
begin
  if p_reason is null or p_reason not in ('incorrect_price', 'unavailable_offer', 'misleading', 'inappropriate')
    or p_rate_key is null or p_rate_key !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid report' using errcode = '22023';
  end if;
  select shop_id into target_shop from public.public_offers where id = p_offer_id;
  if target_shop is null then raise exception 'Offer unavailable' using errcode = '22023'; end if;
  if not private.consume_public_bucket('report_global', 'all', 1000)
    or not private.consume_public_bucket('report_shop', target_shop::text, 100)
    or not private.consume_public_bucket('report_client', p_rate_key, 5) then
    raise exception 'Please try again later' using errcode = 'P0001';
  end if;
  insert into public.offer_reports(offer_id, shop_id, reason) values (p_offer_id, target_shop, p_reason) returning id into report_id;
  return report_id;
end;
$$;
revoke all on function public.submit_offer_report(uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_offer_report(uuid, text, text) to service_role;

create function public.record_shop_view(p_shop_id uuid, p_rate_key text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_rate_key is null or p_rate_key !~ '^[0-9a-f]{64}$' or not exists(select 1 from public.public_shops where id = p_shop_id) then return false; end if;
  if not private.consume_public_bucket('view_global', 'all', 100000)
    or not private.consume_public_bucket('view_client_shop', p_shop_id::text || ':' || p_rate_key, 60) then return false; end if;
  insert into public.shop_daily_metrics(shop_id, page_views) values (p_shop_id, 1)
  on conflict (shop_id, day) do update set page_views = public.shop_daily_metrics.page_views + 1;
  return true;
end;
$$;
revoke all on function public.record_shop_view(uuid, text) from public, anon, authenticated;
grant execute on function public.record_shop_view(uuid, text) to service_role;

create function public.moderate_content(p_kind text, p_id uuid, p_hidden boolean, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare target_shop uuid;
begin
  if not private.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('shop', 'offer') or p_hidden is null or length(trim(coalesce(p_reason, ''))) not between 3 and 300 then
    raise exception 'Invalid moderation action' using errcode = '22023';
  end if;
  if p_kind = 'shop' then
    update public.shops set visibility = case when p_hidden then 'hidden' else 'public' end where id = p_id returning id into target_shop;
  else
    update public.offers set moderation_status = case when p_hidden then 'hidden' else 'visible' end where id = p_id returning shop_id into target_shop;
  end if;
  if target_shop is null then raise exception 'Content unavailable' using errcode = '22023'; end if;
  insert into public.audit_events(shop_id, actor_id, entity_id, action, details)
  values (target_shop, auth.uid(), p_id, 'MODERATE_' || upper(p_kind), jsonb_build_object('hidden', p_hidden, 'reason', trim(p_reason)));
end;
$$;
revoke all on function public.moderate_content(text, uuid, boolean, text) from public, anon;
grant execute on function public.moderate_content(text, uuid, boolean, text) to authenticated;

create function public.review_offer_report(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare target_shop uuid;
begin
  if not private.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('resolved', 'dismissed') then raise exception 'Invalid report status' using errcode = '22023'; end if;
  update public.offer_reports set status = p_status, reviewed_by = auth.uid(), reviewed_at = now() where id = p_id returning shop_id into target_shop;
  if target_shop is null then raise exception 'Report unavailable' using errcode = '22023'; end if;
  insert into public.audit_events(shop_id, actor_id, entity_id, action, details)
  values (target_shop, auth.uid(), p_id, 'REVIEW_REPORT', jsonb_build_object('status', p_status));
end;
$$;
revoke all on function public.review_offer_report(uuid, text) from public, anon;
grant execute on function public.review_offer_report(uuid, text) to authenticated;
