begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Extra states to exercise read-time eligibility, including the exact expiry boundary.
insert into public.offers(shop_id, title, status, moderation_status, starts_at, expires_at, approved_by, approved_at, created_by)
select shop_id, scenario, 'published', moderation,
  case when scenario = 'Future' then now() + interval '1 day' else null end,
  case when scenario = 'Boundary' then now() else now() + interval '2 days' end,
  created_by, now(), created_by
from public.offers cross join (values ('Future', 'visible'), ('Boundary', 'visible'), ('Hidden', 'hidden')) as scenarios(scenario, moderation)
where id = '30000000-0000-0000-0000-000000000001';
insert into storage.objects(bucket_id, name) values
 ('offer-sources', '20000000-0000-0000-0000-000000000001/private.png'),
 ('offer-sources', '20000000-0000-0000-0000-000000000002/private.png');

set local role anon;
select is((select count(*)::int from public.public_shops), 1, 'anonymous sees only public shops');
select is((select count(*)::int from public.public_offers), 1, 'only approved, current, visible offers are public');
select throws_ok('select * from public.offers', '42501', null, 'anonymous cannot read base offers');
select throws_ok('select * from public.offer_sources', '42501', null, 'anonymous cannot read source text');
select is((select count(*)::int from storage.objects where bucket_id = 'offer-sources'), 0, 'anonymous cannot read source media');
select throws_ok('select public.current_user_is_admin()', '42501', null, 'anonymous cannot invoke admin check');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::int from public.shops), 1, 'owner A sees only own base shop');
select is((select count(*)::int from public.offers where shop_id = '20000000-0000-0000-0000-000000000002'), 0, 'owner A cannot read B drafts');
select is((select count(*)::int from public.offer_sources), 1, 'owner A sees only own source records');
select is((select count(*)::int from storage.objects where bucket_id = 'offer-sources'), 1, 'owner A sees only own media');
select is((select count(*)::int from public.audit_events where shop_id = '20000000-0000-0000-0000-000000000002'), 0, 'audit history is tenant isolated');
select lives_ok($$update public.offers set title = 'Changed own draft' where id = '30000000-0000-0000-0000-000000000001'$$, 'owner can edit own draft');
with changed as (update public.offers set title = 'Attack' where shop_id = '20000000-0000-0000-0000-000000000002' returning id)
select is((select count(*)::int from changed), 0, 'cross-shop updates affect no rows');
select throws_ok($$insert into public.offers(shop_id, title) values ('20000000-0000-0000-0000-000000000002', 'Attack')$$, '42501', null, 'cross-shop inserts denied');
select throws_ok($$update public.offers set status = 'published'$$, '42501', null, 'direct publishing cannot bypass approval');
select throws_ok($$insert into public.shop_memberships values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'owner', now())$$, '42501', null, 'owner cannot self-grant membership');
select throws_ok($$update public.shops set visibility = 'public'$$, '42501', null, 'owner cannot bypass moderation');
select is(public.current_user_is_admin(), false, 'owner is not admin');
select throws_ok($$insert into storage.objects(bucket_id, name) values ('offer-sources', '20000000-0000-0000-0000-000000000002/attack.png')$$, '42501', null, 'cross-shop media upload denied');
select lives_ok($$insert into storage.objects(bucket_id, name) values ('offer-sources', '20000000-0000-0000-0000-000000000001/allowed.png')$$, 'own media upload allowed');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.offers), 1, 'owner B sees own offer only');
select is((select title from public.offers limit 1), 'Private draft B', 'cross-shop mutation did not change B');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select throws_ok($$insert into public.offers(shop_id, title) values ('20000000-0000-0000-0000-000000000001', 'Viewer attack')$$, '42501', null, 'viewer cannot create offers');
with changed as (update public.offers set title = 'Viewer attack' returning id)
select is((select count(*)::int from changed), 0, 'viewer cannot edit offers');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select is((select count(*)::int from public.shops), 0, 'unassigned account has no private access');
select is(public.current_user_is_admin(), false, 'unassigned account is not admin');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select is(public.current_user_is_admin(), true, 'explicitly provisioned admin recognized');
select is((select count(*)::int from public.shops), 2, 'admin can inspect both shops');
select is((select count(*)::int from public.offer_sources), 2, 'admin can inspect sources');
select * from finish();
rollback;
