# Contour Billing and Trial Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make agency trials, paid activation, expiry, and Lenco payment verification explicit, testable, and safe to release.

**Architecture:** Keep tenant-derived authorization in `createApiHandler` and middleware. Introduce one pure billing state model used by UI/API guards, persist lifecycle transitions where operationally useful, and retain `Payment` plus idempotent `WebhookEvent` as the settlement ledger until durable subscription/invoice models are added. Real Lenco settlement remains a separate environment-gated verification step.

**Tech Stack:** Next.js App Router, TypeScript strict mode, Prisma/PostgreSQL, Vitest, Lenco REST API/webhooks.

**Spec:** Existing billing behavior in `src/lib/billing-access.ts`, onboarding, middleware, checkout, and Lenco webhook routes; no separate product spec currently exists.

## Global Constraints

- Trial duration is 14 days from the persisted organization trial start/creation timestamp.
- Trial access must never depend on client state or display-only tier labels.
- Tenant organization context is always derived server-side.
- Lenco accepts only ZMW/USD in checkout; ZAR must be rejected, not converted silently.
- Payment and webhook mutations require idempotency, signature verification, and audit evidence.
- No production migration, production payment, merge, or push without explicit authorization.

## Review Focus

- A newly-created organization must not be treated as paid merely because Prisma defaults `subscriptionStatus` to `active`.
- Completing onboarding twice must not restart or extend a trial.
- Exactly-at-expiry access must be denied and billing access must remain available.
- A successful webhook must activate the purchased tier once; duplicate and late failure events must be harmless.
- Local simulation must never be mistaken for real Lenco settlement evidence.

## Phases

### Phase 1 — Trial contract and test truth (current)

Normalize trial access into a pure, tested billing contract; fix the stale gateway verification script to match the implemented Lenco signature contract; add tests for trial boundary behavior and onboarding idempotence where practical.

### Phase 2 — Persisted lifecycle and expiry operations

Add explicit trial start/state fields or a lifecycle model through a reviewed Prisma migration, persist `TRIAL_EXPIRED` transitions through a safe scheduled/admin operation, and add operational visibility for agencies requiring payment.

### Phase 3 — Payment lifecycle hardening

Separate checkout initiation from settlement activation, add durable subscription/invoice/entitlement records, define renewal/cancellation/past-due behavior, and reconcile provider status against the ledger.

### Phase 4 — Provider verification

Run an authenticated Lenco sandbox/live-safe checkout with a disposable test organization, verify callback delivery, signature, provider re-query, duplicate delivery, failed payment, and successful settlement. Record evidence without storing credentials or PII.

### Phase 5 — Release gate

Run focused tests, typecheck, build, migration validation, readiness checks, browser billing workflow, and production reconciliation checks. Report baseline failures separately and do not claim commercial readiness until `/api/ready` and real payment evidence pass.

---

### Task 1: Make trial access semantics explicit

**Files:**
- Create: `src/lib/billing-access.test.ts`
- Modify: `src/lib/billing-access.ts`
- Modify: `src/lib/api-handler.ts`
- Modify: `src/middleware.ts`

**Interfaces:**
- Produces a pure `getBillingAccessState` contract consumed by request guards.
- Existing `getTrialEnd`, `isTrialActive`, and `hasPaidSubscription` remain compatible for callers.

- [x] Write failing tests for paid, active trial, exact expiry, expired trial, and uninitialized-trial behavior.
- [x] Run the focused test and confirm the missing state function fails under the current implementation.
- [x] Implement the smallest pure state function and use it consistently in guards.
- [x] Run the focused billing tests and webhook tests; full-suite verification remains a release-gate task.
- [ ] Commit with `fix(billing): make trial access state explicit`.

### Task 2: Align Lenco gateway verification

**Files:**
- Modify: `scripts/test-lenco-gateway.ts`
- Modify: `src/lib/lenco.test.ts`

**Interfaces:**
- Tests use the production verifier contract: SHA-256-derived API-token key plus HMAC-SHA512 body signature.
- Dev simulation remains explicitly labeled and is not provider evidence.

- [x] Add/adjust coverage for the production signature contract and negative cases.
- [x] Run the gateway test and capture the stale-contract failure.
- [x] Update the script’s environment setup and signature generation to match production code.
- [x] Run the gateway script and focused Lenco tests.
- [ ] Commit with `test(billing): align lenco gateway verification`.

### Task 3: Prove onboarding trial initialization

**Files:**
- Create or modify: `src/app/api/onboarding/profile/route.test.ts`
- Modify: `src/app/api/onboarding/profile/route.ts`

**Interfaces:**
- First completed profile starts one 14-day trial on the persisted organization.
- Repeated profile completion preserves the original trial and paid state.

- [x] Add route tests for first completion, repeat completion, and paid organization protection.
- [x] Run them against the current route and confirm all three lifecycle behaviors.
- [x] No production correction was required; the existing guard is idempotent for these cases.
- [x] Run focused onboarding, billing, and webhook tests.
- [ ] Commit with `test(billing): cover onboarding trial initialization`.

### Task 4: Operational expiry and durable billing records

**Files:**
- Modify: `prisma/schema.prisma`
- Create: reviewed Prisma migration under `prisma/migrations/`
- Create/modify: billing lifecycle service and admin/API routes
- Create: focused lifecycle tests

- [x] Define the lifecycle transition as `trialing` plus due `trialEndsAt` to `trial_expired`; paid evidence remains authoritative.
- [x] Add tests for expiry transition and replay safety.
- [x] Implement an explicit conditional transition used by the billing summary path.
- [x] Add an owner-controlled admin bulk expiry operation with an audit event.
- [x] Add durable `Subscription` and `Invoice` records plus calendar-period tests.
- [ ] Wire settlement, renewal, cancellation, and reconciliation behavior to the ledger.

### Task 5: Real Lenco evidence and release gate

**Files:**
- Modify: billing runbook/status documentation
- Modify: CI checks only if evidence shows a safe deterministic gate

- [ ] Verify environment variable presence by name only.
- [ ] Execute a disposable Lenco verification transaction in the authorized environment.
- [ ] Capture reference, provider status, webhook status, and ledger result without secrets/PII.
- [ ] Run typecheck, build, focused tests, readiness, and browser workflow.
- [ ] Publish a bounded readiness report.
