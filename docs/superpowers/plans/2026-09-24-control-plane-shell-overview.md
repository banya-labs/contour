# Control Plane Shell and Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter Control Plane shell with an authenticated responsive admin application and a real server-backed overview dashboard.

**Architecture:** Keep Better Auth and existing platform authorization as the identity boundary. Add a shared `/admin` layout for navigation and page chrome, a dedicated access-denied page for authenticated non-staff users, and a bounded platform metrics API consumed by the overview page. All aggregates remain server-side and currency-aware; no tenant rows are sent to the browser unless a later agency-detail route explicitly scopes them.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind-style Contour tokens, Prisma, Better Auth, Zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-control-plane-operations-design.md`

## Global Constraints

- Every `/admin` route and API route must enforce platform access server-side.
- Authenticated users without active platform staff access must see no platform data.
- Aggregate results must be bounded, currency-aware, and free of unbounded tenant rows.
- Privileged capabilities remain role-gated through `canPlatformRole`.
- Existing Contour editorial tokens and components must be reused; do not introduce a second visual language.
- Do not add a dependency for charts; use existing primitives or CSS/SVG rendering.
- Do not modify agency dashboard authorization or tenant data models outside the metrics requirements.
- Run typecheck, focused tests, full tests, build, and lint checks separately.

## Review Focus

- Unauthenticated `/admin` request: redirects to sign-in with a return path and never renders platform data.
- Authenticated non-staff request: renders a clear access-denied state and does not call platform metrics APIs.
- Suspended platform staff: cannot load the shell or overview data.
- Invalid or oversized analytics period: falls back safely or returns a bounded validation error without an expensive query.
- Mixed ZMW/ZAR/USD totals: remain grouped by currency and are never silently added together.

---

### Task 1: Lock down the access-state contract

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/lib/control-plane.ts`
- Create: `src/app/admin/access-denied/page.tsx`
- Test: `src/lib/control-plane.test.ts`

**Interfaces:**
- `hasControlPlaneAccess` remains the bootstrap/config check.
- `hasPersistedControlPlaneAccess` remains the database-backed staff check.
- The middleware must preserve `returnTo=/admin` when redirecting an unauthenticated request.

- [ ] **Step 1: Write tests for the access contract**

Add tests asserting that normalized owner emails are accepted, unknown emails are rejected, suspended persisted staff are rejected, and active persisted staff are accepted.

- [ ] **Step 2: Run the focused test**

Run:

```powershell
$env:BETTER_AUTH_SECRET='local-test-secret-012345678901234567890123'; pnpm exec vitest run src/lib/control-plane.test.ts
```

Expected: existing tests pass and the new cases fail only if the contract is not yet covered.

- [ ] **Step 3: Implement access-denied presentation and middleware redirects**

Ensure unauthenticated `/admin` requests redirect to `/sign-in?returnTo=/admin`, while authenticated non-staff users reach `/admin/access-denied`. Keep the page free of organization/platform data and include a return-to-workspace link and sign-out action.

- [ ] **Step 4: Run typecheck and focused tests**

Run the focused test command and `pnpm typecheck`. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/middleware.ts src/lib/control-plane.ts src/app/admin/access-denied/page.tsx src/lib/control-plane.test.ts
git commit -m "feat(admin): add explicit control plane access states"
```

### Task 2: Build the shared responsive admin shell

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/components/admin/control-plane-shell.tsx`
- Create: `src/components/admin/control-plane-sidebar.tsx`
- Modify: `src/app/admin/page.tsx`
- Test: `src/components/admin/control-plane-shell.test.tsx` or route-level test matching repository conventions

**Interfaces:**
- Shell consumes the current platform actor returned by the server boundary and a route-aware navigation definition.
- Navigation entries declare `href`, label, icon, and required platform permission.
- The shell renders children only after the server access check succeeds.

- [ ] **Step 1: Define the navigation model and failing rendering tests**

Cover that OWNER sees Overview, Agencies, People, Subscriptions, Offers, Support access, Analytics, Audit, and Settings; a READ_ONLY operator does not see mutation-only destinations; and the mobile menu exposes the same authorized routes.

- [ ] **Step 2: Implement the server layout access boundary**

Load the session and platform actor in `src/app/admin/layout.tsx`. Redirect unauthenticated users to sign-in and render `access-denied` for authenticated users without active staff access. Pass only safe actor identity/role metadata to the client shell.

- [ ] **Step 3: Implement desktop sidebar and mobile drawer**

Use Contour borders, editorial background, serif headings, mono labels, Contour red for active/privileged emphasis, and accessible buttons/labels. Include current operator, role, sign-out, return-to-workspace, active-route state, and a mobile drawer.

- [ ] **Step 4: Move the overview page into the shell**

Remove the starter module-card shell from `src/app/admin/page.tsx`; make it the Overview page with page title, breadcrumbs, loading/error/empty states, and a real metrics section supplied by Task 3.

- [ ] **Step 5: Run focused tests, typecheck, and mobile-oriented class inspection**

Run the shell test, `pnpm typecheck`, and inspect the rendered class structure at the existing PWA width convention. Expected: no horizontal overflow from the shell.

- [ ] **Step 6: Commit**

```powershell
git add src/app/admin/layout.tsx src/components/admin/control-plane-shell.tsx src/components/admin/control-plane-sidebar.tsx src/app/admin/page.tsx src/components/admin/control-plane-shell.test.tsx
git commit -m "feat(admin): add responsive control plane shell"
```

### Task 3: Add the bounded platform metrics API

**Files:**
- Create: `src/lib/platform-metrics.ts`
- Create: `src/lib/platform-metrics.test.ts`
- Create: `src/app/api/admin/metrics/route.ts`
- Modify: `src/lib/platform-authorization.ts` only if a missing read capability is required

**Interfaces:**
- `PlatformMetricsPeriod = "today" | "week" | "month" | "quarter" | "year" | "all"`.
- `getPlatformMetrics(period: PlatformMetricsPeriod, now?: Date): Promise<PlatformMetrics>`.
- `PlatformMetrics` contains counts plus currency-keyed aggregates, subscription distribution, bounded trends, and recent audit events.

- [ ] **Step 1: Write failing unit tests for period bounds and currency grouping**

Test Monday week boundaries, month/quarter/year starts, all-time behavior, invalid period rejection, and separate ZMW/ZAR/USD aggregation.

- [ ] **Step 2: Run the metrics unit test**

Run:

```powershell
$env:BETTER_AUTH_SECRET='local-test-secret-012345678901234567890123'; pnpm exec vitest run src/lib/platform-metrics.test.ts
```

Expected: new tests fail before the implementation exists.

- [ ] **Step 3: Implement bounded Prisma aggregates**

Query counts and grouped totals with organization scope at the platform layer. Use `take` limits for trend points and recent audit events. Group money by the stored currency and return explicit zero values for known currencies where appropriate. Do not add exchange-rate conversion.

- [ ] **Step 4: Implement the protected API route**

Validate `period` with Zod, require `platform.read`, call `getPlatformMetrics`, and return structured errors. Reject or normalize unknown periods without running an unbounded query.

- [ ] **Step 5: Run unit tests and typecheck**

Expected: metrics tests and `pnpm typecheck` pass.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/platform-metrics.ts src/lib/platform-metrics.test.ts src/app/api/admin/metrics/route.ts src/lib/platform-authorization.ts
git commit -m "feat(admin): add bounded platform metrics API"
```

### Task 4: Implement the Overview dashboard

**Files:**
- Create: `src/components/admin/platform-overview.tsx`
- Modify: `src/app/admin/page.tsx`
- Create: `src/components/admin/platform-overview.test.tsx` or route-level test matching repository conventions

**Interfaces:**
- Overview consumes `GET /api/admin/metrics?period=<period>`.
- Cards display organization/member/property/transaction counts.
- Money values render as currency-keyed groups, never a combined total across currencies.

- [ ] **Step 1: Write failing tests for period changes and mixed-currency rendering**

Assert that selecting a period requests the matching API value, loading/error states are visible, and ZMW/ZAR/USD totals remain separate.

- [ ] **Step 2: Implement overview data loading**

Add a period selector with Today, This week, This month, This quarter, This year, and All time. Fetch server metrics on change and show a refresh action without duplicating authorization logic in the client.

- [ ] **Step 3: Implement KPI cards and operational panels**

Render KPI cards for organizations, users, properties, property value, transactions, and commission totals. Add subscription mix, account-state distribution, trend panel, and recent audit activity using existing Contour tokens and compact tables/cards.

- [ ] **Step 4: Add empty/error/loading states**

Use clear operator-facing copy and never show fabricated zeros when the API failed. Distinguish “no activity in this period” from “metrics unavailable”.

- [ ] **Step 5: Run tests, lint on changed files, typecheck, and build**

Run:

```powershell
$env:BETTER_AUTH_SECRET='local-test-secret-012345678901234567890123'; pnpm exec vitest run src/lib/platform-metrics.test.ts src/components/admin/platform-overview.test.tsx
pnpm typecheck
pnpm exec eslint -- src/app/admin/layout.tsx src/app/admin/page.tsx src/components/admin src/app/api/admin/metrics/route.ts src/lib/platform-metrics.ts
pnpm build
```

Expected: focused tests, typecheck, changed-file lint, and build pass. Repository-wide lint debt is reported separately.

- [ ] **Step 6: Commit**

```powershell
git add src/components/admin/platform-overview.tsx src/components/admin/platform-overview.test.tsx src/app/admin/page.tsx
git commit -m "feat(admin): add platform overview dashboard"
```

### Task 5: End-to-end verification and handoff

## Current implementation status

- Shipped on `codex/control-plane-shell-overview`: access-state gating, responsive shell, overview metrics, agency directory/detail, bounded audit log, and agency-scoped People with audited member actions.
- Verified: changed-file ESLint, TypeScript typecheck, clean working tree, and unauthenticated `/admin` redirect to `/sign-in?redirect_url=%2Fadmin`.
- Pending: authenticated browser verification with a real staff session, production readiness checks, and merge/push approval.

**Files:**
- Modify: `docs/CONTROL_PLANE_SPEC.md` or the current progress document with implemented routes and verification evidence.
- Create/modify: the existing browser smoke-test script if one exists for admin routes.

- [ ] **Step 1: Run all tests**

Run `$env:BETTER_AUTH_SECRET='local-test-secret-012345678901234567890123'; pnpm test`. Record passed/skipped/failed counts.

- [ ] **Step 2: Run Prisma and build checks**

Run `pnpm exec prisma validate`, `pnpm exec prisma migrate status`, and `pnpm build`. Do not apply migrations in this task unless a new migration is explicitly reviewed and approved.

- [ ] **Step 3: Run browser smoke checks**

Verify unauthenticated redirect, authenticated denied state, authorized shell, sidebar navigation, period selection, overview loading/error state, and mobile drawer behavior using the repository's browser verification tooling.

- [ ] **Step 4: Review security boundaries**

Confirm every metrics and admin route checks platform authorization server-side, no agency rows leak into aggregate responses, and no secrets or PII appear in logs.

- [ ] **Step 5: Commit documentation and final verification**

```powershell
git add docs/CONTROL_PLANE_SPEC.md
git commit -m "docs(admin): record control plane shell verification"
```

