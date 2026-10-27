-- Registration creates an identity only. Requests grant no shop or publishing access.
create table public.owner_shop_requests (
  id uuid primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null check (length(trim(category)) between 1 and 80),
  neighborhood text not null check (length(trim(neighborhood)) between 1 and 120),
  address text not null default '' check (length(address) <= 500),
  description text not null default '' check (length(description) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  shop_id uuid unique references public.shops(id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  check ((status = 'pending' and reviewed_at is null and reviewed_by is null and shop_id is null)
    or (status = 'rejected' and reviewed_at is not null and reviewed_by is not null and shop_id is null)
    or (status = 'approved' and reviewed_at is not null and reviewed_by is not null and shop_id is not null))
);
alter table public.owner_shop_requests enable row level security;
revoke all on public.owner_shop_requests from public, anon, authenticated;
grant select on public.owner_shop_requests to authenticated;
create policy read_own_shop_request on public.owner_shop_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create function public.submit_owner_shop_request(p_request_id uuid, p_payload jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); existing public.owner_shop_requests;
  request_name text := trim(p_payload->>'name'); request_category text := trim(p_payload->>'category');
  request_neighborhood text := trim(p_payload->>'neighborhood');
  request_address text := trim(coalesce(p_payload->>'address', ''));
  request_description text := trim(coalesce(p_payload->>'description', ''));
begin
  if actor is null or not exists(select 1 from auth.users where id = actor and email_confirmed_at is not null and deleted_at is null) then
    raise exception 'Confirm your email before requesting a shop' using errcode = '42501';
  end if;
  if p_request_id is null or jsonb_typeof(p_payload) is distinct from 'object'
    or request_name is null or length(request_name) not between 1 and 120
    or request_category is null or length(request_category) not between 1 and 80
    or request_neighborhood is null or length(request_neighborhood) not between 1 and 120
    or length(request_address) > 500 or length(request_description) > 2000
    or (p_payload->>'consent') is distinct from 'true' then
    raise exception 'Check shop details and ownership consent' using errcode = '22023';
  end if;
  -- Serialize one request per identity, including simultaneous retries.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 8));
  select * into existing from public.owner_shop_requests where user_id = actor;
  if found then
    if existing.id = p_request_id and existing.name = request_name and existing.category = request_category
      and existing.neighborhood = request_neighborhood and existing.address = request_address
      and existing.description = request_description then return existing.id; end if;
    raise exception 'A shop request already exists for this account' using errcode = '23505';
  end if;
  perform private.consume_rate_limit(actor, 'owner-onboarding', 3, 3600);
  insert into public.owner_shop_requests(id, user_id, name, category, neighborhood, address, description)
    values(p_request_id, actor, request_name, request_category, request_neighborhood, request_address, request_description);
  return p_request_id;
end;
$$;
revoke all on function public.submit_owner_shop_request(uuid, jsonb) from public, anon;
grant execute on function public.submit_owner_shop_request(uuid, jsonb) to authenticated;

create function public.review_owner_shop_request(p_request_id uuid, p_approve boolean,
  p_slug text default null, p_verified boolean default false, p_method text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare request public.owner_shop_requests; new_shop_id uuid;
begin
  if not private.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if p_approve is null then raise exception 'Choose a review decision' using errcode = '22023'; end if;
  select * into request from public.owner_shop_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found' using errcode = '22023'; end if;
  if request.status <> 'pending' then
    if (request.status = 'approved') = p_approve then return request.shop_id; end if;
    raise exception 'Request already reviewed' using errcode = '40001';
  end if;
  if p_approve then
    if not exists(select 1 from auth.users where id = request.user_id and email_confirmed_at is not null and deleted_at is null) then
      raise exception 'Owner account must have a confirmed email' using errcode = '42501';
    end if;
    new_shop_id := public.admin_save_shop(gen_random_uuid(), 0,
      jsonb_build_object('slug', p_slug, 'name', request.name, 'category', request.category,
        'neighborhood', request.neighborhood, 'address', request.address, 'description', request.description,
        'visibility', 'public'), request.user_id::text, p_verified, p_method, gen_random_uuid());
  end if;
  update public.owner_shop_requests set status = case when p_approve then 'approved' else 'rejected' end,
    shop_id = new_shop_id, reviewed_at = now(), reviewed_by = auth.uid() where id = p_request_id;
  return new_shop_id;
end;
$$;
revoke all on function public.review_owner_shop_request(uuid, boolean, text, boolean, text) from public, anon;
grant execute on function public.review_owner_shop_request(uuid, boolean, text, boolean, text) to authenticated;
