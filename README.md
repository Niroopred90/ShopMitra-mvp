# ShopMitra

Mobile-first digital storefronts for neighborhood shops. Initial scaffold: Next.js App Router, TypeScript, Tailwind CSS, ESLint, and Playwright.

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
- `/owner`: owner preview; no authentication or publishing yet.
- `/admin`: static placeholder only; no administrative data or actions.

These pages do not implement shop onboarding, QR generation, authorization, database reads, or AI. Do not add private information to the public owner/admin placeholders. Add server authorization before introducing protected content.

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

Browser tests start the production server themselves; build first and keep port 3000 free. CI runs the same checks on Node 22 and installs Chromium with Linux dependencies. Tests use a mobile Chromium viewport; they do not substitute for physical Android or weak-network testing.

For the temporary browser installation used in the initial session:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/shopmitra-browsers npm run test:e2e
```

Dependencies are pinned and `package-lock.json` is committed with the source. ESLint 9 is currently pinned for compatibility with the Next.js lint plugins, whose peer dependencies reject ESLint 10. Review this pin when those plugins support ESLint 10.

## Supabase local/test setup

The CLI is pinned as a development dependency and `supabase/config.toml` is initialized. Local database/auth integration is the next milestone. The stack has not been started or validated in this scaffold.

Prerequisites: Node 22 and a running Docker-compatible container engine. The initial start downloads container images and consumes local disk/memory.

```sh
npx supabase start
npx supabase status
cp .env.example .env.local
```

Copy the local API URL and publishable key from status into `.env.local`. Never put a service-role/secret key in a `NEXT_PUBLIC_` variable. The UI does not consume these variables yet. Local Studio is normally at http://127.0.0.1:54323; API at http://127.0.0.1:54321.

Use a separate local project/test database and synthetic records for integration tests. Never reset a production or shared database. Once migrations exist, `npx supabase db reset` rebuilds the **local** database and destroys its existing local data. Stop services with `npx supabase stop`.

Commit schema and policies under `supabase/migrations/`; do not rely on untracked dashboard edits. No hosted Supabase project has been created or linked. Hosted credentials, domain, and deployment decisions remain pending.

Local setup follows the [Supabase CLI documentation](https://supabase.com/docs/guides/local-development/cli/getting-started); application setup follows the [Next.js installation documentation](https://nextjs.org/docs/app/getting-started/installation).

## Next milestone

See `AGENTS.md` for project rules and `IMPLEMENTATION_PLAN.md` for the staged checklist. Next: schema, ownership verification, authentication, and row-level security, followed by real storefronts and owner-approved text offers.
