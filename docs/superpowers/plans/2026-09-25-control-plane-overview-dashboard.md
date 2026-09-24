# Control Plane Overview Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the placeholder `/admin` overview with a real, filtered platform-operations dashboard backed by persisted agency, user, property, inquiry, subscription, payment, and transaction data.

**Architecture:** Add a server-authorized overview analytics route with one typed response envelope and a small pure metrics layer for date ranges, currency grouping, and recurring-revenue calculations. Replace the current static overview page with a client dashboard that fetches that envelope, renders KPI cards, lightweight accessible SVG/CSS charts, subscription mix, and team performance.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, Zod, Vitest, Tailwind CSS, existing control-plane authorization and admin billing helpers.

**Spec:** `docs/superpowers/specs/2026-09-25-control-plane-overview-dashboard-design.md`

## Global Constraints

- Use the existing platform-admin authorization boundary for every overview request.
- Keep currencies separate; never invent an exchange rate.
- MRR is active paid catalog pricing; collected revenue is successful payment records.
- Custom date ranges are inclusive, database-safe, and capped at 366 days.
- Do not expose gateway secrets, full payment tokens, or unrelated tenant PII.
- Do not add a chart dependency; use existing primitives or accessible SVG/CSS.

## Review Focus

- A custom range crossing a daylight-saving boundary must produce deterministic database dates; test UTC normalization in the range helper.
- No organizations, payments, tiers, or team activity must return zero-valued sections rather than divide-by-zero or missing fields.
- Annual subscription pricing must contribute one twelfth of its annual amount to MRR; test monthly and annual plans separately.
- Mixed ZMW/USD revenue must remain separated in every KPI, tier row, and chart point.
- Unauthorized, malformed, oversized, and reversed date requests must fail without querying broad data.

---

### Task 1: Date-range and metric calculation primitives

**Files:**
- Create: `src/lib/admin-control-plane/overview-metrics.ts`
- Test: `src/lib/admin-control-plane/overview-metrics.test.ts`

**Interfaces:**
- `parseOverviewRange(input: { range?: string; from?: string; to?: string }, now?: Date): { key: string; from: Date; to: Date; timezone: "UTC" }`
- `monthlyEquivalent(amount: number, billingCycle: "MONTHLY" | "ANNUAL"): number`
- `groupCurrency(values: Array<{ currency: string; amount: number }>): Record<string, number>`
- `buildSubscriptionRevenue(input): { mrrByCurrency; arrByCurrency }`

- [ ] Write failing tests for each supported range, invalid custom dates, reversed dates, 366-day cap, annual-to-monthly conversion, currency grouping, and empty input.
- [ ] Run `pnpm vitest run src/lib/admin-control-plane/overview-metrics.test.ts` and confirm the expected failures.
- [ ] Implement the pure helpers with UTC boundaries, finite-number guards, and stable currency keys.
- [ ] Re-run the focused test until green.

### Task 2: Admin overview analytics service

**Files:**
- Create: `src/lib/admin-control-plane/overview.ts`
- Test: `src/lib/admin-control-plane/overview.test.ts`

**Interfaces:**
- `getAdminOverview(input: { from: Date; to: Date }): Promise<AdminOverviewResponse>`
- Export `AdminOverviewResponse` and its nested types from `src/lib/admin-control-plane/overview.ts`.

- [ ] Inspect the existing Prisma fields for Organization, Member, User, Property, Inquiry, Transaction, Payment, and subscription tier catalog models before writing queries.
- [ ] Write service tests covering empty data, active/trial/past-due subscription counts, tier grouping, successful payments only, and team ranking.
- [ ] Run the focused tests and verify they fail for missing service behavior.
- [ ] Implement bounded parallel Prisma aggregates and selected-field reads; derive tier pricing from the existing catalog and preserve currency boundaries.
- [ ] Add daily series buckets for the selected date range and return all response sections even when empty.
- [ ] Re-run focused tests and typecheck the service.

### Task 3: Overview API route and contract tests

**Files:**
- Create: `src/app/api/admin/overview/route.ts`
- Test: `src/app/api/admin/overview/route.test.ts`

**Interfaces:**
- `GET /api/admin/overview?range=today|7d|30d|90d|custom&from=YYYY-MM-DD&to=YYYY-MM-DD`

- [ ] Write route tests for unauthorized access, default range, valid custom range, malformed dates, reversed dates, and oversized ranges.
- [ ] Run the route tests and confirm the expected failures.
- [ ] Implement the route using the existing admin actor/authorization helper, Zod-style input validation, `parseOverviewRange`, and `getAdminOverview`.
- [ ] Return `400` for invalid input, `401/403` according to the existing admin boundary, and a stable JSON response for success.
- [ ] Re-run the focused route tests.

### Task 4: Dashboard presentation components

**Files:**
- Create: `src/components/admin/overview/overview-kpi-grid.tsx`
- Create: `src/components/admin/overview/overview-charts.tsx`
- Create: `src/components/admin/overview/subscription-mix.tsx`
- Create: `src/components/admin/overview/team-performance.tsx`
- Create: `src/components/admin/overview/overview-range-control.tsx`
- Test: `src/components/admin/overview/overview-formatters.test.ts`

- [ ] Add pure formatter tests for currency display, percentages, compact counts, and empty-state labels.
- [ ] Implement typed presentational components with Inter-compatible existing tokens, responsive grids, loading skeletons, error states, and accessible chart summaries.
- [ ] Render chart data through inline SVG/CSS so no new dependency is required; include a text/table fallback for each chart.
- [ ] Keep currency totals visibly separate and label MRR, ARR, and collected revenue distinctly.
- [ ] Run formatter tests and typecheck.

### Task 5: Replace the static admin overview

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] Write the page-level data-state test or component contract test for default loading, successful data, error, and zero-data states.
- [ ] Replace static “Not connected” cards with the dashboard shell and default 30-day request.
- [ ] Add range changes that update the URL query and refetch without losing the current control-plane navigation.
- [ ] Compose KPI grid, trend charts, subscription mix, team board, and the existing safety boundary.
- [ ] Verify desktop and mobile layout in the browser at `/admin`, including every range option and an empty response.

### Task 6: Full verification and release handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-09-25-control-plane-overview-dashboard-design.md` only if implementation decisions materially change the approved contract.

- [ ] Run `pnpm exec tsc --noEmit`.
- [ ] Run focused overview tests and then the full `pnpm test` suite.
- [ ] Run `pnpm build`.
- [ ] Run `git diff --check` and inspect the final diff for secret/PII leakage and unbounded queries.
- [ ] Verify `/api/admin/overview` and `/admin` in the browser with desktop and mobile viewport checks.
- [ ] Report any baseline failures separately from dashboard-specific failures.
