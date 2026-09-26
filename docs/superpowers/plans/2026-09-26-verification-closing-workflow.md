# Verification & Closing Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an agent moves an inquiry into `VERIFICATION_CLOSING`, create a tenant-scoped closing workflow, surface the required action in the agent/manager Overview, show an unread/action badge on the Overview sidebar item, and allow an authorised manager to complete the checklist and close the deal only when it is ready.

**Architecture:** Keep `Inquiry` as the pipeline record and add a separate persisted closing-workflow aggregate with per-deal checklist-item snapshots. Each agency manages its own reusable closing-requirement templates; entering `VERIFICATION_CLOSING` snapshots the currently active template into one deal workflow, so later policy changes do not rewrite historical deals. Managers operate the workflow through command-shaped APIs; the final Won transition updates the inquiry, property, competing inquiries, and commission transaction in one database transaction. Overview and sidebar derive their action state from tenant-scoped workflow queries rather than client-only counts.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Prisma 6/PostgreSQL, Zod, Vitest, existing Better Auth authorization, AuditLog, Vault, and smart-cache patterns.

**Spec:** `docs/superpowers/specs/2026-06-14-deals-kanban-board-design.md`, `docs/superpowers/plans/2026-09-24-simplified-deal-pipeline-transition.md`, and the Verification & Closing workflow requirements in this plan.

## Global Constraints

- Every workflow, checklist item, query, mutation, notification count, and audit event is organization-scoped server-side.
- `Inquiry` remains the pipeline record; do not create a parallel `Deal` model.
- Only `VERIFICATION_CLOSING` inquiries can have an active closing workflow.
- Creating a workflow is idempotent; repeated stage transitions and refreshes must not duplicate workflows or checklist items.
- Closing requirements are organization-configurable, with safe Contour defaults seeded for new organizations.
- A deal stores a requirement snapshot; editing agency requirements affects future workflows only unless a manager explicitly applies the change to an open workflow.
- Agents can submit evidence and complete items assigned to them; only users with management authority can approve manager-only items and close the deal.
- A Won close must use the existing transition command and transaction boundary; the browser must never directly mark a property `SOLD` or create a commission transaction.
- Reuse the canonical Vault document verification state and existing `AuditLog`; do not copy files or create a second document-verification system.
- Use branded persistent dialogs/status panels, not native `alert()` or `confirm()`.
- Preserve unrelated dirty worktree changes and do not run production migrations during implementation.
- No new dependency is required.

## Review Focus

- Repeated entry into `VERIFICATION_CLOSING` must produce one workflow and one checklist set, not duplicates.
- A non-manager must not approve manager-only checks or close a ready-looking deal by calling the API directly.
- A deal with incomplete, rejected, or stale required evidence must remain blocked from Won.
- The sidebar badge and Overview action count must clear after the workflow is completed, without exposing another tenant’s count.
- Two concurrent Won requests must result in one successful close and one safe conflict/idempotent response; competing inquiries must not also become Won.
- Lost deals must preserve the checklist and audit history while recording a structured reason.
- A missing or deleted linked document must be represented as blocked, never silently treated as verified.
- An agency cannot remove a requirement that is already used by an open or closed deal; it may archive it for future workflows.

---

### Task 1: Define configurable requirement templates and workflow rules

**Files:**
- Create: `src/lib/closing-workflow.ts`
- Create: `src/lib/closing-workflow.test.ts`
- Create: `src/lib/closing-requirement-templates.ts`
- Create: `src/lib/closing-requirement-templates.test.ts`
- Modify: `src/lib/deal-workflow.ts`
- Modify: `src/lib/pipeline-transition.ts`

**Interfaces:**
- `DEFAULT_CLOSING_REQUIREMENT_TEMPLATES: readonly ClosingRequirementTemplate[]`
- `type ClosingRequirementKey = string` (organization-owned stable key, not a hardcoded global enum)
- `getDefaultClosingRequirementTemplates(): readonly ClosingRequirementTemplate[]`
- `validateClosingRequirementTemplate(input: unknown): ClosingRequirementTemplateInput`
- `getClosingChecklistDefinition(template: ClosingRequirementTemplateSnapshot): ClosingChecklistDefinition`
- `getClosingReadiness(items: readonly ClosingChecklistItemSnapshot[]): ClosingReadiness`
- `canCloseDeal(input: { role: ManagementRole; outcome: "WON" | "LOST"; readiness: ClosingReadiness; reason?: string }): ClosingDecision`
- `getClosingActionCopy(summary: ClosingWorkflowSummary): string`

- [ ] **Step 1: Write failing contract tests** covering default templates, custom agency keys, required versus optional items, agent-editable versus manager-only items, evidence type, readiness with all required items approved, readiness blocked by pending/rejected items, Won requiring readiness, and Lost requiring a reason.
- [ ] **Step 2: Run focused tests and confirm failure.**

  Run: `pnpm exec vitest run src/lib/closing-workflow.test.ts --reporter=verbose`

- [ ] **Step 3: Implement default templates and pure readiness/close decisions.** Seed defaults for Buyer identity, Seller authority, Title documents, Agreement signed, Payment confirmed, and Commission confirmed. Include optional Final handover. Allow agencies to define their own label, description, category, required flag, assignee (`AGENT` or `MANAGER`), evidence type (`NOTE`, `DOCUMENT`, `BOOLEAN`, or `AMOUNT`), and ordering.
- [ ] **Step 4: Update `deal-workflow.ts`** so entering `VERIFICATION_CLOSING` describes the generated closing action and no longer implies that “required documents” is a single boolean sufficient for final closure.
- [ ] **Step 5: Run focused tests and commit.**

  Commit: `feat(pipeline): define verification closing workflow contract`

### Task 2: Add agency requirement templates and per-deal snapshots

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_closing_workflow/migration.sql`
- Create: `prisma/migrations/<timestamp>_add_closing_workflow/ROLLBACK.md`
- Create: `src/lib/closing-requirement-service.ts`
- Create: `src/lib/closing-requirement-service.test.ts`
- Create: `src/lib/closing-workflow-persistence.ts`
- Create: `src/lib/closing-workflow-persistence.test.ts`

**Interfaces:**
- `ensureClosingWorkflow(tx, input: { organizationId: string; inquiryId: string; actorId: string }): Promise<ClosingWorkflowRecord>`
- `listClosingRequirementTemplates(organizationId: string): Promise<ClosingRequirementTemplate[]>`
- `createClosingRequirementTemplate(organizationId: string, actorId: string, input: ClosingRequirementTemplateInput): Promise<ClosingRequirementTemplate>`
- `updateClosingRequirementTemplate(organizationId: string, actorId: string, id: string, input: ClosingRequirementTemplateInput): Promise<ClosingRequirementTemplate>`
- `archiveClosingRequirementTemplate(organizationId: string, actorId: string, id: string): Promise<void>`
- `snapshotActiveClosingRequirements(tx, organizationId: string): Promise<ClosingRequirementTemplateSnapshot[]>`
- `getClosingWorkflow(organizationId: string, inquiryId: string): Promise<ClosingWorkflowView | null>`
- `assertClosingWorkflowTenant(record, organizationId): void`

- [ ] **Step 1: Add Prisma models and enums.** Add `ClosingRequirementTemplate`, `ClosingWorkflow`, and `ClosingChecklistItem`. Templates contain organizationId, stable key, label, description, category, required, assigneeType, evidenceType, sortOrder, active, createdById, and archivedAt. Workflow items contain a full snapshot of those values plus status, notes, evidence value, rejection reason, linked vault document id, submitted/approved actor ids, and timestamps. Use string keys rather than a Prisma enum so agencies can create requirements.
- [ ] **Step 2: Add uniqueness and indexes.** Enforce unique active template keys per organization; enforce one workflow per inquiry with `@@unique([organizationId, inquiryId])`; enforce one checklist item per workflow/key with `@@unique([workflowId, key])`; index organization/status and inquiry/workflow status.
- [ ] **Step 3: Write failing persistence and service tests** for default seeding, custom template CRUD, archive protection, tenant rejection, idempotent workflow creation, exact snapshot generation, template edits not changing an existing deal, and retrieval of linked document/status data.
- [ ] **Step 4: Implement template management.** Seed defaults on organization creation or lazily before first workflow; restrict create/update/archive to managers; validate labels, stable keys, sort order, evidence type, and at least one active required item.
- [ ] **Step 5: Implement `ensureClosingWorkflow`.** Inside the stage transition transaction, load the organization’s active templates, snapshot them into checklist items, and use upsert semantics without overwriting existing user progress.
- [ ] **Step 6: Add and validate the migration locally.** Run `pnpm exec prisma validate` and the focused persistence tests against the disposable local database; do not deploy to production.
- [ ] **Step 7: Commit.**

  Commit: `feat(db): persist verification closing workflows`

### Task 3: Create the stage-entry command and workflow API

**Files:**
- Modify: `src/app/api/clients/[id]/transition/route.ts`
- Create: `src/app/api/clients/[id]/closing-workflow/route.ts`
- Create: `src/app/api/clients/[id]/closing-workflow/items/[itemKey]/route.ts`
- Create: `src/app/api/clients/[id]/closing-workflow/summary/route.ts`
- Create: `src/app/api/settings/closing-requirements/route.ts`
- Modify: `src/lib/pipeline-transition-audit.ts`
- Create: `src/app/api/clients/[id]/closing-workflow/route.test.ts`

**Interfaces:**
- `POST /api/clients/:id/closing-workflow` → creates/returns the workflow; idempotent.
- `GET /api/clients/:id/closing-workflow` → returns workflow, checklist, readiness, and available actions.
- `PATCH /api/clients/:id/closing-workflow/items/:itemKey` → accepts `{ status, notes?, linkedDocumentId?, rejectionReason? }`.
- `GET /api/clients/:id/closing-workflow/summary` → returns `{ actionRequired, pendingCount, blockedCount, readyCount }` for Overview/sidebar aggregation.
- `GET /api/settings/closing-requirements` → lists active and archived agency templates for manager configuration.
- `POST/PATCH/DELETE /api/settings/closing-requirements` → manager-only create, edit, and archive commands; archive is soft-delete and cannot remove historical snapshots.

- [ ] **Step 1: Write failing route tests** for auth, organization scoping, stage restriction, idempotent POST, agent item updates, manager-only approval, invalid item keys/statuses, Vault document ownership, and response readiness.
- [ ] **Step 1a: Write failing settings route tests** for manager-only access, tenant isolation, duplicate keys, invalid evidence types, at least-one-required validation, archive behavior, and edits not mutating existing workflows.
- [ ] **Step 2: Modify the transition route** so a successful move into `VERIFICATION_CLOSING` calls `ensureClosingWorkflow` in the same transaction and writes an audit event containing workflow id and generated item count.
- [ ] **Step 3: Implement GET/POST workflow routes** using `createApiHandler`, Zod validation, tenant context, and explicit pipeline permissions.
- [ ] **Step 4: Implement item PATCH rules.** Agents may submit notes/evidence; only managers may approve/reject manager-owned items; rejected items require a reason; linked documents must belong to the same organization and be readable through the Vault authorization boundary.
- [ ] **Step 5: Recalculate readiness after every item update** and update workflow status from `OPEN` to `READY` only when all required items are approved.
- [ ] **Step 6: Add append-only audit events** for item submitted, approved, rejected, document linked, workflow ready, and workflow reopened.
- [ ] **Step 7: Run focused route tests and commit.**

  Commit: `feat(api): expose closing checklist workflow commands`

### Task 4: Build agency closing-requirement settings

**Files:**
- Create: `src/app/(dashboard)/dashboard/settings/closing-requirements/page.tsx`
- Create: `src/components/closing/closing-requirement-editor.tsx`
- Create: `src/components/closing/closing-requirement-list.tsx`
- Create: `src/components/closing/closing-requirement-settings.test.tsx`
- Modify: `src/components/workspace-sidebar.tsx` only if an existing Settings navigation group requires the link

- [ ] **Step 1: Write component tests** for default requirements, custom requirement creation, evidence-type selection, required toggle, agent/manager ownership, ordering, archive confirmation, and the warning that edits apply only to future workflows.
- [ ] **Step 2: Implement the manager settings page** using the API from Task 3; group templates by category and show active versus archived requirements.
- [ ] **Step 3: Implement the editor** with fields for label, description, category, required, assignee, evidence type, and order; use persistent branded validation feedback.
- [ ] **Step 4: Add policy copy and safety rules.** Explain that existing deals retain their snapshot, archived requirements cannot be deleted from history, and applying a new requirement to an open deal is a separate explicit manager action.
- [ ] **Step 5: Add focused tests and commit.**

  Commit: `feat(settings): configure agency closing requirements`

### Task 5: Enforce manager close and transactional Won/Lost behavior

**Files:**
- Modify: `src/app/api/clients/[id]/transition/route.ts`
- Modify: `src/lib/closing-workflow.ts`
- Modify: existing transaction/property closure helpers found by `rg -n "CLOSED_WON|Transaction.create|status:.*SOLD" src`
- Create or modify: `src/app/api/clients/[id]/transition/route.test.ts`

- [ ] **Step 1: Write failing integration tests** for manager-only Won, incomplete checklist rejection, rejected-document rejection, successful Won, duplicate concurrent Won, sold-property conflict, competing inquiry closure, commission idempotency, and Lost with reason.
- [ ] **Step 2: Add a server-side close guard** that loads the current inquiry, workflow, organization, property, and actor role inside the transaction; do not trust client-supplied readiness or outcome permissions.
- [ ] **Step 3: Implement Won closure.** Require `VERIFICATION_CLOSING`, `READY`, final value, and manager authority; set inquiry outcome/closed fields, mark the property `SOLD`, create or reuse the expected commission transaction, and close competing active inquiries as Lost with an explicit system reason.
- [ ] **Step 4: Implement Lost closure.** Require manager authority and a trimmed reason; preserve checklist/audit history, set workflow `CANCELLED` or `CLOSED` according to the chosen outcome convention, and store failure stage/reason on the inquiry.
- [ ] **Step 5: Make the transaction boundary race-safe.** Use the existing Prisma transaction pattern plus conditional updates/unique constraints so a second close cannot produce a second Won or duplicate commission.
- [ ] **Step 6: Run the focused integration suite and commit.**

  Commit: `feat(api): gate deal closure on verified readiness`

### Task 6: Build the manager closing workspace in Overview

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/closing/closing-workflow-panel.tsx`
- Create: `src/components/closing/closing-checklist-item.tsx`
- Create: `src/components/closing/closing-outcome-dialog.tsx`
- Create: `src/components/closing/closing-workflow-panel.test.tsx`

**Interfaces:**
- `ClosingWorkflowPanel({ inquiryId, mode, onCompleted }): JSX.Element`
- `ClosingChecklistItem({ item, canEdit, onUpdate }): JSX.Element`
- `ClosingOutcomeDialog({ workflow, outcome, onConfirm, onCancel }): JSX.Element`

- [ ] **Step 1: Write component tests** for pending, blocked, ready, and completed states; role-based controls; linked Vault document state; rejection reason; manager-only approval; and Won button disabled until ready.
- [ ] **Step 2: Replace the current generic “Close Handover” Overview action** for `VERIFICATION_CLOSING` records with a `Review closing` action that opens the persistent branded workflow panel.
- [ ] **Step 3: Render the panel** with deal summary, property/client, final value, checklist grouped by identity/legal/payment/close, assignee, status, notes, document links, rejection copy, last activity, and explicit next action.
- [ ] **Step 4: Add manager actions.** Approve/reject items, request correction, open the canonical Vault detail view, mark Won, or mark Lost. The panel must refresh server state after each mutation and preserve its open context.
- [ ] **Step 5: Add truthful loading/error/success states** and prevent duplicate submissions while requests are pending.
- [ ] **Step 6: Run component tests and commit.**

  Commit: `feat(overview): add manager closing workspace`

### Task 7: Add Overview action aggregation and sidebar notification badge

**Files:**
- Create: `src/app/api/dashboard/closing-actions/route.ts`
- Create: `src/lib/closing-action-summary.ts`
- Create: `src/lib/closing-action-summary.test.ts`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Modify: `src/components/workspace-sidebar.tsx`
- Modify: `src/components/mobile-bottom-nav.tsx`
- Modify: shared dashboard shell/layout files identified by `rg -n "WorkspaceSidebar|MobileBottomNav" src`

**Interfaces:**
- `getClosingActionSummary(organizationId: string, actor: ActorContext): Promise<ClosingActionSummary>`
- `GET /api/dashboard/closing-actions` → `{ total, requiringMyAction, awaitingManager, blocked, ready, items }`

- [ ] **Step 1: Write pure summary tests** for agent-submitted items, manager approvals, blocked workflows, ready workflows, closed workflows, zero actions, and tenant isolation.
- [ ] **Step 2: Implement the tenant-scoped summary query** using only active workflows and item statuses requiring the current actor’s role; return counts plus minimal safe preview fields, never PII beyond existing dashboard permissions.
- [ ] **Step 3: Add the Overview action queue entry.** Managers see `Review closing workflows` with counts and the highest-priority items; assigned agents see their required submissions. The action links to the relevant Overview section or opens the workflow panel.
- [ ] **Step 4: Add the sidebar badge** to the Overview item. Show no badge for zero, a numeric badge for 1–99, and `99+` above 99. Include an accessible label such as `Overview, 3 closing actions require attention`.
- [ ] **Step 5: Keep the badge fresh.** Invalidate or refresh the summary after workflow/item/close mutations using the existing workspace event/cache mechanism; do not poll aggressively or use a global unscoped count.
- [ ] **Step 6: Add mobile parity** to the bottom navigation and Overview action card without changing the existing visual baseline.
- [ ] **Step 7: Run focused summary tests and commit.**

  Commit: `feat(navigation): notify users about closing actions`

### Task 8: Add browser coverage, migration rehearsal, and operator documentation

**Files:**
- Create: `tests/closing-workflow.spec.ts` or the repository’s established Playwright equivalent
- Modify: `docs/superpowers/specs/2026-09-24-simplified-deal-pipeline.md`
- Create: `docs/operations/verification-closing-workflow.md`
- Modify: `README.md` only if local setup/migration commands change

- [ ] **Step 1: Add an end-to-end fixture/setup path** that creates a tenant-scoped inquiry in Negotiating, moves it to Verification & Closing, and creates the workflow without hardcoded production/demo records.
- [ ] **Step 2: Verify the desktop flow**: agent transition → Overview action appears → sidebar badge increments → manager opens workflow → submits/approves checklist → readiness changes → manager closes Won → action and badge clear.
- [ ] **Step 3: Verify blocked and Lost flows**: incomplete checklist blocks Won; rejection displays correction state; Lost requires reason and leaves an auditable closed record.
- [ ] **Step 4: Verify mobile layout at `390x844`** for readable checklist rows, reachable controls, no clipped outcome dialog, and visible Overview badge.
- [ ] **Step 5: Rehearse the additive migration** with `pnpm exec prisma migrate deploy` only against the disposable/local database, then run `pnpm exec prisma validate` and focused tests.
- [ ] **Step 6: Document the operator workflow** including who owns each checklist item, what counts as acceptable evidence, how managers reject/request correction, and how to handle a deal that cannot close.
- [ ] **Step 7: Run final verification separately:** focused Vitest, route/integration tests, Playwright, `git diff --check`, Prisma validation, and build/typecheck where the Windows environment provides reliable output. Record any stalled command as unverified rather than passing it.
- [ ] **Step 8: Commit documentation and test coverage.**

  Commit: `docs(pipeline): document verification closing operations`

## Definition of Done

- Moving an inquiry into `VERIFICATION_CLOSING` creates exactly one persisted closing workflow and checklist.
- Each agency can configure its own active closing requirements, including custom requirements and evidence types.
- Every deal stores the exact requirement snapshot that applied at stage entry; later template changes do not silently alter it.
- The Overview shows a role-appropriate action for every open workflow requiring attention.
- The Overview sidebar item displays a tenant-scoped accessible notification badge when action exists and clears when no action remains.
- Agents can submit evidence and corrections; managers can approve/reject and close.
- Won is impossible until the required checklist is ready, except through an audited manager override if that policy is explicitly retained.
- Won/Lost behavior is transactional, race-safe, auditable, and preserves existing property/commission/competing-inquiry rules.
- Vault links use existing authorization and verification state.
- Desktop and `390x844` mobile flows are browser-tested.
- Migration, tests, and operator documentation are complete without changing unrelated dirty files.
