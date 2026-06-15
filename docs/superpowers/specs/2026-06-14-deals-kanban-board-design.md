# Contour Deals Kanban Board Design

> **Status:** approved for implementation by the user
> **Scope:** `/deals` sales kanban, table fallback view, shared table pagination rule, and reusable workflow config for future rentals

## Goal

Turn the current open deals page into a sales-first kanban board for Zambia property and land deals, while preserving a table view for operators who want the current list-style workflow. The same board shell must be reusable for a future rentals board without rewriting the interaction model.

## What Exists Today

- `/deals` currently renders a table-style deals page with summary cards, a create button, and a `DealsTable`.
- `Deal` already has `stage`, `status`, and `dealType` in the Prisma schema.
- `dealType` already supports `sale`, `rental`, and `installment`, so we do not need a new discriminator field.
- The current UI has detail and edit pages for individual deals.
- Existing tables use a shared searchable table wrapper, but pagination is not standardized.

## Product Decisions

1. The default `/deals` experience becomes a kanban board, not a table.
2. The board is optimized for property and land sales only.
3. A visible `All deals` button switches to a table view of the same data.
4. The table view must show 10 items per page.
5. Table pagination rules must become shared behavior across all tables in the app.
6. Search on the board must filter cards live and hide non-matching cards immediately.
7. Clicking a deal on the board opens a detail surface where the user can edit the deal and stage without leaving context.
8. A future rentals board will reuse the same shell and search/drag/drop patterns, but with a separate stage workflow and `dealType = rental`.

## Sales Workflow

### Board Scope

- Board data source: deals where `dealType = sale`.
- Legacy `installment` deals are not part of this board workflow.
- The kanban stages should feel natural to Zambia property/land sales and be easy to scan.

### Recommended Sales Stages

1. `New enquiry`
2. `Qualified`
3. `Site visit`
4. `Offer made`
5. `Negotiation`
6. `Document check`
7. `Closing`
8. `Won`
9. `Lost`

### Stage Rules

- `Won` and `Lost` are terminal columns.
- `Closing` is the final active stage before outcome.
- `Document check` covers ownership, title, survey, and other sale-readiness checks.
- Cards can be dragged between columns to update stage immediately.
- Dragging should be optimistic in the UI, with rollback on failure.

## Board Interaction Model

### Default View

- The default view is the kanban board.
- The board header should include:
  - page title
  - brief description
  - `New deal`
  - `All deals`
  - search input

### Search Behavior

- Search must filter across:
  - deal title
  - linked listing title
  - linked client name
  - stage label
  - status
  - value text
- Search updates the board as the user types.
- Matching cards remain in their stage columns.
- Non-matching cards disappear.
- If nothing matches, show a `No deals found` empty state in the board area.
- The same search logic must be reusable for the rentals board later.

### Card Behavior

- Clicking a card opens a detail drawer or side panel on the same page.
- The detail surface should show:
  - title
  - stage
  - status
  - value
  - linked listing
  - linked client
- The detail surface should allow editing the deal content and the stage.
- The detail surface should also link to the full detail page for deeper review.

## Table View

### Purpose

- The table view is for operators who want the current row-based workflow.
- It should feel like the existing deals table, but be reachable through the `All deals` button.

### Pagination Rules

- Page size is `10`.
- Pagination controls must include:
  - `Previous`
  - numbered pages
  - `Next`
- The current page number must be obvious.
- Empty search results must still show a clear empty state.

### Scope For Shared Pagination

This pagination rule should apply to every table in the app that presents multiple rows, including current and future table views for:

- deals
- listings
- clients
- work items or any future table-backed views

## Rentals Framework

### Why This Is Defined Now

The rentals board should not be a separate one-off implementation. It should be a second configuration for the same kanban system.

### Rentals Board Assumptions

- It will use `dealType = rental`.
- It will keep the same board shell, search behavior, click-to-detail behavior, and drag/drop logic.
- It will use rental-specific stages later, but no rental board UI is built in this phase.

### Draft Rentals Stage Framework

This is the planned shape for the rentals board when that phase starts:

1. `New enquiry`
2. `Viewing`
3. `Application`
4. `Screening`
5. `Lease draft`
6. `Deposit / signing`
7. `Active`
8. `Renewal / arrears`
9. `Closed`

## Data And Code Shape

### Shared Board Config

Create a stage/workflow registry that can define:

- board label
- `dealType` filter
- ordered stages
- terminal stages
- stage display labels
- search indexing fields

### Proposed Components

- `DealsBoardPage` for the `/deals` sales board
- `DealKanbanBoard` for the draggable card grid
- `DealBoardSearch` for the live search input and filter state
- `DealBoardDrawer` for the click-to-view/edit surface
- `DealsTableView` for the paginated table fallback
- `PaginatedSearchableTable` or equivalent shared table shell for all row-based views
- `dealWorkflowConfig.ts` for sales and rentals stage definitions

### Data Handling

- Sales board queries should only load sales deals.
- Table view should reuse the same filtered dataset as the board.
- Search should operate on a normalized searchable index built from the deal and its relations.
- Stage updates should update the deal record and refresh the visible card position immediately.

## UX And Visual Direction

- Keep the board visually restrained and readable.
- Use stage columns that are wide enough for short cards but still easy to scan horizontally.
- Counts should appear in the stage header.
- Empty columns should remain visible so the workflow structure stays clear.
- The table view should be visually consistent with the rest of the app and not feel like a fallback afterthought.

## Error Handling

- If the board query fails, show a compact error state instead of an empty board.
- If a drag update fails, revert the card to its original column and surface the error.
- If the search returns no matches, show a friendly empty state with a reset path.
- If related listing or client data is missing, still render the card with `Unset` labels instead of breaking the board.

## Testing

### Board Tests

- Search filters across title, listing, client, stage, status, and value text.
- Dragging a card updates the stage field.
- A deal with no matches disappears from the board.
- Empty board state renders when nothing matches.

### Table Tests

- Default page size is 10.
- Previous/Next controls move across pages.
- Numbered pagination reflects the current page.
- Empty search states render correctly.

### Shared Rule Tests

- Existing table views that use the shared table shell follow the same pagination behavior.
- Sales and rentals board configs remain separate but use the same board engine.

## Non-Goals

- Do not build the rentals board UI in this phase.
- Do not support lease-to-own in the kanban system yet.
- Do not redesign the entire CRM navigation.
- Do not add a second board engine when a config-driven one will do.

## Acceptance Criteria

- `/deals` opens as a kanban board for sales deals.
- The board filters live as the user types.
- Dragging a card changes its stage.
- Clicking a card opens a detail/edit surface.
- `All deals` opens the table view.
- The table shows 10 rows per page with numbered pages plus previous/next.
- Other table views in the app follow the same pagination standard.
- A rentals workflow can be added later by swapping stage config, not by rewriting the board.

