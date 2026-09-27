# Trustworthy Operating System Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace simulated Overview actions with durable, permissioned, auditable workflows and automatically register a lease when a rental inquiry is closed Won with the required lease details.

**Architecture:** The Overview becomes a read model of durable action items. Every button invokes a server-side command and only reports completion after the server confirms the mutation. Existing domain APIs and models are reused where they already provide the correct workflow, with focused command routes and audit events added where they do not. Rental deal closure remains protected by the closing workflow, then moves into a required lease-setup step that atomically creates the lease, links it to the winning inquiry, and preserves tenant/property consistency.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Zod, existing createApiHandler, Contour permission helpers, smartCache, audit log, Vitest.

**Spec:** This plan is the implementation specification for the approved request in this conversation.

## Global Constraints

- Never mark an action complete from client state alone; completion requires a successful server response.
- Every mutation must be organization-scoped, permission-checked, validated with Zod, and auditable.
- Rental lease creation must be idempotent and transactionally tied to the winning inquiry and property.
- A rental property may not have two active leases.
- WhatsApp dispatch must never claim delivery before the provider or queue confirms the outcome.
- Preserve unrelated working-tree changes and use the existing branch/workflow.
- Do not add a new messaging dependency until the current provider/configuration is verified and approved.
- Production migrations use committed Prisma migrations and prisma migrate deploy; never use db push.

## Review Focus

- Double-click/retry on any action must not duplicate a lease, message, payout, assignment, or notification.
- A user without the relevant permission must not see a successful mutation or bypass the server command.
- A rental deal closed Won without complete lease details must stop at an explicit lease-setup state, not silently create incomplete data.
- A provider failure must produce a visible failed/queued state and a retryable action, never a false success.
- Two users acting on the same inquiry/property concurrently must receive one authoritative result and no duplicate lease or conflicting closure.

### Task 1: Establish the durable action contract

**Files:**
- Create: src/lib/actions/action-types.ts
- Create: src/lib/actions/action-status.ts
- Create: src/lib/actions/action-audit.ts
- Test: src/lib/actions/action-types.test.ts

**Interfaces:**
- Produce ActionType, ActionStatus, priority, owner, due-date, entity-reference, and command-result types.
- Produce a stable idempotency-key convention based on organization, action type, and entity ID.

- [ ] Write failing tests for stable action identity, allowed statuses, and idempotency-key generation.
- [ ] Run the focused Vitest file and verify it fails because the contract does not exist.
- [ ] Implement the pure types and helpers without database access.
- [ ] Run the focused test and verify it passes.
- [ ] Commit: feat(actions): define durable operational action contract.

### Task 2: Replace simulated queue completion with server-confirmed state

**Files:**
- Modify: src/app/(dashboard)/dashboard/page.tsx
- Modify: src/app/api/dashboard/action-queue/route.ts
- Create: src/app/api/dashboard/actions/[type]/route.ts
- Create: src/lib/actions/action-service.ts
- Test: src/lib/actions/action-service.test.ts

**Interfaces:**
- executeDashboardAction(input: organizationId, userId, type, entityId, idempotencyKey, payload) returns a durable command result.
- Queue records expose actionType, entityId, status, priority, owner, dueAt, and total counts.
- UI uses server response state, not completedActions as its source of truth.

- [ ] Write tests proving a command is not completed when the domain mutation fails, repeated idempotency keys return the original result, and organization boundaries are enforced.
- [ ] Implement the service boundary and command route with createApiHandler, Zod payloads, permissions, and audit logging.
- [ ] Replace handleCompleteAction and browser alerts with loading, success, failed, and retry states driven by the API.
- [ ] Return pagination/count metadata when records are capped.
- [ ] Run focused tests, git diff --check, and relevant lint.
- [ ] Commit: feat(actions): make dashboard queue server-confirmed.

### Task 3: Implement real agent assignment

**Files:**
- Create: src/lib/actions/assign-inquiry.ts
- Test: src/lib/actions/assign-inquiry.test.ts
- Modify: src/app/api/dashboard/actions/[type]/route.ts
- Modify: src/app/(dashboard)/dashboard/clients/page.tsx
- Modify: src/app/api/dashboard/action-queue/route.ts

**Interfaces:**
- assignInquiry(input: organizationId, inquiryId, assignedAgentId, actorId) returns inquiryId, assignedAgentId, and status.

- [ ] Test valid assignment, tenant mismatch, inactive/non-agent assignee, and repeat assignment.
- [ ] Implement explicit assignment selection or a documented workload-aware default; persist assignedAgentId, assignment timestamp/audit, and any agreed pipeline status change.
- [ ] Update the action UI to show the server-confirmed assignee.
- [ ] Verify the new inquiry leaves the unassigned queue only after persistence.
- [ ] Commit: feat(crm): make inquiry assignment operational.

### Task 4: Implement real arrears WhatsApp action

**Files:**
- Inspect/modify the existing messaging provider integration and configuration.
- Create: src/lib/actions/send-arrears-reminder.ts
- Test: src/lib/actions/send-arrears-reminder.test.ts
- Modify: src/app/api/dashboard/actions/[type]/route.ts
- Modify: src/app/(dashboard)/dashboard/page.tsx

**Interfaces:**
- sendArrearsReminder(input: organizationId, leaseId, actorId, tier, idempotencyKey) returns QUEUED, SENT, DELIVERED, or FAILED plus reminderId and nextEligibleAt.

- [ ] Verify the configured WhatsApp provider, credentials, callback model, and RentArrearsReminder schema before implementation.
- [ ] Test the four-day cooldown, unique idempotency key, missing phone, provider failure, and retry after failure.
- [ ] Implement the reminder record and provider/queue call; never report SENT or DELIVERED from client assumptions.
- [ ] Add provider status reconciliation if delivery is asynchronous.
- [ ] Replace WhatsApp Nudge simulation with a real command and status display.
- [ ] Commit: feat(leases): make arrears reminders operational.

### Task 5: Make landlord statement approval and release real

**Files:**
- Modify: src/app/api/statements/route.ts
- Create: src/lib/actions/statement-release.ts
- Test: src/lib/actions/statement-release.test.ts
- Modify: src/app/(dashboard)/dashboard/page.tsx
- Modify: the existing statement UI as required

**Interfaces:**
- approveStatement(input: organizationId, statementId, actorId) returns a statement command result.
- releaseStatement(input: organizationId, statementId, actorId) returns a statement command result.

- [ ] Test valid state transitions, permission denial, wrong organization, repeated approval, and invalid release order.
- [ ] Separate approval, sending to landlord, and paid-out states; do not use one Sign & Release mutation for all three.
- [ ] Enforce statements.approve and appropriate finance/payment permissions server-side.
- [ ] Wire the Overview action to the correct next step based on statement status.
- [ ] Audit actor, previous status, new status, statement period, and payout amount.
- [ ] Commit: feat(statements): connect dashboard actions to statement workflow.

### Task 6: Make deed verification a real vault workflow

**Files:**
- Create: src/lib/actions/deed-verification.ts
- Test: src/lib/actions/deed-verification.test.ts
- Modify: src/app/(dashboard)/dashboard/page.tsx
- Modify: property/vault navigation as needed

**Interfaces:**
- getConveyanceDocuments(input: organizationId, transactionId) returns tenant-scoped document summaries.
- verifyConveyanceDocument(input: organizationId, documentId, actorId) returns a verified-document result.

- [ ] Test missing deed, wrong property, unauthorized verifier, repeat verification, and successful audit.
- [ ] Implement transaction-to-property vault lookup.
- [ ] Replace Check Deeds simulation with a real document review route/modal.
- [ ] Require explicit verification evidence before the action leaves the queue.
- [ ] Commit: feat(conveyance): make deed checks operational.

### Task 7: Introduce rental lease setup after Won

**Files:**
- Create: src/lib/lease-workflow.ts
- Test: src/lib/lease-workflow.test.ts
- Create: src/app/api/clients/[id]/lease-setup/route.ts
- Create: src/components/leases/lease-setup-dialog.tsx
- Modify: src/app/(dashboard)/dashboard/page.tsx
- Modify: src/app/api/dashboard/action-queue/route.ts
- Modify: prisma/schema.prisma
- Create: prisma/migrations/<timestamp>_rental_lease_setup_state/migration.sql

**Decision:** A rental deal cannot create a valid lease without dates, rent, deposit, and payment-day information. The winning transition therefore creates a durable Lease registration required action for rental inquiries. The setup dialog collects the remaining details. Submission atomically creates the lease and clears the action. This is the honest meaning of automatically register without fabricating lease terms.

- [ ] Test rental-only eligibility, required fields, winning inquiry requirement, property ownership, active-lease conflict, and idempotent retry.
- [ ] Add the minimum durable state needed to represent lease setup pending; do not overload matchStatus or outcome.
- [ ] Add migration and rollback SQL for the chosen state and indexes.
- [ ] Implement registerLeaseFromWonInquiry in one Prisma transaction:
  - Re-read the inquiry with organization, property, outcome, and rental type.
  - Require status CLOSED and outcome WON.
  - Require a rental property and reject a sale inquiry.
  - Reject an existing active lease.
  - Create the lease with inquiryId, tenant details, dates, rent, deposit, and fee.
  - Set property status to RENTED.
  - Write an audit event.
  - Mark lease-registration complete.
- [ ] Add the server route with leases.manage, Zod validation, idempotency, and conflict-safe responses.
- [ ] Add a Lease Setup dialog after rental Won and from the Overview queue when setup is incomplete.
- [ ] Commit: feat(leases): register rental lease from won inquiry.

### Task 8: Make closing and lease registration one coherent journey

**Files:**
- Modify: src/app/api/clients/[id]/transition/route.ts
- Modify: src/components/closing/closing-workflow-panel.tsx
- Modify: src/app/(dashboard)/dashboard/page.tsx
- Test: the established transition API test location

- [ ] Test rental Won producing a lease-registration-required action, sale Won producing none, incomplete setup remaining actionable, and complete setup clearing the action.
- [ ] Return the next required step after rental Won without pretending a lease exists.
- [ ] Open lease setup after rental Won while preserving inquiry/property context.
- [ ] Keep the setup action retryable when registration fails.
- [ ] Verify sale Won continues the existing commission transaction without lease setup.
- [ ] Commit: feat(closing): connect rental Won deals to lease setup.

### Task 9: Rebuild the Overview action read model

**Files:**
- Create: src/lib/actions/action-queue-service.ts
- Test: src/lib/actions/action-queue-service.test.ts
- Modify: src/app/api/dashboard/action-queue/route.ts
- Modify: src/app/(dashboard)/dashboard/page.tsx

- [ ] Test action generation, ownership, priority, due dates, caps, and permission visibility.
- [ ] Generate actions from durable state for new inquiry assignment, eligible arrears reminders, closing review, lease registration, statement approval/release, deed verification, and lease expiry.
- [ ] Return total counts and pagination metadata instead of silently truncating.
- [ ] Remove unused expiringSoonLeases data or render it as a real action with owner and destination.
- [ ] Add empty, loading, failed, retry, and stale-state UI.
- [ ] Commit: feat(dashboard): build durable operational action queue.

### Task 10: Audit and end-to-end verification

**Files:**
- Add focused tests under existing conventions.
- Modify scripts/test-all-forms.ts or add a focused action workflow script.
- Update README.md if provider/configuration setup changes.

- [ ] Run focused tests for actions, statements, notifications, closing, scoring, and lease setup.
- [ ] Run typecheck and lint separately; record Windows hangs as unverified rather than treating them as passes.
- [ ] Validate migrations against a disposable/local database.
- [ ] Browser-test assignment, arrears cooldown, statement approval/release, deed verification, management closing, rental Won to Lease Setup to Active Lease, and duplicate retry behavior.
- [ ] Verify tenant isolation, permission denial, audit entries, cache invalidation, and action disappearance only after confirmed success.
- [ ] Review the final diff for false-success copy, native alerts, unbounded queue assumptions, and untested mutation paths.
- [ ] Commit: test(actions): verify trustworthy operating workflows.

## Acceptance Criteria

- No Overview action claims success from client state or a browser alert.
- Every mutation has a server endpoint, Zod validation, organization scope, permission check, audit event, and failure state.
- Repeating a command does not duplicate its domain effect.
- New inquiries are actually assigned or remain visibly pending.
- Arrears nudges respect the four-day cooldown and expose provider status.
- Statements have separate approval, send, and payout states.
- Deed checks open and verify real vault documents.
- Closing a rental inquiry Won creates a durable lease-registration action.
- Completing lease setup creates exactly one active lease linked to the winning inquiry and property.
- Closing a sale does not create a lease.
- Lease registration failures remain retryable and never leave a false completed state.
- The Overview reports complete counts and clearly identifies capped or paginated results.

