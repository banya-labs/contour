# Pipeline Closing Workflow Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a persistent closing-workflow trigger to every deal in the final `VERIFICATION_CLOSING` pipeline stage, visible only to users who can perform closing operations, while preserving the Overview trigger.

**Architecture:** Reuse the existing `isManagementRole` authorization predicate and `ClosingWorkflowPanel`. The pipeline will read the authenticated session, derive the same management capability used by Overview, and render an explicit trigger in both responsive card layouts. No database or API changes are needed because the existing tenant-scoped closing-workflow route remains the authority.

**Tech Stack:** Next.js 15, React 19, TypeScript, Better Auth client, Vitest.

**Spec:** Existing closing workflow contract in `docs/superpowers/plans/2026-09-26-verification-closing-workflow.md`.

## Global Constraints

- Keep tenant scoping and server-side authorization unchanged.
- Do not expose the trigger to field agents or non-management roles.
- Preserve the existing Overview action and transition-time prompt.
- Do not modify unrelated dirty working-tree changes.

## Review Focus

- Final-stage deals show the trigger on mobile and desktop pipeline cards.
- Non-final-stage deals do not show a misleading closing trigger.
- Non-management users do not see the trigger.
- Opening the trigger targets the existing inquiry-specific `ClosingWorkflowPanel`.
- Existing Overview and transition prompt behavior remain unchanged.

### Task 1: Add pipeline authorization-aware trigger

**Files:**
- Modify: `src/app/(dashboard)/dashboard/pipeline/page.tsx`
- Test: `src/lib/closing-workflow.test.ts` (authorization contract coverage if needed)

**Interfaces:**
- Consumes: `authClient.useSession`, `isManagementRole`, `ClosingWorkflowPanel`.
- Produces: A visible `Open closing workflow` button for management users on every `VERIFICATION_CLOSING` deal card in both responsive layouts.

- [x] Read the existing pipeline card markup and session/authorization helpers.
- [x] Add a focused test for the management-only final-stage visibility rule.
- [x] Add session-derived `isManagement` state using `authClient.useSession` and `isManagementRole`.
- [x] Add the trigger to the mobile final-stage card and desktop final-stage card, stopping propagation and setting `closingWorkflowTarget` to that deal.
- [x] Run focused tests; repository typecheck remains unverified because it stalls on Windows without diagnostics.
- [x] Inspect the diff; unrelated dirty files were preserved.

### Task 2: Verify responsive and regression behavior

**Files:**
- Modify: none unless verification identifies an issue.

- [ ] Run the full Vitest suite; blocked by missing `BETTER_AUTH_SECRET` and subsequent Windows stall.
- [ ] Run `pnpm typecheck` and the relevant lint command for the changed pipeline file; both stall on Windows without diagnostics.
- [x] Review the final diff and verify Overview trigger code remains present.

