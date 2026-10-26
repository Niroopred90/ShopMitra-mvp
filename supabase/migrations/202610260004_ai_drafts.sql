-- AI requests are budgeted, tenant-bound, private, and can create drafts only.
alter table public.offer_sources add column retained_until timestamptz not null default now() + interval '30 days';
create index offer_sources_retention_idx on public.offer_sources(retained_until);
drop policy sources_read on public.offer_sources;
create policy sources_read on public.offer_sources for select to authenticated
  using (retained_until > now() and (private.has_shop_access(shop_id) or private.is_admin()));
drop policy source_media_read on storage.objects;
create policy source_media_read on storage.objects for select to authenticated
  using (bucket_id = 'offer-sources' and created_at > now() - interval '30 days' and (private.media_access(name) or private.is_admin()));
create table private.ai_requests (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id),
  shop_id uuid not null references public.shops(id),
  offer_id uuid not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);
alter table private.ai_requests enable row level security;
revoke all on private.ai_requests from public, anon, authenticated;

create function public.begin_ai_request(p_shop_id uuid, p_offer_id uuid, p_request_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare existing private.ai_requests;
begin
  if auth.uid() is null or not private.has_shop_access(p_shop_id, true) then raise exception 'Shop access denied' using errcode = '42501'; end if;
  if p_offer_id is null or p_request_id is null then raise exception 'Invalid request' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext(p_request_id::text));
  select * into existing from private.ai_requests where request_id = p_request_id;
  if found then
    if existing.user_id <> auth.uid() or existing.shop_id <> p_shop_id or existing.offer_id <> p_offer_id then raise exception 'Request conflict' using errcode = '42501'; end if;
    return existing.status;
  end if;
  perform private.consume_rate_limit(auth.uid(), 'ai-hour', 6, 3600);
  perform private.consume_rate_limit(auth.uid(), 'ai-day', 30, 86400);
  insert into private.ai_requests(request_id, user_id, shop_id, offer_id) values (p_request_id, auth.uid(), p_shop_id, p_offer_id);
  return 'ready';
end;
$$;

create function public.complete_ai_draft(p_request_id uuid, p_payload jsonb, p_extracted jsonb, p_transcript text, p_storage_path text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare request private.ai_requests;
begin
  select * into request from private.ai_requests where request_id = p_request_id for update;
  if not found or auth.uid() is null or request.user_id <> auth.uid() or not private.has_shop_access(request.shop_id, true) then raise exception 'Request access denied' using errcode = '42501'; end if;
  if request.status = 'completed' then return request.offer_id; end if;
  if request.status <> 'processing' then raise exception 'Start a new AI request' using errcode = '22023'; end if;
  if p_extracted is null or jsonb_typeof(p_extracted) <> 'object' or octet_length(p_extracted::text) > 30000 or length(coalesce(p_transcript, '')) > 30000 then
    raise exception 'Invalid AI source' using errcode = '22023';
  end if;
  if p_storage_path is not null and (
    length(p_storage_path) > 100
    or not exists (select 1 from unnest(case when p_payload->>'source_type' = 'photo' then array['jpg', 'png', 'webp']
      when p_payload->>'source_type' = 'voice' then array['webm', 'mp4', 'mp3', 'ogg'] else array[]::text[] end) as allowed(extension)
      where p_storage_path = request.shop_id::text || '/' || request.request_id::text || '.' || allowed.extension)
    or not exists (select 1 from storage.objects where bucket_id = 'offer-sources' and name = p_storage_path)
  ) then raise exception 'Invalid AI source' using errcode = '22023'; end if;
  perform public.save_offer_draft(request.shop_id, request.offer_id, 0, p_payload, p_request_id);
  insert into public.offer_sources(offer_id, shop_id, storage_path, transcript, extracted_fields)
    values (request.offer_id, request.shop_id, p_storage_path, p_transcript, p_extracted);
  update private.ai_requests set status = 'completed' where request_id = p_request_id;
  return request.offer_id;
end;
$$;

create function public.fail_ai_request(p_request_id uuid) returns void
language sql security definer set search_path = '' as $$
  update private.ai_requests set status = 'failed' where request_id = p_request_id and user_id = auth.uid() and status = 'processing';
$$;

create function private.record_ai_corrections() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.offer_sources set corrections = jsonb_build_object('title', new.title, 'description', new.description,
    'price_minor', new.price_minor, 'quantity', new.quantity, 'unit', new.unit, 'starts_at', new.starts_at,
    'expires_at', new.expires_at, 'corrected_at', now(), 'corrected_by', auth.uid())
  where offer_id = new.id and retained_until > now();
  return new;
end;
$$;
revoke all on function private.record_ai_corrections() from public;
create trigger record_ai_corrections after update of title, description, price_minor, quantity, unit, starts_at, expires_at on public.offers
for each row execute function private.record_ai_corrections();

revoke all on function public.begin_ai_request(uuid, uuid, uuid), public.complete_ai_draft(uuid, jsonb, jsonb, text, text), public.fail_ai_request(uuid) from public, anon;
grant execute on function public.begin_ai_request(uuid, uuid, uuid), public.complete_ai_draft(uuid, jsonb, jsonb, text, text), public.fail_ai_request(uuid) to authenticated;
