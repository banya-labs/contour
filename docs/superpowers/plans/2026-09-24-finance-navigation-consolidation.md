# Finance Navigation Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Finance as a top-level sidebar group and place commissions in Property Sales, landlord statements in Rentals & Leases, and subscription billing in Agency Settings without breaking permissions, deep links, or existing workflows.

**Architecture:** Keep the existing page routes and APIs as compatibility boundaries, but change the user-facing information architecture. Add explicit local tabs/sections to the owning pages, using query parameters for addressable state. The dashboard will show sales/commission KPIs in its existing overview area; it will not become a second commission ledger.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind, lucide-react, Better Auth permission checks, Vitest, Playwright/tsx surface scripts.

**Spec:** This plan is the implementation spec for the requested Finance navigation consolidation; it supplements `AGENTS.md`, `src/components/workspace-sidebar.tsx`, and the existing dashboard page contracts.

## Global Constraints

- Preserve unrelated work already present in the dirty worktree; do not reset, checkout, or stage unrelated files.
- Preserve tenant scoping and server-side authorization for sales, statements, and billing data.
- Do not remove `/dashboard/commissions`, `/dashboard/statements`, or `/dashboard/billing` in the first release; redirect or compatibility-render them so bookmarks and existing links continue to work.
- Billing remains owner/admin-restricted through the existing `org.billing.read` / billing management permissions.
- Use the existing Contour visual language and tab components; do not add a navigation dependency.
- Do not call the product “complete” until desktop, collapsed sidebar, mobile navigation, direct URLs, permission-denied states, and production build/type checks are verified.

## Review Focus

- Direct visits to old Finance URLs must land on the correct new context and preserve a meaningful tab selection.
- A user without finance or billing permissions must not see a newly embedded table or gain access by changing the query string.
- Browser back/forward and refresh must preserve the selected Sales, Statements, or Billing tab.
- Empty, loading, and error states must be scoped to the selected tab rather than blanking the parent page.
- Existing dashboard KPI values must not double-count sales commissions after the ledger is embedded.

## File Map

- Modify `src/components/workspace-sidebar.tsx`: remove the Finance group and update route-to-permission mapping for the new visible destinations.
- Modify `src/components/mobile-bottom-nav.tsx`: remove or reroute any Finance destinations and expose the owning workflows consistently on mobile.
- Modify `src/app/(dashboard)/dashboard/sales/page.tsx`: add Sales/Commissions local navigation and render the existing commission-ledger content in the Commissions view.
- Modify `src/app/(dashboard)/dashboard/leases/page.tsx`: add Leases/Statements local navigation and render landlord statements in the Statements view.
- Modify `src/app/(dashboard)/dashboard/settings/page.tsx`: add a Billing tab and stop treating billing as a separate settings escape hatch.
- Modify `src/app/(dashboard)/dashboard/page.tsx`: place only the agreed sales and commission summary metrics in the overview; link to the relevant Property Sales tab.
- Modify `src/app/(dashboard)/dashboard/commissions/page.tsx`, `statements/page.tsx`, and `billing/page.tsx`: convert legacy entries into compatibility redirects or shared content wrappers, not duplicate implementations.
- Inspect and modify the relevant route/page tests or add focused tests under `src/lib` / `scripts` according to existing repository conventions.
- Update `README.md` or user-facing route documentation only if it documents the old Finance navigation.

## Task 1: Establish the new navigation contract and compatibility behavior

**Files:**
- Modify: `src/components/workspace-sidebar.tsx`
- Modify: `src/components/mobile-bottom-nav.tsx`
- Modify: `src/app/(dashboard)/dashboard/commissions/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/statements/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/billing/page.tsx`
- Test: add or extend a focused navigation contract test near the existing billing navigation coverage

**Interfaces:**
- New visible destinations: `/dashboard/sales?tab=commissions`, `/dashboard/leases?tab=statements`, and `/dashboard/settings?tab=billing`.
- Legacy destinations remain valid and redirect to those destinations while preserving authorization behavior.

- [ ] **Step 1: Write failing contract tests** for sidebar labels/links, absence of the Finance group, legacy redirects, and permission mapping.
- [ ] **Step 2: Run the focused tests** and confirm they fail because Finance is still rendered and the legacy pages are still independent.
- [ ] **Step 3: Remove the Finance `NavGroup`** from `workspace-sidebar.tsx`; keep Property Sales and Rentals & Leases under Properties; do not expose billing as a top-level navigation item.
- [ ] **Step 4: Update permission resolution** so `/dashboard/sales` checks the sales/finance read permission already used by the ledger, `/dashboard/leases` checks lease/statement access as appropriate, and `/dashboard/settings` checks organization access. The visible parent route must not weaken child authorization.
- [ ] **Step 5: Update mobile navigation** so it does not contain orphaned Finance links and uses the same owning routes as desktop.
- [ ] **Step 6: Convert legacy pages** to server-side redirects or compatibility wrappers: commissions → sales commissions, statements → leases statements, billing → settings billing. Preserve query parameters only when safe and never bypass auth.
- [ ] **Step 7: Run the focused navigation tests** and confirm they pass.
- [ ] **Step 8: Commit** with `refactor(navigation): consolidate finance destinations into workflows`.

## Task 2: Embed the commissions ledger in Property Sales

**Files:**
- Modify: `src/app/(dashboard)/dashboard/sales/page.tsx`
- Inspect/reuse: `src/app/(dashboard)/dashboard/commissions/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Test: focused sales/commission component or route tests

**Interfaces:**
- `sales/page.tsx` owns the page-level tab state through `searchParams.get("tab")` with a default of `sales`.
- Supported values are `sales` and `commissions`; unknown values normalize to `sales`.

- [ ] **Step 1: Extract or isolate the existing commission table** from the legacy commissions page into a reusable component with explicit props for loading, rows, permissions, and actions. Do not duplicate its data-fetching or authorization logic.
- [ ] **Step 2: Add a failing test** proving `/dashboard/sales?tab=commissions` renders the ledger view and `/dashboard/sales` renders the sales register.
- [ ] **Step 3: Add local tabs** with accessible tab semantics, visible active state, keyboard focus, and URL-backed state. The tab label should be `Commissions`, not a second Finance heading.
- [ ] **Step 4: Render the extracted ledger** inside Property Sales only when the user has the existing commission read capability. Show a clear unauthorized state if a user can reach the parent page but not the ledger.
- [ ] **Step 5: Move only commission-related summary cards** into the sales page or dashboard summary: earned, pending, paid/outstanding, and relevant sales volume. Use the existing API values and avoid client-side recomputation that can diverge from the ledger.
- [ ] **Step 6: Add contextual links** from dashboard commission KPI cards to `/dashboard/sales?tab=commissions`.
- [ ] **Step 7: Make the legacy commissions route redirect** and verify no duplicate table implementation remains.
- [ ] **Step 8: Run focused tests plus `pnpm typecheck`** and commit with `feat(sales): embed commissions ledger in property sales`.

## Task 3: Embed landlord statements in Rentals & Leases

**Files:**
- Modify: `src/app/(dashboard)/dashboard/leases/page.tsx`
- Inspect/reuse: `src/app/(dashboard)/dashboard/statements/page.tsx`
- Test: focused leases/statements route or component tests

**Interfaces:**
- `leases/page.tsx` owns `tab=leases` and `tab=statements`.
- Statement generation, approval, download, and human-authorization behavior remain backed by the existing statements API and permission checks.

- [ ] **Step 1: Extract the landlord statement table/actions** into a reusable component or shared section; keep statement-specific fetches and mutations inside that boundary.
- [ ] **Step 2: Add failing tests** for default lease view, statement tab rendering, refresh/back-forward URL persistence, and unauthorized statement access.
- [ ] **Step 3: Add accessible local tabs** labelled `Leases` and `Statements`.
- [ ] **Step 4: Render the statement section** under Rentals & Leases with its existing empty, loading, error, approval, and download states intact.
- [ ] **Step 5: Add contextual links** from lease/property-management action queues to `/dashboard/leases?tab=statements`.
- [ ] **Step 6: Redirect the legacy statements route** to the embedded tab and verify no duplicate statement workflow remains.
- [ ] **Step 7: Run focused tests and `pnpm typecheck`**, then commit with `feat(leases): embed landlord statements in rentals workflow`.

## Task 4: Move subscription billing into Agency Settings

**Files:**
- Modify: `src/app/(dashboard)/dashboard/settings/page.tsx`
- Inspect/reuse: `src/app/(dashboard)/dashboard/billing/page.tsx`
- Modify: existing billing navigation test(s), including `scripts/test-billing-nav.ts` if still used
- Test: focused settings/billing tests

**Interfaces:**
- Settings tabs become `BRANDING`, `ORGANIZATION`, `BILLING`, and `DEVELOPER` where permitted.
- Billing data and actions remain protected by billing permissions; tab visibility and server authorization are separate checks.

- [ ] **Step 1: Add failing tests** for `/dashboard/settings?tab=billing`, unauthorized users, owner/admin visibility, and billing action access.
- [ ] **Step 2: Extract the billing page content** into a reusable `BillingSettingsSection` (or equivalent) so Settings owns the presentation without copying checkout/payment logic.
- [ ] **Step 3: Replace the current billing redirect effect** in Settings with real billing-tab selection and normalization.
- [ ] **Step 4: Add the Billing tab** with clear subscription status, plan, payment actions, receipts, and failure states. Keep sensitive actions visually and permission-wise distinct from general organization settings.
- [ ] **Step 5: Redirect the legacy billing page** to Settings Billing while preserving safe return/context parameters.
- [ ] **Step 6: Run focused billing tests and `pnpm typecheck`**, then commit with `feat(settings): embed subscription billing in agency settings`.

## Task 5: Dashboard, deep-link, and accessibility polish

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: affected shared tab components if needed, preferably `src/components/ui/animate/animated-tabs.tsx`
- Modify: route-level metadata/breadcrumbs if present
- Test: browser/surface scripts and focused accessibility checks

- [ ] **Step 1: Verify dashboard KPI ownership**: sales and commission cards link to Property Sales; rental income, arrears, and statements link to Rentals & Leases; subscription status links to Settings Billing.
- [ ] **Step 2: Verify no dashboard card or copy still implies Finance is a navigable section.**
- [ ] **Step 3: Verify tabs have accessible names, `aria-selected`, keyboard navigation, visible focus, and sufficient contrast in active/inactive states.
- [ ] **Step 4: Verify desktop expanded/collapsed sidebar, mobile bottom navigation, and direct URLs for all three embedded sections.
- [ ] **Step 5: Verify browser refresh and back/forward behavior for each tab.
- [ ] **Step 6: Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and the relevant dashboard/billing surface scripts. Record pre-existing failures separately from regressions.
- [ ] **Step 7: Commit with `test(navigation): verify consolidated finance workflows`.

## Task 6: Documentation and release handoff

**Files:**
- Modify: `README.md` or route documentation only where old Finance navigation is documented
- Create: optional short changelog/release note if this repository maintains one

- [ ] **Step 1: Update route documentation** to describe the new owning locations and legacy redirects.
- [ ] **Step 2: Add a release note** stating that Finance is no longer a sidebar group and listing the three new locations.
- [ ] **Step 3: Review `git diff`** to ensure only this restructuring is included; do not stage the existing unrelated dirty-worktree changes.
- [ ] **Step 4: Run the final verification commands** and capture exact results.
- [ ] **Step 5: Prepare a handoff** with changed files, route compatibility behavior, test results, known baseline failures, and any follow-up cleanup that should wait for a later release.

## Self-Review Checklist

- [ ] All three requested relocations are represented in the sidebar, desktop pages, mobile navigation, dashboard links, permissions, and legacy routes.
- [ ] No duplicated commission, statement, or billing implementation remains unintentionally.
- [ ] No database migration is required for this navigation-only change.
- [ ] The current dirty worktree changes are preserved and excluded from commits for this feature.
- [ ] Existing memory guidance was respected: real server-side authorization remains authoritative, and route/UI consolidation does not weaken tenant boundaries.
