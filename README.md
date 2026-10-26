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
- `/admin`: verified admin gate; moderation tools are not implemented yet.

Shop provisioning is operator-only. Public storefront reads, QR generation, database authorization, and owner login are implemented. Offer publishing and AI remain pending. Login and database-backed pages require Supabase settings; home/demo pages still work without them.

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
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start the production server themselves; build first and keep port 3000 free. With local Supabase configured, run `npm run test:db` and `TEST_LOCAL_AUTH=1 npm run test:e2e` for database/auth coverage. CI starts local Supabase, runs the database tests, and enables auth browser tests. Tests use a mobile Chromium viewport; they do not substitute for physical Android or weak-network testing.

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

The setup script writes only the local public API URL/key to ignored `.env.local` and refuses to overwrite an existing file. Never put a service-role/secret key in a `NEXT_PUBLIC_` variable. Local Studio is normally at http://127.0.0.1:54323; API at http://127.0.0.1:54321.

After a new local stack is initialized, fictional seed accounts are available: `owner-a@example.test`, `owner-b@example.test`, `viewer@example.test`, `admin@example.test`, and `unassigned@example.test`. Their local-only password is `ShopMitra-local-2026!`. Owner A is assigned Fixture Shop A; owner B is assigned Fixture Shop B; viewer can read A; unassigned has no shop access. Never apply these seeds to a hosted/production database. Existing local stacks need a deliberate local reset to apply new seeds/migrations; this destroys local data.

Use a separate local project/test database and synthetic records for integration tests. Never reset a production or shared database. Once migrations exist, `npx supabase db reset` rebuilds the **local** database and destroys its existing local data. Stop services with `npx supabase stop`.

Commit schema and policies under `supabase/migrations/`; do not rely on untracked dashboard edits. No hosted Supabase project has been created or linked. Hosted credentials, domain, and deployment decisions remain pending.

Local setup follows the [Supabase CLI documentation](https://supabase.com/docs/guides/local-development/cli/getting-started); application setup follows the [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation).

## Next milestone

See `AGENTS.md` for project rules, `IMPLEMENTATION_PLAN.md` for the checklist, and `docs/architecture-decisions.md` for access/provisioning decisions. Next: owner-approved text offers. Step 4's physical scan and permanent-domain gate remain pending.
