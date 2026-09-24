# Inquiries and Contacts Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a tabbed Inquiries workspace with an alphabetical Contacts table, a visible contact detail modal, inquiry editing, deal initiation, and explicit property matching while preserving the existing Inquiry data model and tenant-safe APIs.

**Architecture:** Keep `src/app/(dashboard)/dashboard/clients/page.tsx` as the route owner and use `Inquiry` records as the canonical contact source. Add small pure CRM view-model helpers for normalization, search, sorting, and filters; reuse the existing inquiry update, pipeline, and deterministic matching boundaries instead of introducing a Contact model or duplicating business rules.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Prisma 6, Zod, Tailwind CSS, Vitest, existing Contour matching and authorization helpers.

**Spec:** `docs/superpowers/specs/2026-09-24-inquiries-contacts-workspace-design.md`

## Global Constraints

- `Inquiry` remains the canonical client/contact record; do not add a parallel Contact table.
- All reads and mutations remain organization-scoped through authenticated tenant context.
- Use existing Zod schemas and API routes for inquiry edits, pipeline creation, and property assignment.
- Keep `Deals` as the separate navigation destination and preserve the existing pipeline board.
- Errors and pending states must be visible in the viewport, including modal actions.
- Do not silently assign a property from a match result; require explicit user selection.

## Review Focus

- A contact named with different casing sorts predictably and remains searchable by name, phone, and email; test in Task 1.
- A URL tab value outside the allowed set falls back safely to `Inquiries`; test in Task 2.
- A contact modal remains usable on a short viewport with its own scroll container and keyboard close behavior; test in Task 3.
- A failed edit, deal creation, or match request shows an in-viewport error without losing the selected contact; test in Tasks 3 and 4.
- A property from another organization or a sold property cannot be assigned through the modal; test through existing API authorization tests in Task 4.

### Task 1: Extract CRM view-model helpers and tests

**Files:**
- Create: `src/lib/crm/contacts-view-model.ts`
- Test: `src/lib/crm/contacts-view-model.test.ts`
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx:1-320`

**Interfaces:**
- `normalizeInquiryContact(inquiry): ContactRow`
- `sortContactsAlphabetically(rows): ContactRow[]`
- `filterContacts(rows, { search, status, assignment }): ContactRow[]`
- `ContactRow` includes `id`, `name`, `phone`, `email`, `status`, `assignedAgent`, `preferredSuburbs`, `budget`, `purpose`, `leadSource`, and the original inquiry payload needed by the modal.

- [ ] **Step 1: Write failing tests** for name normalization/sorting, search across name/phone/email, status filtering, assignment filtering, and stable handling of blank names.
- [ ] **Step 2: Run** `pnpm exec vitest run src/lib/crm/contacts-view-model.test.ts`; confirm the new module/tests fail because the helpers do not exist.
- [ ] **Step 3: Implement** the pure helpers without fetches, React state, or tenant logic.
- [ ] **Step 4: Re-run** the focused test and confirm all cases pass.
- [ ] **Step 5: Replace** the clients page’s inline normalization/filter logic with the helpers without changing existing API payloads.
- [ ] **Step 6: Run** `pnpm exec vitest run src/lib/crm/contacts-view-model.test.ts src/lib/matching/score.test.ts`.

### Task 2: Add Inquiries/Contacts tabs and Contacts table

**Files:**
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`
- Create: `src/components/crm/contacts-table.tsx`
- Create: `src/components/crm/inquiries-tabs.tsx`

**Interfaces:**
- `InquiriesTabs({ activeTab, onChange })` emits only `"inquiries" | "contacts"`.
- `ContactsTable({ rows, search, onSearchChange, status, onStatusChange, assignment, onAssignmentChange, onSelect })` renders keyboard-accessible rows and explicit loading/empty/error states.

- [ ] **Step 1: Add a failing component test or route-level test** asserting `?view=contacts` selects Contacts and an invalid/missing value selects Inquiries.
- [ ] **Step 2: Run** the focused test and confirm the URL-state behavior is absent.
- [ ] **Step 3: Add** tab state synchronized with `searchParams` and shallow route updates, preserving existing `?new=1` behavior.
- [ ] **Step 4: Add** the Contacts table with alphabetical rows, search input, status filter, assignment filter, result count, and responsive overflow handling.
- [ ] **Step 5: Keep** the existing inquiry view available under the Inquiries tab and ensure the current create/edit/delete workflows remain reachable.
- [ ] **Step 6: Run** the focused tab/table tests and `pnpm exec vitest run src/lib/crm/contacts-view-model.test.ts`.

### Task 3: Add contact detail modal and inquiry editing

**Files:**
- Create: `src/components/crm/contact-detail-dialog.tsx`
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`
- Modify: `src/app/api/clients/[id]/route.ts` only if the existing update schema is missing a field required by the approved modal form.

**Interfaces:**
- `ContactDetailDialog({ contact, agents, onClose, onSaved, onStartDeal, onMatchProperties })` owns presentation and local edit state; the page owns server mutations and selected-contact state.
- `onSaved(updatedInquiry)` replaces the selected row and preserves the current tab.

- [ ] **Step 1: Add tests** for modal open/close, Escape close, edit validation, pending button state, and preserving the selected contact after a failed save.
- [ ] **Step 2: Run** the focused component tests and confirm they fail before the dialog exists.
- [ ] **Step 3: Implement** a viewport-fixed, scroll-contained dialog with focusable close control, accessible labels, contact details, inquiry requirements, assigned agent, status, and visible action buttons.
- [ ] **Step 4: Wire** edit submission to `PATCH /api/clients/[id]`, reusing the existing update schema and server response.
- [ ] **Step 5: Add** fixed viewport-visible error feedback and a local loading state for saves.
- [ ] **Step 6: Run** focused component tests and the existing client API tests if available.

### Task 4: Add deal initiation and property matching actions

**Files:**
- Create: `src/components/crm/property-match-results.tsx`
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`
- Modify: `src/components/crm/contact-detail-dialog.tsx`
- Modify: `src/app/api/clients/[id]/route.ts` only for a narrowly scoped missing operation.
- Test: `src/lib/crm/contact-actions.test.ts`

**Interfaces:**
- `PropertyMatchResults({ matches, pending, error, onSelect })` renders ranked candidates, reasons, availability, and an explicit select action.
- `startDealForInquiry(inquiryId)` navigates to the existing pipeline flow with the inquiry preselected rather than creating a second deal API.
- `matchPropertiesForInquiry(inquiryId)` calls the existing tenant-safe matching boundary and returns candidates without assigning one.

- [ ] **Step 1: Write failing tests** for explicit property selection, match failure preserving the modal, and deal navigation carrying the inquiry ID.
- [ ] **Step 2: Run** `pnpm exec vitest run src/lib/crm/contact-actions.test.ts`; confirm expected failures.
- [ ] **Step 3: Identify** the existing matching endpoint/service contract and use it from the modal; do not add client-side tenant filtering.
- [ ] **Step 4: Render** ranked matches with hard constraints and reasons from the existing score result.
- [ ] **Step 5: Wire** explicit property selection through `PATCH /api/clients/[id]` with the existing property validation and cache invalidation.
- [ ] **Step 6: Wire** Start deal to the existing pipeline creation flow with a stable inquiry query parameter.
- [ ] **Step 7: Run** focused action tests and existing matching/API tests.

### Task 5: Full verification and browser acceptance

**Files:**
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx` or CRM components only for issues found during verification.
- Test: any focused tests added in Tasks 1-4.

- [ ] **Step 1: Run** `pnpm exec vitest run src/lib/crm src/lib/matching src/app/api/clients` and record any baseline blockers separately.
- [ ] **Step 2: Run** `pnpm typecheck`; if Windows stalls again, record that as unverified rather than claiming a pass.
- [ ] **Step 3: Run** `pnpm lint -- src/app/(dashboard)/dashboard/clients/page.tsx src/components/crm src/lib/crm` or the repository’s supported focused lint command.
- [ ] **Step 4: Start** the dev server and browser-verify: Inquiries tab, Contacts tab, alphabetical/search/filter behavior, row modal, edit success/failure, Start deal, match results, explicit property selection, loading state, and fixed error alert.
- [ ] **Step 5: Verify** no new route bypasses tenant authorization and no existing client/pipeline flow regresses.
- [ ] **Step 6: Report** exact test output and remaining environment blockers before any production or merge claim.
