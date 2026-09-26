# Simplified Deal Pipeline Transition Implementation Plan

## Revision: 2026-09-26 mobile status picker and management closing workflow

The desktop/web surface remains a Kanban board. The agent PWA does not become
a mobile Kanban: each deal uses one prominent `Change status` button that opens
a modal listing the canonical pipeline stages. The current stage is disabled/
greyed out; selecting another stage submits the same server transition command
used by the dashboard. The modal must show pending, success, validation, and
failure/rollback states.

`Lost` is the unsuccessful terminal outcome. `Won` is the successful terminal
outcome. Both are terminal and cannot be reopened through the normal UI.

Entering `VERIFICATION_CLOSING` creates or updates one tenant-scoped management
action for the inquiry. The action remains open while the deal is in
verification/closing, is visible from both the dashboard and the agent PWA,
and is removed only when the inquiry reaches `CLOSED` with `WON` or `LOST`.
The notification is unread until management opens the action, then becomes
viewed without generating duplicate notifications for the same entry event.

The PWA and dashboard must consume one canonical server-backed deal projection;
the PWA must not render actionable inquiry records that are absent from the
local mutation source. No stage movement may be implemented as a local-only
optimistic change.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely move Contour from the current six-column inquiry board to a simple five-stage working pipeline plus a Won/Lost outcome register, with server-enforced movement rules and a clear agent-first UI.

**Architecture:** Keep `Inquiry` as the tenant-scoped pipeline record and keep property lifecycle separate. Add a central workflow configuration and transition service used by the API and UI. Use additive Prisma enum values and a staged data backfill; retain legacy enum values for rollback/read compatibility until a later cleanup migration.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Prisma 6/PostgreSQL, Zod, Vitest, existing Contour loading and authorization helpers.

**Spec:** `docs/superpowers/specs/2026-06-14-deals-kanban-board-design.md` plus the agreed six-stage simplification in the conversation.

## Global Constraints

- Pipeline records remain `Inquiry`; do not introduce a second `Deal` model.
- Property status changes to `SOLD` only after a server-authorized Won transition; other inquiries for that property are closed as lost transactionally.
- Every query and mutation is organization-scoped server-side; never trust organization IDs, display names, or client-only permissions.
- Agents may normally advance one stage at a time; backward moves and overrides require a reason and appropriate permission.
- Won and Lost are outcomes, not ordinary editable working stages.
- Do not remove legacy Prisma enum values in this migration; production enum removal requires a later two-phase cleanup.
- Preserve unrelated dirty worktree changes and do not stage them.
- Do not run production migrations during implementation; use `pnpm db:migrate:deploy` only as an explicitly approved deployment step.

## Review Focus

- Legacy inquiries using `CONTACTED`, `VIEWING_SCHEDULED`, `OFFER_MADE`, `MANAGEMENT_HANDOVER`, `CLOSED_WON`, or `CLOSED_LOST` must remain readable and map deterministically to the new workflow; test in Task 2.
- A client must not move a property to `SOLD` from the browser without a valid Won transition; test in Task 3.
- Two inquiries competing for one property must not both become Won; test transaction behavior in Task 3.
- Agents must not skip stages or override requirements through the edit modal; test API rejection and UI affordances in Tasks 3 and 5.
- A failed optimistic move must restore the original column and truthful pending/error feedback; test in Task 6.

## Canonical Workflow

The board exposes five active stages and a separate closed outcome register:

| Code | Label | Meaning | Required before exit |
|---|---|---|---|
| `NEW_INQUIRY` | New enquiry | Contact captured, not yet qualified | Client/property/agent present; qualification action recorded |
| `QUALIFIED` | Qualified | Need, budget, and fit confirmed | Budget or affordability note; next action |
| `VIEWING_OR_OFFER` | Viewing / offer | Viewing and early offer activity | Viewing outcome or reason; offer value when an offer exists |
| `NEGOTIATING` | Negotiation | Active price or terms discussion | Current value; last contact; next follow-up |
| `VERIFICATION_CLOSING` | Verification & closing | Legal, identity, payment, and signing checks | Final value and required close checklist |
| `CLOSED` + `outcome` | Won / Lost | Terminal outcome | Won: close checklist; Lost: reason |

### Allowed movement

```text
NEW_INQUIRY -> QUALIFIED -> VIEWING_OR_OFFER -> NEGOTIATING -> VERIFICATION_CLOSING -> CLOSED(WON|LOST)
```

- Normal agents may move one step forward when requirements pass.
- Agents may move backward only with a reason and only while the inquiry is not closed.
- Managers may override missing requirements with a reason; the override is audited.
- No closed inquiry may be reopened through the normal UI.
- `Won` is transactional: set the inquiry outcome, set the property `SOLD`, create the commission transaction idempotently, and close competing active inquiries as Lost.

## File Map

- Create `src/lib/deal-workflow.ts` — canonical stage codes, labels, requirements, movement helpers, and card copy.
- Create `src/lib/deal-workflow.test.ts` — pure workflow and requirement tests.
- Create `src/lib/pipeline-transition-audit.ts` — typed transition event payload and reason/override helpers if no existing activity abstraction is suitable.
- Create `prisma/migrations/<timestamp>_simplify_inquiry_pipeline/migration.sql` — additive enum values and any required transition-event/checklist fields.
- Modify `prisma/schema.prisma` — additive enum values and transition audit relation/model only if required by the final data shape.
- Modify `src/lib/pipeline-transition.ts` — delegate to the canonical workflow and expose server-safe transition validation.
- Modify `src/lib/pipeline-transition.test.ts` — replace old linear assumptions with the six-stage contract while retaining legacy mapping tests.
- Modify `src/app/api/clients/[id]/route.ts` — enforce transition permissions, requirements, reasons, and transactional Won/Lost behavior.
- Modify `src/app/api/inquiries/route.ts` — create new inquiries in `NEW_INQUIRY` and preserve duplicate/idempotency behavior.
- Create or modify a dedicated route such as `src/app/api/clients/[id]/pipeline-transition/route.ts` only if the existing PATCH contract cannot express a safe transition command without ambiguity.
- Modify `src/app/(dashboard)/dashboard/pipeline/page.tsx` — six visible columns/outcome register, next-action cards, transition drawer, and optimistic rollback.
- Create `src/components/pipeline/deal-transition-drawer.tsx` — confirmation/checklist surface for valid and invalid moves.
- Create `src/components/pipeline/deal-card.tsx` — reusable card with next action, age, owner, value, and missing requirement state.
- Create `src/components/pipeline/pipeline-stage-header.tsx` — labels, counts, stage explanation, and warning states.
- Modify `src/app/api/agent/summary/route.ts` — map the simplified stages to agent summary labels and metrics.
- Modify any dashboard/analytics queries that enumerate old status codes; locate with `rg` before implementation.
- Create `src/lib/pipeline-migration-map.ts` and test it — deterministic legacy-to-new status mapping.
- Create `scripts/audit-pipeline-migration.ts` — read-only organization-scoped counts and unmapped/invalid record report.
- Update `docs/` with the final transition contract and operator-facing rules after implementation.

### Task 1: Freeze the contract in pure workflow code

**Status:** Complete for the canonical workflow registry and focused unit tests. The existing legacy transition helper remains compatible and will be narrowed when the API migration is complete.

**Files:**
- Create: `src/lib/deal-workflow.ts`
- Test: `src/lib/deal-workflow.test.ts`
- Modify: `src/lib/pipeline-transition.ts`
- Test: `src/lib/pipeline-transition.test.ts`

**Interfaces:**
- `PIPELINE_STAGES: readonly PipelineStageDefinition[]`
- `ACTIVE_PIPELINE_STAGE_CODES`
- `getStageDefinition(stage)`
- `getStageRequirements(stage, context)`
- `canMovePipelineStage(input): TransitionDecision`
- `getNextStage(stage)`

- [ ] **Step 1: Write failing tests** for the five active stages, terminal outcomes, one-step movement, backward-reason requirement, offer/value requirements, verification requirements, and legacy status display mapping.
- [ ] **Step 2: Run focused tests** with `pnpm exec vitest run src/lib/deal-workflow.test.ts src/lib/pipeline-transition.test.ts --reporter=verbose`; confirm failure against the missing canonical workflow.
- [ ] **Step 3: Implement the workflow registry** with exact codes, labels, descriptions, ordered movement, requirement keys, and user-facing blocked reasons.
- [ ] **Step 4: Refactor `pipeline-transition.ts`** so it delegates to the registry and returns a structured decision rather than a boolean-only answer.
- [ ] **Step 5: Run focused tests** and confirm all contract tests pass.
- [ ] **Step 6: Commit** with `feat(pipeline): define simplified inquiry workflow contract`.

### Task 2: Add additive schema support and safe legacy mapping

**Status:** Additive enum migration and deterministic mapping are implemented. Read-only migration audit and data backfill remain rollout work.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_simplify_inquiry_pipeline/migration.sql`
- Create: `src/lib/pipeline-migration-map.ts`
- Test: `src/lib/pipeline-migration-map.test.ts`
- Create: `scripts/audit-pipeline-migration.ts`

**Interfaces:**
- `mapLegacyInquiryStatus(status, outcome): CanonicalPipelineState`
- `auditPipelineMigration(): Promise<PipelineMigrationAudit>`

- [ ] **Step 1: Write mapping tests** for every existing status, including `CLOSED_WON` and `CLOSED_LOST`, and assert no record loses its outcome.
- [ ] **Step 2: Run mapping tests** and confirm failure before implementation.
- [ ] **Step 3: Add enum values** `QUALIFIED`, `VIEWING_OR_OFFER`, and `VERIFICATION_CLOSING` additively; do not remove existing values.
- [ ] **Step 4: Implement deterministic mapping:** `CONTACTED -> QUALIFIED`, `VIEWING_SCHEDULED -> VIEWING_OR_OFFER`, `OFFER_MADE -> NEGOTIATING`, `MANAGEMENT_HANDOVER -> VERIFICATION_CLOSING`, and closed legacy statuses -> `CLOSED` with existing outcome.
- [ ] **Step 5: Add a read-only audit script** that reports counts by old status, target status, null/invalid outcomes, and records requiring manual review. It must not mutate data.
- [ ] **Step 6: Apply the migration only in a disposable/local database**, then run `pnpm exec prisma validate` and focused tests.
- [ ] **Step 7: Commit** with `feat(db): add simplified inquiry pipeline statuses`.

### Task 3: Enforce transitions and terminal outcomes server-side

**Status:** Command endpoint is implemented at `src/app/api/clients/[id]/transition/route.ts`; dashboard, kiosk, pipeline, and matching callers no longer use PATCH for stage movement, and legacy PATCH now rejects stage mutations. Dedicated integration tests and transition audit events remain.

**Files:**
- Modify: `src/app/api/clients/[id]/route.ts`
- Modify or create: `src/app/api/clients/[id]/pipeline-transition/route.ts`
- Modify: `src/app/api/inquiries/route.ts`
- Modify: `src/lib/pipeline-transition.ts`
- Test: route/unit tests adjacent to the existing API test conventions

- [ ] **Step 1: Write failing API tests** for tenant scope, role permission, one-step movement, missing requirements, backward reason, manager override, lost reason, and duplicate Won attempts.
- [ ] **Step 2: Run the focused API tests** and confirm the current unrestricted edit behavior fails the new contract.
- [ ] **Step 3: Implement a command-shaped transition endpoint** accepting only `{ targetStage, outcome?, reason?, overrideMissingRequirements? }`; derive current stage, organization, actor, and property from the database.
- [ ] **Step 4: Validate the transition** with the canonical workflow and Zod before any database write.
- [ ] **Step 5: Implement Won transaction behavior** using the existing property/inquiry closure logic, including sold-property rejection, competing-inquiry closure, and idempotent commission creation.
- [ ] **Step 6: Implement Lost behavior** requiring a trimmed reason and storing the relevant stage/failure metadata.
- [ ] **Step 7: Remove or narrow arbitrary stage editing** from the general client PATCH path so the transition endpoint is the only stage mutation boundary.
- [ ] **Step 8: Run focused tests and `pnpm exec prisma validate`**.
- [ ] **Step 9: Commit** with `feat(api): enforce simplified pipeline transitions`.

### Task 4: Build the transition audit trail

**Status:** Implemented using the existing append-only `AuditLog` ledger rather than adding a second transition table. Transition records now preserve actor, previous/target status, outcome, reason, override state, missing requirements, and competing inquiries closed.

**Files:**
- Create or modify: `prisma/schema.prisma`
- Create: `src/lib/pipeline-transition-audit.ts`
- Create: `src/lib/pipeline-transition-audit.test.ts`
- Modify: the transition route from Task 3

- [ ] **Step 1: Write failing tests** for forward, backward, override, Won, Lost, actor, previous stage, next stage, reason, and timestamp fields.
- [ ] **Step 2: Add the smallest append-only transition event model** linked to `Inquiry`, organization, and actor; include previous/next stage, outcome, reason, override flag, and requirement snapshot.
- [ ] **Step 3: Write the event in the same transaction** as the inquiry/property mutation.
- [ ] **Step 4: Verify tenant scoping and append-only behavior** with tests.
- [ ] **Step 5: Commit** with `feat(pipeline): audit inquiry stage transitions`.

### Task 5: Rebuild the board around next actions, not free-form editing

**Status:** Desktop Kanban remains the manager/operator surface and continues to use the shared transition endpoint. Mobile now uses a prominent `Change status` action with a greyed current stage, server-backed selection, and visible pending/error feedback. Inquiry-derived cards are normalized to the canonical stage before rendering, and the no-op mutation path is removed. Browser verification remains outstanding.

**Files:**
- Create: `src/components/pipeline/deal-card.tsx`
- Create: `src/components/pipeline/deal-transition-drawer.tsx`
- Create: `src/components/pipeline/pipeline-stage-header.tsx`
- Modify: `src/app/(dashboard)/dashboard/pipeline/page.tsx`
- Test: component tests following existing Vitest/React testing conventions

- [ ] **Step 1: Write component tests** for five active columns, outcome register, counts, empty states, missing-requirement badges, blocked movement copy, and role-gated override controls.
- [ ] **Step 2: Implement stage headers** with plain labels, short explanations, counts, and stalled/overdue indicators.
- [ ] **Step 3: Implement cards** showing buyer, property, value, assigned agent, days in stage, next action, and missing requirements.
- [ ] **Step 4: Replace the arbitrary stage select** in the edit modal with `Move to next stage`, `Move back`, `Mark won`, and `Mark lost` actions.
- [ ] **Step 5: Implement the transition drawer** showing current stage, destination, checklist, missing fields, and the exact reason a move is blocked.
- [ ] **Step 6: Keep drag-and-drop as a shortcut** but validate it through the same transition command; invalid drops must not mutate local state.
- [ ] **Step 7: Preserve optimistic movement with rollback** on API failure and truthful pending/error feedback.
- [ ] **Step 8: Add keyboard and screen-reader affordances**: buttons must be reachable without drag, status changes announced, no color-only state meaning, and focus returned after drawer close.
- [ ] **Step 9: Run focused component tests and a desktop/mobile browser smoke check**.
- [ ] **Step 10: Commit** with `feat(pipeline): simplify board navigation and transition feedback`.

### Task 6: Update mobile and agent-facing summaries

**Status:** Mobile status selection is implemented as an explicit modal rather than a native select. The agent summary now presents canonical labels and prioritizes Verification & Closing as a management review action. The dashboard action queue treats `VERIFICATION_CLOSING` as the active management handoff until `WON` or `LOST`. `LOST` is the unsuccessful terminal outcome; `WON` is successful. A full browser smoke check and notification read-state verification remain.

**Files:**
- Modify: `src/app/api/agent/summary/route.ts`
- Modify: relevant `/agent` or kiosk pipeline components found by `rg`
- Test: agent summary and mobile component tests

- [ ] **Step 1: Write tests** asserting the five canonical labels and correct priority ordering for overdue next actions.
- [ ] **Step 2: Replace old status comparisons** with the canonical workflow helpers; retain compatibility mapping for records not yet backfilled.
- [ ] **Step 3: Implement mobile navigation** as one active stage at a time with horizontal stage tabs, a sticky current-stage header, large next-action button, and full-screen transition checklist.
- [ ] **Step 4: Verify the mobile surface at `390x844`** for no clipped controls, reachable movement actions, and readable blocked-state copy.
- [ ] **Step 5: Run focused tests and commit** with `feat(agent): align mobile pipeline with simplified workflow`.

### Task 7: Controlled data rehearsal and rollout gates

**Status:** Read-only audit script implemented at `scripts/audit-pipeline-migration.ts`. It reports organization-scoped status counts and deterministic target mappings without client PII or mutations.

The guarded backfill rehearsal is implemented at `scripts/migrate-pipeline-stages.ts`; it defaults to dry-run and requires `--apply`, `CONTOUR_ENV=staging`, and `CONTOUR_PIPELINE_MIGRATION_ALLOW_WRITE=true` before mutation. No semantic rollback is claimed because legacy viewing and offer stages intentionally collapse into one stage; preserve a staging snapshot before applying.

Rollback guidance is documented in `prisma/migrations/20260924140000_simplify_inquiry_pipeline/ROLLBACK.md`.

Production rollout completed 2026-09-24 after explicit approval: migration applied, 2 legacy inquiries backfilled, post-migration audit reports zero legacy statuses and zero manual-review records, and Prisma reports the database is up to date.

Current verification note: the production build compiles successfully but fails during page collection with `PageNotFoundError: Cannot find module for page: /_document`; Next also skips type validation and linting in this run. This remains a repository verification blocker and is not attributed to the pipeline change without a clean baseline comparison.

**Files:**
- Modify: `scripts/audit-pipeline-migration.ts`
- Create: `docs/superpowers/specs/2026-09-24-simplified-deal-pipeline.md`
- Create: `docs/superpowers/rollouts/2026-09-24-simplified-deal-pipeline-rehearsal.md`

- [ ] **Step 1: Run read-only audit** against the target environment and save counts only; do not print PII or secrets.
- [ ] **Step 2: Rehearse the additive migration** against a database copy or approved staging environment.
- [ ] **Step 3: Backfill status values** in a transaction with a before/after count report and no destructive enum removal.
- [ ] **Step 4: Run API and browser verification** for create, qualify, viewing/offer, negotiation, verification, lost, won, competing inquiries, and sold-property rejection.
- [ ] **Step 5: Verify `/api/ready`, database migration status, typecheck, focused tests, and build separately.**
- [ ] **Step 6: Keep the legacy mapping path enabled for one release** and monitor unmapped status counts.
- [ ] **Step 7: Commit documentation only after the rehearsal evidence exists** with `docs(pipeline): document simplified workflow rollout`.

## Verification Commands

```powershell
pnpm exec prisma validate
pnpm exec vitest run src/lib/deal-workflow.test.ts src/lib/pipeline-transition.test.ts src/lib/pipeline-migration-map.test.ts --reporter=verbose
pnpm typecheck
pnpm lint -- src/lib/deal-workflow.ts src/lib/pipeline-transition.ts src/app/api/clients/[id]/route.ts
pnpm build
```

These checks remain separate: a passing build does not prove typecheck, lint, API authorization, migration safety, or browser behavior.

## Rollout Strategy

1. Ship additive code and enum values with legacy read mapping enabled.
2. Run the read-only audit and stage migration rehearsal.
3. Backfill existing inquiries in staging; compare counts and outcomes.
4. Enable the new board for internal users behind a feature flag or organization allow-list if the current configuration supports one.
5. Verify agent and manager workflows, including a competing-inquiry Won case.
6. Release broadly only after `/api/ready`, focused tests, typecheck, lint, build, and browser checks are independently recorded.
7. Remove legacy enum values only in a later release after all consumers are migrated and a rollback plan exists.

## Self-Review

- Covered the current persisted `Inquiry` model and existing closed-outcome behavior.
- Covered legacy status mapping and additive migration safety.
- Covered API authorization, tenant isolation, property SOLD transactionality, and competing inquiries.
- Covered agent UX, manager overrides, optimistic rollback, keyboard access, and mobile navigation.
- No production migration, destructive data operation, or unrelated worktree change is included in this plan.
