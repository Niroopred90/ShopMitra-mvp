alter table public.offers add column version integer not null default 1;
revoke insert, update on public.offers from authenticated;
revoke insert (shop_id, title, description, price_minor, currency, quantity, unit, starts_at, expires_at, source_type) on public.offers from authenticated;
revoke update (title, description, price_minor, currency, quantity, unit, starts_at, expires_at) on public.offers from authenticated;

create table private.rate_limits (
 user_id uuid not null, scope text not null, bucket bigint not null, hits integer not null,
 primary key (user_id, scope, bucket)
);
alter table private.rate_limits enable row level security;
create function private.consume_rate_limit(p_user uuid,p_scope text,p_limit integer,p_window_seconds integer) returns void
language plpgsql security definer set search_path='' as $$
declare current_bucket bigint; total integer;
begin
 if p_user is null or p_limit < 1 or p_window_seconds < 1 then raise exception 'Invalid rate limit'; end if;
 current_bucket := floor(extract(epoch from clock_timestamp()) / p_window_seconds)::bigint;
 insert into private.rate_limits values(p_user,p_scope,current_bucket,1)
 on conflict(user_id,scope,bucket) do update set hits=private.rate_limits.hits+1 returning hits into total;
 if total > p_limit then raise exception 'Too many updates. Please wait and try again.' using errcode='P0001'; end if;
 delete from private.rate_limits where user_id=p_user and scope=p_scope and bucket < current_bucket-2;
end $$;
revoke all on function private.consume_rate_limit(uuid,text,integer,integer) from public;

create table private.offer_requests (
 user_id uuid not null, request_id uuid not null, scope text not null, entity_id uuid not null,
 signature text not null, created_at timestamptz not null default now(), primary key(user_id,request_id)
);
alter table private.offer_requests enable row level security;
create function private.offer_request_replayed(p_request_id uuid,p_scope text,p_entity_id uuid,p_signature text) returns boolean
language plpgsql security definer set search_path='' as $$
declare prior private.offer_requests;
begin
 if p_request_id is null then raise exception 'Missing request key'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_request_id::text,0));
 select * into prior from private.offer_requests where user_id=auth.uid() and request_id=p_request_id;
 if found then
   if prior.scope<>p_scope or prior.entity_id<>p_entity_id or prior.signature<>p_signature then raise exception 'Retry key was already used for different changes'; end if;
   return true;
 end if;
 insert into private.offer_requests(user_id,request_id,scope,entity_id,signature) values(auth.uid(),p_request_id,p_scope,p_entity_id,p_signature);
 return false;
end $$;
revoke all on function private.offer_request_replayed(uuid,text,uuid,text) from public;

create function public.save_offer_draft(p_shop_id uuid,p_offer_id uuid,p_expected_version integer,p_payload jsonb,p_request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare current_offer public.offers; title_value text; price_value integer; quantity_value numeric; unit_value text; start_value timestamptz; end_value timestamptz; source_value text;
begin
 if auth.uid() is null or not private.has_shop_access(p_shop_id,true) then raise exception 'Shop access denied' using errcode='42501'; end if;
 if p_expected_version is null or p_expected_version<0 then raise exception 'Invalid offer version'; end if;
 if p_offer_id is null or p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid offer'; end if;
 if private.offer_request_replayed(p_request_id,'save',p_offer_id,md5(p_shop_id::text||p_expected_version::text||p_payload::text)) then return p_offer_id; end if;
 perform private.consume_rate_limit(auth.uid(),'offer-write',30,60);
 select * into current_offer from public.offers where id=p_offer_id for update;
 if found then
   if current_offer.shop_id<>p_shop_id then raise exception 'Shop access denied' using errcode='42501'; end if;
   if current_offer.version<>p_expected_version then raise exception 'Offer changed. Reload before saving.' using errcode='40001'; end if;
 elsif p_expected_version<>0 then raise exception 'Offer no longer exists' using errcode='40001'; end if;
 title_value:=trim(p_payload->>'title'); price_value:=(p_payload->>'price_minor')::integer;
 quantity_value:=(p_payload->>'quantity')::numeric; unit_value:=nullif(trim(p_payload->>'unit'),'');
 start_value:=(p_payload->>'starts_at')::timestamptz; end_value:=(p_payload->>'expires_at')::timestamptz;
 source_value:=coalesce(p_payload->>'source_type','text');
 if title_value is null or length(title_value) not between 1 and 160 or length(coalesce(p_payload->>'description',''))>3000 then raise exception 'Check title and description'; end if;
 if price_value is not null and (price_value<0 or price_value>100000000) then raise exception 'Invalid price'; end if;
 if quantity_value is not null and (quantity_value<=0 or quantity_value>1000000 or quantity_value<>round(quantity_value,3)) then raise exception 'Invalid quantity'; end if;
 if (quantity_value is null)<>(unit_value is null) or length(unit_value)>40 then raise exception 'Quantity and unit must be supplied together'; end if;
 if start_value is not null and end_value is not null and end_value<=start_value then raise exception 'End must be after start'; end if;
 if current_offer.id is null then
  insert into public.offers(id,shop_id,title,description,price_minor,quantity,unit,starts_at,expires_at,source_type,created_by)
  values(p_offer_id,p_shop_id,title_value,coalesce(p_payload->>'description',''),price_value,quantity_value,unit_value,start_value,end_value,source_value,auth.uid());
 else
  update public.offers set title=title_value,description=coalesce(p_payload->>'description',''),price_minor=price_value,
   quantity=quantity_value,unit=unit_value,starts_at=start_value,expires_at=end_value,
   status='draft',approved_by=null,approved_at=null,version=version+1 where id=p_offer_id;
 end if;
 return p_offer_id;
end $$;

create function public.publish_offer(p_offer_id uuid,p_expected_version integer,p_request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare current_offer public.offers;
begin
 if p_expected_version is null or p_expected_version<1 then raise exception 'Invalid offer version'; end if;
 select * into current_offer from public.offers where id=p_offer_id;
 if not found or auth.uid() is null or not private.has_shop_access(current_offer.shop_id,true) then raise exception 'Shop access denied' using errcode='42501'; end if;
 if private.offer_request_replayed(p_request_id,'publish',p_offer_id,p_expected_version::text) then return p_offer_id; end if;
 perform private.consume_rate_limit(auth.uid(),'offer-write',30,60);
 select * into current_offer from public.offers where id=p_offer_id for update;
 if current_offer.version<>p_expected_version then raise exception 'Offer changed. Reload and review again.' using errcode='40001'; end if;
 if current_offer.status<>'draft' or current_offer.price_minor is null or current_offer.expires_at is null or current_offer.expires_at<=now() then raise exception 'Review price and a future end date before publishing'; end if;
 if current_offer.moderation_status='hidden' then raise exception 'This offer is hidden by moderation'; end if;
 update public.offers set status='published',approved_by=auth.uid(),approved_at=now(),version=version+1 where id=p_offer_id;
 return p_offer_id;
end $$;

create function public.withdraw_offer(p_offer_id uuid,p_expected_version integer,p_request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare current_offer public.offers;
begin
 if p_expected_version is null or p_expected_version<1 then raise exception 'Invalid offer version'; end if;
 select * into current_offer from public.offers where id=p_offer_id;
 if not found or auth.uid() is null or not private.has_shop_access(current_offer.shop_id,true) then raise exception 'Shop access denied' using errcode='42501'; end if;
 if private.offer_request_replayed(p_request_id,'withdraw',p_offer_id,p_expected_version::text) then return p_offer_id; end if;
 perform private.consume_rate_limit(auth.uid(),'offer-write',30,60);
 select * into current_offer from public.offers where id=p_offer_id for update;
 if current_offer.version<>p_expected_version then raise exception 'Offer changed. Reload before withdrawing.' using errcode='40001'; end if;
 update public.offers set status='withdrawn',version=version+1 where id=p_offer_id;
 return p_offer_id;
end $$;
revoke all on function public.save_offer_draft(uuid,uuid,integer,jsonb,uuid),public.publish_offer(uuid,integer,uuid),public.withdraw_offer(uuid,integer,uuid) from public,anon;
grant execute on function public.save_offer_draft(uuid,uuid,integer,jsonb,uuid),public.publish_offer(uuid,integer,uuid),public.withdraw_offer(uuid,integer,uuid) to authenticated;
