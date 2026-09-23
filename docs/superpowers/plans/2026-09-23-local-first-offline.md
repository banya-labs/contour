# Contour Local-First Offline Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Contour's simulated browser-cache offline behavior with a tenant-safe, role-scoped SQLite/PowerSync local-first architecture and an offline-bootable PWA for field agents and supported administration workflows.

**Architecture:** PostgreSQL remains authoritative. PowerSync provides filtered read replication into encrypted client-side SQLite/WASM. An idempotent mutation outbox writes approved operational changes back through authenticated server handlers. A service worker precaches the supported app shell; sensitive vault, billing, permission, and destructive workflows remain online-only.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Prisma/PostgreSQL, `@powersync/web`, `@powersync/react`, SQLite WASM, IndexedDB/OPFS persistence, Workbox service worker, Vitest, Playwright.

**Spec:** `COMMERCIAL_LAUNCH_PLAN.md`, `DESIGN.md`, `AGENTS.md`, and the current `/kiosk` field workflow.

## Global Constraints

- Never replicate data across organizations; every sync rule and upload mutation must derive organization scope server-side.
- Never cache title deeds, NRC scans, bank details, payment secrets, or unrestricted admin data locally.
- Every offline mutation has a client-generated idempotency key and server confirmation state.
- Preserve unrelated work and do not modify the user's existing flyer branch.
- No production migration or deployment is included in this branch.
- Local-first UI must distinguish locally saved, queued, syncing, confirmed, failed, and conflict states.

## Review Focus

- Expired or revoked sessions must not silently retain sensitive local data.
- A duplicate retry must create one server record, not two.
- A user switching organizations must never see the previous organization's local rows.
- A stale manager edit must produce a visible conflict rather than overwrite authoritative data.
- A cold reload in airplane mode must boot the supported agent shell after an online install.

---

### Task 1: Baseline and dependency foundation

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `src/lib/local-first/types.ts`, `src/lib/local-first/constants.ts`
- Test: `src/lib/local-first/constants.test.ts`

- [ ] Write failing tests for supported offline routes, mutation statuses, and sensitive table exclusions.
- [ ] Run the focused test and confirm it fails because the local-first contract is absent.
- [ ] Add the official PowerSync web/react dependencies and typed constants.
- [ ] Run the focused test and typecheck.
- [ ] Commit `feat(offline): add local-first dependency and contract foundation`.

### Task 2: Real encrypted SQLite database and schema

**Files:**
- Create: `src/lib/local-first/schema.ts`, `src/lib/local-first/database.ts`, `src/lib/local-first/database.test.ts`
- Modify: `src/app/layout.tsx` and provider wiring as required

- [ ] Test database initialization, organization-scoped tables, durable persistence, and no sensitive vault columns.
- [ ] Implement PowerSyncDatabase with SQLite WASM worker persistence, encryption key injection, and lifecycle cleanup.
- [ ] Implement typed reactive query helpers for properties, clients, visits, inquiries, deals, and sync state.
- [ ] Run focused tests and typecheck.
- [ ] Commit `feat(offline): add encrypted client sqlite database`.

### Task 3: Tenant-safe PowerSync service and sync rules

**Files:**
- Create: `powersync/README.md`, `powersync/sync-rules.yaml`, `src/app/api/powersync/route.ts`
- Modify: `src/app/api/powersync/token/route.ts`, `src/env.ts`, `.env.example`
- Test: `src/lib/local-first/sync-scope.test.ts`

- [ ] Test that agent, manager, and admin scopes include only permitted organization rows and reject cross-tenant claims.
- [ ] Implement authenticated PowerSync endpoint/token configuration using real signing configuration, never the current simulated signature.
- [ ] Document the required PowerSync service connection and deployment configuration without exposing credentials.
- [ ] Run focused tests and validate environment parsing.
- [ ] Commit `feat(offline): enforce role-scoped powersync replication`.

### Task 4: Idempotent offline mutation outbox

**Files:**
- Create: `src/lib/local-first/outbox.ts`, `src/lib/local-first/outbox.test.ts`
- Create: `src/app/api/sync/mutations/route.ts`, `src/app/api/sync/mutations/route.test.ts`
- Modify: relevant property/client/visit API handlers to accept mutation IDs

- [ ] Test local queueing, retry backoff, duplicate mutation suppression, server confirmation, validation failure, and conflict states.
- [ ] Implement SQLite-backed outbox processing with bounded retries and durable error records.
- [ ] Implement one server mutation endpoint that revalidates tenant membership, role, payload, and idempotency before writing through Prisma.
- [ ] Migrate supported `/kiosk` writes to the outbox; keep unsupported sensitive actions online-only.
- [ ] Run focused tests, API tests, and typecheck.
- [ ] Commit `feat(offline): add durable idempotent mutation outbox`.

### Task 5: Replace the simulated PowerSync React provider

**Files:**
- Modify: `src/lib/powersync.tsx`
- Create: `src/lib/local-first/local-first-provider.tsx`, `src/lib/local-first/sync-status.ts`
- Test: `src/lib/local-first/sync-status.test.ts`

- [ ] Test status transitions and organization/user database reset behavior.
- [ ] Replace localStorage dataset snapshots with SQLite reactive queries and the durable outbox.
- [ ] Expose explicit local-save versus server-confirmed status and pending counts.
- [ ] Wipe the local database on sign-out, organization switch, device expiry, or failed key validation.
- [ ] Run focused tests and field component typecheck.
- [ ] Commit `refactor(offline): drive field workflows from local sqlite`.

### Task 6: Offline application shell and install readiness

**Files:**
- Create: `public/service-worker.js`, `public/offline.html`, `src/components/pwa/service-worker-registration.tsx`
- Modify: `src/app/layout.tsx`, `public/manifest.webmanifest`, `next.config.*` if required
- Test: `tests/offline-app-shell.spec.ts`

- [ ] Test cold navigation to the supported agent shell after the browser is offline.
- [ ] Implement versioned service-worker precaching for the agent shell, WASM workers, icons, fonts, and offline fallback.
- [ ] Use network-only behavior for authentication, billing, vault, payments, and sensitive API requests.
- [ ] Add update/version reporting so stale app shells cannot silently operate indefinitely.
- [ ] Run the Playwright offline shell test in Chromium and verify build output.
- [ ] Commit `feat(pwa): precache offline field application shell`.

### Task 7: Admin offline scope and UX

**Files:**
- Modify: supported dashboard components under `src/app/dashboard` and `src/components`
- Create: `src/lib/local-first/admin-scope.ts`, `src/lib/local-first/admin-scope.test.ts`

- [ ] Test that admin offline mode exposes only operational read/review and low-risk queue actions.
- [ ] Add an explicit offline dashboard mode with unavailable-action explanations.
- [ ] Keep billing, permissions, vault, destructive actions, and financial reconciliation online-only.
- [ ] Add visible sync/conflict/retry panels for managers and admins.
- [ ] Run focused tests, typecheck, and dashboard smoke tests.
- [ ] Commit `feat(admin): add scoped offline operations mode`.

### Task 8: Attachments, conflicts, and recovery

**Files:**
- Create: `src/lib/local-first/attachments.ts`, `src/lib/local-first/conflicts.ts`
- Modify: field photo capture and sync status components
- Test: corresponding unit and Playwright tests

- [ ] Test compressed field-photo queueing, upload retry, conflict presentation, and recovery after browser restart.
- [ ] Implement non-sensitive attachment queueing; keep vault documents online-only.
- [ ] Implement append-only visits/notes and explicit conflict records for mutable property/client/deal fields.
- [ ] Add recovery controls without allowing users to silently discard failed writes.
- [ ] Run focused tests and typecheck.
- [ ] Commit `feat(offline): add attachment recovery and conflict handling`.

### Task 9: Full verification and documentation

**Files:**
- Modify: `README.md`, `COMMERCIAL_LAUNCH_PLAN.md`, `docs/affine/04.3-powersync-offline-sync.md`
- Create: `tests/offline-first-e2e.spec.ts`

- [ ] Run unit tests, lint, typecheck, production build, and Playwright tests.
- [ ] Verify airplane-mode cold reload, browser restart, duplicate retry, tenant switch, expiry, and reconnect reconciliation on desktop and mobile emulation.
- [ ] Document setup, PowerSync deployment, supported offline workflows, and known online-only workflows.
- [ ] Run final security review of local data and environment configuration.
- [ ] Commit `docs(offline): document local-first operations and verification`.

