# Deal-Type Closing Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split Verification & Closing into rental lease handoff and sale document-closing workflows while preserving tenant-safe Vault and canonical deal transitions.

**Architecture:** The server resolves the persisted transaction type for each inquiry and returns a typed closing payload. Rental closing uses a dedicated lease handoff endpoint/service that validates inquiry, property, contact, organization, and duplicate active leases before completing Won. Sale closing extends the existing closing snapshot and Vault request linkage so configured requirements, evidence, and client-upload requests remain in one custody system.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Zod, existing Vault/MinIO upload-request flow, React client components.

**Spec:** `docs/superpowers/specs/2026-09-27-deal-type-closing-workflows-design.md`

## Global Constraints

- Resolve transaction type from persisted server-side deal data; never trust a client-selected closing mode.
- Preserve organization scoping and inquiry/property lineage checks on every read and mutation.
- Reuse the existing Vault upload-request/token flow; do not create a second document-storage system.
- Do not mark a rental deal Won unless lease persistence succeeds.
- Preserve immutable per-deal closing requirement snapshots.
- Preserve manager-only Won/Lost rules and the existing duplicate active-lease guard.
- Add rollback SQL beside every Prisma migration.

## Review Focus

- Rental inquiry has no linked property or contact: return a structured conflict and leave the deal open.
- Property already has an active lease: reject atomically without closing the deal.
- Client attempts to submit a different transaction type or foreign property: ignore/reject it server-side.
- Sale request is created with a property from another organization: reject before token creation.
- Existing document request links without an inquiry remain functional after the schema change.

---

### Task 1: Establish the server-side deal-type closing contract

**Files:**
- Modify: `src/lib/closing-workflow.ts`
- Modify: `src/lib/closing-workflow-persistence.ts`
- Modify: `src/app/api/clients/[id]/closing-workflow/route.ts`
- Modify: `src/app/api/agent/summary/route.ts` or the current summary producer identified by search
- Test: `src/lib/closing-workflow.test.ts`

**Interfaces:**
- Produce a closing payload containing `transactionType`, deal/property/client summary, and the existing workflow/readiness data.
- Keep existing sale checklist behavior unchanged while rental payloads identify the lease handoff mode.

- [ ] **Step 1: Add failing unit cases** for rental and sale transaction-type resolution, including a missing/ambiguous transaction case.
- [ ] **Step 2: Run** `pnpm exec vitest run src/lib/closing-workflow.test.ts` and confirm the new cases fail.
- [ ] **Step 3: Implement** a server-side resolver that reads the inquiry’s persisted transaction/deal lineage and normalizes `PROPERTY_SALE` vs `RENTAL_PLACEMENT`.
- [ ] **Step 4: Update** the closing GET route to return the resolver output without accepting a client mode override.
- [ ] **Step 5: Run** the focused test and `pnpm exec prisma validate`.
- [ ] **Step 6: Commit** `feat(closing): expose persisted deal closing type`.

### Task 2: Implement the rental Start Lease handoff

**Files:**
- Create: `src/lib/rental-closing.ts`
- Create: `src/app/api/clients/[id]/closing-workflow/start-lease/route.ts`
- Modify: `src/app/api/leases/route.ts` only if shared validation/extraction is required
- Test: `src/lib/rental-closing.test.ts`

**Interfaces:**
- `startRentalLease(inquiryId: string, organizationId: string, actorId: string, input: RentalLeaseInput): Promise<{ leaseId: string; inquiryId: string }>`
- Input includes lease dates, rent, deposit, payment day, and optional editable client contact fields; property, inquiry, organization, and transaction type come from the server.

- [ ] **Step 1: Add failing tests** for valid creation, missing property/contact, wrong transaction type, foreign lineage, duplicate active lease, and no Won transition on failure.
- [ ] **Step 2: Run** the focused rental test and confirm failure.
- [ ] **Step 3: Implement** Zod validation and a transaction that verifies the inquiry, property, organization, rental type, and active-lease uniqueness before creating the Lease.
- [ ] **Step 4: Complete the deal through the existing canonical transition service/boundary only after lease creation succeeds.**
- [ ] **Step 5: Run** `pnpm exec vitest run src/lib/rental-closing.test.ts src/lib/lease-workflow.test.ts`.
- [ ] **Step 6: Commit** `feat(closing): add rental start-lease handoff`.

### Task 3: Build the rental closing UI handoff

**Files:**
- Modify: `src/components/closing/closing-workflow-panel.tsx`
- Create or reuse: `src/components/closing/start-lease-dialog.tsx`
- Modify: the current deal/inquiry card that opens `ClosingWorkflowPanel`
- Test: existing component test location discovered from repository conventions

- [ ] **Step 1: Add a focused UI test** proving rental mode renders Start Lease and sale mode does not.
- [ ] **Step 2: Implement** read-only property/client context and prefilled lease fields from the server payload.
- [ ] **Step 3: Submit to the rental handoff endpoint, show pending/error/success states, refresh the parent deal, and close the panel only after success.
- [ ] **Step 4: Run** the focused UI test, lint on changed files, and typecheck.
- [ ] **Step 5: Commit** `feat(closing): add rental start-lease dialog`.

### Task 4: Link sale document requests to closing deals

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/YYYYMMDDHHMMSS_closing_document_request_linkage/migration.sql`
- Create: `prisma/migrations/YYYYMMDDHHMMSS_closing_document_request_linkage/ROLLBACK.md`
- Modify: `src/app/api/vault/requests/route.ts`
- Modify: `src/components/vault/request-document-modal.tsx`
- Test: `src/lib/document-request-status.test.ts` and a new focused request-linkage test if needed

- [ ] **Step 1: Add failing persistence/API tests** for inquiry/closing linkage, organization mismatch, and legacy property-only requests.
- [ ] **Step 2: Add nullable deal/closing linkage with indexes and rollback SQL; run** `pnpm exec prisma validate` and `pnpm exec prisma generate`.
- [ ] **Step 3: Extend request creation to accept a server-validated inquiry/closing context and preserve existing token, consent, PIN, expiry, and property behavior.
- [ ] **Step 4: Make the request modal accept a closing context and preselect property/client without allowing cross-deal reassignment.
- [ ] **Step 5: Run focused tests and `git diff --check`.
- [ ] **Step 6: Commit** `feat(vault): link client document requests to closing deals`.

### Task 5: Add sale closing evidence and request workspace

**Files:**
- Modify: `src/lib/closing-workflow-persistence.ts`
- Modify: `src/app/api/clients/[id]/closing-workflow/route.ts`
- Modify: `src/app/api/clients/[id]/closing-workflow/items/[itemKey]/route.ts`
- Create or modify: deal-scoped Vault evidence query/API identified from existing Vault routes
- Modify: `src/components/closing/closing-workflow-panel.tsx`
- Test: `src/lib/closing-workflow.test.ts` and focused API tests

- [ ] **Step 1: Add failing tests** for sale evidence visibility, missing-document request context, and tenant isolation.
- [ ] **Step 2: Implement** server-side sale evidence queries that return only linked, non-deleted documents for the inquiry/property and organization.
- [ ] **Step 3: Render** requirement status, linked evidence, upload action, and Request Missing Documents action for sale deals.
- [ ] **Step 4: Wire** request creation to the existing secure client upload portal and refresh evidence after upload/request creation.
- [ ] **Step 5: Run focused API/component tests and lint/typecheck.
- [ ] **Step 6: Commit** `feat(closing): add sale document workspace`.

### Task 6: End-to-end verification and release evidence

**Files:**
- Modify: `scripts/test-all-surfaces.ts` or add a focused script under `scripts/`
- Modify: relevant README/runbook only if setup or migration commands changed

- [ ] **Step 1: Add deterministic checks** for rental Start Lease, sale request-link generation, and tenant isolation.
- [ ] **Step 2: Run** focused tests, `pnpm exec prisma validate`, typecheck, lint, and build separately; record each result.
- [ ] **Step 3: Run browser smoke checks for both deal types, including client upload-link visibility, without claiming deployed-runtime proof.
- [ ] **Step 4: Review migration SQL and `git diff --check`.
- [ ] **Step 5: Commit** `test(closing): verify deal-type workflows`.
