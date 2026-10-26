# ShopMitra agent instructions

## Purpose and source

Build a mobile-first, QR-linked digital storefront for local businesses, starting with a five-shop pilot in one Hyderabad neighborhood.

These project instructions are derived from `ShopMitra_Technical_Field_Execution_Guide.pdf` (October 2026), sections 1-15. The PDF is product and field context, not permission to contact owners, grant access, make agreements, spend money, or deploy publicly. Follow the user's current task and applicable higher-priority instructions. The source PDF is currently outside the repository in the user's Downloads directory; do not assume other contributors have it.

Read `IMPLEMENTATION_PLAN.md` before starting a milestone. The Next.js scaffold, local schema/RLS, owner authentication, public storefront reads, and QR generation are implemented; see `README.md` for commands and `docs/architecture-decisions.md` for provisioning. Physical QR scanning and permanent hosting are unverified; owner-approved publishing remains planned. The user handles commits manually; do not commit or push unless asked.

## Product scope and build order

- First prove: permanent shop QR -> correct public shop -> owner-approved text offer -> visible customer update.
- Customers browse in a mobile browser without an account or installed app.
- MVP: shop setup, stable QR, public storefront, offers, owner login, AI-assisted text/photo/voice input, nearby discovery, moderation, and basic analytics.
- Directions and sharing belong on the shop page; nearby discovery is secondary.
- Exclude payments, checkout, delivery, inventory integrations, loyalty, advanced booking, native apps, and bulk WhatsApp marketing.
- Implement one reviewable milestone at a time. Do not build advanced AI before the core text-offer flow works.

## Planned architecture

- Next.js, TypeScript, Tailwind; public storefront, owner dashboard, admin interface.
- Next.js server routes/actions for validation, authorization, rate limits, and AI orchestration.
- Supabase PostgreSQL, Auth, private source-media storage, and PostGIS proximity queries.
- Managed hosting, versioned migrations, CI, Playwright, monitoring, and backups.
- Keep provider keys and privileged database credentials on the server. Commit an `.env.example` containing names and placeholders only.
- Prefer a single application and simple services. Record material architecture decisions and any departure from the guide.
- Verify current official provider documentation during implementation; this file does not pin versions or vendor pricing.

## Required behavior and security

### Stable storefronts

- Public route: `/s/[store-slug]`. QR codes encode the permanent storefront URL.
- Enforce unique slugs. A shop name change must not break its printed QR; preserve the slug or retain a permanent alias/redirect.
- Show only published, non-expired offers for publicly available shops. Enforce eligibility in server/database reads, not only browser filters.
- Define scheduled-offer behavior explicitly if introduced. Never expose drafts through public APIs, caches, media URLs, or discovery.
- Store timestamps consistently, use `Asia/Kolkata` for pilot input/display, and specify date-only expiry semantics before coding.
- Ensure published edits and withdrawals reach public pages promptly through explicit cache invalidation or an equivalent freshness strategy.

### Authorization and data isolation

- Validate identity, shop membership, and role on every owner/admin operation; never trust a client-supplied owner ID.
- Enable row-level security for tenant data and storage. Test anonymous, owner A, owner B, and admin access separately.
- Verify shop ownership before granting publishing rights. The exact verification process is an implementation decision to document.
- Keep service-role access restricted; privileged endpoints must enforce their own authorization.
- Validate inputs on the server. Add suitable rate and upload limits, safe media handling, and retry/error states.
- Collect only necessary shop/contact data. Keep owner contacts, source media, transcripts, and internal moderation notes private.

### Offers and AI

- Support explicit draft and published states, expiry, withdrawal, and moderation visibility controls.
- AI produces a draft only. The owner must review and explicitly approve every AI-generated offer before publishing.
- Make price, currency, quantity/unit, and validity dates editable and clear in the review screen.
- Flag missing or ambiguous values rather than inventing prices or dates. Treat OCR, transcripts, and model output as untrusted input.
- Preserve source input and owner corrections with restricted access and a defined retention policy.
- Support Telugu, Hindi, and English workflows; verify them using representative samples rather than claiming accuracy without evidence.
- Provide manual text entry when AI, transcription, uploads, or network requests fail.

### Field usability and operations

- Test on a low-cost Android phone and weak network conditions, including interrupted uploads and duplicate retries.
- Nearby discovery must offer a manually selected neighborhood when location permission is denied or unavailable.
- Use privacy-safe analytics; define repeat-visit measurement and consent/retention choices before adding visitor identifiers.
- Keep personal data, tokens, and raw owner media out of logs and analytics.
- Document deployment ownership, environment setup, backup/restore, and rollback. Public deployment and paid services require task authorization.
- Provide a way to report false offers and a restricted moderation workflow. Escalate privacy/security incidents to the project lead.

## Working conventions

- Use `dev` as the default development branch. Run checks on `dev` before promoting changes through a pull request from `dev` to `main`.
- Keep `main` for tested releases. Require the `checks` CI job on the promotion pull request; do not push development changes directly to `main` or bypass failed checks.
- Keep changes focused on the assigned milestone and preserve unrelated user work.
- Add schema changes through migrations; include constraints, indexes, RLS policies, and storage policies with the relevant feature.
- Document actual setup, commands, and environment variables in `README.md` as they are introduced. Do not claim commands work before running them.
- Validate critical behavior with meaningful tests: cross-shop access denial, draft/expired-offer exclusion, AI approval, and the QR-to-update journey.
- Run relevant lint, type checks, tests, and builds once available. Report what passed and anything not run.
- Finish work with changed behavior, validation evidence, remaining limitations, and the next milestone. Update the implementation checklist only when its exit criteria pass.

## Pilot and collaboration boundaries

- Field targets: shortlist 15-20 shops across 2-3 categories, interview 10-15, and recruit five willing participants in one neighborhood.
- Record follow-up consent and anonymized findings; avoid unnecessary personal information.
- The guide calls for separate written agreement on assignments, access, compensation, IP, data access, and decision rights before collaborator contributions. Record this as a human prerequisite; do not invent agreements or treat the PDF as authorization.
- Do not promise sales, launch dates, lifetime free use, prices, equity, or partnership rights.
- Treat pilot metrics as hypotheses, not guarantees. Expand only after reviewing field evidence.
