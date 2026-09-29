# Property Type Parity and Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require an explicit property type when creating properties and inquiries, expose the same property-type options on desktop and Field OS, and apply that type consistently through persistence, display, and matching.

**Architecture:** Reuse the existing Prisma `PropertyType` enum and Zod enum as the canonical contract. Add a shared typed option/label module and shared selector so desktop and PWA cannot drift. Keep `Inquiry.propertyType` nullable for historical rows and external backward compatibility, but require it for new authenticated UI/API inquiry creation; matching treats legacy null as unrestricted while typed inquiries hard-filter/score only the same property type.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Zod, Vitest, existing permission-aware API handlers.

## Global Constraints

- Preserve historical inquiries with `propertyType = null`; do not invent types in a migration.
- New desktop/PWA inquiry creation must send a valid explicit `propertyType`.
- New property creation must show and require property type; the server remains authoritative.
- Use the existing `PropertyType` enum values only: `STANDALONE_HOUSE`, `APARTMENT`, `COMMERCIAL_OFFICE`, `WAREHOUSE`, `VACANT_LAND_PLOT`, `FARM_AGRICULTURAL`.
- Keep organization and permission checks in existing API handlers; parity must not widen access.
- Preserve legacy machine/public ingestion compatibility unless the caller is explicitly using the new strict UI contract.
- Do not run production migrations automatically.

## Review Focus

- A desktop inquiry cannot submit with “Any Type” or an empty type.
- A PWA inquiry cannot submit with an empty type, including offline/outbox submission.
- A desktop property cannot submit without a type, even if the browser bypasses `required`.
- A mismatched inquiry/property type is excluded from matching; a historical null inquiry type remains unrestricted.
- Property type labels and enum values are identical across desktop, PWA, API responses, matching dialogs, pipeline cards, and analytics inputs.
- A user lacking the relevant create/update permission cannot mutate property or inquiry type through either surface.

### Task 1: Establish the shared property-type contract

**Files:**
- Create: `src/lib/property-types.ts`
- Test: `src/lib/property-types.test.ts`

- [ ] Add failing tests for the complete enum list, stable labels, and conversion from enum value to display label.
- [ ] Implement `PROPERTY_TYPE_OPTIONS`, `PropertyTypeValue`, and `propertyTypeLabel` using the existing enum values and human-readable labels.
- [ ] Export a reusable option shape for select components; do not duplicate option arrays in pages.
- [ ] Run the focused test and commit `feat(property-types): centralize property type options`.

### Task 2: Make desktop property creation explicitly require property type

**Files:**
- Modify: `src/app/(dashboard)/dashboard/properties/page.tsx`
- Modify: `src/app/api/properties/route.ts` only if the create handler currently relies on the default rather than rejecting absent UI input.
- Test: `src/lib/validations/property-type-input.test.ts`

- [ ] Add failing validation tests for missing property type rejection in the new-property payload and valid enum acceptance.
- [ ] Add `propertyType` to desktop property form state with no silent fallback; use the shared option selector near listing/ownership fields.
- [ ] Make the selector visibly required and show an inline error before the request.
- [ ] Ensure the payload includes the explicit selected type and the server validates it through `createPropertySchema`.
- [ ] Keep update/edit behavior compatible, but display the canonical label and prevent invalid enum values.
- [ ] Run focused validation tests and targeted lint/typecheck.
- [ ] Commit `feat(properties): require property type on desktop creation`.

### Task 3: Make desktop inquiry creation explicitly require property type

**Files:**
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`
- Modify: `src/lib/validations/index.ts`
- Test: `src/lib/validations/property-type-input.test.ts`
- Test: `src/lib/matching/inquiry-property-match.test.ts`

- [ ] Add a required property-type field to Add Inquiry using the shared options; remove the implicit `propertyType: undefined` payload.
- [ ] Reject submit when no property type is selected and show a clear inline error.
- [ ] Change the authenticated UI create schema path so new UI payloads require the field without breaking legacy machine/public ingestion; use a narrow UI-specific schema or explicit server requirement marker rather than making all old integrations fail unexpectedly.
- [ ] Persist the selected type and verify the returned inquiry carries it into the creation match dialog/list view.
- [ ] Add matching tests proving same-type matches and different-type rejection.
- [ ] Commit `feat(inquiries): require property type on desktop creation`.

### Task 4: Align Field OS property and inquiry workflows

**Files:**
- Modify: `src/app/(kiosk)/agent/page.tsx`
- Modify: shared components from Task 1 if required.
- Test: `src/lib/pwa-property-type-payload.test.ts` or the existing PWA pure-helper test location.

- [ ] Add failing payload tests proving PWA inquiry creation rejects/does not queue without property type and includes the selected enum when valid.
- [ ] Replace “Any Type” with a required selection for new inquiry capture; retain filtering/search semantics elsewhere.
- [ ] Ensure the selected type is preserved in online and offline/outbox payloads and reset after successful capture.
- [ ] Add the same required property-type selector to PWA property creation if that flow currently hardcodes `STANDALONE_HOUSE` or omits user choice.
- [ ] Ensure permission-gated controls remain unchanged and server authorization still owns the final decision.
- [ ] Commit `feat(pwa): align property type requirements across field workflows`.

### Task 5: Apply property type consistently in matching and relevant views

**Files:**
- Inspect/modify: `src/lib/matching/score.ts`
- Inspect/modify: `src/lib/matching/inquiry-property-match.ts`
- Inspect/modify: `src/app/api/clients/[id]/matches/route.ts`
- Inspect/modify: `src/app/api/matching/unassigned/route.ts`
- Inspect/modify: `src/components/matching/inquiry-match-modal.tsx`
- Inspect/modify: inquiry/property cards, pipeline, analytics, Vault, and PWA renderers where raw enum values are shown.
- Test: focused score/matcher/API view-model tests.

- [ ] Audit every matching adapter for nullable inquiry type behavior; preserve null as unrestricted only for legacy records.
- [ ] Ensure typed inquiries use the same hard-failure/type-match rule in automatic matches, test-all-properties, unassigned matches, notifications, catalogue badges, and Vault counts.
- [ ] Replace ad hoc `replace(/_/g, " ")` labels with `propertyTypeLabel` where the value is user-facing.
- [ ] Add regression coverage for all enum values, mismatches, null legacy inquiries, and returned display labels.
- [ ] Run the focused matching suite and verify the existing strict `> 70` threshold is unchanged.
- [ ] Commit `fix(matching): enforce inquiry property type compatibility`.

### Task 6: Full verification and release boundary

- [ ] Run full Vitest with a temporary test-only `BETTER_AUTH_SECRET` if required.
- [ ] Run `pnpm exec tsc --noEmit`, targeted lint, and full lint separately; distinguish pre-existing repository failures.
- [ ] Run `pnpm exec prisma validate`; confirm no migration was generated.
- [ ] Run `git diff --check` and inspect permission/API boundaries.
- [ ] Perform authenticated desktop and Field OS smoke tests for property creation, inquiry creation, offline queue payload, matching, and a user without the required permission.
- [ ] Do not claim deployed parity until browser/deployed-runtime evidence exists.
