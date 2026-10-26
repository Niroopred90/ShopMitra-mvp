begin;
select no_plan();
insert into public.audit_events(shop_id, actor_id, entity_id, action, details) values
 ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'MODERATE_SHOP', '{"reason":"Internal investigation"}'),
 ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'REVIEW_REPORT', '{"status":"resolved"}');
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::int from public.audit_events where action like 'MODERATE_%' or action = 'REVIEW_REPORT'), 0, 'owner cannot read internal moderation records');
select ok((select count(*) > 0 from public.audit_events where action = 'INSERT'), 'owner still sees own offer history');
select throws_ok('select public.run_private_maintenance()', '42501', null, 'owners cannot erase rate/retry ledgers');
select throws_ok($$insert into storage.objects(bucket_id, name) values ('offer-sources', '20000000-0000-0000-0000-000000000002/foreign.png')$$, '42501', null, 'bounded upload helper still denies foreign shop');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select is((select count(*)::int from public.audit_events where action like 'MODERATE_%' or action = 'REVIEW_REPORT'), 0, 'viewer cannot read internal moderation records');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select is((select count(*)::int from public.audit_events where action in ('MODERATE_SHOP','REVIEW_REPORT')), 2, 'admin can review internal investigation records');
reset role;
select is((select file_size_limit::int from storage.buckets where id = 'offer-sources'), 2097152, 'storage API enforces 2MB source limit');
set local role anon;
select throws_ok('select public.run_private_maintenance()', '42501', null, 'anonymous cannot invoke maintenance');
select * from finish();
rollback;
