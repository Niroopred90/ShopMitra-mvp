# ShopMitra step-by-step implementation plan

## Basis and current state

Based on the October 2026 Technical & Field Execution Guide, especially sections 2, 7-8, 10-13. Repository inspection found only an empty `test` file; no application, dependencies, database, or automated checks exist yet.

Progress: steps 2 and 3 are implemented and locally verified. Step 4's code and automated checks are complete; its physical Android scan and permanent-domain gate remain pending. Later steps remain planned. No public deployment, owner outreach, hosted account provisioning, or paid services have been performed.

The guide places the main build in weeks 3-8 but also requests a live QR test on days 8-12 and a text-offer test by day 14. Reconcile these with a small vertical prototype during weeks 1-2, followed by hardening and the remaining features in weeks 3-8. Dates are relative to an agreed kickoff, not promised launch dates.

## 1. Confirm pilot and product decisions (days 1-3)

- [ ] Select one Hyderabad neighborhood and 2-3 shop categories.
- [ ] Create a visit tracker: shop code, area/category, permission to follow up, current sharing behavior, device/language, reaction, objection, next step, responsible person.
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

- [ ] Build the owner dashboard and manual offer creation/editing form.
- [ ] Add a review screen for title, price, quantity/unit, and dates, with explicit publish action.
- [ ] Support drafts, edits, withdrawal, validation errors, session expiry, and safe retry behavior.
- [ ] Record approval and change history; ensure retries do not create duplicate offers.
- [ ] Invalidate public-page caches after publication, edits, withdrawal, and moderation changes.
- [ ] Review three screens with field participants: public shop, owner dashboard, offer review.

Exit: an authorized owner can publish/edit a text offer and a customer sees the update on the same QR URL. Aim to test a simple offer in under 60 seconds; record actual results. This is the first product-value gate.

## 6. Harden the core journey (weeks 3-4)

- [ ] Add rate limits, server validation, accessible forms, helpful failures, and monitoring with redacted logs.
- [ ] Complete integration/browser tests for auth, tenant isolation, offer lifecycle, exact expiry boundaries, freshness, and QR routing.
- [ ] Test low-cost Android devices, slow connections, refresh/retry, and interrupted sessions.
- [ ] Fix issues observed in interviews and screen reviews before adding AI complexity.

Exit: core checks pass in CI, critical security defects are resolved, and field users can complete the text journey reliably.

## 7. Add AI-assisted drafts incrementally (weeks 5-6)

- [ ] Define a structured extraction schema and provider adapter; start with text extraction.
- [ ] Add private photo uploads, content/type/size checks, and image/OCR extraction.
- [ ] Add voice recording/upload, transcription, and extraction; test Telugu, Hindi, and English samples.
- [ ] Store restricted source references, transcripts, extracted fields, owner corrections, and processing state; define retention/deletion.
- [ ] Flag ambiguity and require explicit owner review. Every AI path ends in a draft, including retries.
- [ ] Handle timeout, invalid model output, provider failure, and interrupted uploads with manual fallback.
- [ ] Bound request rates, file sizes, and provider usage; record costs without making financial commitments.

Exit: representative text/photo/voice samples yield editable drafts; AI never publishes automatically; malformed or ambiguous prices/dates cannot silently become public offers.

## 8. Add discovery, moderation, and analytics (week 7)

- [ ] Add shop coordinates and PostGIS indexes/proximity queries, with server-side input bounds.
- [ ] Offer location permission and manual neighborhood selection; return only eligible public shops.
- [ ] Add false-offer reporting and restricted admin review/hide/restore actions with an audit trail.
- [ ] Define scan/page-view, publication, time-to-publish, and repeat-visit metrics; distinguish a QR entry from a generic page visit where measurable.
- [ ] Select a privacy-safe aggregation/return-visitor approach and document consent, retention, and limitations. Keep owner contacts and raw media out of analytics.

Exit: discovery works when geolocation is refused; unauthorized moderation fails; hidden content disappears publicly; metrics can be checked against known test events.

## 9. Prepare the five-shop release (week 8)

- [ ] Verify deployment/domain ownership, environment separation, secrets, hosting limits, and CI gates.
- [ ] Configure backups and perform a restore exercise; document rollback and incident/report handling.
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

Next development ticket is step 5: owner-approved text offers. Step 4's code is tested locally; keep its physical Android scan and permanent public origin as open release prerequisites. Complete the core owner-to-customer update journey before introducing AI.
