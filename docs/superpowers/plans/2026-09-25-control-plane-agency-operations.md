# Control Plane Agency Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give authorized platform staff a secure agency operations workspace for suspension, recoverable deletion, audited impersonation, user management, and filterable complete audit history.

**Architecture:** Extend the existing Control Plane APIs and `PlatformAuditEvent` ledger. Agency operations remain server-authorized by platform role and capability; impersonation uses the existing expiring support-access session and never grants unrestricted platform authority to the impersonated browser. Deletion remains a reversible recovery-window action, not an immediate destructive delete.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest.

**Spec:** User requirement in the conversation: agency operations must support suspend/delete, system impersonation and audited agency actions, user list/last login, and filterable complete logs by user/action.

## Global Constraints

- Every privileged action requires platform capability authorization, a reason, and an immutable `PlatformAuditEvent`.
- Suspension blocks tenant access through existing `accountStatus` enforcement.
- Deletion is scheduled with a recovery window; no hard delete from the first implementation slice.
- Impersonation is time-limited, organization-scoped, visibly labeled, and separately audited.
- Act-as impersonation must bootstrap a real authenticated session in the popup, not merely expose a support snapshot: it must open the agency dashboard and allow the agency-owner PWA surface while denying platform-wide administration and nested impersonation.
- The impersonation session uses an HttpOnly, short-lived, revocable server-side credential; every request re-checks expiry/revocation and retains the original platform actor for audit attribution.
- Audit responses must be paginated and must not expose secrets, tokens, or unnecessary PII.
- Last-login data comes from existing auth audit/session evidence; do not invent client timestamps.

## Review Focus

- A support operator must not obtain act-as mutation capability unless their platform role has `support.impersonate`.
- A suspended agency must be blocked on both page middleware and API handlers.
- A deletion request must not erase data and must be recoverable during the stated window.
- Audit filtering by actor, action, target agency, and date must be server-side and bounded.
- User last-login must distinguish “never recorded” from an old login and must not be inferred from `updatedAt`.

## Phases

### Phase 1 — Agency operations foundation

Add a unified agency detail operations panel and server routes for suspend, recover, schedule deletion, and restore. Reuse existing account-state and recovery logic; add confirmation/reason validation and focused authorization tests.

### Phase 2 — Users and last-login

Add a paginated agency users endpoint and panel showing name, email, role, membership status, joined date, and last login derived from auth audit/session evidence. Add member suspend/reactivate/role actions with platform audit events.

### Phase 3 — System impersonation

Harden and expose the existing support-access flow from the agency page: view-only and act-as modes, explicit duration, confirmation banner, organization scope, end-session control, and mutation audit attribution to both platform actor and target agency. The act-as popup must be a real authenticated dashboard/PWA session, not a client-only support screen.

### Phase 4 — Complete audit explorer

Add a paginated `/admin/audit` API and UI with filters for agency, actor/user, capability/action, target type, date range, and free-text reason. Add indexes only after query shape is fixed and verify no unbounded reads.

### Phase 5 — Browser and release verification

Verify desktop/mobile Control Plane navigation, destructive-dialog behavior, suspension blocking, recovery, impersonation expiry, user actions, audit filtering, typecheck, build, and migration status. Report baseline build/tooling failures separately.

## Task 1: Unified agency operations

**Files:**
- Modify: `src/app/admin/agencies/[id]/page.tsx`
- Modify/create: existing agency state/deletion routes under `src/app/api/admin/agencies/`
- Test: focused API authorization/state tests

- [ ] Write failing tests for authorized suspend, unauthorized suspend, scheduled deletion, and recovery.
- [x] Implement the operations panel with branded confirmation dialogs and reason fields.
- [x] Run focused tests and verify middleware/API suspension behavior.
- [ ] Commit `feat(control-plane): add agency operations controls`.

## Task 2: Agency users and last-login

**Files:**
- Create: `src/app/api/admin/agencies/[id]/members/route.ts` or extend the existing route contract
- Modify: `src/app/admin/agencies/[id]/members/page.tsx`
- Modify: `prisma/schema.prisma` only if existing auth audit evidence cannot support the query
- Tests: member listing/action and last-login tests

- [ ] Pin server-side organization scoping and pagination with failing tests.
- [x] Add last-login projection from auth audit/session records.
- [x] Add audited member actions and UI filters.
- [x] Run focused tests; commit remains deferred until release authorization.

## Task 3: Audited system impersonation

**Files:**
- Modify: `src/app/api/admin/support-access/route.ts`
- Modify: `src/app/admin/agencies/page.tsx` and support workspace UI
- Modify: `src/lib/support-access.ts`
- Tests: capability, expiry, scope, and attribution tests

- [ ] Add failing tests for role denial, expiry, organization scope, and act-as mutation attribution.
- [x] Add agency-detail entry points and visible act-as context.
- [x] Verify ending a session invalidates further access.
- [x] Bootstrap a secure HttpOnly impersonation cookie and redirect the popup into the normal authenticated dashboard context.
- [x] Resolve the target organization server-side for dashboard APIs and the owner PWA; never use a query parameter, localStorage value, or platform credential as tenant authority.
- [x] Show an “Acting as {agency}” banner with expiry and exit action in dashboard and PWA surfaces; exit revokes the session and clears the cookie.
- [x] Deny platform admin routes, nested impersonation, and platform-only operations while impersonating.
- [x] Re-check expiry, revocation, and account status on every request, including suspension and deletion-pending transitions.
- [ ] Commit `feat(control-plane): harden agency impersonation`.

## Task 4: Complete audit explorer

**Files:**
- Create/modify: `src/app/api/admin/audit/route.ts`
- Create/modify: `src/app/admin/audit/page.tsx`
- Modify: `src/components/admin/control-plane-shell.tsx`
- Test: filter, pagination, authorization, and PII-boundary tests

- [ ] Write failing tests for each supported filter and pagination limit.
- [x] Implement bounded server-side query and redacted detail projection.
- [x] Implement UI filter state and pagination controls.
- [ ] Commit `feat(control-plane): add filterable audit explorer`.

## Task 5: Verification and release

- [x] Run focused tests, Prisma validation, typecheck, build, and unauthenticated HTTP boundary verification.
- [ ] Complete an authenticated browser walkthrough of popup, dashboard, PWA, expiry, and exit behavior.
- [x] Verify the current uncommitted files are limited to the requested Control Plane feature and related plan/sidebar work.
- [x] Complete static security review; platform API access is blocked during impersonation.
- [ ] Add deferred route-level authorization tests and complete an authenticated browser walkthrough.
