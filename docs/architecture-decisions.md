# Pilot architecture decisions

## Authentication and verified access

Use Supabase email/password for the initial pilot. This avoids a paid SMS dependency while testing the core flow; revisit phone-based login after interviews. Public customers never need an account. Self-registration is disabled in local Supabase configuration; apply the same setting explicitly in a hosted Auth project before pilot use. Login is rate-limited by Supabase Auth, and server actions retain Next.js origin checks. Password-reset/self-service onboarding UI remains future work.

A trusted pilot operator creates/invites the owner through Supabase Auth, independently confirms the owner controls the business in person or through an agreed callback, then inserts the user's UUID and shop UUID into `shop_memberships` with role and `verified_at`. Email confirmation alone does not prove shop ownership. Keep consent/verification evidence outside public shop fields; do not collect identity documents by default.

Use the SQL editor/trusted operational tooling for provisioning for now. Membership and admin tables are not writable by application users. Never accept role/admin claims from user-editable Auth metadata. Membership removal revokes access on the next database query; changing a display name does not alter identity. Admins are explicitly provisioned in `private.admins`; there is no admin signup route.

Roles: owner/staff may edit their shop's drafts; viewer may only read. Owner and staff privileges are identical at this milestone. Membership management remains operator-only. Admins can read private records for support but cannot publish or moderate via the current UI. Future admin mutations need individually authorized, audited actions.

## Data and publication

Shop rows contain public business fields only. Memberships, full offers, source inputs, and audit history use RLS. Public access is through `public_shops` and `public_offers`, deliberately definer views with explicit safe columns and filtering. These views intentionally bypass base-table RLS solely for their public projection; never add private columns to them. Every base-table client query still uses the user's credentials, never a service-role key.

Offers use integer paise (`price_minor`, INR only) with a 0–100,000,000 bound. Quantity is an optional decimal with three fractional places. Published offers require approval metadata and expiry. Starts are inclusive; expiry is exclusive, checked at read time. Scheduled future offers are excluded until start. Date-only end dates in later forms will convert the next midnight in `Asia/Kolkata` to UTC. No cron task is required to hide expired offers.

Drafts are the only user-writable offer state in this milestone. Clients cannot modify approval, tenant, creator, status, or moderation fields. A dedicated owner-confirmation publication action/RPC will be implemented in step 5. Media upload is restricted to a private 10 MB bucket and paths beginning with the authorized shop UUID; updates/upserts are currently denied. Source records are read-only until AI ingestion is implemented. Audit entries are trigger-written and read-only for clients.

Before collecting real media, implement automatic deletion and confirm a retention period with the pilot lead; proposed source-media retention is 30 days. Retain only the minimum correction evidence needed. This milestone contains no real media or contacts.

## Stable URLs and hosting

Storefront path: `/s/[store-slug]`, unique lowercase hyphenated slug assigned by the operator. A trigger rejects slug changes even from privileged operator updates; names remain editable without breaking links. `demo-shop` is reserved. Any future slug-change feature requires a migration and permanent aliases. The canonical public domain is pending. Do not print pilot QR codes with a temporary hostname. No public hosting has been provisioned.

QR downloads use `qrcode` locally on the server, with a four-module quiet zone, medium error correction, and a 1024px PNG. The target comes solely from validated server-side `SITE_URL`, restricted to HTTPS origins (loopback HTTP allowed for local testing). The route does not accept arbitrary target URLs. Missing configuration fails closed; only public database-backed shops get downloads. A QR decode-and-open test verifies the generated asset independently via `jsqr`.

Public reads use an anonymous Supabase client without session persistence or owner cookies. Fetches use `no-store`, a six-second timeout per query, and request-only memoization. Failures display a retry state; unknown/hidden shops return 404. Navigation uses inline loading feedback rather than a streamed route fallback to preserve correct 404 status codes. Shop details/offers are loaded on each request so withdrawals and expiry are reflected on subsequent visits. Dates display in `Asia/Kolkata`; the UI uses integer-paise prices from the database.

## Verification

Local seed identities use `example.test` addresses and a documented test-only password. Never deploy `supabase/seed.sql` to a hosted database. Database security tests run transactionally and roll back their changes. Browser auth tests are enabled only with `TEST_LOCAL_AUTH=1` against the local seeded stack. CI starts a fresh local stack, then runs database and browser checks. Actual Android devices and live owner workflows remain later field checks.

Implementation follows [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs) and [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
