# Contour Analytics Engine MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Contour Analytics Engine as an offline-first, analytics-led real estate operating system with a Vercel web app, Windows Electron desktop app, Neon Postgres system of record, and a polished high-end operational UI.

**Architecture:** Use a shared TypeScript monorepo where Next.js provides the web app, API routes, and canonical UI; Electron wraps the same UI with a local SQLite mirror and sync outbox; shared packages define domain models, validation schemas, permissions, event taxonomy, analytics contracts, and design tokens. Neon Postgres remains authoritative, Vercel Blob stores document bytes, and Clerk controls identity while internal roles control product permissions.

**Tech Stack:** TypeScript strict mode, Next.js App Router, React, Clerk, Neon Postgres, Prisma or Drizzle, Electron, SQLite, Vercel Blob, GitHub Actions, Vercel, Vitest or Jest, Playwright, Sentry.

---

## Product North Star

Contour Analytics Engine should help a real estate operator answer three questions every day:

- What assets, clients, deals, money, and documents need attention?
- Who owns the next action?
- Can the business keep operating when the internet fails?

The MVP is successful when it replaces the core spreadsheet workflow with a faster, safer, more beautiful operating cockpit.

## Non-Negotiable MVP Standards

- The UI must follow the warm, restrained, high-end visual direction in `DESIGN.md`.
- The product name is Contour Analytics Engine.
- The logo direction is minimal colored contour-line mountain/map illustration.
- Every meaningful mutation emits an `events` row and an audit log where appropriate.
- KYC fields are restricted by role at the service/API layer.
- Money records are append-only or correction-based.
- Desktop app works offline for the initial core workflow.
- Sync is idempotent and visible to the user.
- Dashboards must lead to action, not just display numbers.

## Phase 0: Product Definition and Design System

Objective: lock the product identity, app shell, UX principles, and implementation boundaries before scaffolding feature code.

- [ ] Convert `DESIGN.md` into app design tokens: colors, typography, radius, spacing, shadow, focus rings, and density rules.
- [ ] Create the Contour logo asset in SVG: minimal contour-line mountain/map mark using the brand brown.
- [ ] Define the app shell: sidebar, top utility strip, global search, connectivity indicator, sync badge, user menu.
- [ ] Define the three cockpit information architecture: Portfolio, Revenue, Action.
- [ ] Define role-specific default navigation for admin, agent, finance, legal, and auditor.
- [ ] Create wireframe-level screen specs for inventory, client profile, deal pipeline, revenue cockpit, document vault, insights inbox, and work queue.
- [ ] Define empty states, loading states, error states, offline states, and sync conflict states.

Exit criteria:

- A developer can build the shell without guessing visual direction.
- The design system supports operational density while still feeling premium.
- The first sprint has clear screens and routes.

## Phase 1: Repo, Tooling, and Deployment Skeleton

Objective: create the build foundation for web, desktop, tests, and deployment.

- [ ] Scaffold a TypeScript monorepo with `apps/web`, `apps/desktop`, and shared packages.
- [ ] Add strict TypeScript, ESLint, formatting, and path aliases.
- [ ] Add shared packages for `domain`, `db`, `auth`, `ui`, `analytics`, `sync`, and `config`.
- [ ] Add `.env.example` with Clerk, Neon, Vercel Blob, Sentry, app URLs, and Electron build variables.
- [ ] Add scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `db:migrate`, `db:studio`, `desktop:dev`, `desktop:build`.
- [ ] Add GitHub Actions for lint, typecheck, tests, web build, and Windows desktop artifact build.
- [ ] Add Vercel project configuration for web deployment.
- [ ] Add Sentry or equivalent error tracking configuration and structured logging conventions.

Exit criteria:

- Web app boots locally.
- Electron shell boots locally.
- CI validates the repo.
- Vercel preview deployment works.
- Windows desktop artifact is produced in CI.

## Phase 2: Database, Domain Model, Auth, and Permissions

Objective: make the system safe before user-facing workflows depend on it.

- [ ] Implement the canonical Neon schema from `database-schema-ddl-neon-postgres.md`.
- [ ] Add migration scripts and a production migration checklist.
- [ ] Add seeds for representative admin, agent, finance, legal, and auditor users.
- [ ] Implement Clerk authentication and internal `users.clerk_user_id` mapping.
- [ ] Implement role permissions as shared domain policy functions.
- [ ] Implement KYC access policy for read and write behavior.
- [ ] Implement event writer and audit log writer.
- [ ] Add service-layer mutation wrappers so events/audit are not optional.
- [ ] Add tests for role access, KYC restrictions, event emission, audit logging, and soft-delete behavior.

Exit criteria:

- Authenticated requests resolve to internal users and roles.
- Unauthorized roles cannot read/write KYC fields.
- Critical writes create events and audit records.
- Database migrations can run cleanly from an empty database.

## Phase 3: Contour App Shell and Core UI Components

Objective: make the product feel premium before filling it with complex workflows.

- [ ] Build the authenticated app shell using the Contour visual system.
- [ ] Build left sidebar navigation with logo, role-aware sections, and active state.
- [ ] Build top utility strip with search, connectivity indicator, sync status, and user menu.
- [ ] Build table component with search, filters, pagination, row actions, density, and empty state.
- [ ] Build form components with validation messages and accessible focus states.
- [ ] Build status chips for availability, deal stage, payment status, insight severity, work priority, online/offline state.
- [ ] Build split-pane detail layout for records with timeline/documents/work side panels.
- [ ] Build kanban component for deal stages.
- [ ] Add Playwright visual smoke tests for desktop and mobile viewport layout.

Exit criteria:

- The app already looks like Contour before business modules are complete.
- Navigation is fast and predictable.
- Components support dense operational workflows without visual clutter.

## Phase 4: Portfolio Cockpit, Listings, and Local Search

Objective: replace the inventory spreadsheet with a fast operational inventory cockpit.

- [ ] Build Portfolio Cockpit dashboard with inventory counts, portfolio value, stale listings, missing location, and document readiness.
- [ ] Build Listings CRUD for property and vacant land.
- [ ] Implement `listing_utilities` selection and display.
- [ ] Add listing filters: status, type, location, price range, land size, assigned agent, document readiness.
- [ ] Add listing detail page with metadata, linked deals, interactions, documents, events, and work items.
- [ ] Add event emission for listing create/update/status change/agent assignment.
- [ ] Add data-quality checks for missing location, invalid sold-to-available transition, and stale listing.
- [ ] Add SQL-backed dashboard queries with indexes reviewed.

Exit criteria:

- Agents can manage inventory end to end.
- Owners can see portfolio status quickly.
- Stale and incomplete inventory creates actionable work.

## Phase 5: Clients, KYC, Interactions, and Follow-Ups

Objective: build the CRM layer that captures demand, compliance, and relationship history.

- [ ] Build client list with segment filters, KYC completeness, last interaction, and assigned work.
- [ ] Build client profile with KYC fields hidden or visible based on role.
- [ ] Implement preferred locations through normalized rows.
- [ ] Build interaction timeline logging for calls, site visits, WhatsApp, email, negotiation, and other.
- [ ] Add follow-up scheduling from interactions.
- [ ] Add duplicate-client checks by phone, email, NRC, and TPIN.
- [ ] Add KYC completeness checks for required segments.
- [ ] Emit events for client create/update/segment change/KYC update, interaction logged, and follow-up scheduled.

Exit criteria:

- Agents can capture a client and log a complete follow-up history.
- KYC remains protected.
- Follow-up gaps and duplicate suspicion become work items.

## Phase 6: Deals Pipeline and Document Compliance

Objective: turn client interest into trackable transactions with legal evidence.

- [ ] Build deal CRUD with client and multi-listing links.
- [ ] Build kanban pipeline by `stage`.
- [ ] Add drag/drop or explicit stage change action with confirmation for closed states.
- [ ] Add agent attribution and commission fields.
- [ ] Build document upload to Vercel Blob.
- [ ] Store document metadata and link to listing/client/deal.
- [ ] Build document checklist by category and entity type.
- [ ] Build legal verification flow for critical documents.
- [ ] Add missing/unverified critical document insights.
- [ ] Emit deal and document events.

Exit criteria:

- Deals can progress from lead to closed won/lost.
- Legal can verify documents.
- Contract-stage compliance gaps are visible and actionable.

## Phase 7: Revenue Cockpit, Installments, Rentals, and Payments

Objective: make the system useful for money tracking without external payment integrations.

- [ ] Build Revenue Cockpit with expected vs actual, arrears totals, 15/30/60+ aging, overdue tenants, and overdue installment buyers.
- [ ] Build payment plan constructor.
- [ ] Generate installment schedule rows.
- [ ] Build rental lease CRUD.
- [ ] Build manual rental charge generation.
- [ ] Build receipt entry linked to relevant client, deal, plan item, lease, or charge.
- [ ] Treat corrections as new rows or explicit correction workflow.
- [ ] Add finance-only write permissions for payments and financial corrections.
- [ ] Add reconciliation queries and finance-focused work items.

Exit criteria:

- Finance can record money safely.
- Owners can see expected vs actual collections.
- Arrears are prioritized into work.

## Phase 8: Analytics Engine, Insights Inbox, and Work Queue

Objective: make Contour feel intelligent and operationally alive.

- [ ] Implement source-controlled SQL views for inventory, sales, collections, client follow-up, document compliance, and sync health.
- [ ] Implement canonical event taxonomy and event metadata contracts.
- [ ] Build insights generator jobs for stale listings, stuck deals, follow-up gaps, missing documents, duplicate clients, KYC incomplete, arrears, and sync failures.
- [ ] Build Insights Inbox with filters by type, severity, owner, entity, status, and due date.
- [ ] Build Work Queue with ownership, priority, due date, status, and resolution actions.
- [ ] Link dashboard panels to relevant filtered work views.
- [ ] Add audit trail views for owners and auditors.

Exit criteria:

- Every dashboard metric has a query source.
- Open insights create or update work items.
- Users can resolve work with evidence.

## Phase 9: Offline Desktop Vertical Slice

Objective: prove offline-first behavior on a meaningful slice before widening sync to every table.

- [ ] Mirror local SQLite tables for users, listings, listing utilities, clients, preferred locations, interactions, events, insights, work items, sync devices, and sync state.
- [ ] Add local outbox table for queued writes.
- [ ] Implement local repositories for the offline slice.
- [ ] Implement `/sync/push` for mutable upserts and append-only inserts.
- [ ] Implement `/sync/pull` with sync token and tombstone support.
- [ ] Add idempotency tests for duplicate retries.
- [ ] Add conflict log for mutable rows changed on both client and server.
- [ ] Build desktop sync UI: online/offline, last sync, queued writes, error code, manual retry.
- [ ] Add offline Playwright/Electron test for creating a listing, client, and interaction, then syncing.

Exit criteria:

- Desktop can perform useful field work offline.
- Sync retries are safe.
- Conflicts are visible to admins.
- The user always knows whether data is local, queued, or synced.

## Phase 10: Offline Expansion and Desktop Packaging

Objective: extend offline reliability to revenue and documents, then produce installable releases.

- [ ] Extend SQLite mirror and sync to deals, deal listings, payment plans, installment schedule items, rental leases, rental charges, payments, and documents metadata.
- [ ] Add offline document metadata creation with deferred Blob upload when online.
- [ ] Add conflict handling for document verification and deal stage changes.
- [ ] Add desktop app signing and installer configuration.
- [ ] Publish Windows `.exe` artifacts from CI.
- [ ] Add auto-update strategy or documented manual update path.
- [ ] Add backup/export path for local unsynced outbox in support cases.

Exit criteria:

- Desktop supports the core MVP workflow offline.
- Windows artifact is installable by a non-developer.
- Support can recover unsynced local work.

## Phase 11: Production Hardening and Pilot Readiness

Objective: reach almost-production quality for a controlled client pilot.

- [ ] Add staging and production environment separation.
- [ ] Add Neon backup/restore runbook.
- [ ] Add Vercel deployment protection and environment variable audit.
- [ ] Add explicit production CORS policy.
- [ ] Add rate limiting for public/API routes.
- [ ] Add audit export for auditors and owners.
- [ ] Add CSV export for accounting handoff.
- [ ] Add seeded demo data for sales and onboarding.
- [ ] Add product help copy only where workflows are unclear.
- [ ] Run accessibility pass for keyboard navigation, focus, contrast, and touch targets.
- [ ] Run performance pass for dashboard queries, table pagination, and desktop sync batch size.

Exit criteria:

- A real estate operator can run a pilot without developer assistance.
- Core workflows are stable, monitored, backed up, and auditable.
- The app visually feels premium enough for enterprise demos.

## Phase 12: Post-MVP Expansion

Objective: add leverage after the core operating loop proves retention.

- [ ] WhatsApp follow-up and arrears reminders.
- [ ] Automated recurring rental charge generation.
- [ ] Payment provider integrations after manual receipt flow is trusted.
- [ ] Advanced buyer matching and ranking.
- [ ] Branch-level permissions and reporting.
- [ ] GIS/map views only after customer workflows prove the need.
- [ ] Investor reporting packs.
- [ ] Multi-tenant SaaS packaging if selling beyond one operator.

## First Build Sequence

The first sprint should be narrow and prove the product shape:

- [ ] App shell with Contour design tokens and an initial contour-line SVG logo.
- [ ] Clerk auth and internal role mapping.
- [ ] Canonical database migration.
- [ ] Portfolio Cockpit with listings CRUD.
- [ ] Event and audit writers used by the first listing mutations.
- [ ] CI for web build and desktop shell build.

## Definition of Done

- Typecheck passes.
- Tests cover permissions and mutation behavior.
- SQL queries are bounded, indexed, and paginated.
- Mutations emit required events and audit rows.
- KYC and financial data respect role access.
- Offline behavior is considered for every new domain.
- Visual implementation follows `DESIGN.md` and the Contour brief.
- README or docs are updated when setup, deployment, or workflow changes.
