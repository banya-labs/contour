# Inquiries and Contacts Workspace Design

**Date:** 2026-09-24  
**Status:** Draft for review  
**Surface:** Dashboard Inquiries workspace

## Goal

Give agency staff one focused Inquiries workspace where they can switch between an alphabetical Contacts table and inquiry work, open a contact in a visible detail modal, edit the inquiry, start a deal, and match suitable properties without losing tenant isolation or duplicating CRM data.

## Approved scope

- Rename the current CRM navigation destination to `Inquiries` while retaining its existing route and permissions.
- Add two page tabs: `Inquiries` and `Contacts`.
- Keep `Deals` as the separate navigation destination for pipeline work.
- Contacts tab: alphabetized table, search, and practical filters using the existing `Inquiry` records as the source of contact truth.
- Contact row click: open a viewport-fixed detail modal with contact identity, communication details, inquiry requirements, assigned agent, status, and activity-relevant fields.
- Modal actions: edit inquiry details, start a deal using the existing inquiry/pipeline creation path, and match properties using the existing matching primitives.
- After successful mutations, refresh the relevant data and keep the user’s current tab/context where possible.
- Errors and pending states must be visible in the viewport: modal/alert treatment for failures and blocking or local loading feedback for mutations.

## Explicit non-goals

- No new `Contact` database model; `Inquiry` remains the canonical record because it already carries the client identity and inquiry requirements.
- No replacement of the existing Deals pipeline board.
- No automatic property assignment without an explicit user action.
- No client-only authorization, filtering, or cross-tenant lookup.

## UX and interaction

The Inquiries page gets a tab bar with `Inquiries` first and `Contacts` second. The active tab is reflected in the URL so refresh and navigation preserve context.

The Contacts tab displays a compact, responsive table sorted by normalized client name ascending. Search matches client name, phone, and email. Filters should include inquiry status and assigned-agent state, reusing the existing agent data. Empty, loading, and error states are explicit.

Each row is keyboard reachable and opens a fixed, scroll-contained modal. The modal has a clear title, close button, accessible labels, and visible action buttons. Editing uses the existing inquiry update contract. `Start deal` routes to or opens the existing pipeline creation flow with the selected inquiry prefilled. `Match properties` calls the existing deterministic matching path and renders ranked candidates with enough explanation to choose one; it does not silently mutate the inquiry. Selecting a property uses the existing tenant-safe inquiry update path.

## Data and API boundaries

- `GET /api/clients` remains the source for tabular inquiry/contact records and must return bounded, tenant-scoped data suitable for alphabetical sorting and filtering.
- `PATCH /api/clients/[id]` remains the mutation boundary for contact/inquiry edits and property selection.
- Existing pipeline creation and transition endpoints remain the only way to create or advance deals.
- Existing property matching services/endpoints are reused; matching constraints remain deterministic and tenant-scoped.
- Every server mutation validates input with the existing Zod schemas and derives `organizationId` from the authenticated tenant context.

## Component boundaries

- Existing clients page remains the route-level owner of tab state and data loading.
- Extract or add focused UI units only where needed: tab switcher, contacts table, contact detail modal, and matching results panel.
- Keep API calls and normalization close to the route or a small CRM helper; do not copy pipeline business rules into the UI.

## Verification

- Unit tests cover alphabetical normalization, search across name/phone/email, and filter combinations.
- Component/route tests cover tab URL state, row-to-modal behavior, modal close/keyboard behavior, and visible pending/error states.
- API tests cover tenant scoping, invalid inquiry/property IDs, and mutation authorization.
- Run the existing focused CRM/pipeline tests, typecheck, lint, and build where the repository scripts support them.
- Browser verification must confirm both tabs, a populated contacts table, modal actions, a failed mutation alert, and a successful property match/update.

## Open implementation constraint

The current clients page contains substantial existing modal and normalization logic. The implementation should first reuse it; extraction is justified only when it reduces duplication without changing current workflows.
