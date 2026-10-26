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
- `/s/demo-shop`: explicitly fictional storefront, with no live offers. Other shop slugs return 404.
- `/owner/login`: email/password sign-in for provisioned pilot accounts.
- `/owner`: authenticated list of the user's verified shops and sign-out.
- `/admin`: verified admin gate; moderation tools are not implemented yet.

Shop provisioning is operator-only. Database authorization and owner login are implemented; real public storefront reads, QR generation, offer publishing, and AI remain pending. Login requires local Supabase settings; the home/demo pages still work without them.

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

See `AGENTS.md` for project rules, `IMPLEMENTATION_PLAN.md` for the checklist, and `docs/architecture-decisions.md` for access/provisioning decisions. Next: real public storefront reads and stable QR generation, then owner-approved text offers.
