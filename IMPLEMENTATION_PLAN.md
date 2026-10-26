# ShopMitra step-by-step implementation plan

## Basis and current state

Based on the October 2026 Technical & Field Execution Guide, especially sections 2, 7-8, 10-13. Repository inspection found only an empty `test` file; no application, dependencies, database, or automated checks exist yet.

Progress: the software for steps 2–8 is implemented, with local verification recorded below. Release/pilot materials and a local recovery rehearsal support steps 1, 9, and 10. Field activities, real AI/provider quality checks, hosted operations, physical Android/weak-network verification, and the actual five-shop pilot remain open. No public deployment, owner outreach, hosted account provisioning, paid AI calls, commits, or pushes were performed during the fan-out implementation.

The guide places the main build in weeks 3-8 but also requests a live QR test on days 8-12 and a text-offer test by day 14. Reconcile these with a small vertical prototype during weeks 1-2, followed by hardening and the remaining features in weeks 3-8. Dates are relative to an agreed kickoff, not promised launch dates.

## Integrated local validation after fan-out implementation

- Lint, strict type checks, and production build passed.
- All 123 transactional database assertions passed across tenant isolation, lifecycle/retries/versions, AI draft-only rules, retention visibility, discovery, moderation, and grants.
- All 30 app/browser/adapter/validation cases passed, including the owner-publish/customer-read/edit/reapprove/withdraw journey and bounded streaming requests. AI provider calls are mocked in these tests.
- The physical retention smoke test uploaded one synthetic expired source, verified object deletion and clearing of private fields, then removed its fixture.
- The final local restore rehearsal matched data/public-view counts, RLS flags, and key role privileges in a separate temporary database. Private storage-object backup remains a hosted release requirement.
- CI and disabled-by-default maintenance workflows are prepared. These final changes were not committed/pushed, so no GitHub CI or public deployment result is claimed.

The open field, provider, and hosting checkboxes below remain required. Automated checks do not establish owner consent, sales impact, real multilingual accuracy, a scheduled hosted backup/cleanup, or successful physical-device tests.

## 1. Confirm pilot and product decisions (days 1-3)

- [ ] Select one Hyderabad neighborhood and 2-3 shop categories.
- [x] Create a visit tracker: shop code, area/category, permission to follow up, current sharing behavior, device/language, reaction, objection, next step, responsible person. See `docs/pilot-field-kit.md`; no real visit records have been collected.
- [ ] Shortlist 15-20 shops; plan 10-15 interviews and five consenting pilot participants.
- [ ] Have the humans settle collaborator responsibilities and the written terms identified in the guide before collaborator contributions or access.
- [ ] Record decisions for owner login method, ownership verification, permanent domain/slug policy, expiry semantics, and public shop fields.

Exit: documented pilot boundaries, interview template, decision log, and a clear first demonstration scenario. Field interviews can run alongside technical preparation.

## 2. Scaffold the application and development workflow (days 3-5)

- [x] Initialize Next.js with TypeScript, Tailwind, and a package lockfile; choose versions using current official documentation.
- [x] Establish public storefront, owner, and admin route groups, with simple mobile-first layouts.
- [x] Add `.env.example`, `.gitignore`, and README setup instructions. Keep real secrets out of version control.
- [x] Configure linting, type checks, production build, and a Playwright smoke-test workflow in CI.
- [x] Add local development and test-environment instructions for Supabase.

Validation: lint, type checks, production build, and three mobile Chromium smoke tests passed locally. CI is configured but has not run on GitHub. Supabase CLI configuration is initialized; container startup and database/auth behavior remain untested. Node 22 is required; this machine's system Node 18 was left unchanged.

Suggested layout, adaptable to the chosen Next.js conventions:

```text
app/                    public, owner, admin, and server entry points
components/             shared UI and offer review controls
lib/                    validation, authorization, Supabase, AI adapters
supabase/migrations/    schema, policies, indexes, database functions
tests/                  integration and browser tests
docs/                   decisions, field templates, pilot runbook
```

Exit: a clean checkout can run locally; configured checks and a production build pass.

## 3. Implement schema, ownership, and isolation (days 5-8)

- [x] Create migrations for shops, shop memberships/roles, offers, and restricted audit history.
- [x] Define offer fields: shop, title/description, price/currency, quantity/unit, validity, status, source type, approval metadata, timestamps.
- [x] Use explicit decimal or integer-minor-unit money handling; define precision and valid ranges.
- [x] Define publication and moderation states plus timezone/expiry behavior. Date-only end dates will expire at the next local midnight in `Asia/Kolkata`, stored as an exclusive UTC boundary.
- [x] Implement Supabase Auth and server-side membership checks; choose a documented verification process for the first five shops.
- [x] Add RLS, public safe views/queries, private storage policies, foreign keys, and appropriate indexes.
- [x] Prepare synthetic seed shops and accounts without real owner contact details.

Validation: migration/reset, 29 transactional database security checks, lint, type checks, production build, and 7 mobile Chromium tests passed locally. Tests cover public offer filtering, cross-shop read/write denial, private media, blocked direct publication, viewer restrictions, owner login/logout, unassigned users, and admin access. Hosted auth settings and real owner onboarding remain operational work; the documented manual verification flow has not been performed on real shops.

Exit: anonymous users can read only safe public data; owner A cannot read or change owner B's private data, including through direct database/storage calls; unauthorized admin access fails.

## 4. Prove the stable QR storefront (days 8-12)

- [x] Build `/s/[store-slug]` with shop details, current offers, directions, and sharing.
- [x] Generate downloadable/printable QR codes for configured canonical storefront URLs (local test origin only so far).
- [x] Preserve QR destinations through shop-name changes; enforce slug uniqueness and immutable slugs.
- [x] Add navigation loading feedback, unavailable-shop, empty-offer, and network-error/retry states.
- [x] Filter public offers by publication, validity, and moderation eligibility on the server.
- [ ] Use a review/test environment first; choose a stable public host before printing pilot QR codes.

Validation: 40 transactional database checks, 11 mobile Chromium tests, lint, type checks, and production build passed locally. The downloaded PNG is independently decoded in tests and its destination opens the correct public shop without login. Name changes preserve the slug; attempts to change it are rejected. No cross-request storefront cache is used. Physical Android scan, weak-network field checks, and a permanent hosted origin have not been verified. Do not print localhost codes for customers.

Exit: scanning a physical sample QR on Android opens the intended shop without login; draft, expired, withdrawn, and hidden offers remain inaccessible publicly.

## 5. Complete owner-approved text publishing (days 12-14)

- [x] Build the owner dashboard and manual offer creation/editing form.
- [x] Add a review screen for title, price, quantity/unit, and dates, with explicit publish action.
- [x] Support drafts, edits, withdrawal, validation errors, session expiry, and safe retry behavior.
- [x] Record approval and change history; ensure retries do not create duplicate offers.
- [x] Revalidate affected paths and use fresh public reads after publication, edits, withdrawal, and moderation changes.
- [ ] Review three screens with field participants: public shop, owner dashboard, offer review.

Exit: an authorized owner can publish/edit a text offer and a customer sees the update on the same QR URL. Aim to test a simple offer in under 60 seconds; record actual results. This is the first product-value gate.

## 6. Harden the core journey (weeks 3-4)

- [x] Add database-backed write/upload/request limits, server validation, labeled forms, helpful failures, browser security headers, and fixed-field operational logs/health checks. Hosted alerting remains unconfigured.
- [x] Complete integration/browser tests for auth, tenant isolation, offer lifecycle, exact expiry boundaries, freshness, and QR routing.
- [ ] Test low-cost Android devices, slow connections, refresh/retry, and interrupted sessions.
- [ ] Fix issues observed in interviews and screen reviews before adding AI complexity.

Exit: core checks pass in CI, critical security defects are resolved, and field users can complete the text journey reliably.

## 7. Add AI-assisted drafts incrementally (weeks 5-6)

- [x] Define a structured extraction schema and real server-side provider adapter, with offline request/response tests.
- [x] Add private photo uploads, content/type/signature/size checks, and image-extraction adapter.
- [x] Add phone capture/upload and transcription/extraction adapters with Telugu/Hindi/English language selection.
- [ ] Validate actual provider output on consented Telugu, Hindi, and English samples; no real quality or cost claim is supported yet.
- [x] Store restricted source references, transcripts, extracted fields, corrections, and request state; implement 30-day visibility and physical cleanup tooling.
- [ ] Confirm retention policy with the lead and activate/monitor the scheduled cleanup before real media collection.
- [x] Flag ambiguity and require explicit owner review. Every AI path ends in a draft, including retries.
- [x] Handle timeout, invalid output, provider failure, and interrupted/ambiguous completion with manual fallback and source preservation.
- [x] Bound database request budgets, file sizes, and output tokens; require explicit models/credentials. Provider-side spending limits and actual cost measurement remain release setup.

Exit: representative text/photo/voice samples yield editable drafts; AI never publishes automatically; malformed or ambiguous prices/dates cannot silently become public offers.

## 8. Add discovery, moderation, and analytics (week 7)

- [x] Add shop coordinates and PostGIS indexes/proximity queries, with server-side input bounds.
- [x] Offer location permission and manual neighborhood selection; return only eligible public shops.
- [x] Add private, rate-limited false-offer reports and restricted admin review/hide/restore actions with an audit trail; internal moderation reasons are admin-only.
- [x] Define the pilot scorecard and implement aggregate daily page displays. Publication/time-to-publish evidence is in offer history/field observations; QR scans and returning visitors are explicitly unmeasured.
- [x] Use no persistent visitor identifiers; expire daily HMAC abuse-control buckets. Document trusted-proxy configuration, shared-bucket limits, and measurement limitations.

Exit: discovery works when geolocation is refused; unauthorized moderation fails; hidden content disappears publicly; metrics can be checked against known test events.

## 9. Prepare the five-shop release (week 8)

- [ ] Verify deployment/domain ownership, environment separation, secrets, hosting limits, and CI gates.
- [x] Implement and run a separate local database backup/restore rehearsal; document rollback and incident/report handling in `docs/release-runbook.md`.
- [ ] Configure hosted backup schedules/alerts and separate storage-object backups; perform a hosted recovery exercise against agreed recovery targets.
- [ ] Run the full QR -> owner update -> public visibility flow on actual field devices and weak networks.
- [ ] Prepare onboarding, QR placement, owner review instructions, support process, and consent records.
- [ ] Review release evidence and unresolved issues with the lead before the authorized pilot deployment.

Exit: deployment and recovery are reproducible, security and publication checks pass, and five consenting shops can be onboarded and supported.

## 10. Run and evaluate the pilot (weeks 9-12)

- [ ] Collect weekly feedback, defects, publication behavior, objections, and anonymized observations.
- [ ] Track hypotheses: five onboarded shops; at least four publishing weekly; at least three offers per active shop per week; simple publication under 60 seconds.
- [ ] Experimentally assess 25-30% returning visitors and willingness to pay from two of five owners, using explicit metric definitions and noting the small sample.
- [ ] Seek evidence of incremental visits/purchases through owner/customer feedback; do not equate scans with increased sales.
- [ ] Prioritize fixes and assess retention, usability, support effort, costs, and business value.

Exit: a written continue/change/stop decision backed by field evidence. Expansion to 20-30 shops in months 4-5 is conditional on this review; willingness-to-pay discussions do not establish pricing commitments.

## Recommended first implementation ticket

Next is release review and the human/provider/hosting gates listed above. Use `docs/pilot-field-kit.md` for interviews, consent, onboarding, and the weekly scorecard; use `docs/release-runbook.md` for deployment ownership, monitoring, retention activation, recovery, and rollback. Do not mark the real pilot or business hypotheses complete from automated tests.
