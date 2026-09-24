# Contour Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a secure, branded internal Control Plane for Contour owners and future platform staff.

**Architecture:** Keep platform authorization separate from agency membership/RBAC. Bootstrap owners come from `CONTOUR_CONTROL_PLANE_OWNER_EMAILS`; future staff are persisted with explicit platform roles, status, and audit records. All agency access is server-derived, time-limited where appropriate, and visibly attributable.

**Tech Stack:** Next.js App Router, Better Auth, Prisma/PostgreSQL, Zod, existing Contour editorial tokens and Tailwind classes.

**Spec:** `docs/CONTROL_PLANE_SPEC.md`

## Global Constraints

- Never trust a browser-supplied organization identifier for privileged access.
- Never expose secrets or environment values in logs or UI.
- Do not run production migrations without explicit approval.
- Preserve existing dirty work outside this isolated branch.
- Treat impersonation, billing overrides, account locking, and deletion as separate audited capabilities.

## Review Focus

- An unauthenticated or agency-only user must receive no Control Plane data.
- Email matching must be case-insensitive, trimmed, and server-side only.
- An empty bootstrap-owner environment variable must fail closed.
- The Control Plane must not claim live health or audit metrics without a connected data source.
- Future persisted staff must not gain agency owner privileges merely by being platform staff.

### Task 1: Bootstrap access foundation

**Files:**
- Create: `src/lib/control-plane.ts`
- Modify: `src/env.ts`, `.env.example`, `src/middleware.ts`
- Test: `src/lib/control-plane.test.ts`

Implement normalized owner-email parsing and a fail-closed access predicate. Protect `/admin` and `/admin/*` at the middleware boundary while retaining a later extension point for persisted platform staff.

### Task 2: Branded truthful shell

**Files:**
- Modify: `src/app/admin/page.tsx`
- Create: `src/app/admin/layout.tsx`

Replace static claims with a control-plane overview shell using existing Contour editorial tokens. Show readiness and metrics as unavailable until backed by real queries. Add navigation placeholders only for capabilities that will be implemented in later tasks.

### Task 3: Persisted platform staff and audit model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration, `src/lib/platform-authorization.ts`, API tests

Add platform staff roles/status, separate from agency `Member` records. Add immutable platform audit events with actor, target, capability, reason, request metadata, and timestamps. No destructive operations in this task.

### Task 4: Agency directory and read-only usage

**Files:**
- Create: admin API routes, pages, query helpers, tests

Add bounded, searchable agency and subscription views. Enforce role-specific field visibility and avoid returning vault/identity data to read-only operational staff.

### Task 5: Support access and impersonation

**Files:**
- Create: access-session model, routes, banner/UI, tests

Implement reason-required, expiring, auditable “view as” sessions. Keep “act as” separate and disabled until explicitly authorized by role and re-authentication.

### Task 6: Billing and account controls

**Files:**
- Create: discount/offer/account-state models and routes, UI, tests

Implement subscription adjustments, offers, suspension, lock, recovery, and soft deletion with confirmation phrases, idempotency, and audit records.

### Task 7: Verification and production gate

Run focused tests, typecheck, lint, build, migration validation, and browser checks separately. Do not claim production readiness until tenant isolation, audit completeness, and destructive-action recovery are evidenced.
