# Contour Analytics Engine: Architecture and UX Brief

## Product Positioning

Contour Analytics Engine is not just a real estate CRM. It is an offline-first real estate operating system where operational records, financial ledgers, documents, and field activity continuously produce analytics, insights, and assigned work.

The strongest product thesis is:

- Agents use it as a daily operating cockpit.
- Finance uses it as a collections and reconciliation engine.
- Legal uses it as a document compliance queue.
- Owners use it as a portfolio intelligence layer.

The product should be sold as a high-trust operating layer for real estate businesses that have outgrown spreadsheets but cannot afford fragile cloud-only tooling in field conditions.

## Improved Product Idea

The original Notion plan has the right modules, but the system becomes stronger if the analytics engine is treated as the product spine from day one.

### Core Improvement 1: Make "Insights to Work" the Main Loop

Every operational module should feed this loop:

1. User performs work: creates listing, logs interaction, moves deal, records payment, uploads document.
2. System emits event.
3. SQL views update operational metrics.
4. Data-quality and analytics jobs create insights.
5. Insights create work items.
6. Teams complete work from the queue.
7. Completion emits new events and improves the dataset.

This makes the product more valuable than a record store. It tells the business what needs attention.

### Core Improvement 2: Separate the MVP Into Three Cockpits

Instead of exposing every table equally, the MVP should organize screens around how people work:

- **Portfolio Cockpit:** inventory, listings, valuation, document completeness, stale listings.
- **Revenue Cockpit:** deals, payment plans, rental charges, payments, arrears, expected vs actual.
- **Action Cockpit:** insights, work queue, follow-ups, document requests, data cleanup, sync issues.

The underlying modules remain the same, but the daily UX becomes easier to understand and faster to operate.

### Core Improvement 3: Build Offline as a Narrow Vertical Slice First

Do not wait until all modules exist before proving sync. Build offline sync early for the smallest useful slice:

- Listings
- Clients
- Interactions
- Events
- Work items

Then extend sync to payments and documents once the retry/idempotency model is proven. This lowers risk without compromising the offline-first requirement.

### Core Improvement 4: Keep Money Append-Only

Payments, charges, and installment schedule items should never be edited destructively. Corrections should be new rows linked to prior rows through metadata or a correction relation. This protects reconciliation, auditability, and investor trust.

### Core Improvement 5: Make Document Compliance a First-Class Workflow

Documents should not be a file dump. The app should show document readiness by listing, deal, and client:

- Missing critical docs.
- Uploaded but unverified docs.
- Verification age.
- Contract-stage deals missing legal documents.

This gives legal and management an immediate reason to use the system daily.

## Complete Architecture Understanding

### Runtime Shape

The system has two client shells and one shared product surface:

- **Web app:** Next.js on Vercel, cloud-first, canonical admin and operations UI.
- **Desktop app:** Electron shell using the same UI, with local SQLite and sync outbox.
- **Shared packages:** domain types, validation schemas, permission rules, event taxonomy, sync contracts, data-quality rules, and UI primitives.

### Data Shape

Neon Postgres is the source of truth. SQLite is a local mirror for desktop use. Data falls into two categories:

- **Mutable records:** listings, clients, deals, payment plans, rental leases, document metadata.
- **Append-only facts:** events, interactions, payments, rental charges, installment schedule items.

Mutable records sync by upsert with conflict logging. Append-only facts sync by insert with client-generated UUIDs and duplicate rejection.

### Domain Shape

Primary domains:

- Identity and roles.
- Listings and inventory.
- Clients and KYC.
- Interactions and follow-ups.
- Deals and pipeline.
- Installments and payment plans.
- Rentals and charges.
- Payments and receipts.
- Documents and verification.
- Events, analytics, insights, work items.
- Sync devices, sync state, and conflict handling.

## Performance Strategy

### Database

- Index every foreign key and common filter column.
- Use partial indexes for active rows where `deleted_at IS NULL`.
- Keep dashboard queries as source-controlled SQL views.
- Use pagination on all list endpoints.
- Use cursor pagination for event, audit, payment, and interaction timelines.
- Avoid loading document bytes through the app server; use Vercel Blob URLs and metadata in Postgres.

### API

- Use typed request/response contracts.
- Validate inputs at the edge of every mutation.
- Enforce role permissions in service functions, not only UI.
- Make all write endpoints idempotent where retry is possible.
- Include request IDs for audit and debugging.

### Desktop

- SQLite tables mirror only syncable operational data.
- Keep a local FTS index for listings, clients, and deals.
- Use a local outbox table for pending writes.
- Sync in small batches to avoid long blocking operations.
- Show queued write count and last sync status.

### UI

- Prefer dense, scannable tables and split-pane layouts over marketing-style cards.
- Use optimistic local updates on desktop and careful pending states on web.
- Keep dashboard panels actionable, not decorative.
- Use skeleton loading only where data has real latency.

## Security Strategy

- Clerk provides identity; internal `users` table provides app role and attribution.
- KYC fields are restricted at API/service level.
- Admin has full access; auditor is read-only.
- Finance can write payments and financial corrections.
- Legal can verify documents and access KYC where required.
- Every critical mutation writes both an analytics event and audit log row.
- Production CORS must be explicit.
- Secrets stay in environment variables only.

## UX and Visual Direction

Source design reference: `DESIGN.md`.

## Brand

Name: Contour Analytics Engine.

Logo idea: a minimal, clean, colored line illustration of mountain contour lines, like a topographic map. This is a strong fit because the product maps hidden operational terrain: inventory risk, revenue flow, arrears, compliance gaps, and field activity.

## Atmosphere

The app should feel:

- High-end.
- Quiet.
- Precise.
- Warm.
- Analytical.
- Operational.

Avoid:

- Generic SaaS purple/blue gradients.
- Decorative dashboards.
- Oversized marketing hero sections.
- Card-heavy layouts with low information density.
- Loud status colors outside true alerts.

## Palette

Use the Perplexity-inspired palette from `DESIGN.md` as the base, adapted for Contour:

- Warm paper background: `#fdfbfa`.
- Primary text: `#27251e`.
- Brand brown / primary action: `#271a00`.
- Inverse text: `#fdfbfa`.
- Subtle surfaces: low-alpha black or brown overlays.

For operational status, use restrained accents:

- Online: muted green.
- Offline: neutral grey.
- Critical arrears or compliance: deep red used sparingly.
- Warning: muted amber.
- Informational: muted slate or brown-grey, not bright blue.

## Typography

Use one disciplined sans-serif family across the app. If `pplxSans` is unavailable, choose a premium-feeling substitute with similar restraint. Hierarchy should come from weight and spacing, not oversized headlines.

Recommended hierarchy:

- Page titles: 20-24px, weight 500.
- Section headers: 16px, weight 500.
- Body/table text: 14-16px, weight 400.
- Captions/metadata: 12px, weight 400.

## Layout

Use an operations-first shell:

- Fixed left sidebar on desktop.
- Collapsed navigation on mobile.
- Persistent top utility strip with search, connectivity, sync state, and user menu.
- Main content uses dense tables, split panes, kanban, and work queues.
- Detail pages use a two-column layout: core details left, timeline/documents/work right.

## Component Rules

- Buttons: 8px radius, compact, with icons for common actions.
- Inputs: 12-16px radius, warm surface, strong focus ring.
- Cards: use sparingly for repeated records or modals, not as page-section decoration.
- Tables: first-class component with saved filters, quick search, column visibility, pagination, and row actions.
- Status indicators: quiet color chips with clear labels.
- Charts: minimal, direct, and always paired with a table or work action.

## Logo Use

The contour-line logo should be used as:

- Sidebar masthead.
- App icon.
- Desktop installer icon.
- Empty-state watermark, very faint.

Do not overuse the contour motif as background decoration. Keep it premium and restrained.

## MVP Product Shape

The MVP should feel almost production-ready by delivering fewer workflows deeply:

1. Authenticated app shell with Contour visual system.
2. Inventory and client CRM.
3. Interactions and deal pipeline.
4. Documents and verification.
5. Payments, rental charges, payment plans, and arrears.
6. Analytics views with insights and work items.
7. Electron offline slice with sync status and queued writes.
8. CI that builds web and Windows desktop artifact.

The first version does not need payment gateway integrations, GIS mapping, branch-level permissions, or ML matching. Those come after the operating loop is trusted.
