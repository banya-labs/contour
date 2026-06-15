# Contour Webapp Next Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Contour dashboard shell into the first usable product slice by shipping real listings and deals create/edit flows, with manual local testing after every phase.

**Architecture:** Keep the work narrow and reuse the existing app shell, auth, and Neon-backed data layer. Build one vertical slice at a time so each phase is independently testable, commit-ready, and cheap to validate locally. Avoid broad refactors, avoid new dependencies unless a phase truly needs them, and keep the dashboard as the navigation hub while the CRUD flows land.

**Tech Stack:** Next.js App Router, React 19, Clerk, Neon Postgres, Prisma, TypeScript, Tailwind CSS v4, Vitest, Playwright.

---

## What the repo says right now

- Auth, session bootstrap, and Neon-backed dashboard reads already exist.
- The home page already renders live listings, clients, deals, and work items from Neon.
- The current in-app next step is already hinted in the UI: seed the tables and wire create/edit flows for listings and deals.
- The cheapest path forward is to make one operational workflow real before widening the product surface.

## Recommended Next Step

Build the first real data-entry loop:

1. Create listing.
2. Edit listing.
3. Create deal linked to a listing and client.
4. Edit deal stage and status.

That gives the team something an operator can actually use, and it creates the right foundation for future client, revenue, and offline work.

## Phase 1: Listings CRUD Slice

Objective: add a usable create/edit flow for listings and keep it tied to the existing dashboard.

**Files**
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/app/listings/new/page.tsx`
- Create: `apps/web/app/listings/[id]/page.tsx`
- Create: `apps/web/app/listings/[id]/edit/page.tsx`
- Create: `apps/web/components/listing-form.tsx`
- Create: `apps/web/lib/listings.ts`
- Modify: `packages/db/src/dashboard.ts` only if the dashboard needs extra listing fields

- [ ] Add a listing form component that supports create and edit mode with the existing listing fields already modeled in Neon.
- [ ] Add a create page that opens the form inside the current Contour shell, not a separate product layout.
- [ ] Add a listing detail page that shows the same record in a read-only view with an edit entry point.
- [ ] Wire the dashboard “New listing” button to the create page.
- [ ] Wire the portfolio table rows to the detail page.
- [ ] Add a small local loading/empty/error state so the flow does not feel broken when data is missing.
- [ ] Add tests for form defaults, required field handling, and record rendering.

**Manual local test checkpoint**
- Start the web app locally.
- Create one listing.
- Open the created listing.
- Edit the listing and confirm the dashboard reflects the update.
- Stop here and report back before moving to Phase 2.

**Commit**
- Commit after this phase is stable locally.
- Keep the commit message narrow, for example: `feat(web): add listings CRUD slice`.

## Phase 2: Deals CRUD Slice

Objective: make the sales pipeline real by letting a user create and update deals against existing listings and clients.

**Files**
- Create: `apps/web/app/deals/new/page.tsx`
- Create: `apps/web/app/deals/[id]/page.tsx`
- Create: `apps/web/app/deals/[id]/edit/page.tsx`
- Create: `apps/web/components/deal-form.tsx`
- Create: `apps/web/lib/deals.ts`
- Modify: `apps/web/app/page.tsx`
- Modify: `packages/db/src/dashboard.ts` only if the dashboard needs extra deal fields

- [ ] Add a deal form component that supports stage, status, value, currency, listing, and client selection.
- [ ] Add deal create and edit pages that reuse the current shell and styling.
- [ ] Wire the dashboard revenue section or action queue to the deal create flow.
- [ ] Add a deal detail page with the linked listing and client context visible.
- [ ] Add validation so a deal cannot be saved without the minimum linked data needed for the pipeline.
- [ ] Add tests for stage changes, linked-record display, and invalid form input.

**Manual local test checkpoint**
- Create a deal from the UI.
- Link it to an existing listing and client.
- Change its stage and confirm the dashboard snapshot updates.
- Stop here and report back before moving to Phase 3.

**Commit**
- Commit after this phase is stable locally.
- Keep the commit message narrow, for example: `feat(web): add deals CRUD slice`.

## Phase 3: Client Profile Slice

Objective: make the CRM side useful enough that deals and follow-ups have real customer context.

**Files**
- Create: `apps/web/app/clients/new/page.tsx`
- Create: `apps/web/app/clients/[id]/page.tsx`
- Create: `apps/web/app/clients/[id]/edit/page.tsx`
- Create: `apps/web/components/client-form.tsx`
- Create: `apps/web/lib/clients.ts`
- Modify: `apps/web/app/page.tsx`

- [ ] Add a client form that captures the core public fields first and keeps KYC-sensitive fields behind the right role checks.
- [ ] Add client create/edit/detail pages.
- [ ] Wire the client list entry points from the dashboard.
- [ ] Surface duplicate-risk hints if the same email or phone appears again.
- [ ] Add tests for role-gated fields and client record rendering.

**Manual local test checkpoint**
- Create a client.
- Edit the client.
- Confirm the KYC-sensitive fields only appear for the right role.
- Stop here and report back before moving to Phase 4.

**Commit**
- Commit after this phase is stable locally.
- Keep the commit message narrow, for example: `feat(web): add client profile slice`.

## Phase 4: Shell Polish and Usability Pass

Objective: tighten the web app without expanding scope.

**Files**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `packages/config/src/navigation.ts`
- Modify: `apps/web/components/*` only if a shared component is needed

- [ ] Replace any remaining dead-end buttons with real navigation or disabled states.
- [ ] Improve mobile responsiveness for the main dashboard and the new CRUD pages.
- [ ] Make empty states, loading states, and action feedback consistent.
- [ ] Keep the premium visual direction intact while reducing visual noise.
- [ ] Add a final smoke test pass for desktop and mobile viewport rendering.

**Manual local test checkpoint**
- Open the main dashboard on desktop and mobile widths.
- Confirm listings, deals, and clients navigation works.
- Confirm no route feels like a placeholder.
- Stop here and report back before any wider scope changes.

**Commit**
- Commit after this phase is stable locally.
- Keep the commit message narrow, for example: `refactor(web): tighten shell and navigation`.

## Operating Rules For This Run

- Do not deploy.
- Do not push.
- Commit only after each phase is locally verified.
- Keep the work inside the web app unless a phase absolutely needs shared package changes.
- Prefer existing tables, existing auth, and existing dashboard data rather than introducing new abstractions too early.
- If a phase grows beyond a single user test loop, split it before coding.

## Success Criteria

- A user can create, open, and edit a listing locally.
- A user can create, open, and edit a deal locally.
- The dashboard reflects live Neon data instead of static placeholders.
- You can pause after every phase, manually test, and then decide whether to continue.

