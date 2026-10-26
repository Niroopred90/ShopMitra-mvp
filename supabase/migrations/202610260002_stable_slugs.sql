-- Printed storefront links must survive shop name changes and privileged operator edits.
alter table public.shops add constraint shops_reserved_slug check (slug <> 'demo-shop');
create function private.keep_shop_slug() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'Storefront slugs are permanent' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.keep_shop_slug() from public;
create trigger keep_shop_slug before update of slug on public.shops
for each row execute function private.keep_shop_slug();
