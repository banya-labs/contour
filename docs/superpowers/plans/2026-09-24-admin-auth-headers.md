# Admin Authentication Headers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task.

**Goal:** Make `/admin` resolve Better Auth sessions reliably and enforce the existing control-plane allowlist without `Headers is required` Server Component failures.

**Architecture:** Normalize all Next.js request/header wrappers into concrete Web `Headers` before calling Better Auth. Keep `/admin` dynamic and server-gated: authenticate first, then allow only configured bootstrap-owner emails or active `PlatformStaff` records.

**Tech Stack:** Next.js 15 App Router, Better Auth 1.7.x, TypeScript, Prisma/PostgreSQL, Vitest, pnpm.

**Spec:** Production repeatedly logs `APIError: Headers is required` (HTTP 400) while `/admin` renders; the browser masks this as a generic Server Components error.

## Global Constraints

- Every protected Better Auth `getSession` call receives concrete request headers.
- `/admin` access remains independent from agency membership permissions.
- Only `CONTOUR_CONTROL_PLANE_OWNER_EMAILS` or an active `PlatformStaff` row grants control-plane access.
- Do not log cookies, credentials, PII, or full environment values.
- Preserve unrelated dirty-worktree changes; do not push or run production migrations.

## Review Focus

- Valid session cookie: `/admin` renders without a 400 or Server Component error.
- No session: redirect to `/sign-in`.
- Bootstrap owner: allowed without a staff row.
- Active platform staff: allowed.
- Agency owner, suspended staff, or stale cookie: denied without admin data exposure.

---

### Task 1: Confirm the deployed route and inventory unsafe session calls

**Files:**
- Inspect: `src/app/admin/**`, `src/middleware.ts`, `src/lib/auth.ts`, `src/lib/auth-headers.ts`
- Inspect: every file returned by `rg -n "auth\\.api\\.getSession" src`

- [ ] **Step 1: Verify branch/deployment alignment.** Run `git status --short --branch`, `git log -10 --oneline --decorate`, and `git grep -n "auth.api.getSession" -- src`. Confirm whether the deployed build contains `src/app/admin/layout.tsx`.
- [ ] **Step 2: Classify every occurrence** as safe (`toAuthHeaders`), unsafe (no argument), or unsafe (direct framework headers). Include middleware, pages/layouts, API routes, and shared server helpers.
- [ ] **Step 3: Capture baseline tests.** Run `pnpm exec vitest run src/lib/auth-headers.test.ts src/lib/control-plane.test.ts src/lib/api-handler.test.ts`; if a file is absent, record that instead of inventing a result.

---

### Task 2: Test and preserve the shared header boundary

**Files:**
- Modify: `src/lib/auth-headers.ts`
- Create: `src/lib/auth-headers.test.ts`

**Interface:** `toAuthHeaders(headers: HeadersInit): Headers` returns a concrete Web `Headers` while preserving cookies and authorization headers.

- [ ] **Step 1: Add failing tests** for native `Headers` and plain objects:

```ts
it("returns concrete Headers and preserves cookies", () => {
  const result = toAuthHeaders(new Headers({ cookie: "better-auth.session_token=test" }));
  expect(result).toBeInstanceOf(Headers);
  expect(result.get("cookie")).toBe("better-auth.session_token=test");
});

it("preserves authorization headers", () => {
  const result = toAuthHeaders({ authorization: "Bearer token" });
  expect(result.get("authorization")).toBe("Bearer token");
});
```

- [ ] **Step 2: Run `pnpm exec vitest run src/lib/auth-headers.test.ts` and verify the tests fail or expose missing coverage.**
- [ ] **Step 3: Keep `src/lib/auth-headers.ts` limited to `return new Headers(headers)`. Do not add auth decisions, cookie parsing, caching, or logging.**
- [ ] **Step 4: Re-run the focused header and control-plane tests; expected result is PASS.**

---

### Task 3: Repair the `/admin` server entry point

**Files:**
- Modify: `src/app/admin/layout.tsx` if present in the deployed/current route tree
- Create or modify: `src/app/admin/access-denied/page.tsx`
- Test: `src/app/admin/admin-auth.test.ts` or the closest existing admin auth test location

**Interface:** The admin server entry point consumes `auth`, `headers`, `toAuthHeaders`, `hasPersistedControlPlaneAccess`, and `hasControlPlaneAccess`; it produces dynamic authenticated admin rendering.

- [ ] **Step 1: Add tests for no session, bootstrap owner, active `PlatformStaff`, non-platform user, and suspended staff. Mock Better Auth and Prisma; do not use a production database.**
- [ ] **Step 2: Make the admin entry point dynamic and pass headers:**

```ts
export const dynamic = "force-dynamic";

const requestHeaders = await headers();
const session = await auth.api.getSession({
  headers: toAuthHeaders(requestHeaders),
});
```

- [ ] **Step 3: Authenticate before authorization.** If there is no session, redirect to `/sign-in`; otherwise evaluate `hasPersistedControlPlaneAccess(session.user.id)` and `hasControlPlaneAccess(session.user.email, persistedStaff)`.
- [ ] **Step 4: Redirect unauthorized authenticated users to the existing access-denied route (or the project’s established `/dashboard` behavior), without querying or rendering admin data.** Do not infer platform access from agency `owner` or `admin` roles.
- [ ] **Step 5: Ensure the access-denied page performs no session lookup and is dynamic if nested under an authenticated runtime layout.**
- [ ] **Step 6: Run the admin-focused tests; expected result is PASS for all five cases.**

---

### Task 4: Normalize every remaining Better Auth session call

**Files:**
- Modify every unsafe file identified in Task 1; likely candidates include `src/app/api/admin/**`, `src/app/api/access-requests/[token]/route.ts`, `src/app/api/organization/invitations/claim/route.ts`, and upload routes.
- Modify `src/lib/api-handler.ts`, `src/lib/tenant-context.ts`, and `src/middleware.ts` only where inventory confirms an unsafe call.

- [ ] **Step 1: Replace request calls with** `auth.api.getSession({ headers: toAuthHeaders(request.headers) })` and server `headers()` calls with `toAuthHeaders(await headers())`.
- [ ] **Step 2: Add a static regression check that fails on `auth.api.getSession()` with no arguments and flags direct framework headers for review.**
- [ ] **Step 3: Run `pnpm exec vitest run src/lib src/app/api/admin`; separate pre-existing failures such as missing `@powersync/web` from regressions caused by this change.**

---

### Task 5: Verify configuration and the real browser path

**Files:**
- Inspect: `.env.example`, `src/env.ts`, `src/lib/control-plane.ts`, `src/app/api/auth/[...all]/route.ts`
- Modify: deployment documentation or `.env.example` only if `CONTOUR_CONTROL_PLANE_OWNER_EMAILS` is undocumented.

- [ ] **Step 1: Confirm presence, without printing values, of `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, and `CONTOUR_CONTROL_PLANE_OWNER_EMAILS`.** Confirm the configured email matches the authenticated user after trimming/lowercasing.
- [ ] **Step 2: Run `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`; report baseline failures separately.**
- [ ] **Step 3: With a real authenticated browser session, open `/admin`, then `/admin/agencies`, verify the shell and authorized API response, sign out, revisit `/admin`, and verify redirect to `/sign-in`. Test a non-platform agency user separately.
- [ ] **Step 4: Confirm runtime logs contain none of `APIError: Headers is required`, HTTP 400 session failures, or related Server Component digests. A successful build alone is not sufficient evidence.**

---

### Task 6: Review and commit

**Files:**
- Modify: documentation only if the control-plane environment variable is undocumented.

- [ ] **Step 1: Run `git diff --check`, `git diff --stat`, and review only the auth-header, admin, middleware, tests, and documentation diff.**
- [ ] **Step 2: Commit with:**

```powershell
git add src/lib/auth-headers.ts src/lib/auth-headers.test.ts src/app/admin src/middleware.ts README.md
git commit -m "fix(admin): pass request headers to Better Auth session checks"
```

- [ ] **Step 3: Do not push or merge until explicitly authorized.**

## Completion Criteria

- [ ] No server-side Better Auth session lookup omits headers.
- [ ] `/admin` is dynamic and server-gated.
- [ ] Bootstrap owner and active platform staff paths are tested.
- [ ] Unauthorized users cannot reach admin data or APIs.
- [ ] Browser verification and clean runtime logs confirm the original production symptom is gone.
