-- LOCAL DEVELOPMENT ONLY. Never apply this file to a hosted/production database.
-- All accounts are fictional and share this local-only password: ShopMitra-local-2026!
insert into auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', id::uuid, 'authenticated', 'authenticated', email,
  extensions.crypt('ShopMitra-local-2026!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
from (values
 ('10000000-0000-0000-0000-000000000001', 'owner-a@example.test'),
 ('10000000-0000-0000-0000-000000000002', 'owner-b@example.test'),
 ('10000000-0000-0000-0000-000000000003', 'viewer@example.test'),
 ('10000000-0000-0000-0000-000000000004', 'admin@example.test'),
 ('10000000-0000-0000-0000-000000000005', 'unassigned@example.test')
) as fixtures(id, email);

insert into auth.identities(id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email like '%@example.test';

insert into public.shops(id, slug, name, category, neighborhood, visibility) values
 ('20000000-0000-0000-0000-000000000001', 'fixture-shop-a', 'Fixture Shop A', 'Kirana', 'Test neighborhood', 'public'),
 ('20000000-0000-0000-0000-000000000002', 'fixture-shop-b', 'Fixture Shop B', 'Bakery', 'Test neighborhood', 'hidden');
insert into public.shop_memberships(shop_id, user_id, role, verified_at) values
 ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner', now()),
 ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'owner', now()),
 ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'viewer', now());
insert into private.admins values ('10000000-0000-0000-0000-000000000004');

insert into public.offers(id, shop_id, title, price_minor, status, expires_at, approved_by, approved_at, created_by) values
 ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Private draft A', 9900, 'draft', now() + interval '7 days', null, null, '10000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Private draft B', 5000, 'draft', now() + interval '7 days', null, null, '10000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Visible offer', 8900, 'published', now() + interval '7 days', '10000000-0000-0000-0000-000000000001', now(), '10000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Expired offer', 8900, 'published', now() - interval '1 day', '10000000-0000-0000-0000-000000000001', now(), '10000000-0000-0000-0000-000000000001');
insert into public.offer_sources(offer_id, shop_id, transcript) values
 ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Private source A'),
 ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Private source B');
