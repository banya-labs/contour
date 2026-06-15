# Contour Deals Kanban Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a sales-first kanban board for `/deals` with live search, drag/drop stage changes, a detail/edit surface, and a paginated table fallback, while standardizing 10-row pagination across all table views.

**Architecture:** Keep the feature config-driven. Build one shared board shell that consumes workflow config, searchable deal rows, and stage update actions. Render the kanban board by default and switch to a table view through a route flag or query parameter. Reuse the same paginated table shell everywhere so the pagination rule does not drift by page.

**Tech Stack:** Next.js App Router, React client components, Prisma/Neon-backed data, TypeScript, Tailwind CSS, Vitest, existing shared table/search utilities.

---

## What the repo says right now

- `/deals` currently renders a server-driven summary page and `DealsTable`.
- Deal records already include `stage`, `status`, and `dealType`.
- `dealType` already supports `sale`, `rental`, and `installment`.
- Existing table components use a shared searchable table wrapper, but pagination is still ad hoc.
- The deal detail and edit pages already exist, so the board can link into them instead of inventing a separate record model.

## Recommended Implementation Order

1. Add shared pagination/search table infrastructure first so the table fallback and the rest of the app can reuse it.
2. Add the board workflow config and normalized search indexing for sales deals.
3. Replace `/deals` with a default kanban board and a table mode.
4. Roll the 10-row pagination rule into the other existing table views.
5. Verify with unit tests and typecheck.

## Phase 1: Shared Table Pagination Shell

Objective: create one reusable paginated searchable table surface with 10-row pages and numbered controls.

**Files**
- Create: `apps/web/components/paginated-searchable-table.tsx`
- Modify: `apps/web/components/searchable-table.tsx`
- Modify: `apps/web/components/deals-table.tsx`
- Modify: `apps/web/components/clients-table.tsx`
- Modify: `apps/web/components/listings-table.tsx`
- Modify: `apps/web/components/finance-payment-plans-table.tsx`
- Modify: `apps/web/components/work-items-table.tsx` if it exists, or the work-items table implementation if it is inline

- [ ] Add pagination state, `Previous`, page numbers, and `Next` to the shared table shell, with a fixed page size of 10.

```tsx
const PAGE_SIZE = 10;

function getPageCount(rowCount: number) {
  return Math.max(1, Math.ceil(rowCount / PAGE_SIZE));
}
```

- [ ] Update the existing searchable table wrapper so current consumers can opt into the new paginated behavior without losing the existing search UX.
- [ ] Update the deals, clients, listings, and finance/work tables to use the shared pagination shell.
- [ ] Add tests for page-count math, clamping current page, and empty-result behavior.

**Run**
- `npx vitest run`
- `npm run typecheck --workspace @contour/web`

## Phase 2: Sales Workflow Config

Objective: introduce a sales-specific board definition that can also support a rentals board later.

**Files**
- Create: `apps/web/lib/deal-workflows.ts`
- Modify: `apps/web/lib/table-search.ts` if the current indexing helper needs normalization support
- Modify: `apps/web/app/deals/page.tsx`
- Modify: `apps/web/app/deals/[id]/page.tsx`
- Modify: `apps/web/app/deals/[id]/edit/page.tsx`

- [ ] Define a sales workflow config with stage labels, terminal stages, and the `dealType = sale` filter.

```ts
export const salesDealWorkflow = {
  dealType: "sale",
  stages: [
    "New enquiry",
    "Qualified",
    "Site visit",
    "Offer made",
    "Negotiation",
    "Document check",
    "Closing",
    "Won",
    "Lost",
  ],
  terminalStages: ["Won", "Lost"],
} as const;
```

- [ ] Build a normalized search index that includes deal title, listing title, client name, stage, status, and value text.
- [ ] Keep the rentals workflow defined in the same config file but do not render the rentals UI yet.

**Run**
- `npm run typecheck --workspace @contour/web`

## Phase 3: Deals Kanban Board

Objective: make `/deals` default to a draggable kanban board with live search and a detail surface.

**Files**
- Create: `apps/web/components/deals-kanban-board.tsx`
- Create: `apps/web/components/deal-board-card.tsx`
- Create: `apps/web/components/deal-board-drawer.tsx`
- Modify: `apps/web/app/deals/page.tsx`
- Modify: `packages/db/src/deals.ts` only if the existing summary shape needs extra fields

- [ ] Build the board as a client component that receives grouped rows and workflow config.
- [ ] Add the live search input above the columns and hide non-matching cards immediately.
- [ ] Render terminal stage columns as visible end buckets.
- [ ] Add card click behavior that opens a drawer with linked listing/client context and inline edit controls.
- [ ] Add drag/drop stage updates with optimistic UI and rollback on failure.
- [ ] Make the board show a `No deals found` state when search returns nothing.
- [ ] Keep the existing `/deals/[id]` detail page as the full-page fallback for deeper review.

**Run**
- `npm run typecheck --workspace @contour/web`

## Phase 4: Deals Table Mode

Objective: preserve the current table experience behind an `All deals` switch.

**Files**
- Modify: `apps/web/app/deals/page.tsx`
- Modify: `apps/web/components/deals-table.tsx`
- Create or modify: `apps/web/components/deals-table-view.tsx` if a separate table-view wrapper is cleaner

- [ ] Add a clear `All deals` button that switches the `/deals` page into table mode.
- [ ] Make table mode reuse the same deals dataset as the kanban board.
- [ ] Ensure the table mode respects the shared 10-row pagination shell.
- [ ] Keep search behavior identical between board and table mode where possible.

**Run**
- `npm run typecheck --workspace @contour/web`

## Phase 5: Validate Shared Table Rule

Objective: confirm the 10-row pagination rule is now consistent across the app.

**Files**
- Modify: existing table tests under `apps/web/components/*`
- Modify: `apps/web/app/clients/page.tsx` if needed to expose the right row count to the shared table
- Modify: `apps/web/app/listings/page.tsx` if needed to expose the right row count to the shared table
- Modify: `apps/web/app/work-items/page.tsx` if a row-based table shell is used there

- [ ] Add or update tests that verify every table using the shared shell renders at 10 rows per page.
- [ ] Check that empty states still render when search removes all rows.
- [ ] Make sure the pagination controls do not disappear when row count exceeds 10.

**Run**
- `npx vitest run`
- `npm run typecheck --workspace @contour/web`

## Operating Rules

- Do not introduce a second board engine.
- Do not add a new DB field for workflow type; use existing `dealType`.
- Keep rentals as a config-only future workflow in this phase.
- Prefer shared components over per-page ad hoc pagination logic.
- Do not rewrite unrelated CRM pages unless they must adopt the shared table pagination rule.

## Success Criteria

- `/deals` opens as a kanban board by default.
- A user can search deals across title, listing, client, stage, status, and value.
- A user can drag a deal to another stage and see it stay there.
- A user can open a deal from the board and edit it.
- `All deals` opens a table view with 10-row pagination and numbered pages.
- The shared table pagination rule is applied consistently across the app.
- The rentals board can be added later by reusing the same workflow engine.

