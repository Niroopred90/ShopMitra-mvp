# Local website test report

Application revision: `163d2f4`, on `dev`. Tested locally with Node 22, Next.js 16.4.3, Playwright 1.64.1, and local Supabase. No deployment, paid AI requests, database reset, commit, or push was performed.

| Check | Result |
| --- | --- |
| ESLint | Passed |
| Strict TypeScript | Passed |
| Production build | Passed |
| Database security/lifecycle assertions | 151 passed |
| Production-mode Chromium / Pixel 5 suite | 47 passed |
| Standalone offline AI validation | 19 passed; these cases are also included in the 47-case suite |
| Expired private-source deletion | Passed; synthetic source bytes removed and retained private fields cleared |
| Isolated backup/restore rehearsal | Passed; core counts, public projection, RLS flags, and role grants matched |
| Production-mode WebKit / iPhone 13 critical flows | 13 passed |

Coverage includes login/logout, unauthorized access denial, tenant isolation, verified shop setup, immutable slugs, draft privacy, explicit publication approval, edits/reapproval, withdrawal, expiry, duplicate retries, session interruption, QR decoding, sharing, discovery fallback, reports, request limits, and malformed AI output. Browser tests use fictional local accounts and may create private synthetic drafts; publication tests withdraw their offers and shop-setup tests remove their own synthetic shop.

## Reproduce

Start local Supabase and configure local settings per README. Keep port 3000 free for the production test server, and build before browser tests.

```sh
npm run lint
npm run typecheck
npm run test:db
npm run test:ai
npm run test:retention
npm run verify:restore
npm run build
npx playwright install chromium webkit
TEST_LOCAL_AUTH=1 npm run test:e2e
TEST_LOCAL_AUTH=1 npm run test:ios
```

Use `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/shopmitra-browsers` for the temporary browser downloads used in this session. Restart the normal local app with `npm run dev:local` after testing.

## Remaining verification

Google business-search follow-up: 8 Chromium cases passed (5 new Google URL/UI cases plus 3 existing discovery/reporting regressions), and all 5 new cases passed in iPhone/WebKit emulation. Lint, types, and production build passed. Google navigation is intercepted in these tests; actual listing relevance/coverage and physical-device location permission remain manual checks. Search results open externally and are not imported into ShopMitra.

- Physical iPhone/Android devices, camera scans, microphone capture, and actual weak mobile networks.
- Live provider output and consented Telugu/Hindi/English quality evaluation. Offline fixtures do not establish real AI accuracy.
- Hosted domain, secrets, email behavior, monitoring/alerts, and hosted backup/object recovery. Local dumps do not back up private storage object bytes.

Passing local checks does not establish these deployment/device/provider results.
