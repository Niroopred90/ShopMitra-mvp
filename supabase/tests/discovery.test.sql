begin;
select no_plan();
delete from public.offer_reports;
delete from public.shop_daily_metrics;
delete from private.public_rate_buckets;
update public.shops set location = extensions.st_setsrid(extensions.st_makepoint(78.4867, 17.3850), 4326)::extensions.geography;

set local role anon;
select is((select count(*)::int from public.discover_shops('Test neighborhood')), 1, 'manual neighborhood discovery excludes hidden shops');
select is((select count(*)::int from public.discover_shops(null, 17.3850, 78.4867, 1000, 20)), 1, 'proximity finds public shop');
select is((select distance_m from public.discover_shops(null, 17.3850, 78.4867, 1000, 20) limit 1), 0, 'distance is measured in metres');
select is((select count(*)::int from public.discover_shops('Unknown neighborhood')), 0, 'unknown neighborhood yields no shops');
select is((select count(*)::int from public.discover_shops()), 0, 'discovery requires a deliberate location or neighborhood');
select throws_ok($$select * from public.discover_shops(null, 91, 20)$$, '22023', 'Invalid discovery bounds', 'invalid latitude rejected');
select throws_ok($$select * from public.discover_shops(null, 17, 78, 100000)$$, '22023', 'Invalid discovery bounds', 'unbounded radius rejected');
select throws_ok($$select * from public.discover_shops(null, 17, 78, 5000, 10000)$$, '22023', 'Invalid discovery bounds', 'unbounded result count rejected');
select throws_ok($$select public.record_shop_view('20000000-0000-0000-0000-000000000001', repeat('a', 64))$$, '42501', null, 'anonymous cannot spoof ingestion rate keys');
select throws_ok($$select public.submit_offer_report('30000000-0000-0000-0000-000000000003', 'misleading', repeat('a',64))$$, '42501', null, 'anonymous cannot directly bypass reporting endpoint');
select throws_ok('select * from public.shop_daily_metrics', '42501', null, 'anonymous cannot read private metrics');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok($$select public.moderate_content('offer', '30000000-0000-0000-0000-000000000003', true, 'Owner attempt')$$, '42501', 'Administrator access required', 'owner cannot moderate');
select throws_ok($$select public.submit_offer_report('30000000-0000-0000-0000-000000000003', 'misleading', repeat('a',64))$$, '42501', null, 'authenticated clients cannot bypass rate-key derivation');

set local role service_role;
select is(public.record_shop_view('20000000-0000-0000-0000-000000000001', repeat('a',64)), true, 'server can record a public page display');
select is(public.record_shop_view('20000000-0000-0000-0000-000000000002', repeat('a',64)), false, 'hidden shop views are not counted');
select lives_ok($$select public.submit_offer_report('30000000-0000-0000-0000-000000000003', 'incorrect_price', repeat('b',64))$$, 'server accepts report on public current offer');
select throws_ok($$select public.submit_offer_report('30000000-0000-0000-0000-000000000001', 'incorrect_price', repeat('b',64))$$, '22023', 'Offer unavailable', 'draft reports are rejected');
select throws_ok($$select public.submit_offer_report('30000000-0000-0000-0000-000000000003', 'arbitrary text', repeat('b',64))$$, '22023', 'Invalid report', 'report reasons are bounded categories');
select lives_ok($$select public.submit_offer_report('30000000-0000-0000-0000-000000000003', 'misleading', repeat('c',64)) from generate_series(1,5)$$, 'five daily reports are accepted');
select throws_ok($$select public.submit_offer_report('30000000-0000-0000-0000-000000000003', 'misleading', repeat('c',64))$$, 'P0001', 'Please try again later', 'daily per-client reporting limit enforced');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::int from public.offer_reports), 0, 'owners cannot read reporter queue');
select is((select page_views::int from public.shop_daily_metrics limit 1), 1, 'owner can read own aggregated counts');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.shop_daily_metrics), 0, 'other owners cannot read metrics');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select is((select count(*)::int from public.offer_reports), 6, 'admin sees moderation queue');
select lives_ok($$select public.moderate_content('offer', '30000000-0000-0000-0000-000000000003', true, 'Verify price with owner')$$, 'admin can hide an offer');
select is((select count(*)::int from public.public_offers), 0, 'moderated offer disappears immediately');
select lives_ok($$select public.moderate_content('offer', '30000000-0000-0000-0000-000000000003', false, 'Owner confirmed correct price')$$, 'admin can restore an offer');
select is((select count(*)::int from public.public_offers), 1, 'restored eligible offer is public');
select lives_ok($$select public.review_offer_report((select id from public.offer_reports limit 1), 'resolved')$$, 'admin can resolve report');
select is((select count(*)::int from public.offer_reports where status = 'resolved'), 1, 'report review is stored');
select is((select count(*)::int from public.audit_events where action = 'MODERATE_OFFER' and actor_id = auth.uid()), 2, 'moderation audit records actual admin');
select lives_ok($$select public.moderate_content('shop', '20000000-0000-0000-0000-000000000001', true, 'Temporary review')$$, 'admin can hide shop');
select is((select count(*)::int from public.discover_shops('Test neighborhood')), 0, 'hidden shop disappears from discovery');
select * from finish();
rollback;
