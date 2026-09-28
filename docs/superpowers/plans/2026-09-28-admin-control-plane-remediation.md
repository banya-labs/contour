# Admin Control Plane Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore reliable, tenant-safe `/admin` operation, eliminate the production rendering failure, and prove the control plane through authenticated functional and visual QA.

**Architecture:** Preserve the existing admin route structure and API boundaries. First isolate the shared React/runtime failure and the agency-detail data failure with reproducible diagnostics; then apply the smallest fixes, add regression coverage, correct navigation contracts, and verify the deployed surface with Playwright at desktop and mobile widths.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma-backed admin APIs, Vitest, Playwright/browser bridge, production Dokploy deployment.

**Spec:** `AGENTS.md` admin control-plane requirements and the findings from the 2026-09-28 authenticated browser audit.

## Global Constraints

- Do not perform destructive admin actions, mutations, deletion, impersonation, key revocation, billing changes, or migrations during QA.
- Preserve tenant isolation and platform-role authorization on every admin API and page.
- Do not hide the React error with a generic fallback; identify and fix the rendering/data root cause.
- Use committed Prisma migrations only; never use `prisma db push` for production verification.
- Separate source/test evidence from deployed browser evidence; a successful deploy is not proof of readiness.
- Keep unrelated working-tree changes untouched.

## Review Focus

- Shared production React error `#418`: reproduce on `/admin`, `/admin/agencies`, `/admin/subscriptions`, and `/admin/mcp`; add a regression check that console errors are absent.
- Agency-detail loading/error path: test success, API failure, malformed JSON, and activity failure independently; the page must leave loading state with an actionable error.
- Navigation contract: `/admin/settings` must either render settings or be renamed/repointed to the actual staff route; test every visible nav link against its expected destination.
- Privileged controls: ensure read-only QA never triggers revoke, delete, recovery, impersonation, subscription, or staff mutations; keep authorization assertions server-side.
- Responsive layout: verify sidebar/menu, cards, tables, filters, and error states at 390x844 and desktop widths with screenshots.

### Task 1: Establish a reproducible diagnostic baseline

**Files:**
- Inspect: `src/app/admin/**`, `src/app/api/admin/**`, `src/components/admin/**`
- Test/diagnostic: existing admin tests under `src/**/*.test.ts`, `tests/**`, and a temporary local Playwright diagnostic kept out of production code

**Interfaces:**
- Consumes: authenticated admin session and the deployed routes already identified.
- Produces: a written evidence table mapping route, API response, console error, visible state, and suspected boundary.

- [ ] **Step 1: Reproduce each reported failure locally or against the current deployment.** Capture the exact route, response status/body shape for its admin APIs, console stack, and whether the failure occurs before or after hydration.
- [ ] **Step 2: Compare a working admin page with the failing agency detail page.** Trace params, client/server boundaries, fetch lifecycle, and shared layout components; do not change code yet.
- [ ] **Step 3: Check recent commits and branch/deployment ancestry.** Identify whether the deployed bundle contains the current agency-detail implementation and whether the React error is stale deployment output or current source behavior.
- [ ] **Step 4: Record the single leading hypothesis for each failure and the minimum test that would falsify it.** Do not combine the hydration and agency API hypotheses without evidence.
- [ ] **Step 5: Commit the diagnostic test harness only if it is reusable; otherwise preserve the evidence in this plan/issue notes.**

### Task 2: Fix and regression-test the shared React/rendering failure

**Files:**
- Modify: the exact shared component or page identified by Task 1; likely candidates include `src/components/admin/control-plane-shell.tsx`, `src/components/admin/admin-period-select.tsx`, and admin pages using browser-only values.
- Test: add focused Vitest coverage where the defect is pure logic; add authenticated Playwright coverage for hydration/console behavior.

**Interfaces:**
- Consumes: Task 1’s confirmed failure boundary.
- Produces: all tested admin routes render without React hydration/runtime errors and retain their visible content after data resolution.

- [ ] **Step 1: Add the smallest failing regression test for the confirmed mismatch.** Assert the problematic server/client output or browser-visible error condition.
- [ ] **Step 2: Run the focused test and confirm it fails for the expected reason.**
- [ ] **Step 3: Implement one root-cause fix.** Keep dynamic formatting, browser-only state, and responsive navigation behind stable client boundaries as required by the evidence; do not add broad suppressions.
- [ ] **Step 4: Run focused tests plus `pnpm typecheck` and `pnpm lint`.**
- [ ] **Step 5: Verify `/admin`, `/admin/agencies`, `/admin/subscriptions`, `/admin/staff`, `/admin/audit`, and `/admin/mcp` in an authenticated browser with console errors collected.**
- [ ] **Step 6: Commit:** `fix(admin): resolve control plane render mismatch`.

### Task 3: Make agency detail loading robust and tenant-safe

**Files:**
- Modify: `src/app/admin/agencies/[id]/page.tsx`
- Inspect/modify only if required: `src/app/api/admin/agencies/[id]/route.ts`, `src/app/api/admin/agencies/[id]/activity/route.ts`
- Test: add focused route/component tests under the existing Vitest conventions; add browser coverage for both agencies.

**Interfaces:**
- Consumes: `GET /api/admin/agencies/[id]` and `GET /api/admin/agencies/[id]/activity`.
- Produces: a typed, deterministic detail state: loading, loaded, or actionable error; no uncaught rejected promise and no indefinite blank page.

- [ ] **Step 1: Add failing tests for the following cases:** valid agency with activity; valid agency with no activity; agency API 404/403; activity API failure while agency succeeds; invalid JSON/network failure.
- [ ] **Step 2: Run the focused tests and confirm the current implementation fails on the error cases.**
- [ ] **Step 3: Refactor the load boundary to validate both responses before reading JSON, isolate activity failure from agency failure, and expose retry/back navigation without leaking tenant data.** Preserve server authorization and organization scoping.
- [ ] **Step 4: Add a stable loading indicator and an error message that names the failed operation without exposing raw server details.**
- [ ] **Step 5: Run focused tests, typecheck, and lint.**
- [ ] **Step 6: Browser-test both agency links and verify the rendered agency name, subscription, owner, workspace, people, and activity/empty state.**
- [ ] **Step 7: Commit:** `fix(admin): harden agency detail loading`.

### Task 4: Correct admin navigation and module contracts

**Files:**
- Modify: `src/components/admin/control-plane-tabs.tsx`, `src/components/admin/control-plane-shell.tsx`, and the relevant admin route/page files.
- Test: navigation contract test plus browser smoke coverage.

**Interfaces:**
- Consumes: the actual route inventory under `src/app/admin/**` and role permissions in `src/lib/platform-authorization*`.
- Produces: every visible navigation item has a real, intentional destination; unavailable modules are not presented as clickable.

- [ ] **Step 1: Inventory all visible nav links and module cards against actual routes.** Decide whether “Settings” should be a settings page or be renamed “Users” and point to `/admin/staff`.
- [ ] **Step 2: Add a failing route-contract test for the mismatch and the non-clickable Audit trail card.**
- [ ] **Step 3: Implement the smallest copy/href correction and make Audit trail clickable only if `/admin/audit` is intended to be public to the current platform role.**
- [ ] **Step 4: Verify active-state styling, back-to-workspace behavior, and mobile menu open/close cycle.**
- [ ] **Step 5: Commit:** `fix(admin): align control plane navigation`.

### Task 5: Add complete authenticated Playwright visual and functional coverage

**Files:**
- Create/modify: the repository’s established browser-test location, preferably `tests/admin-control-plane.spec.ts` if no existing convention supersedes it.
- Artifacts: save screenshots under the existing test artifact directory, not source control unless the project convention requires them.

**Interfaces:**
- Consumes: Tasks 2-4’s stable routes and controls.
- Produces: repeatable evidence for desktop and mobile admin readiness.

- [ ] **Step 1: Define the QA inventory:** overview metrics/period selector, all nav links, agency search/filter, both agency details, subscription read-only view, staff/audit/MCP read-only views, loading/error states, and mobile navigation.
- [ ] **Step 2: Add functional tests using normal browser input:** change reporting period and verify the selected state; search agencies; open both agencies; navigate every visible module; return to overview.
- [ ] **Step 3: Add negative tests:** unknown agency ID, API failure fixture where supported, empty audit state, and narrow viewport menu cycle.
- [ ] **Step 4: Add visual assertions/screenshots at 1920x917 and 390x844.** Inspect clipping, overflow, contrast, loading stability, error presentation, card/table density, and sidebar behavior.
- [ ] **Step 5: Fail the suite on unexpected console errors and capture network failures for `/api/admin/**`.**
- [ ] **Step 6: Run the suite against the deployed authenticated surface and the local build where environment access permits.**
- [ ] **Step 7: Commit:** `test(admin): cover control plane browser workflows`.

### Task 6: Release gate and deployment verification

**Files:**
- Inspect: `.github/workflows/**`, `package.json`, deployment configuration, and `docs/**` release notes as applicable.

- [ ] **Step 1: Run focused tests, full Vitest, `pnpm typecheck`, `pnpm lint`, and `pnpm build` separately; record failures by category.**
- [ ] **Step 2: Verify migration status/readiness without mutating production.**
- [ ] **Step 3: Deploy through the established Dokploy workflow only after code checks pass.**
- [ ] **Step 4: Wait for deployment status `Done`, then rerun the authenticated Playwright suite against production.**
- [ ] **Step 5: Confirm no React console errors, agency detail success, navigation correctness, desktop/mobile fit, and no accidental mutation requests.**
- [ ] **Step 6: Update release/validation notes with exact commit, deployment status, route results, and remaining limitations.**
- [ ] **Step 7: Commit any documentation-only changes:** `docs(admin): record control plane validation`.

## Completion Criteria

- No React hydration/runtime errors on the tested admin routes.
- Both agency details render successfully and handle API failure states without application-error fallback.
- Navigation labels and destinations match, including mobile navigation.
- Read-only browser coverage passes at desktop and 390x844 viewports.
- Typecheck, lint, focused tests, full tests, and build results are reported separately.
- Production is only called ready after deployment is `Done` and the authenticated browser suite passes.
