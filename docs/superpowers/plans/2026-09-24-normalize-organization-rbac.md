# Normalize Organization RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the active organization assignment the canonical source of role and permission truth, and ensure member role changes take effect consistently on subsequent requests.

**Architecture:** Keep the legacy `User.role` only as a compatibility fallback for users without an organization assignment. Resolve effective access from the active `Member`, its assigned `OrganizationRole`, and validated `MemberPermissionOverride` records. Replace route-specific role comparisons with permission checks or a single normalized management capability.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Better Auth, Vitest, Zod.

**Spec:** This plan implements the RBAC normalization audit from the Contour authorization layer.

## Global Constraints

- Preserve tenant isolation: every role/member lookup remains organization-scoped.
- Do not broaden access while replacing role checks; preserve current intended capabilities unless explicitly corrected by the permission matrix.
- Do not modify unrelated dirty worktree files.
- Validate all user-provided permission keys against the canonical permission catalogue.
- Role changes must invalidate relevant caches and be read from the database on the next request.

## Review Focus

- A user reassigned from manager to field agent must lose dashboard/member-management access immediately on the next request.
- An organization-assigned `ADMIN_STAFF`, `FINANCE_OFFICER`, or `VAULT_MANAGER` must not be overwritten by the legacy global role.
- A DENY override must remove a preset permission, and an ALLOW override must only accept known permissions.
- OWNER, organization owner membership, and legacy `SUPER_ADMIN` must resolve to the same canonical owner capability.
- Route checks must not rely on stale session role claims or hard-coded role lists when a permission expresses the capability.

### Task 1: Canonical role and permission resolver

**Files:**
- Modify: `src/lib/authorization.ts`
- Modify: `src/lib/tenant-context.ts`
- Test: `src/lib/authorization.test.ts`
- Test: `src/lib/tenant-context.test.ts`

- [ ] Add failing tests for organization assignment precedence, normalized owner mapping, ALLOW/DENY application, and unknown permission rejection.
- [ ] Run the focused tests and confirm they fail for the missing behavior.
- [ ] Add canonical permission validation and a resolver that returns the effective role plus permissions from organization assignment and overrides.
- [ ] Keep legacy global role fallback only when no organization role assignment exists.
- [ ] Run focused tests and confirm they pass.

### Task 2: Correct member role and permission mutation

**Files:**
- Modify: `src/app/api/organization/members/route.ts`
- Test: `src/app/api/organization/members/route.test.ts` (create if absent)

- [ ] Add failing tests proving role changes replace the member’s assignment, reject invalid permission keys, and clear stale overrides when requested.
- [ ] Run the tests and verify the expected failures.
- [ ] Validate permission overrides with the canonical permission enum, enforce organization-scoped role keys, and update cache/session state after role changes.
- [ ] Run focused tests and confirm the changed role is visible to a fresh tenant-context resolution.

### Task 3: Normalize route authorization

**Files:**
- Modify: `src/lib/api-handler.ts`
- Modify: routes currently using direct role comparisons, including `src/app/api/vault/documents/route.ts`, `src/app/api/vault/access/route.ts`, `src/app/api/clients/[id]/route.ts`, `src/app/api/organization/data/route.ts`
- Test: relevant authorization/API tests

- [ ] Add failing tests for dynamic organization roles reaching permission-protected routes and for demoted users losing access.
- [ ] Replace direct role comparisons with canonical permission checks or a small explicit capability helper where no existing permission expresses the rule.
- [ ] Ensure `requireRoles` evaluates the resolved organization role, not only the legacy application role.
- [ ] Run focused route tests and verify no role escalation is introduced.

### Task 4: Verification and documentation

**Files:**
- Modify: `README.md` only if role behavior/setup documentation is stale.

- [ ] Run authorization, tenant-context, API route, and full test suites.
- [ ] Run TypeScript and targeted lint checks.
- [ ] Inspect the final diff and confirm unrelated dirty files remain unstaged.
- [ ] Report any pre-existing test/environment failures separately from RBAC results.
