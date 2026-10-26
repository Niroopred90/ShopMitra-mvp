begin;
select no_plan();
set local test.setup_payload = '{"slug":"setup-test-shop","name":"Setup Test Shop","category":"Kirana","neighborhood":"Synthetic setup locality","address":"Fictional business address","description":"Synthetic fixture only","visibility":"hidden","latitude":17.385,"longitude":78.4867}';

set local role anon;
select throws_ok($$select public.admin_shop_details('20000000-0000-0000-0000-000000000001')$$, '42501', null, 'anonymous cannot inspect admin setup');
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,'unassigned@example.test',true,'in_person','71000000-0000-0000-0000-000000000001')$$, '42501', null, 'anonymous cannot create shops');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,'unassigned@example.test',true,'in_person','71000000-0000-0000-0000-000000000001')$$, '42501', 'Administrator access required', 'ordinary owner cannot provision another shop');
select throws_ok($$select public.admin_shop_details('20000000-0000-0000-0000-000000000001')$$, '42501', 'Administrator access required', 'ordinary owner cannot use admin profile RPC');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,'unassigned@example.test',false,'in_person','71000000-0000-0000-0000-000000000001')$$, '22023', 'Verify ownership before assigning access', 'admin cannot grant unverified access');
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,'unassigned@example.test',true,null,'71000000-0000-0000-0000-000000000001')$$, '22023', 'Verify ownership before assigning access', 'verification method is required');
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,'missing@example.test',true,'in_person','71000000-0000-0000-0000-000000000001')$$, '22023', 'Existing owner account was not found', 'setup never creates an auth account');
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,null,false,null,'71000000-0000-0000-0000-000000000001')$$, '22023', 'An existing verified owner account is required', 'new shop needs an initial verified owner');
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb || '{"latitude":91}', 'unassigned@example.test',true,'in_person','71000000-0000-0000-0000-000000000001')$$, '22023', 'Invalid shop coordinates', 'invalid latitude rejected');

select is(public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,'unassigned@example.test',true,'in_person','71000000-0000-0000-0000-000000000001'), '70000000-0000-0000-0000-000000000001'::uuid, 'admin creates a verified hidden shop');
select is(public.admin_save_shop('70000000-0000-0000-0000-000000000001',0,current_setting('test.setup_payload')::jsonb,'unassigned@example.test',true,'in_person','71000000-0000-0000-0000-000000000001'), '70000000-0000-0000-0000-000000000001'::uuid, 'same request safely replays');
select is((select count(*)::int from public.shop_memberships where shop_id = '70000000-0000-0000-0000-000000000001'), 1, 'retry does not duplicate membership');
select is((select role from public.shop_memberships where shop_id = '70000000-0000-0000-0000-000000000001'), 'owner', 'verified account receives owner role');
select is((select profile_version from public.admin_shop_details('70000000-0000-0000-0000-000000000001')), 1, 'new profile starts at version one');
select is((select latitude::numeric from public.admin_shop_details('70000000-0000-0000-0000-000000000001')), 17.385::numeric, 'profile editing preserves readable latitude');
select is((select longitude::numeric from public.admin_shop_details('70000000-0000-0000-0000-000000000001')), 78.4867::numeric, 'coordinates use longitude-first PostGIS point ordering');
select is((select count(*)::int from public.audit_events where entity_id = '70000000-0000-0000-0000-000000000001' and action = 'SETUP_SHOP'), 1, 'setup and retry create a single audit entry');
select is((select details->>'verification_method' from public.audit_events where entity_id = '70000000-0000-0000-0000-000000000001' and action = 'SETUP_SHOP'), 'in_person', 'verification method is recorded privately');
select is((select count(*)::int from public.audit_events where entity_id = '70000000-0000-0000-0000-000000000001' and details::text like '%unassigned@example.test%'), 0, 'owner email is not copied into audit history');

select lives_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',1,current_setting('test.setup_payload')::jsonb || '{"name":"Renamed Setup Shop","visibility":"public"}',null,false,null,'71000000-0000-0000-0000-000000000002')$$, 'admin edits business fields without granting new access');
select is((select profile_version from public.admin_shop_details('70000000-0000-0000-0000-000000000001')), 2, 'profile update increments version');
select is((select slug from public.public_shops where id = '70000000-0000-0000-0000-000000000001'), 'setup-test-shop', 'name change preserves permanent URL');
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',2,current_setting('test.setup_payload')::jsonb || '{"slug":"changed-slug"}',null,false,null,'71000000-0000-0000-0000-000000000003')$$, '23514', 'Storefront slugs are permanent', 'setup cannot change a printed shop slug');
select lives_ok($$select public.moderate_content('shop','70000000-0000-0000-0000-000000000001',true,'Synthetic moderation check')$$, 'admin moderation still works');
select is((select profile_version from public.admin_shop_details('70000000-0000-0000-0000-000000000001')), 3, 'moderation also advances profile version');
select throws_ok($$select public.admin_save_shop('70000000-0000-0000-0000-000000000001',2,current_setting('test.setup_payload')::jsonb || '{"visibility":"public"}',null,false,null,'71000000-0000-0000-0000-000000000004')$$, '40001', 'Shop changed. Reload before saving.', 'stale form cannot undo newer moderation');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select is((select count(*)::int from public.shops where id = '70000000-0000-0000-0000-000000000001'), 1, 'verified assigned account can read its shop');
select is((select count(*)::int from public.audit_events where entity_id = '70000000-0000-0000-0000-000000000001' and action = 'SETUP_SHOP'), 0, 'internal verification evidence is hidden from tenant');
select * from finish();
rollback;
