# Pilot release and recovery runbook

This document prepares operational work. It does not authorize deployment, spending, collaborator access, or real-owner onboarding. The current target remains the five-shop pilot.

## Local verification

Use Node 22, a running Docker-compatible engine, and the pinned dependencies. Start local Supabase, apply migrations, generate database types when schema changes, then run lint, type checks, database tests, build, and local-auth browser tests as documented in README. Keep test identities and `.env.local` out of production. Commits and pushes are handled manually by the user.

## Hosted release gate

- Name the project lead, hosting/Supabase account owner, release operator, support contact, and person responsible for incidents. Record contact details privately.
- Choose a stable HTTPS domain and a separate review environment. Configure `SITE_URL` deliberately before printing QR codes.
- Use separate development/review/production credentials and databases; never deploy fictional seed accounts.
- Disable public signup if retaining invitation-only onboarding. Provision verified membership/operator roles through controlled tooling.
- Apply versioned migrations first in review. Review RLS, private storage, rate limits, source retention, email delivery, provider budgets, and hosting limits.
- Run CI and the complete review journey, including owner A/B access denial and an unassigned account. No failing check is bypassed on `main`.
- Verify monitoring, health endpoint, backup availability, restore evidence, and rollback path. Confirm a real owner-facing support channel before onboarding.
- Test physical QR scans, actual Android devices, weak/interrupted networks, local-language samples, and owner review/withdrawal. Record evidence rather than assuming browser emulation covers these.
- Obtain the lead's release decision before authorized deployment. No public deployment has been made by this development work.

## Monitoring and incidents

`GET /api/health` returns only `ok` or `unavailable`, with a three-second dependency timeout and no connection details. An external uptime monitor must be configured against the authorized hosted origin. Application operational logs contain fixed event names and timestamps, not raw inputs, contacts, tokens, or provider responses. The hosting platform may produce its own request/error logs: review redaction and retention there before collecting real data.

For false offers: hide affected content using restricted moderation, retain the report/audit record, investigate with the owner, and restore only after review. For security/privacy incidents: restrict affected access, preserve necessary private audit evidence, rotate exposed secrets, notify the lead, assess affected data, and document decisions and recovery. Do not paste private data into public issues.

## Local database backup/restore exercise

```sh
npm run backup:local
npm run verify:restore
```

These scripts refuse non-loopback database connections. They use the local Supabase container, write a custom-format PostgreSQL dump under ignored `.local-backups/` with restricted permissions, and never reset the source database. `verify:restore` creates a separate randomly named temporary database, restores the archive including grants, compares core data/public-view counts, RLS flags and role privileges, then drops only that temporary database. Its local Supabase administrative role is required to recreate Supabase system functions. Pause local writes during the exercise for a consistent comparison. This is a recovery rehearsal, not a managed production backup schedule.

Database dumps include sensitive Auth records and storage metadata. Keep them private and delete obsolete copies deliberately. **Storage object bytes are not included.** A complete hosted recovery plan needs separate private-object backup/export and a tested restore of objects, permissions, signed-link behavior, and source retention. SQL functions, extension versions, and roles must be compatible in a target environment. Count comparison is a basic rehearsal; it does not prove a complete application disaster-recovery objective.

## Hosted backup requirements (pending setup)

Choose a Supabase/hosting plan with the required backup/restore capability after checking actual limits and budget. Before launch, define recovery point/time targets, backup frequency, retention, encryption/access, object backup, offsite copy policy, and the named operator. Record dates and evidence of a restore in a separate review database/storage bucket. Do not test a destructive restore on production. Set alerts for failed backups and expiry of retained copies.

## Rollback

Record the last known-good application commit/deployment and compatible schema version. For an application regression, pause releases and promote the previous tested build using the hosting platform's rollback workflow. Database changes should remain backward compatible; never assume an app rollback reverses a migration. Prefer a reviewed forward repair. Restore data only after the lead approves the recovery scope, writes are paused, and a current snapshot is preserved. Re-run access, publication, QR, and moderation checks before reopening the pilot.

## AI/provider release gate

Configure server-only provider credentials and explicitly selected models only after budget approval. Set provider-side spending caps as well as application limits; do not rely solely on an in-process limit in multi-instance hosting. Confirm deletion/retention settings and schedule the source-cleanup job. Test text/photo/voice errors and representative Telugu/Hindi/English samples with consent. Until that happens, AI accuracy and actual costs are unverified; manual text entry remains the release fallback.

The daily retention workflow is checked in but disabled until repository variable `PILOT_MAINTENANCE_ENABLED` is set to `true`. Configure repository secrets `PILOT_SUPABASE_URL` and `PILOT_SUPABASE_SECRET_KEY` only for the approved environment. Its 01:00 UTC run removes expired private sources and request ledgers. The first run and failure alerts must be reviewed by the named operator; a workflow file alone does not establish active retention. Prefer environment-protected secrets for production according to the chosen release process.

Public ingestion defaults to one shared anonymous abuse bucket unless an explicitly trusted proxy header is configured. This deliberately limits the whole deployment to five reports/day and 60 recorded displays/shop/day. Configure a header only when the actual host/proxy guarantees it is overwritten; verify forgery resistance and the rate/retention behavior before interpreting metrics or recruiting the five shops.
