alter table public.shops add column profile_version integer not null default 1 check (profile_version > 0);
-- Moderation and profile edits share one version so stale forms cannot undo a newer hide action.
create function private.bump_shop_profile_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.profile_version := old.profile_version + 1;
  return new;
end;
$$;
revoke all on function private.bump_shop_profile_version() from public;
create trigger bump_shop_profile_version before update on public.shops
for each row execute function private.bump_shop_profile_version();

create function public.admin_shop_details(p_shop_id uuid)
returns table(id uuid, slug text, name text, category text, neighborhood text, address text,
  description text, visibility text, profile_version integer, latitude double precision, longitude double precision)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  return query select s.id, s.slug, s.name, s.category, s.neighborhood, s.address, s.description,
    s.visibility, s.profile_version, extensions.st_y(s.location::extensions.geometry), extensions.st_x(s.location::extensions.geometry)
  from public.shops s where s.id = p_shop_id;
end;
$$;
revoke all on function public.admin_shop_details(uuid) from public, anon;
grant execute on function public.admin_shop_details(uuid) to authenticated;

create function public.admin_save_shop(p_shop_id uuid, p_expected_version integer, p_payload jsonb,
  p_owner_lookup text default null, p_verified boolean default false,
  p_verification_method text default null, p_request_id uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare current_shop public.shops; owner_id uuid; shop_slug text; shop_name text; shop_category text;
  shop_neighborhood text; shop_address text; shop_description text; shop_visibility text;
  latitude_value double precision; longitude_value double precision; location_value extensions.geography;
  previous_profile jsonb; signature_value text; lookup_value text;
begin
  if not private.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if p_shop_id is null or p_expected_version is null or p_expected_version < 0 or jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'Invalid shop profile' using errcode = '22023';
  end if;
  lookup_value := nullif(trim(p_owner_lookup), '');
  if lookup_value is not null then
    if length(lookup_value) > 254 or p_verified is distinct from true or p_verification_method is null
      or p_verification_method not in ('in_person', 'agreed_callback') then
      raise exception 'Verify ownership before assigning access' using errcode = '22023';
    end if;
    if lookup_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select u.id into owner_id from auth.users u where u.id = lookup_value::uuid and u.deleted_at is null;
    else
      select u.id into owner_id from auth.users u where lower(u.email) = lower(lookup_value) and u.deleted_at is null;
    end if;
    if owner_id is null then raise exception 'Existing owner account was not found' using errcode = '22023'; end if;
  elsif p_expected_version = 0 then
    raise exception 'An existing verified owner account is required' using errcode = '22023';
  end if;
  shop_slug := p_payload->>'slug'; shop_name := trim(p_payload->>'name');
  shop_category := trim(p_payload->>'category'); shop_neighborhood := trim(p_payload->>'neighborhood');
  shop_address := trim(coalesce(p_payload->>'address', '')); shop_description := trim(coalesce(p_payload->>'description', ''));
  shop_visibility := p_payload->>'visibility';
  if shop_slug is null or shop_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(shop_slug) not between 3 and 100 or shop_slug = 'demo-shop'
    or shop_name is null or length(shop_name) not between 1 and 120
    or shop_category is null or length(shop_category) not between 1 and 80
    or shop_neighborhood is null or length(shop_neighborhood) not between 1 and 120
    or length(shop_address) > 500 or length(shop_description) > 2000
    or shop_visibility is null or shop_visibility not in ('public', 'hidden') then
    raise exception 'Check shop fields and permanent slug' using errcode = '22023';
  end if;
  latitude_value := nullif(p_payload->>'latitude', '')::double precision;
  longitude_value := nullif(p_payload->>'longitude', '')::double precision;
  if (latitude_value is null) <> (longitude_value is null)
    or (latitude_value is not null and not (latitude_value between -90 and 90 and longitude_value between -180 and 180)) then
    raise exception 'Invalid shop coordinates' using errcode = '22023';
  end if;
  if latitude_value is not null then location_value := extensions.st_setsrid(extensions.st_makepoint(longitude_value, latitude_value), 4326)::extensions.geography; end if;
  signature_value := md5(p_expected_version::text || p_payload::text || coalesce(owner_id::text, '') || coalesce(p_verification_method, '') || coalesce(p_verified::text, ''));
  if private.offer_request_replayed(p_request_id, 'shop-setup', p_shop_id, signature_value) then return p_shop_id; end if;
  perform private.consume_rate_limit(auth.uid(), 'shop-setup', 15, 60);
  select * into current_shop from public.shops where shops.id = p_shop_id for update;
  if found then
    if current_shop.profile_version <> p_expected_version then raise exception 'Shop changed. Reload before saving.' using errcode = '40001'; end if;
    if current_shop.slug <> shop_slug then raise exception 'Storefront slugs are permanent' using errcode = '23514'; end if;
    previous_profile := jsonb_build_object('name', current_shop.name, 'category', current_shop.category,
      'neighborhood', current_shop.neighborhood, 'address', current_shop.address, 'description', current_shop.description,
      'visibility', current_shop.visibility, 'version', current_shop.profile_version);
    update public.shops set name = shop_name, category = shop_category, neighborhood = shop_neighborhood,
      address = shop_address, description = shop_description, visibility = shop_visibility, location = location_value
      where shops.id = p_shop_id;
  else
    if p_expected_version <> 0 then raise exception 'Shop no longer exists' using errcode = '40001'; end if;
    insert into public.shops(id, slug, name, category, neighborhood, address, description, visibility, location)
    values(p_shop_id, shop_slug, shop_name, shop_category, shop_neighborhood, shop_address, shop_description, shop_visibility, location_value);
  end if;
  if owner_id is not null then
    insert into public.shop_memberships(shop_id, user_id, role, verified_at)
    values(p_shop_id, owner_id, 'owner', now())
    on conflict(shop_id, user_id) do update set role = 'owner', verified_at = now();
  end if;
  insert into public.audit_events(shop_id, actor_id, entity_id, action, details)
  values(p_shop_id, auth.uid(), p_shop_id, 'SETUP_SHOP', jsonb_build_object(
    'before', previous_profile, 'after', jsonb_build_object('slug', shop_slug, 'name', shop_name, 'visibility', shop_visibility),
    'assigned_owner', owner_id, 'verification_method', case when owner_id is not null then p_verification_method else null end));
  return p_shop_id;
end;
$$;
revoke all on function public.admin_save_shop(uuid, integer, jsonb, text, boolean, text, uuid) from public, anon;
grant execute on function public.admin_save_shop(uuid, integer, jsonb, text, boolean, text, uuid) to authenticated;
