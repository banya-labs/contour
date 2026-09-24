# Grouped Role Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the long per-permission tag wall with grouped access controls while preserving role presets, individual overrides, owner protection, and record-level scope for Field Agents.

**Architecture:** Keep roles as baseline presets and permission groups as UI/API abstractions over the existing canonical permissions. The `FIELD_AGENT` role is strictly PWA-only by default; all dashboard, property, CRM, pipeline, lease, vault, and finance access is explicitly granted through grouped permissions. Add explicit scope checks for sensitive records so additional finance access remains limited to permitted records. The owner remains an immutable full-access membership.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth, Zod, Vitest, ESLint.

**Spec:** `docs/superpowers/plans/2026-09-24-grouped-role-permissions.md`

## Global Constraints

- Organization membership is the source of tenant identity; never trust a client-supplied organization ID for authorization.
- The organization owner always has all permissions and cannot be downgraded, suspended, removed, or denied through the custom editor.
- Added members start with no permissions unless a role preset or explicit grouped access is assigned.
- Field Agent is a role, not a permission; its default baseline is only `pwa.access`, `pwa.listings.create`, `pwa.listings.share`, and `pwa.inquiries.update`.
- A Field Agent must not see or enter the main dashboard unless `dashboard.read` is explicitly granted.
- Every UI restriction must have matching server-side enforcement.
- No new dependency is required.
- Preserve existing `ALLOW`/`DENY` permission override records and migrate behavior without destructive data loss.

## Review Focus

- A default Field Agent must see only the PWA and must not see the main dashboard or other operational screens.
- A Field Agent with explicit grants must access only the granted areas and assigned/owned financial records, never agency-wide finance or another agent’s earnings.
- A Field Agent must be able to receive explicit access to Clients, Deals, Rentals, Properties, and permitted Documents without receiving agency administration access.
- Selecting a preset and then editing a group must save the resulting effective permissions, not silently restore the preset.
- Selecting Custom permissions must remove the prior role assignment and persist only the selected capabilities.
- Owners must remain full-access even if stale role assignments or deny overrides already exist.

---

### Task 1: Define grouped capability contracts

**Files:**
- Create: `src/lib/authorization-groups.ts`
- Modify: `src/lib/authorization.ts`
- Test: `src/lib/authorization-groups.test.ts`

**Interfaces:**
- Produce `PERMISSION_GROUPS: readonly PermissionGroup[]`, where each group has `key`, `displayName`, `description`, and `permissions: readonly Permission[]`.
- Produce `permissionsForGroups(groupKeys: readonly PermissionGroupKey[]): readonly Permission[]`.
- Produce `groupKeysForPermissions(permissions: readonly Permission[]): PermissionGroupKey[]`.
- Produce `fieldAgentBaseline: readonly Permission[]` and `fieldAgentScope` metadata for later API checks.

- [ ] **Step 1: Write failing tests** for the nine groups: agency/team, billing, dashboard/reports, properties, clients/leads, deals/pipeline, rentals/leases, finance/statements, and documents/legal vault. Assert every canonical permission belongs to exactly one group.
- [ ] **Step 2: Run** `pnpm exec vitest run src/lib/authorization-groups.test.ts`; expect failure because the group contract does not exist.
- [ ] **Step 3: Implement** the group map from `PERMISSIONS`, preserving all current permission keys. Treat `pwa.access`, `pwa.listings.create`, `pwa.listings.share`, and `pwa.inquiries.update` as part of the Field Agent role baseline rather than a separate UI group.
- [ ] **Step 4: Add tests** proving the Field Agent baseline contains only `pwa.access`, `pwa.listings.create`, `pwa.listings.share`, and `pwa.inquiries.update`; it must exclude `dashboard.read`, all property/CRM/pipeline/lease/vault/finance permissions, team administration, billing, statement approval, and agency-wide finance management.
- [ ] **Step 5: Run** the focused tests and commit: `feat(auth): define grouped permission capabilities`.

### Task 2: Normalize role presets and effective permissions

**Files:**
- Modify: `src/lib/authorization.ts`
- Modify: `src/lib/tenant-context.ts`
- Modify: `src/app/api/organization/members/route.ts`
- Test: `src/lib/authorization.test.ts`
- Test: `src/lib/tenant-context.test.ts`

**Interfaces:**
- Produce `effectivePermissionsForMember(memberRole, assignedRole, overrides)` as the single server-side calculation used by tenant context and member listing.

- [ ] **Step 1: Write failing tests** for owner precedence, role baseline plus deny overrides, custom allow-only members, and Field Agent baseline.
- [ ] **Step 2: Run** `pnpm exec vitest run src/lib/authorization.test.ts src/lib/tenant-context.test.ts`; confirm the new cases fail against the current duplicated calculation paths.
- [ ] **Step 3: Implement** one effective-permissions function. Owner membership returns the complete `OWNER` set and ignores stale assignments/denies. Other members apply role baseline, then `ALLOW`/`DENY` overrides.
- [ ] **Step 4: Update** `GET /api/organization/members` to return grouped capability metadata, role presets, effective permissions, and a scope summary used by the UI.
- [ ] **Step 5: Update** `PATCH /api/organization/members` so preset selection replaces the role assignment, custom selection removes the role assignment, and grouped changes are persisted as minimal `ALLOW`/`DENY` overrides.
- [ ] **Step 6: Run** focused tests and commit: `refactor(auth): centralize effective permission resolution`.

### Task 3: Add record-level scope enforcement for Field Agent finance and sensitive data

**Files:**
- Modify: `src/lib/authorization.ts`
- Create: `src/lib/authorization-scope.ts`
- Modify: relevant finance/commission API routes under `src/app/api/`
- Modify: relevant client, deal, lease, and vault API routes under `src/app/api/`
- Test: `src/lib/authorization-scope.test.ts`

**Interfaces:**
- Produce `canReadFinanceRecord(actor, record)` and `canManageFinanceRecord(actor, record)`.
- Produce `scopeForRole(role)` returning `OWN`, `ASSIGNED`, or `AGENCY` for each functional area.

- [ ] **Step 1: Inventory** all finance, commission, statement, client, deal, lease, and vault list/detail/mutation routes and record the current `organizationId`, `assignedAgentId`, `createdById`, and owner relationships.
- [ ] **Step 2: Write failing tests** proving a Field Agent can read their own commission/earnings, can read assigned client/deal/lease/document records, and cannot read another agent’s private finance or agency-wide finance totals.
- [ ] **Step 3: Implement** server-side scope predicates using authenticated `userId` and tenant context. Do not implement scope only in the UI. A Field Agent with no extra grant must receive no operational records; a Field Agent with an explicit grant receives only records within that grant’s scope.
- [ ] **Step 4: Add bounded list filtering** to list endpoints and explicit `403` responses for out-of-scope detail/mutation requests.
- [ ] **Step 5: Run** route/unit tests and commit: `feat(auth): enforce role record scopes`.

### Task 4: Replace inline member tags with the grouped permissions modal

**Files:**
- Modify: `src/app/(dashboard)/dashboard/settings/page.tsx`
- Create if useful: `src/components/settings/member-permissions-dialog.tsx`
- Test: `src/components/settings/member-permissions-dialog.test.tsx` or the repository’s existing component test convention

- [ ] **Step 1: Write failing UI tests** for opening the dialog, selecting a preset, switching to Custom, toggling a group, preserving owner lock, and cancelling without saving.
- [ ] **Step 2: Implement** a `Permissions` button on each non-owner member row and remove the inline role selector/tag wall.
- [ ] **Step 3: Implement** the dialog with preset role select, grouped toggles, selected-group summary, optional advanced individual permissions, Save, Cancel, loading, error, and accessible close behavior.
- [ ] **Step 4: Keep owner rows visibly full-access but non-editable. Do not expose a misleading save control for owners. Keep a default Field Agent’s row limited to PWA access until extra groups are explicitly selected.
- [ ] **Step 5: Refresh member state after save and show the effective group summary on the row.
- [ ] **Step 6: Run** focused component tests and commit: `feat(settings): manage member access by permission groups`.

### Task 5: Align onboarding, invitations, and role defaults

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: invitation acceptance/request routes under `src/app/api/organization/`
- Modify: `src/lib/onboarding-contract.ts`
- Test: `src/lib/onboarding-contract.test.ts`

- [ ] **Step 1: Write failing tests** proving the creator becomes owner/full access and invited members start with no access unless an approved role preset is explicitly selected.
- [ ] **Step 2: Verify** Better Auth organization creation creates the owner membership and ensure the application does not replace it with the global default `FIELD_AGENT` role.
- [ ] **Step 3: Implement** invitation role handling using the canonical role preset keys and the grouped permission contract.
- [ ] **Step 4: Ensure** organization switching resolves membership role from the active organization and never leaks permissions from another organization.
- [ ] **Step 5: Run** onboarding/auth tests and commit: `fix(auth): normalize creator and invitation role defaults`.

### Task 6: Migrate and audit existing memberships

**Files:**
- Create: `scripts/audit-rbac-memberships.ts`
- Create: `scripts/repair-rbac-memberships.ts`
- Create if schema changes are required: `prisma/migrations/<timestamp>_normalize_rbac_memberships/migration.sql`
- Update: `README.md` with safe migration/run instructions

- [ ] **Step 1: Write an audit script** that reports owner members with non-owner role assignments, members with invalid permission keys, duplicate assignments, and members with no effective permissions.
- [ ] **Step 2: Run the audit in read-only mode** against the configured database; do not mutate production data automatically.
- [ ] **Step 3: Write repair logic** that promotes each organization owner to authoritative owner behavior, removes stale owner assignments, preserves non-owner custom overrides, and does not grant permissions to ordinary members.
- [ ] **Step 4: Add idempotency checks** so running repair twice produces no additional changes.
- [ ] **Step 5: Run against a test database, then document the production command** using `pnpm db:migrate:deploy` where applicable. Commit: `chore(auth): audit and normalize memberships`.

### Task 7: Full verification and handoff

**Files:**
- Modify: documentation touched by the implementation only
- Test: all affected unit/component/integration tests

- [ ] **Step 1: Run** `pnpm test` and record any unrelated baseline failure separately.
- [ ] **Step 2: Run** `pnpm run typecheck`.
- [ ] **Step 3: Run** targeted lint on every changed file; fix new errors and distinguish existing warnings/errors.
- [ ] **Step 4: Run** the browser workflow: owner creates agency, invites member, opens Permissions, selects Field Agent, disables one group, saves, reloads, and verifies the member cannot access that screen/API.
- [ ] **Step 5: Run** the Field Agent workflow across clients, deals, rentals, documents, and own finance; verify agency-wide admin/billing/other-agent finance remains unavailable.
- [ ] **Step 6: Review the final diff, commit any test/documentation fixes, and prepare a migration and deployment checklist.

## Coverage Check

- Grouped UI: Task 4.
- Preset roles and custom access: Tasks 1, 2, and 4.
- Field Agent as a PWA-only role with explicit operational grants: Tasks 1, 2, 3, and 4.
- Dashboard visibility only after `dashboard.read`: Tasks 2, 3, and 4.
- Own financial visibility without agency-wide finance: Task 3.
- Owner full-access protection: Tasks 2, 4, 5, and 6.
- Existing data normalization: Task 6.
- Browser, API, typecheck, lint, and full-suite verification: Task 7.
