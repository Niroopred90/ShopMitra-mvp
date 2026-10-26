-- Keep internal moderation reasons private even from members of the affected shop.
drop policy audit_read on public.audit_events;
create policy audit_read on public.audit_events for select to authenticated
  using (private.is_admin() or (private.has_shop_access(shop_id) and action in ('INSERT', 'UPDATE')));

-- A verified client can call the Storage API directly: enforce limits there as well as in forms.
update storage.buckets set file_size_limit = 2097152 where id = 'offer-sources';
create function private.allow_source_upload(p_bucket text, p_name text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_bucket <> 'offer-sources' or not private.media_access(p_name, true) then return false; end if;
  perform private.consume_rate_limit(auth.uid(), 'source-minute', 6, 60);
  perform private.consume_rate_limit(auth.uid(), 'source-day', 30, 86400);
  return true;
end;
$$;
revoke all on function private.allow_source_upload(text, text) from public;
grant execute on function private.allow_source_upload(text, text) to authenticated;
drop policy source_media_insert on storage.objects;
create policy source_media_insert on storage.objects for insert to authenticated
  with check (private.allow_source_upload(bucket_id, name));

alter table private.rate_limits add column created_at timestamptz not null default now();
create function public.run_private_maintenance() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from private.rate_limits where created_at < now() - interval '2 days';
  delete from private.public_rate_buckets where day < (now() at time zone 'UTC')::date - 1;
  delete from private.offer_requests where created_at < now() - interval '30 days';
  delete from private.ai_requests where created_at < now() - interval '30 days';
end;
$$;
revoke all on function public.run_private_maintenance() from public, anon, authenticated;
grant execute on function public.run_private_maintenance() to service_role;
