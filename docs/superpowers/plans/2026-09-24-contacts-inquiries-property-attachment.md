# Contacts, Inquiries, and Property Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce reusable tenant-scoped contacts, require every inquiry to belong to a contact, and require a property attachment before an inquiry enters the operating pipeline.

**Architecture:** Add a Prisma `Contact` model and a required `Inquiry.contactId` relation. Backfill existing inquiries into contacts using organization plus normalized phone identity, then expose tenant-scoped contact selection through a dedicated API. Keep the current inquiry fields/API compatibility while making CRM identity come from the contact relation and enforce property requirements in the server transition boundary.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Zod, Better Auth permission handlers, Vitest, existing editorial dashboard components.

**Spec:** `docs/superpowers/specs/2026-09-24-contact-inquiry-property-design.md`

## Global Constraints

- Every contact, inquiry, and property mutation must derive organization scope from authenticated server context.
- Existing inquiry records must remain available and be backfilled during migration.
- Do not apply the migration to production automatically.
- Keep public and machine inquiry ingestion compatible while introducing contact linkage.
- Verify typecheck, focused tests, full tests, and build separately.

## Review Focus

- Cross-tenant `contactId` or `propertyId` supplied to an inquiry mutation must be rejected.
- Duplicate contacts with the same organization and normalized phone must not be created accidentally.
- Existing inquiries with missing or malformed phone values must still receive a deterministic backfilled contact.
- An inquiry without a property must not advance beyond the initial pipeline stage.
- A contact with multiple inquiries must show each inquiry without collapsing records.

### Task 1: Data model and migration contract

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_contacts_and_inquiry_links/migration.sql`
- Test: `src/lib/crm/contact-identity.test.ts`

**Interfaces:**
- Produce `Contact` with `id`, `organizationId`, `name`, `phone`, nullable `email`/`notes`, timestamps, `inquiries`, and a tenant/phone lookup index.
- Produce required `Inquiry.contactId` and `contact` relation with an inquiry/contact index.
- Produce a migration that creates contacts, backfills one contact per organization and normalized phone identity, updates every inquiry, then enforces `contact_id NOT NULL`.

- [ ] Write a failing identity-normalization test covering equivalent phone formatting and empty phone fallback.
- [ ] Run `pnpm vitest run src/lib/crm/contact-identity.test.ts` and confirm it fails before the helper exists.
- [ ] Implement a small pure contact identity helper and Prisma schema additions.
- [ ] Generate the migration SQL and inspect that the backfill is deterministic, tenant-scoped, and does not delete inquiry data.
- [ ] Run the focused identity test and `pnpm exec prisma validate`.
- [ ] Commit the model, migration, and helper test with `feat(crm): add tenant-scoped contacts to inquiries`.

### Task 2: Contact and inquiry API boundaries

**Files:**
- Create: `src/app/api/contacts/route.ts`
- Create: `src/app/api/contacts/[id]/route.ts`
- Modify: `src/app/api/clients/route.ts`
- Modify: `src/app/api/clients/[id]/route.ts`
- Modify: `src/lib/validations/index.ts`
- Test: `src/app/api/contacts/route.test.ts`
- Test: `src/app/api/clients/contact-linking.test.ts`

**Interfaces:**
- `GET /api/contacts` returns bounded, tenant-scoped contacts with inquiry counts.
- `POST /api/contacts` accepts `{ name, phone, email?, notes? }`, normalizes the phone, rejects duplicates within the organization, and returns the created contact.
- Inquiry create/update accepts `contactId`, verifies contact ownership, and returns contact details.
- Inquiry creation may omit `propertyId`; it must never accept a property from another organization.

- [ ] Add failing tests for contact creation, duplicate phone rejection, cross-tenant contact rejection, and cross-tenant property rejection.
- [ ] Run the focused API tests and confirm the new contracts fail.
- [ ] Implement Zod schemas and tenant-scoped handlers using the existing `createApiHandler` pattern.
- [ ] Update inquiry create/update to resolve the selected contact and preserve compatibility for public ingestion by resolving/creating a contact from submitted identity when authenticated organization context is available.
- [ ] Run focused API tests and `pnpm exec tsc --noEmit` for the touched contracts.
- [ ] Commit with `feat(api): expose contact and inquiry relationships`.

### Task 3: Contacts page and inquiry creation flow

**Files:**
- Create: `src/app/(dashboard)/dashboard/contacts/page.tsx`
- Modify: `src/components/workspace-sidebar.tsx`
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`
- Modify: `src/components/mobile-bottom-nav.tsx` if required by the existing navigation pattern.
- Test: `src/lib/crm/contacts-view-model.test.ts`

**Interfaces:**
- Contacts page lists contacts and has an Add Contact form.
- Inquiries page lists inquiries and has an Add Inquiry form with a required contact selector.
- Contact detail display shows inquiry count and links to the inquiries view.

- [ ] Add failing view-model tests for contact display, empty contact state, and multiple inquiries per contact.
- [ ] Implement the contacts page using existing dashboard loading, validation, and pending-state components.
- [ ] Replace inquiry creation’s free-form client identity path with contact selection, while preserving the existing inquiry qualification fields.
- [ ] Add navigation labels/routes without removing existing pipeline access.
- [ ] Run the focused view-model tests and lint the touched pages.
- [ ] Commit with `feat(crm): add contacts and inquiry creation surfaces`.

### Task 4: Pipeline property attachment enforcement

**Files:**
- Modify: `src/app/(dashboard)/dashboard/pipeline/page.tsx`
- Modify: `src/app/api/clients/route.ts`
- Modify: `src/app/api/clients/[id]/transition/route.ts`
- Modify: `src/lib/deal-workflow.ts`
- Test: `src/lib/deal-workflow.test.ts`
- Test: `src/app/api/clients/pipeline-requirements.test.ts`

**Interfaces:**
- Pipeline creation selects an existing inquiry/contact and requires a property.
- The server rejects creation or stage advancement when `contactId` is absent or when a non-initial stage has no `propertyId`.
- Property attachment is tenant-checked and remains editable before close.

- [ ] Add failing workflow/API tests for missing contact, missing property, and valid contact-plus-property progression.
- [ ] Run focused tests and confirm the missing-requirement cases fail.
- [ ] Implement the server requirement checks and update the modal labels/selection flow.
- [ ] Render the contact identity and attached property on pipeline cards.
- [ ] Run focused workflow/API tests and verify no unauthorized relationship can enter the pipeline.
- [ ] Commit with `feat(pipeline): require contact and property relationships`.

### Task 5: Integrated verification and migration review

**Files:**
- Modify: `README.md` only if local migration/setup instructions change.
- Review: all files from Tasks 1–4.

- [ ] Run `pnpm exec prisma validate`.
- [ ] Run all focused CRM/API/workflow tests.
- [ ] Run `pnpm test` with the repository’s required test environment variables.
- [ ] Run `pnpm typecheck` and record any pre-existing Windows hang or error separately.
- [ ] Run `pnpm build`.
- [ ] Run `git diff --check`, inspect the migration SQL, and verify the working tree contains only this feature.
- [ ] Do not run `prisma migrate deploy` against production without explicit approval.
