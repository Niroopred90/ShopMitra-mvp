begin;
select no_plan();

select lives_ok($$update public.shops set name = 'Renamed Fixture Shop' where slug = 'fixture-shop-a'$$, 'shop name can change');
select is((select slug from public.shops where name = 'Renamed Fixture Shop'), 'fixture-shop-a', 'name change keeps printed URL');
select throws_ok($$update public.shops set slug = 'new-url' where slug = 'fixture-shop-a'$$, '23514', 'Storefront slugs are permanent', 'even privileged updates cannot break the QR slug');
select throws_ok($$insert into public.shops(slug, name, category, neighborhood) values ('fixture-shop-a', 'Duplicate', 'Kirana', 'Test')$$, '23505', null, 'slugs remain unique');
select throws_ok($$insert into public.shops(slug, name, category, neighborhood) values ('demo-shop', 'Conflict', 'Kirana', 'Test')$$, '23514', null, 'demo slug is reserved');

-- Safe projections filter withdrawn, hidden, future, boundary-expired, and hidden-shop offers.
insert into public.offers(shop_id, title, status, moderation_status, starts_at, expires_at, approved_by, approved_at, created_by)
select case when scenario = 'Hidden shop offer' then '20000000-0000-0000-0000-000000000002'::uuid else shop_id end,
  scenario, case when scenario = 'Withdrawn offer' then 'withdrawn' else 'published' end,
  case when scenario = 'Moderated offer' then 'hidden' else 'visible' end,
  case when scenario = 'Future offer' then now() + interval '1 day' else null end,
  case when scenario = 'Boundary offer' then now() else now() + interval '2 days' end,
  created_by, now(), created_by
from public.offers cross join (values ('Withdrawn offer'), ('Moderated offer'), ('Future offer'), ('Boundary offer'), ('Hidden shop offer')) as scenarios(scenario)
where id = '30000000-0000-0000-0000-000000000001';

set local role anon;
select is((select name from public.public_shops where slug = 'fixture-shop-a'), 'Renamed Fixture Shop', 'same public URL shows new name');
select is((select count(*)::int from public.public_offers), 1, 'only the eligible offer is exposed');
select is((select title from public.public_offers limit 1), 'Visible offer', 'public projection returns the correct offer');
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'public_offers' and column_name in ('created_by', 'approved_by', 'source_type')), 0, 'public projection excludes internal metadata');

reset role;
update public.offers set status = 'withdrawn' where id = '30000000-0000-0000-0000-000000000003';
set local role anon;
select is((select count(*)::int from public.public_offers), 0, 'withdrawal takes effect on the next read');
reset role;
update public.shops set visibility = 'hidden' where slug = 'fixture-shop-a';
set local role anon;
select is((select count(*)::int from public.public_shops), 0, 'shop moderation takes effect on the next read');
select * from finish();
rollback;
