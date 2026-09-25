# Admin Control Plane Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragmented admin directory/staff/subscription experience with an agency-centric control plane, a complete agency detail page, owner-aware agent visibility, governed agency actions, and tier-level subscription operations and analytics.

**Architecture:** Keep `/admin/agencies` as the agency directory and add `/admin/agencies/[id]` as the canonical agency workspace. The detail page becomes the single place for agency identity, people, subscription, activity, and controlled actions; support-access remains a separate audited session mechanism for impersonation. Replace organization-per-row subscription reporting with a tier/configuration and revenue analytics surface backed by persisted plan configuration, payment aggregation, and a secure Lenco connection-settings boundary.

**Tech Stack:** Next.js App Router, React/TypeScript, Prisma/PostgreSQL, Zod, Better Auth, existing platform RBAC/audit events, Tailwind/editorial design tokens, Vitest, Playwright/browser smoke checks.

**Spec:** This plan is the implementation spec for the requested admin navigation, agency detail, people, access-control, subscription-tier, Lenco, and analytics overhaul.

## Global Constraints

- Preserve tenant isolation: every agency detail query and mutation is scoped by the selected organization ID and platform permission.
- Do not delete inquiry data; remove only its standalone admin navigation/reporting surface unless a future retention decision explicitly authorizes deletion.
- Every privileged mutation requires the existing platform permission model, a reason, and a `PlatformAuditEvent` or equivalent immutable audit record.
- Do not store or return a plaintext Lenco API key; show only configured/masked metadata and test results.
- Keep support access time-bound, explicitly labelled, and auditable; “impersonate” must never silently create an ordinary agency session.
- Preserve existing billing correctness: successful payments are idempotent, webhook state cannot be downgraded by a later failure, and unsupported currencies are rejected rather than converted silently.
- Use bounded pagination for people, payments, activity, and agency lists.
- Do not change the existing `/admin/health`/overview scope in this work.

## Review Focus

- Selecting an agency must show the correct organization, owner, members, subscription, payments, and activity without cross-tenant leakage; cover with API authorization and fixture tests.
- An agency with no owner, no payment, an expired trial, or multiple owners must render an explicit state rather than crash or invent data; cover in detail-view tests.
- Destructive actions must require confirmation, reason, permission, and recovery semantics; cover delete/suspend/reactivate tests.
- Changing a tier price must not rewrite historical payment amounts; cover immutable payment aggregation tests.
- Lenco credentials must never appear in API responses, logs, HTML, or client state; cover redaction and connection-test tests.

### Task 1: Establish the admin information architecture and shared contracts

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: the admin navigation component discovered during implementation (currently the control-plane cards are in `src/app/admin/page.tsx`; do not duplicate navigation in each page)
- Create: `src/lib/admin-control-plane/types.ts`
- Create: `src/lib/admin-control-plane/formatters.ts`
- Test: `src/lib/admin-control-plane/formatters.test.ts`

**Interfaces:**
- `AgencySummary`, `AgencyDetail`, `AgencyMemberSummary`, `AgencySubscriptionSummary`, `AgencyActivityItem`, `SubscriptionTierSummary`, and `LencoConnectionStatus` are the shared client/API contracts.
- The menu exposes `Agencies`, `Subscriptions`, `Staff`, and existing governance/health areas; it removes standalone `People` and `Inquiries` entries.
- Agency rows link to `/admin/agencies/[organizationId]`; subscription rows do not represent agencies.

- [ ] **Step 1: Write formatter tests** for status labels, trial/payment due labels, currency formatting, unknown tier fallback, and missing-owner display.
- [ ] **Step 2: Implement shared types and pure formatters** with explicit nullable fields and no `any`.
- [ ] **Step 3: Update the control-plane navigation** so People is represented inside Agencies and Inquiries is absent from the menu without removing inquiry APIs or data.
- [ ] **Step 4: Run the focused test** with `pnpm vitest run src/lib/admin-control-plane/formatters.test.ts`.
- [ ] **Step 5: Commit** with `refactor(admin): simplify control plane navigation`.

### Task 2: Build the agency detail read model and route

**Files:**
- Create: `src/app/admin/agencies/[id]/page.tsx`
- Create: `src/app/api/admin/agencies/[id]/route.ts`
- Create: `src/app/api/admin/agencies/[id]/activity/route.ts`
- Modify: `src/app/admin/agencies/page.tsx`
- Modify: `src/app/api/admin/agencies/route.ts`
- Test: `src/app/api/admin/agencies/[id]/route.test.ts`

**Interfaces:**
- `GET /api/admin/agencies/[id]` returns organization identity/profile, account state, owner candidates, paginated members, subscription status/trial/due dates, payment summary, bounded counts, and recent platform/agency activity.
- `GET /api/admin/agencies/[id]/activity?page=&pageSize=` returns redacted, timestamped activity records with actor and action metadata.
- Directory rows use links and owner name/email columns; clicking the agency opens the detail route; the detail route links back to `/admin/agencies`.

- [ ] **Step 1: Write authorization and isolation tests** for allowed platform roles, forbidden users, unknown IDs, and organization A never returning organization B data.
- [ ] **Step 2: Add a server read model** that performs bounded Prisma selects for organization, `Member` → `User`, successful/failed `Payment`, `AuditLog`, and `PlatformAuditEvent` data; avoid loading vault contents or raw secrets.
- [ ] **Step 3: Add owner resolution** using the organization membership/role model, returning `Unassigned` or an explicit `Multiple owners` state when applicable.
- [ ] **Step 4: Implement the page** with a header/back link, identity card, owner card, people table, subscription card, payment timeline/summary, activity timeline, and action rail.
- [ ] **Step 5: Update the directory** to remove inquiries, make the agency name clickable, add owner name/email, and keep member/property counts as summary values.
- [ ] **Step 6: Run focused route tests** and manually verify directory → detail → directory navigation.
- [ ] **Step 7: Commit** with `feat(admin): add agency detail workspace`.

### Task 3: Move agency people into the agency detail experience

**Files:**
- Create: `src/components/admin/agency-people-table.tsx`
- Create: `src/app/api/admin/agencies/[id]/members/route.ts`
- Modify: `src/app/admin/agencies/[id]/page.tsx`
- Modify: existing support-access member controls only where reusable, likely `src/components/admin/support-member-controls.tsx`
- Test: `src/app/api/admin/agencies/[id]/members/route.test.ts`

**Interfaces:**
- Member rows expose name, email, role, membership status, phone presence (not sensitive value unless authorized), joined date, and subscription context inherited from the agency.
- Member actions are permission-gated and remain agency-scoped: view, activate/suspend, role update where already supported, and start audited support access.

- [ ] **Step 1: Write tests** for owner identification, member pagination, suspended members, and forbidden mutations.
- [ ] **Step 2: Implement the bounded members endpoint** with Zod query validation and server-derived organization scope.
- [ ] **Step 3: Extract the people table** with responsive columns and explicit empty/error/loading states.
- [ ] **Step 4: Add subscription context** to the agency and member presentation without duplicating subscription rows elsewhere.
- [ ] **Step 5: Verify keyboard navigation, table semantics, and mobile horizontal overflow behavior.**
- [ ] **Step 6: Commit** with `feat(admin): embed agency people oversight`.

### Task 4: Add governed agency actions: edit, suspend/recover, support access, and delete scheduling

**Files:**
- Create: `src/components/admin/agency-action-menu.tsx`
- Create: `src/components/admin/confirm-reason-dialog.tsx`
- Create or modify: `src/app/api/admin/agencies/[id]/profile/route.ts`
- Create or modify: `src/app/api/admin/agencies/[id]/state/route.ts`
- Create or modify: `src/app/api/admin/agencies/[id]/support-access/route.ts`
- Create or modify: `src/app/api/admin/agencies/[id]/deletion/route.ts`
- Modify: `src/app/admin/agencies/[id]/page.tsx`
- Modify: `src/lib/platform-authorization.ts` only if a distinct capability is required
- Tests: corresponding route tests plus `src/components/admin/confirm-reason-dialog.test.tsx`

**Interfaces:**
- Actions: `Edit details`, `Suspend/lock`, `Reactivate`, `View as agency`, `Act as agency` where permitted, and `Schedule deletion`.
- Every mutation accepts a validated `reason`; destructive actions also require typed confirmation and display recovery timing.
- `View as agency` remains read-only; `Act as agency` creates the existing expiring support session and visibly labels the session.

- [ ] **Step 1: Write tests** asserting capability matrix: read-only can view, operations can configure/suspend, support can view/impersonate, owner can delete, and unauthorized roles receive 403.
- [ ] **Step 2: Replace browser `window.prompt` flows** with the branded accessible dialog used for reason, confirmation, pending, success, and error states.
- [ ] **Step 3: Wire edit profile** to organization/profile fields already supported by the product; reject fields that would require a separate product decision.
- [ ] **Step 4: Wire state changes and deletion scheduling** to existing recovery semantics and audit events; do not hard-delete records in this slice.
- [ ] **Step 5: Add action-result refresh** so the detail page reflects the new state without stale subscription/member data.
- [ ] **Step 6: Run route/component tests and a browser smoke path** for edit, view-only support, suspend, recover, and deletion cancellation/recovery display.
- [ ] **Step 7: Commit** with `feat(admin): add audited agency actions`.

### Task 5: Replace the subscription ledger with tier management and analytics

**Files:**
- Create: `prisma/migrations/<timestamp>_subscription_tier_catalog/migration.sql`
- Modify: `prisma/schema.prisma`
- Create: `src/lib/subscriptions/tier-catalog.ts`
- Create: `src/lib/subscriptions/tier-analytics.ts`
- Create: `src/app/api/admin/subscriptions/tiers/route.ts`
- Create: `src/app/api/admin/subscriptions/analytics/route.ts`
- Create: `src/app/api/admin/subscriptions/tiers/[id]/route.ts`
- Rewrite: `src/app/admin/subscriptions/page.tsx`
- Tests: `src/lib/subscriptions/tier-analytics.test.ts`, route tests, and payment immutability tests

**Interfaces:**
- Persisted tier catalog stores stable tier ID/key, display name, description, active state, monthly/annual prices per supported currency, limits/features, version/effective dates, and audit metadata.
- `GET /api/admin/subscriptions/tiers` returns tiers plus subscriber count, active/trial/past-due counts, and gross successful-payment totals by tier/currency/cycle.
- `PATCH /api/admin/subscriptions/tiers/[id]` creates a new effective configuration/version or safely updates future pricing; it never mutates historical `Payment.amount`, `currency`, or `planId`.
- The page contains tier cards/table, subscriber distribution, revenue analytics, and links from a tier to its subscribing agencies; it does not render one agency subscription row per agency.

- [ ] **Step 1: Write analytics tests** for tier counts, zero-payment tiers, mixed currencies, monthly/annual totals, failed/pending exclusion, and historical price immutability.
- [ ] **Step 2: Add the catalog migration/model** with indexes for active tier lookup and payment aggregation; preserve current `STARTER`, `GROWTH`, and `ENTERPRISE` values during backfill.
- [ ] **Step 3: Implement the catalog service** and replace hard-coded checkout price lookup with a compatibility boundary that resolves the active tier price.
- [ ] **Step 4: Implement tier analytics** with bounded date/currency filters and database aggregation, not loading all payments into memory.
- [ ] **Step 5: Implement audited tier editing** with permission `billing.adjust`, reason capture, validation against non-negative prices and supported currencies, and effective-date semantics.
- [ ] **Step 6: Build the subscriptions UI** with tier management, subscriber counts, gross collected, balance/state summary, edit drawer, and empty/partial-data states.
- [ ] **Step 7: Verify checkout, webhook, receipts, and existing billing summary remain compatible** with the catalog migration.
- [ ] **Step 8: Commit** with `feat(admin): add subscription tier management and analytics`.

### Task 6: Add secure Lenco connection management and test flow

**Files:**
- Create: `prisma/migrations/<timestamp>_payment_gateway_credentials/migration.sql` only if the selected secret-storage boundary requires metadata persistence
- Create: `src/lib/payment-gateway-settings.ts`
- Create: `src/app/api/admin/subscriptions/gateway/route.ts`
- Create: `src/app/api/admin/subscriptions/gateway/test/route.ts`
- Modify: `src/app/admin/subscriptions/page.tsx`
- Modify: `src/lib/lenco.ts`
- Modify: `src/lib/platform-authorization.ts` if a distinct `billing.gateway.manage` capability is needed
- Tests: `src/lib/payment-gateway-settings.test.ts`, gateway route tests, and Lenco redaction tests

**Interfaces:**
- `GET` returns provider, environment, API URL, configured boolean, masked key metadata, last test status/time, and webhook configuration status—never the key.
- `PUT` accepts a new key only over an authenticated, permission-gated request and stores it in the approved encrypted secret mechanism; if no secret manager exists, keep the actual secret in deployment environment configuration and persist only metadata, explicitly showing that limitation in the UI.
- `POST /test` performs a non-mutating Lenco authentication/health probe, redacts provider responses, times out, and returns actionable status.

- [ ] **Step 1: Write tests** proving no API response, log, thrown error, or rendered payload contains the raw API key.
- [ ] **Step 2: Confirm the current Lenco API contract from official provider documentation** before implementing the probe; do not treat the existing collection endpoint as a health check.
- [ ] **Step 3: Implement the settings boundary** with secret redaction, environment/sandbox labels, rotation semantics, timeout, and audit events.
- [ ] **Step 4: Add the gateway panel** with configured status, masked key, sandbox/production warning, test button, last result, webhook URL/status, and permission-aware edit state.
- [ ] **Step 5: Verify failed credentials, timeout, provider 4xx/5xx, and successful connection states** in focused tests and the browser.
- [ ] **Step 6: Commit** with `feat(admin): add secure Lenco connection management`.

### Task 7: Remove obsolete screens safely and update documentation

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: any discovered admin sidebar/menu component
- Remove or redirect: standalone `/admin/staff` only if its remaining platform-staff purpose is intentionally moved; otherwise keep it as `Staff`, not People
- Remove/redirect: any standalone `/admin/inquiries` navigation only; preserve inquiry APIs
- Modify: `README.md`
- Modify: `.env.example` if gateway configuration changes
- Create: `docs/admin-control-plane.md`

- [ ] **Step 1: Search for all old menu labels/routes** and classify each reference as navigation, deep link, API, test, or data contract.
- [ ] **Step 2: Remove only obsolete navigation entries** and add redirects for bookmarked routes where useful.
- [ ] **Step 3: Document the new agency-first workflow, permissions, audit requirements, tier pricing semantics, and Lenco secret boundary.**
- [ ] **Step 4: Update environment/setup documentation without printing or committing credentials.**
- [ ] **Step 5: Commit** with `docs(admin): document control plane overhaul`.

### Task 8: Full verification and release gate

**Files:**
- Modify: focused tests/config only when a verification defect is found
- Create: `docs/verification/admin-control-plane-verification.md`

- [ ] **Step 1: Run typecheck** with `pnpm exec tsc --noEmit`.
- [ ] **Step 2: Run focused unit/API tests** for agency detail, actions, tiers, analytics, gateway settings, Lenco, and existing webhook/checkout tests.
- [ ] **Step 3: Run the relevant full test command** and report baseline failures separately from changes.
- [ ] **Step 4: Run production build** with `pnpm build`.
- [ ] **Step 5: Run browser verification** covering control-plane navigation, directory search, owner columns, directory/detail back navigation, all detail tabs/sections, permission-denied states, tier edit, analytics filters, and Lenco test redaction.
- [ ] **Step 6: Verify migration status** with the repository’s approved Prisma migration command; do not use `prisma db push`.
- [ ] **Step 7: Record screenshots/evidence and known limitations**; do not claim production readiness from source tests alone.
- [ ] **Step 8: Commit the verification record** with `test(admin): verify control plane overhaul`.

## Self-review coverage

- Agency directory simplification: Task 1 and Task 2.
- People visible inside agencies, including owner name/email: Task 2 and Task 3.
- Agency detail page with subscription, activity, people, and back navigation: Task 2.
- Removal of Inquiries from menu without data deletion: Task 1 and Task 7.
- Agency edit/delete/impersonate/protection actions: Task 4.
- Subscription state and payment due details on agency pages: Task 2 and Task 3.
- Subscription tiers, agencies-per-tier, editing, amounts, revenue and balance analytics: Task 5.
- Lenco connection test and visually managed credential boundary: Task 6.
- Offers/terms/overview intentionally unchanged: Global Constraints and Task 7.
- Security, tenant isolation, auditability, historical billing integrity, and verification: Global Constraints, Review Focus, Tasks 2–6, and Task 8.
