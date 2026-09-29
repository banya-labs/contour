# Inquiry Location Options and Case-Insensitive Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve inquiry location entry with a curated Lusaka suburb/neighborhood list, a safe custom-location input, and consistent case-insensitive matching across inquiry creation, API candidate selection, and persisted property matching.

**Architecture:** Keep the existing `Inquiry.preferredSuburbs String[]` contract and the current centralized matcher. Add one shared location-options module for display labels and one shared normalizer for trimming, whitespace folding, and case-insensitive comparison. The dashboard form will support a predefined single selection plus a custom value; the server will normalize all received values before storing or using them. No new database table is required for this slice because the requested list is product seed data, not organization-managed data.

**Tech Stack:** Next.js App Router, TypeScript, React, Prisma/PostgreSQL, Zod, Vitest, existing Contour dashboard/API patterns.

**Spec:** This plan is the implementation spec for the requested inquiry location UX and matching behavior.

## Global Constraints

- Preserve unrelated dirty subscription-tier changes in the current working tree; do not reset, stage, or rewrite them.
- Keep `preferredSuburbs` backward-compatible as `String[]`; existing inquiries and public/machine ingestion must continue to work.
- Derive organization scope from authenticated server context; custom text must never bypass tenant checks.
- Normalize comparison values with trim + whitespace folding + locale-independent lowercase; do not make matching depend on display capitalization.
- Do not fabricate a default suburb when the user chooses “Any location” or leaves the field empty.
- Do not run production migrations; this plan is expected to require no schema migration.
- Preserve the current strict property-match rule (`score > 70`) and only change location normalization/entry behavior.

## Review Focus

- A custom `Roma park`, `ROMA PARK`, or `Roma   Park` inquiry matches a property stored as `Roma Park`; test in the pure matcher and API candidate path.
- A blank custom value does not become an empty-string preferred suburb and behaves as “Any location”; test form payload construction and Zod validation.
- A custom location containing leading/trailing whitespace is stored in a clean display form; test server normalization without changing unrelated inquiry fields.
- Duplicate predefined/custom values differing only by case are stored once; test canonical de-duplication.
- A property suburb with punctuation or a multi-word name remains comparable without substring false positives; test exact normalized equality.
- Existing non-Lusaka and legacy inquiry suburbs remain valid; test backward-compatible parsing and matching.

### Task 1: Establish shared location data and normalization contracts

**Files:**
- Create: `src/lib/locations/lusaka-suburbs.ts`
- Create: `src/lib/locations/normalize-location.ts`
- Test: `src/lib/locations/normalize-location.test.ts`
- Test: `src/lib/locations/lusaka-suburbs.test.ts`

**Interfaces:**
- Produce `LUSAKA_SUBURBS: readonly string[]`, sorted alphabetically and containing display labels only.
- Produce `normalizeLocation(value: string): string`, returning trimmed, collapsed-whitespace, lowercase text.
- Produce `cleanLocationValues(values: readonly string[]): string[]`, removing blank values and case-insensitive duplicates while preserving the first display label.
- Produce `locationsEqual(left: string, right: string): boolean`, using `normalizeLocation` exact equality.

Use an initial curated list of commonly used Lusaka areas, including: Avondale, Bauleni, Chalala, Chilenje, Chalala South, Chawama, Chelstone, Foxdale, Ibex Hill, Kabulonga, Kalikiliki, Kamwala, Kanyama, Kasisi, Leopard's Hill, Libala, Lilayi, Longacres, Lusaka West, Makeni, Meanwood, Mass Media, Matero, Manda Hill, Munali, New Kasama, Nyumba Yanga, Olympia, PHI, Roma, Roma Park, Salama Park, State Lodge, Thornpark, Twin Palm, Woodlands, and Zimpat.

- [ ] Write failing normalization tests for case, whitespace, blank input, exact equality, and first-label-preserving de-duplication.
- [ ] Write a list test asserting the options are non-empty, unique under normalization, and contain core areas such as Kabulonga, Leopards Hill, Roma Park, Woodlands, and Chalala.
- [ ] Run `pnpm vitest run src/lib/locations/normalize-location.test.ts src/lib/locations/lusaka-suburbs.test.ts` and confirm the new tests fail before implementation.
- [ ] Implement the constants and pure helpers with no React, Prisma, or browser dependencies.
- [ ] Run the focused tests and commit with `feat(inquiries): add shared location option contracts`.

### Task 2: Normalize inquiry location payloads at the validation/API boundary

**Files:**
- Modify: `src/lib/validations/index.ts`
- Modify: `src/app/api/clients/route.ts`
- Modify: `src/app/api/clients/[id]/route.ts`
- Test: `src/lib/validations/location-input.test.ts`
- Test: `src/app/api/clients/location-normalization.test.ts` or the repository’s existing API test location if route tests use a shared harness.

**Interfaces:**
- `createInquirySchema` and `updateInquirySchema` continue accepting `preferredSuburbs: string[]` but reject non-strings and enforce a bounded per-value length suitable for the existing property suburb field.
- Inquiry create/update paths call `cleanLocationValues` before database writes.
- Server candidate lookup uses normalized comparison semantics and remains organization-scoped.

- [ ] Add failing validation tests for trimmed values, blank removal, duplicate values differing only by case, overlong values, and legacy valid values.
- [ ] Add failing API tests asserting a payload containing `" roma   park "` is persisted as a clean display value and a blank custom entry is omitted.
- [ ] Implement the normalization at the server boundary so non-dashboard clients receive the same behavior.
- [ ] Review the initial candidate-selection query in `src/app/api/clients/route.ts`: retain Prisma `mode: "insensitive"` for direct lookup where safe, but ensure normalized values are passed in and do not rely on UI casing.
- [ ] Apply the same helper to inquiry updates so edited inquiries cannot reintroduce inconsistent location arrays.
- [ ] Run the focused validation/API tests and `pnpm exec prisma validate` (no migration should be generated).
- [ ] Commit with `fix(inquiries): normalize preferred locations at api boundary`.

### Task 3: Build the inquiry location selector with custom entry

**Files:**
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`
- Create: `src/components/inquiries/inquiry-location-field.tsx` if extracting the field keeps the page readable; otherwise keep the implementation local to the page.
- Test: `src/components/inquiries/inquiry-location-field.test.tsx` if the repository supports component tests; otherwise add a pure payload/view-model test next to the shared location helpers.

**Interfaces:**
- The field accepts `value: string`, `onChange(value: string): void`, and optional `error`/`disabled` props.
- It exposes predefined options from `LUSAKA_SUBURBS`, an `Any location` empty option, and a `Custom location` mode.
- Selecting `Custom location` reveals a text input with an explicit label/placeholder such as `Type suburb or neighborhood`.
- On blur/submit, the field emits a trimmed custom value; empty custom input emits `""` and therefore means “Any location.”

- [ ] Add a failing interaction/payload test for selecting Kabulonga, selecting Custom location, typing `roma park`, and clearing the custom value.
- [ ] Replace the current property-derived `<select>` in the Add Inquiry form with the shared field; keep Purpose as a separate control.
- [ ] Ensure the predefined list is available even when `propertyOptions` is empty; do not use live inventory as the source of the option list.
- [ ] Keep the current payload shape (`preferredSuburbs: string[]`) by converting the single selected/custom field to either `[]` or `[value]` at submit.
- [ ] Add accessible labels, keyboard navigation, and visible custom-input validation feedback.
- [ ] Preserve the existing edit-inquiry behavior: if edit mode still uses a text/CSV input, either reuse the same field or explicitly document why it remains a multi-value editor and apply the same normalization.
- [ ] Run component/payload tests, lint the touched files, and manually inspect the Add Inquiry modal at desktop and mobile widths if browser tooling is available.
- [ ] Commit with `feat(inquiries): add Lusaka suburb and custom location input`.

### Task 4: Make every matching path use the same location semantics

**Files:**
- Modify: `src/lib/matching/inquiry-property-match.ts`
- Modify: `src/lib/matching/inquiry-property-match.test.ts`
- Modify: `src/app/api/clients/route.ts` if candidate selection needs a shared post-query filter.
- Inspect and update: `src/app/api/clients/[id]/matches/route.ts` and any score/match adapters that compare suburb strings directly.
- Test: focused matcher/API matching tests covering custom locations.

**Interfaces:**
- `inquiryMatchesProperty` uses `locationsEqual` for exact location matching and keeps the existing empty-preference wildcard behavior.
- All scored matching paths use the same normalized `preferredSuburbs` and property suburb values; no separate lowercase implementation remains.

- [ ] Add failing matcher tests for uppercase/lowercase differences, repeated spaces, apostrophe/punctuation-preserving exact matches, blank preferred values, and a near-but-not-equal suburb.
- [ ] Add a test that a custom `Roma park` value matches a property `ROMA PARK` without changing price, currency, listing type, or property-type rules.
- [ ] Replace local normalization closures with the shared helper and audit `rg -n -i "suburb.*toLowerCase|toLowerCase.*suburb|preferredSuburbs" src/lib src/app/api` for divergent comparison logic.
- [ ] Verify the complete scored inventory and strict `PROPERTY_MATCH_THRESHOLD` behavior are unchanged; only the location score/input comparison changes.
- [ ] Run `pnpm vitest run src/lib/matching/inquiry-property-match.test.ts` plus the focused route/matching tests.
- [ ] Commit with `fix(matching): share case-insensitive inquiry location comparison`.

### Task 5: End-to-end verification and rollout checklist

**Files:**
- Modify: `README.md` only if the local inquiry setup/test instructions need updating.
- Review: all files from Tasks 1–4.

- [ ] Run `pnpm vitest run` for the focused location, inquiry API, and matching suites; record any Windows stall as unverified rather than a pass.
- [ ] Run `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` separately.
- [ ] Run `git diff --check` and inspect that no Prisma migration was accidentally generated.
- [ ] Perform an authenticated browser smoke test: Add Inquiry with Kabulonga, Add Inquiry with custom `roma park`, dismiss the creation match dialog, reopen the inquiry, and verify the saved value and matching property.
- [ ] Verify empty location still creates an inquiry with no preferred suburb and matches any location under the existing rules.
- [ ] Verify a custom location from one organization cannot expose or match properties from another organization.
- [ ] Confirm existing inquiry edit, kiosk inquiry creation, public/machine ingestion, analytics location reporting, and property-derived fallback behavior remain compatible.
- [ ] Review the final diff against the current dirty working tree and ensure subscription-tier files are not included in this feature’s commit.
- [ ] Do not claim production readiness until deployed-runtime/browser evidence is available; apply the normal migration/readiness/deployment gates if a later slice changes the schema or rollout process.

## Future Slice (only if product requirements expand)

If agencies need to manage their own approved locations, promote the static list into an organization-scoped `Location` model with a canonical key, display label, active/archive state, and uniqueness on `(organizationId, normalizedKey)`. That is deliberately out of scope here: it adds CRUD, permissions, migration, and tenant-admin UX that the current request does not require.
