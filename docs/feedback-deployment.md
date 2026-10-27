# Feedback deployment: Netlify + Supabase Free

Status: Netlify published `dev@36d74fe` at `https://shopmartn.netlify.app` (site ID `6cbbd596-003d-4630-a07d-d180f0e6917b`). The user authorized public production access; deploy previews remain private. The six feedback environment variables were imported with secret masking, and the private local deployment file is ignored by Git. Supabase project `sstpxieasmnvvebplyvb` is healthy and linked; all seven repository migrations were applied and their remote versions verified. No local seeds were copied. Hosted Auth uses the Netlify origin and public signup is disabled; a remote configuration diff verified those settings. Public database projections respond successfully, while anonymous access to underlying shops/offers is denied. Use only Free plans and keep paid AI off. Source commits/pushes remain the user's manual action.

Hosted validation: `/api/health` returned HTTP 200 with `status: ok`. Home, demo shop, nearby, and owner login returned HTTP 200 with the feedback banner, disabled-AI notice, no-index metadata, and no server-key/rate-secret values in their HTML. Anonymous `/owner` and `/admin` requests redirect to `/owner/login`. Existing smoke and Google Maps tests passed in mobile Chromium and WebKit: **16 passed, 8 local-auth cases skipped**. Google requests and geolocation in those tests were mocked; this does not prove real GPS or physical-phone behavior. A private owner account now has verified owner access to the fictional `feedback-test-shop`, with no administrator grant. Its generated credentials are stored only in the ignored, owner-readable `.local-runtime/feedback-owner.json`; no invitation email was sent. A hosted mobile Chromium journey passed sign-in, shop listing, administrator-access denial, hosted-origin QR decoding, draft privacy, explicit publication, edit/reapproval, and withdrawal. The synthetic test offer was withdrawn. Hosted cross-owner/viewer checks and physical-device testing remain outstanding. The fictional storefront and owner dashboard are ready for manual feedback testing.

## Dedicated feedback backend

Owner self-signup follow-up: migration `202610270008_owner_onboarding.sql` is installed on the hosted feedback project. Local confirmation/request/approval checks passed in Chromium and WebKit; hosted signup remains disabled pending custom SMTP and the user's manual commit/push/deployment of the new app routes. See [owner signup setup](owner-signup-setup.md). The provisioned feedback owner remains available on the current deployment.

1. Create a separate **Free** Supabase project named ShopMitra Feedback in an organization with a free project slot. Stop if the provider requires a paid plan or unavailable quota. Do not reuse a production database.
2. Authenticate the pinned Supabase CLI, link this repository to the new feedback project, inspect `supabase db push --dry-run`, then apply the repository migrations with `supabase db push`. Do not run `supabase/seed.sql`, `db reset --linked`, or copy local Auth tables to the hosted project.
3. Disable public signup. Password-based sign-in works with explicitly provisioned confirmed accounts; OAuth/SMTP is not needed for this feedback pass.
4. Create a private lead/admin account through trusted Supabase Auth administration using a newly generated password. Grant its exact UUID access in `private.admins` through the trusted SQL editor/operator. Keep this account private.
5. Create individual owner/viewer feedback accounts with new unique passwords. Share only the intended test account with each tester; never publish the known local demo passwords or an admin password.
6. Sign in as the lead and set up a clearly fictional feedback shop using the admin setup screen once hosted. Until then, the static `/s/demo-shop` preview works without seeded shop records. Do not claim a real business has consented.

## Netlify project

Import `Niroopred90/ShopMitra-mvp` into Netlify. The Git repository root is the Next.js app root (the enclosing local workspace directory is not the repository root). Use Node 22, the checked-in `netlify.toml`, build command `npm run build:feedback`, and publish directory `.next`. Netlify detects its OpenNext adapter; do not upload an `out` directory or use a static export for this server-rendered/authenticated app.

For feedback only, set the site's tracked branch to `dev` after the user commits/pushes these changes. This does not merge `dev` into `main` or deploy a main release. Disable automatic deploys if the user prefers manually reviewed feedback releases.

Configure these values in **Netlify environment settings**, available to both **Builds and Functions**. Never paste keys into chat or commit real `.env` files:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Dedicated hosted project's HTTPS API origin |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable/anon key, never secret/service-role |
| `SUPABASE_SECRET_KEY` | Server-only feedback project secret/service-role key |
| `PUBLIC_RATE_SECRET` | Random secret of at least 32 characters |
| `SITE_URL` | Stable Netlify HTTPS site origin; `URL` is the build fallback |
| `FEEDBACK_MODE` | `true` |

Leave all `OPENAI_*` variables unset. Feedback mode is also frozen into the built artifact so an accidentally added runtime AI key cannot enable paid requests. Only non-secret flags and the public site origin are inlined; secret credentials are never placed in `next.config.ts` or `netlify.toml`.

After the Netlify hostname is assigned, set Supabase Auth Site URL and exact allowed redirects to that hostname, set `SITE_URL`, and rebuild. Free hosting may pause or reach quota; a successful local build does not prove provider limits or adapter compatibility for this deployment.

## Before sharing

- Verify HTTPS, `/api/health`, home/demo, nearby Google link-out, and owner login at the hosted URL.
- Confirm the feedback banner, no-index metadata, and disabled AI screen.
- Test private draft -> explicit publication -> anonymous visibility -> edit/reapprove -> withdraw, plus owner/viewer/admin separation.
- Decode the downloadable QR and verify it targets the hosted origin, not localhost or a temporary deployment URL.
- Keep all shops/offers fictional, admin credentials private, and no real owner/customer contact data in the preview.
- Confirm free usage limits, project pausing, and the plan for deletion/cleanup if media collection is later enabled. Do not activate hosted maintenance until credentials/policy/environment are explicitly configured.

The environment preflight checks shape and placement; it does not authenticate keys or prove hosted database migrations are applied. Hosting is complete only after provider deployment and hosted smoke checks pass.

References: [Netlify Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Netlify configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/), [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod).
