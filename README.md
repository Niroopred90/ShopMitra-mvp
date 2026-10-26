# ShopMitra

Mobile-first digital storefronts for neighborhood shops. Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, ESLint, and Playwright.

## Run locally

Use Node.js 22 (see `.nvmrc`). If you use nvm:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No environment variables or hosted services are needed for the initial preview.

Routes:

- `/`: introduction and navigation.
- `/s/demo-shop`: explicitly fictional preview, with no live offers.
- `/s/[store-slug]`: public database-backed storefront, current offers, sharing, and directions when an address exists. Hidden/unknown shops return 404; backend failures show a retry state.
- `/s/[store-slug]/qr`: downloadable 1024px PNG QR for an available public shop, using the configured canonical origin.
- `/owner/login`: email/password sign-in for provisioned pilot accounts.
- `/owner`: authenticated list of the user's verified shops and sign-out.
- `/owner/shops/[shopId]/offers`: create, edit, review, approve, publish, and withdraw offers.
- `/owner/shops/[shopId]/ai`: optional text/photo/voice AI assistance with private sources and mandatory owner review.
- `/nearby`: nearby shops by explicit geolocation or selected neighborhood.
- `/report/[offer-id]`: fixed-choice report form for eligible public offers.
- `/admin`: restricted moderation, report triage, and aggregate daily page displays.
- `/api/health`: minimal dependency-health endpoint.

Shop provisioning is operator-only. The core owner-to-customer publication flow, public storefronts/QRs, AI adapters, discovery, reporting, and moderation are implemented. Login and database-backed pages require Supabase settings; home/demo pages still work without them. AI remains disabled until compatible models and a provider key are explicitly configured. No public deployment or real-shop pilot has taken place.

Open `/s/fixture-shop-a` on the seeded local stack to see a database-backed shop and its published offer. `/s/fixture-shop-b` is intentionally hidden. Local fixtures are fictional.

## Storefront links and QR codes

Set server-only `SITE_URL` in `.env.local` to your canonical **HTTPS origin**, with no path, query, credentials, or fragment. The local setup script uses `http://127.0.0.1:3000`; HTTP is allowed only for loopback development. Existing `.env.local` files from step 3 need that setting added manually. Restart/rebuild after configuration changes.

The public shop page offers a PNG download; owners can reach it through “View storefront and QR” in their dashboard. QR destinations always come from `SITE_URL`, never incoming Host headers or query parameters. Missing/invalid `SITE_URL` disables QR downloads with a 503 response; hidden/unknown/demo shops return 404 for downloads. Sharing falls back to the current page URL if no canonical origin is configured.

Localhost QR codes are only test artifacts: they point to the scanning device's own loopback address. Choose the permanent domain and a review deployment before printing customer-facing QR codes. Physical Android scanning, real network/device checks, and hosting remain pending.

Storefront pages use fresh anonymous reads from safe public views, never the signed-in owner's session. Drafts, future/expired/withdrawn offers, moderated content, and private source data are excluded by the database. Shop slugs are immutable even to normal operator updates; name changes retain printed URLs. The demo slug is reserved. A backend timeout shows a retry state instead of presenting an error as “no offers.”

The initial development session used a temporary Node 22 runtime because the machine had Node 18. While that temporary runtime remains available, a session-local alternative is:

```sh
export PATH="/private/tmp/shopmitra-node/node_modules/node/bin:$PATH"
npm run dev
```

Install/use Node 22 normally for ongoing development; temporary directories are not durable.

## Branch workflow

`dev` is the default development branch. Push development changes to `dev` and let the Application checks workflow pass. Promote tested work with a pull request whose base is `main` and head is `dev`; merge only after the PR's `checks` job passes. Keep `main` for tested releases and avoid direct pushes. CI runs on both pushes and pull requests; merging to `main` is a deliberate release action, not automatic deployment.

## Validation commands

```sh
npm run lint
npm run typecheck
npm run test:db
npm run test:retention
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start the production server themselves; build first and keep port 3000 free. With local Supabase configured, run `npm run test:db` and `TEST_LOCAL_AUTH=1 npm run test:e2e` for database/auth coverage. CI starts local Supabase, runs the database tests, and enables auth browser tests. Tests use a mobile Chromium viewport; they do not substitute for physical Android or weak-network testing.

Latest integrated local result: 123 database assertions and 30 app/browser/adapter cases passed, plus actual synthetic-source deletion and a database restore rehearsal covering core grants/RLS. `test:retention` requires the seeded local stack and server-only local settings; it refuses hosted URLs. AI tests use offline mocks rather than paid provider calls.

For the temporary browser installation used in the initial session:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/shopmitra-browsers npm run test:e2e
```

Dependencies are pinned and `package-lock.json` is committed with the source. ESLint 9 is currently pinned for compatibility with the Next.js lint plugins, whose peer dependencies reject ESLint 10. Review this pin when those plugins support ESLint 10.

## Supabase local/test setup

The CLI is pinned as a development dependency. Schema, RLS, storage policies, private source data, and trigger-written audit history are versioned in `supabase/migrations/`. The local stack and isolation tests have been validated.

Prerequisites: Node 22 and a running Docker-compatible container engine. The initial start downloads container images and consumes local disk/memory.

```sh
npx supabase start
npm run setup:local-env
```

The setup script writes local public connection settings plus **server-only local** ingestion credentials to ignored `.env.local` with restricted permissions. It refuses to overwrite an existing file by default. For an existing local setup, `npm run setup:local-env -- --fill-missing` adds only missing values and refuses non-local URLs. Never put a service-role/secret key in a `NEXT_PUBLIC_` variable. Local Studio is normally at http://127.0.0.1:54323; API at http://127.0.0.1:54321.

After a new local stack is initialized, fictional seed accounts are available: `owner-a@example.test`, `owner-b@example.test`, `viewer@example.test`, `admin@example.test`, and `unassigned@example.test`. Their local-only password is `ShopMitra-local-2026!`. Owner A is assigned Fixture Shop A; owner B is assigned Fixture Shop B; viewer can read A; unassigned has no shop access. Never apply these seeds to a hosted/production database. Existing local stacks need a deliberate local reset to apply new seeds/migrations; this destroys local data.

Use a separate local project/test database and synthetic records for integration tests. Never reset a production or shared database. Once migrations exist, `npx supabase db reset` rebuilds the **local** database and destroys its existing local data. Stop services with `npx supabase stop`.

Commit schema and policies under `supabase/migrations/`; do not rely on untracked dashboard edits. No hosted Supabase project has been created or linked. Hosted credentials, domain, and deployment decisions remain pending.

Local setup follows the [Supabase CLI documentation](https://supabase.com/docs/guides/local-development/cli/getting-started); application setup follows the [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation).

## Publishing and retries

Sign in as owner A, choose **Manage offers**, and create a text offer. Saving produces a private draft. Review the price, quantity/unit, and dates, then explicitly confirm and publish. Editing a published offer returns it to draft until reapproved. Withdraw removes it from public reads. RPCs enforce tenant roles, write limits, request idempotency, and optimistic versions; stale edits require reloading. End dates are inclusive local calendar days converted to the next midnight in India as an exclusive boundary. Price is stored as integer paise.

## Optional AI configuration

Set server-only `OPENAI_API_KEY` and an explicit `OPENAI_OFFER_MODEL` supporting image input and structured Responses output. Set `OPENAI_TRANSCRIPTION_MODEL` separately for voice. There are no default models or automatic live calls. Review current official provider compatibility and pricing before configuring them. Owners must consent to sending the input to the provider, and must separately review/approve every generated draft.

Uploads are limited to 2 MB, validated by media signatures, and stored in private shop-scoped paths. Processing uses timeouts, database request budgets, and manual-entry fallback. Source text/media is hidden after 30 days; physical deletion requires the cleanup job. Actual provider quality, cost, and representative Telugu/Hindi/English samples are unverified. Never claim the offline adapter tests establish multilingual accuracy.

## Discovery, reporting, and analytics

Operators provision `shops.location` using longitude/latitude PostGIS points. Geolocation search requires coordinates; manual neighborhood discovery also works for shops without them. Location is requested explicitly and used for that search only.

Server-side reporting/event ingestion needs `SUPABASE_SECRET_KEY`; `PUBLIC_RATE_SECRET` is a separate HMAC secret. Without an explicitly trusted client-IP header, all anonymous traffic shares conservative rate buckets: at most five reports per day and 60 recorded displays per shop/day. Configure `TRUSTED_CLIENT_IP_HEADER` only when your reverse proxy overwrites it; never trust arbitrary forwarded headers. Daily HMAC buckets are short-lived; aggregate metrics contain no visitor identifiers. Page displays are **not** unique/returning visitors, QR scans, or sales. Moderation reasons and reports are admin-only.

## Operations and pilot readiness

```sh
npm run backup:local
npm run verify:restore
npm run cleanup:sources
```

The restore rehearsal uses a separate temporary local database; it never resets the source. Dumps are private and ignored. Storage object bytes require a separate backup strategy. Cleanup deletes expired media/source text and expires private rate/retry records. The optional daily GitHub workflow is disabled until `PILOT_MAINTENANCE_ENABLED=true` is set and `PILOT_SUPABASE_URL` / `PILOT_SUPABASE_SECRET_KEY` repository secrets are provisioned after release approval. Do not enable it against a database before confirming the retention policy. For hosted jobs with injected environment variables, invoke `node scripts/cleanup-ai-sources.mjs` directly.

See `IMPLEMENTATION_PLAN.md` for verified progress, `docs/architecture-decisions.md` for access decisions, `docs/release-runbook.md` for deployment/recovery gates, and `docs/pilot-field-kit.md` for interview, consent, onboarding, and weekly-scorecard templates. Physical Android testing, the permanent public origin, hosted operations/provider setup, and the real five-shop pilot remain open. The user handles commits manually.
