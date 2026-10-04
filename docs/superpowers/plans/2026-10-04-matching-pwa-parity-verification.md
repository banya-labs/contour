# Matching and Agent PWA verification record

Date: 2026-10-04
Branch: chore/matching-pwa-implementation-plan
Baseline: eaa457efb79890b5d9f9fd0b0d8aa2e80e100e94
Scope: local implementation; production deployment and database migration are not included.

## Delivered behavior

- Property cards open property-filtered buyer/renter results. Full property records automatically load fit percentages and reasons. Map entry uses the same results view.
- One deterministic policy powers inquiry, reverse-property, desktop, vault, and notification consumers. AVAILABLE inventory and active, unattached inquiries drive opportunity counts. Structured requirements outrank old JSON values; rental pricing on BOTH listings uses rent.
- Required flags and confirmed must-haves reject incompatible results. Soft preferences retain existing weights and explain unmet or unknown data. Qualifying means strictly over 70 fit points, with no hard failures.
- Inquiries select an existing contact; Contacts create/edit identities separately. Multiple inquiries for one contact remain distinct. Capture sends typed bedroom, bathroom, plot, budget and strict requirements with a stable retry key.
- Attachment validates ownership, current availability and hard requirements inside a serializable transaction, synchronizes propertyId/matchStatus, and records an audit event. Creation with an attached property uses the same checks. Attachment does not advance the inquiry stage.
- Scoped PWA endpoints serve field agents' own and unassigned inquiries. Management access follows leads.assign. Desktop CRM read access is not granted to field agents.
- Matching notifications are reconciled for inquiry/property mutations and reevaluated on read. Read receipts are recipient-only; shared unassigned notifications cannot be marked read on behalf of every agent.
- PWA refresh loads paginated inventory and inquiry data and bounded summary batches. Summary calculation is reused by tenant/user/permissions for 30 seconds and invalidated on relevant mutations. Result pages cache by tenant/user/query/policy, label stale results, clear denied results, and refresh all mounted matching views after attachment.
- Provider datasets/outbox are scoped by identity; identity changes remount the provider and reject late writes. SQLite caches use scoped keys, with a new database identity on account changes.

## Validation

| Check | Evidence and result |
|---|---|
| Full unit suite | Test-only BETTER_AUTH_SECRET; Vitest with maxWorkers=1. 89 suites passed; 287 tests passed; one existing suite/test skipped. |
| Mobile browser | scripts/test-pwa-matching.ts passes with API fixtures at 390x844: card badge navigation, record preview, denied modal clearance, cached and uncached offline paths, reconnect, contact-linked inquiry payload including bedroomsMin. |
| Large fixture | 501 properties x 101 inquiries, 50,601 pairs: every summary count is complete and previews are capped at two. One local run took 258.7 ms and produced 81,787 bytes for the complete fixture summary; two mocked database reads. This excludes database/network time and is not a production latency benchmark. |
| Targeted ESLint | New matching modules, scoped endpoints, CRM helpers, hook and components pass. Existing /api/agent/summary has an unrelated pre-existing no-explicit-any diagnostic when linting the entire agent directory. |
| Prisma schema | pnpm exec prisma validate passed. No migration was created or applied. |
| Typecheck | No diagnostics in changed implementation files in the final source check. Whole-repo typecheck remains blocked by baseline pipeline, sale-transfer, alert and rental-closing diagnostics. |
| Production build | Attempt failed with ENOSPC while writing webpack cache. A parallel typecheck also hit machine memory exhaustion earlier. These are not passing build evidence. Generated cache packs were cleared; the interrupted source write was recovered from the baseline and recorded edits, then source-checked. |
| Diff hygiene | git diff --check passed. |
| Independent review | Seven actionable findings were addressed: identity isolation, phone-based deduplication, create-with-property transaction, desktop strict flag edits, mutation reconciliation, desktop property result truncation and mounted-preview invalidation. Additional strict-attachment regression test passed after the fix. |

Screenshots are local, ignored verification artifacts:
- [Matching results](../../../.superpowers/sdd/2026-10-04-matching-pwa-parity/browser/matching-results.png)
- [Automatic property preview](../../../.superpowers/sdd/2026-10-04-matching-pwa-parity/browser/property-preview.png)
- [Contact-linked inquiry capture](../../../.superpowers/sdd/2026-10-04-matching-pwa-parity/browser/contact-inquiry.png)
- [Cached offline matching](../../../.superpowers/sdd/2026-10-04-matching-pwa-parity/browser/offline-cached.png)

## Deployment and remaining validation

- A successful production build and live authenticated field-agent/management/second-tenant smoke are still required before release. Browser API fixtures and mocked query predicates do not prove deployed tenant isolation or PostgreSQL transaction races.
- Contact creation provenance uses the existing CONTACT_CREATED audit record and is written transactionally. Legacy contacts without creator provenance are visible to field agents only through a visible linked inquiry. Management retains the existing authority; no contact-owner migration was introduced.
- Legacy unscoped browser caches are retained but are not imported into an arbitrary current identity. Synchronize existing pending field captures before rollout of the scoped cache format; ambiguous legacy queues require deliberate reconciliation rather than uploading into another workspace.
- The summary cache is process-local. Invalidation is immediate in that process; another application instance can retain summaries for the 30-second TTL. Do not describe this as distributed real-time invalidation.
- Shared per-agent notification read receipts would require a separate additive schema change. Current UNREAD/READ status is preserved.
- No production data, migrations, dependencies, push, or deployment were changed by this implementation.

## Authorized release follow-up

The user subsequently authorized fixing every typecheck error, pushing, merging and deploying, and explicitly waived another local production build.

- Isolated release branch: `codex/matching-typecheck-release`. Integrated upstream main `96a16ad` through merge `0e5df4b`; unrelated dirty work in other checkouts was preserved.
- Removed the already-disabled pipeline opportunity capture form and its unused state/handler. The existing New inquiry link remains the creation entry point.
- Sale transfers now persist `transferStatus` without overwriting commission accounting `status`.
- Rental closing reuses an existing Prisma transaction, or opens a transaction when supplied the root client.
- Flyer export accepts the width/height rectangle fields it actually consumes. Optional match reasons and touched API response DTOs are typed explicitly.
- Regression tests first reproduced the transfer-field and nested-transaction bugs, then passed after their fixes.
- Full unit suite on the integrated release tree: 91 files passed, one existing file skipped; 295 tests passed, one skipped.
- Full nonincremental typecheck passed after the behavior fixes. Targeted ESLint passed with one existing image-element advisory and no errors.
- No new dependency or migration was introduced. Local production build was not rerun, as requested. Deployment still requires its normal server-side image build and startup checks.
- Push, merge and deployed-runtime confirmation will be recorded separately; the earlier local-only scope and baseline typecheck caveats above describe the original implementation verification.
