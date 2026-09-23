# Contour Loading and Action Feedback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every asynchronous Contour workflow immediate, uniform, accessible feedback using a reusable orange sun loading system while preserving existing content skeletons.

**Architecture:** Build a small shared loading-feedback layer (`ContourSunLoader`, pending button content, section state, and blocking transition) backed by CSS motion tokens and pure transition helpers. Migrate flows from the inside out: identity first, then operational mutations, then documents/management, then field/public surfaces and route boundaries. Each owning screen keeps domain state local; no global network interceptor or blanket full-screen loader is introduced.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS, existing CSS custom properties, Vitest 3, `react-dom/server`, Better Auth, PowerSync-aware field workflows.

**Spec:** `docs/superpowers/specs/2026-09-23-contour-loading-feedback-system-design.md`

## Global Constraints

- Preserve all existing page skeletons for content whose eventual shape is known.
- Use `#FA3600` for the solid Contour sun disc and existing design tokens for surrounding surfaces and text.
- Add no third-party dependency, raster loading asset, fake percentage, fake timer, or global fetch interceptor.
- Use transform and opacity animation only; no animated blur, layout property, or box shadow.
- `prefers-reduced-motion: reduce` must retain a visible static status mark and text while disabling orbit rotation and large-scale travel.
- Every visible pending state must expose operation-specific text through `role="status"` or an equivalent labelled status region.
- Errors must restore usable controls, preserve user-entered data, and use `role="alert"` when newly surfaced.
- Navigation and authentication transitions must not clear pending state before navigation or OAuth handoff completes.
- Field actions must distinguish `Saved offline — awaiting sync` from server-confirmed `Synced`.
- Use keyed pending identifiers for row/card mutations; do not freeze a whole page for one affected record.
- Do not stage, revert, or overwrite unrelated dirty work. The existing commission-rate changes overlap several target files and must be preserved.
- Use `apply_patch` for source edits and explicit path lists for every commit.

## Review Focus

- **Fast completion under 150 ms:** controls disable immediately, but delayed inline visuals must not flash after the action already completed; Task 1 tests cancellation of delayed visibility.
- **Rejected action after pending begins:** the original form data and button label return, and the error is announced; Tasks 1 and 2 test rejection cleanup.
- **Navigation that never resolves:** the transition remains truthful and does not report completion or fake progress; Task 2 tests the navigation-state contract.
- **Two row actions started near each other:** only the affected records become busy and each can resolve independently; Task 3 tests keyed pending state.
- **Offline field mutation:** local acceptance shows queued status and never claims server confirmation; Task 5 tests offline-to-synced transitions.

---

## File Structure

### Shared foundation

- Create `src/components/ui/contour-sun-loader.tsx` — branded sun mark and accessible status contract.
- Create `src/components/ui/pending-button-content.tsx` — stable inline pending content.
- Create `src/components/ui/section-pending-state.tsx` — section/modal pending presentation.
- Create `src/components/ui/contour-transition-screen.tsx` — full-screen identity/workspace transition.
- Create `src/lib/loading-feedback.ts` — pure delay, keyed-pending, and status-transition helpers.
- Create `src/components/ui/loading-feedback.test.tsx` — server-rendered accessibility/markup coverage.
- Create `src/lib/loading-feedback.test.ts` — pure state behavior and edge-case coverage.
- Modify `src/app/globals.css` — loader keyframes, size tokens, and reduced-motion rules.

### Identity and routing

- Create `src/lib/auth-transition.ts` and `src/lib/auth-transition.test.ts` — truthful authentication stage transitions.
- Modify `src/components/auth/auth-form.tsx` — credential, claim, organization, OAuth, and redirect feedback.
- Modify `src/app/onboarding/page.tsx` — workspace and invite transitions.
- Modify `src/app/accept-invitation/[id]/page.tsx` — lookup, auth, claim, and redirect states.
- Modify `src/app/request-access/[token]/page.tsx` — submit feedback and duplicate prevention.
- Create route-local loading files at `src/app/sign-in/[[...sign-in]]/loading.tsx`, `src/app/sign-up/[[...sign-up]]/loading.tsx`, and `src/app/onboarding/loading.tsx` without changing route URLs or layout groups.

### Operations

- Modify the dashboard pages for properties, pipeline, clients, sales, leases, and statements.
- Modify `src/components/properties/property-360-detail-modal.tsx`, `property-image-uploader.tsx`, `title-deed-ocr-uploader.tsx`, and `location-coordinate-picker.tsx`.

### Documents and management

- Modify vault tree/modals, documents pages, settings, billing, analytics, and print flows.

### Field and public surfaces

- Modify `src/app/(kiosk)/agent/page.tsx`, `src/app/upload/[token]/page.tsx`, and public map refresh controls.
- Create scoped loading boundaries for dashboard and field route groups only where server navigation currently exposes an empty shell.

---

### Task 1: Build the Loading Feedback Foundation

**Files:**
- Create: `src/components/ui/contour-sun-loader.tsx`
- Create: `src/components/ui/pending-button-content.tsx`
- Create: `src/components/ui/section-pending-state.tsx`
- Create: `src/components/ui/contour-transition-screen.tsx`
- Create: `src/components/ui/loading-feedback.test.tsx`
- Create: `src/lib/loading-feedback.ts`
- Create: `src/lib/loading-feedback.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `ContourSunLoader`, `PendingButtonContent`, `SectionPendingState`, `ContourTransitionScreen`.
- Produces: `createDelayedPending(delayMs)`, `setKeyPending(state, key, pending)`, and `isKeyPending(state, key)`.
- Consumes: existing Tailwind utilities and Contour CSS tokens only.

- [ ] **Step 1: Write failing component contract tests**

Create `src/components/ui/loading-feedback.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContourSunLoader } from "./contour-sun-loader";
import { PendingButtonContent } from "./pending-button-content";
import { ContourTransitionScreen } from "./contour-transition-screen";

describe("Contour loading feedback", () => {
  it("announces a non-decorative sun loader", () => {
    const html = renderToStaticMarkup(<ContourSunLoader label="Publishing property" />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Publishing property");
    expect(html).toContain("contour-sun-loader");
  });

  it("does not duplicate status text for a decorative loader", () => {
    const html = renderToStaticMarkup(<ContourSunLoader label="Saving" decorative />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="status"');
  });

  it("keeps pending button copy explicit", () => {
    const html = renderToStaticMarkup(
      <PendingButtonContent pending pendingLabel="Saving client changes">Save Changes</PendingButtonContent>,
    );
    expect(html).toContain("Saving client changes");
    expect(html).not.toContain(">Save Changes<");
  });

  it("renders a blocking transition as an announced busy region", () => {
    const html = renderToStaticMarkup(
      <ContourTransitionScreen label="Creating your account" description="Preparing your workspace." />,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Creating your account");
    expect(html).toContain("Preparing your workspace.");
  });
});
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `pnpm exec vitest run src/components/ui/loading-feedback.test.tsx --reporter=verbose`

Expected: FAIL because the four shared components do not exist.

- [ ] **Step 3: Write failing pure-state tests**

Create `src/lib/loading-feedback.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createDelayedPending, isKeyPending, setKeyPending } from "./loading-feedback";

describe("loading feedback state", () => {
  it("does not flash delayed feedback after a fast action finishes", () => {
    vi.useFakeTimers();
    const visibility: boolean[] = [];
    const pending = createDelayedPending(150, (visible) => visibility.push(visible));
    pending.start();
    pending.stop();
    vi.advanceTimersByTime(200);
    expect(visibility).toEqual([false]);
    vi.useRealTimers();
  });

  it("shows delayed feedback for a slower action and clears it", () => {
    vi.useFakeTimers();
    const visibility: boolean[] = [];
    const pending = createDelayedPending(150, (visible) => visibility.push(visible));
    pending.start();
    vi.advanceTimersByTime(150);
    pending.stop();
    expect(visibility).toEqual([true, false]);
    vi.useRealTimers();
  });

  it("tracks row actions independently", () => {
    let state: ReadonlySet<string> = new Set();
    state = setKeyPending(state, "member-a", true);
    state = setKeyPending(state, "member-b", true);
    state = setKeyPending(state, "member-a", false);
    expect(isKeyPending(state, "member-a")).toBe(false);
    expect(isKeyPending(state, "member-b")).toBe(true);
  });
});
```

- [ ] **Step 4: Run the pure-state test and verify RED**

Run: `pnpm exec vitest run src/lib/loading-feedback.test.ts --reporter=verbose`

Expected: FAIL because `loading-feedback.ts` does not exist.

- [ ] **Step 5: Implement the pure helpers**

Create `src/lib/loading-feedback.ts`:

```ts
export function createDelayedPending(delayMs: number, onVisibilityChange: (visible: boolean) => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let visible = false;
  return {
    start() {
      if (timer || visible) return;
      timer = setTimeout(() => {
        timer = null;
        visible = true;
        onVisibilityChange(true);
      }, delayMs);
    },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      visible = false;
      onVisibilityChange(false);
    },
  };
}

export function setKeyPending(state: ReadonlySet<string>, key: string, pending: boolean): ReadonlySet<string> {
  const next = new Set(state);
  if (pending) next.add(key);
  else next.delete(key);
  return next;
}

export function isKeyPending(state: ReadonlySet<string>, key: string): boolean {
  return state.has(key);
}
```

- [ ] **Step 6: Implement the four shared components**

Use this core loader structure in `src/components/ui/contour-sun-loader.tsx`:

```tsx
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  label: string;
  className?: string;
  decorative?: boolean;
};

export function ContourSunLoader({ size = "md", label, className, decorative = false }: Props) {
  return (
    <span
      className={cn("contour-sun-loader", `contour-sun-loader--${size}`, className)}
      {...(decorative ? { "aria-hidden": true } : { role: "status", "aria-live": "polite" })}
    >
      <span className="contour-sun-loader__orbit" aria-hidden="true" />
      <span className="contour-sun-loader__disc" aria-hidden="true" />
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  );
}
```

Implement `PendingButtonContent` with a stable `inline-grid` wrapper and a decorative `sm` loader. Implement `SectionPendingState` as a labelled `role="status"` panel with the `md` loader.

Implement `ContourTransitionScreen` as a `"use client"` component with a fixed, safe-area-aware `role="status" aria-busy="true"` surface, the `lg` loader, Contour wordmark, heading, and optional description. Give the heading `tabIndex={-1}`, attach a ref, and move focus to it in a mount-only `useEffect`. Consumers must render this component as a replacement for the interactive surface while the blocking stage is active so the previous controls are unmounted and cannot receive pointer or keyboard input. Do not include a skip button or progress bar.

- [ ] **Step 7: Add CSS motion and reduced-motion behavior**

Append scoped classes to `src/app/globals.css`:

```css
@keyframes contour-sun-orbit {
  to { transform: rotate(360deg); }
}

@keyframes contour-sun-breathe {
  0%, 100% { transform: scale(0.92); opacity: 0.82; }
  50% { transform: scale(1); opacity: 1; }
}

.contour-sun-loader {
  --sun-size: 1.5rem;
  position: relative;
  display: inline-grid;
  width: var(--sun-size);
  height: var(--sun-size);
  place-items: center;
  flex: none;
}

.contour-sun-loader--sm { --sun-size: 1rem; }
.contour-sun-loader--md { --sun-size: 2rem; }
.contour-sun-loader--lg { --sun-size: 4.5rem; }

.contour-sun-loader__disc {
  width: 54%;
  height: 54%;
  border-radius: 9999px;
  background: #fa3600;
  animation: contour-sun-breathe 1.35s ease-in-out infinite;
}

.contour-sun-loader__orbit {
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, #fa3600 42%, transparent);
  border-right-color: #fa3600;
  border-radius: 44% 56% 52% 48%;
  animation: contour-sun-orbit 1.8s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .contour-sun-loader__disc,
  .contour-sun-loader__orbit { animation: none; }
  .contour-sun-loader__orbit { opacity: 0.55; }
}
```

- [ ] **Step 8: Run foundation tests and typecheck the new files**

Run:

```powershell
pnpm exec vitest run src/components/ui/loading-feedback.test.tsx src/lib/loading-feedback.test.ts --reporter=verbose
pnpm exec eslint src/components/ui/contour-sun-loader.tsx src/components/ui/pending-button-content.tsx src/components/ui/section-pending-state.tsx src/components/ui/contour-transition-screen.tsx src/components/ui/loading-feedback.test.tsx src/lib/loading-feedback.ts src/lib/loading-feedback.test.ts
```

Expected: all new tests pass and targeted lint exits 0.

- [ ] **Step 9: Commit the foundation**

```powershell
git add -- src/components/ui/contour-sun-loader.tsx src/components/ui/pending-button-content.tsx src/components/ui/section-pending-state.tsx src/components/ui/contour-transition-screen.tsx src/components/ui/loading-feedback.test.tsx src/lib/loading-feedback.ts src/lib/loading-feedback.test.ts src/app/globals.css
git commit -m "feat(ui): add Contour loading feedback system"
```

---

### Task 2: Make Authentication and Onboarding Transitions Truthful

**Files:**
- Create: `src/lib/auth-transition.ts`
- Create: `src/lib/auth-transition.test.ts`
- Modify: `src/components/auth/auth-form.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/accept-invitation/[id]/page.tsx`
- Modify: `src/app/request-access/[token]/page.tsx`
- Create: route-local `loading.tsx` files under `src/app/sign-in/[[...sign-in]]/`, `src/app/sign-up/[[...sign-up]]/`, and `src/app/onboarding/`

**Interfaces:**
- Consumes: `ContourTransitionScreen`, `PendingButtonContent`, `SectionPendingState` from Task 1.
- Produces: `AuthTransitionStage` and `authTransitionCopy(stage)` for identity screens.

- [ ] **Step 1: Write the failing transition-contract tests**

Create `src/lib/auth-transition.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { authTransitionCopy, shouldBlockAuthSurface } from "./auth-transition";

describe("auth transition feedback", () => {
  it("keeps the surface blocked from successful credentials through navigation", () => {
    expect(shouldBlockAuthSurface("AUTHENTICATING")).toBe(true);
    expect(shouldBlockAuthSurface("CLAIMING_INVITATION")).toBe(true);
    expect(shouldBlockAuthSurface("ACTIVATING_ORGANIZATION")).toBe(true);
    expect(shouldBlockAuthSurface("NAVIGATING")).toBe(true);
    expect(shouldBlockAuthSurface("IDLE")).toBe(false);
    expect(shouldBlockAuthSurface("ERROR")).toBe(false);
  });

  it("never claims completion before navigation", () => {
    expect(authTransitionCopy("AUTHENTICATING").label).toBe("Signing you in…");
    expect(authTransitionCopy("CLAIMING_INVITATION").label).toBe("Checking your agency access…");
    expect(authTransitionCopy("ACTIVATING_ORGANIZATION").label).toBe("Securing your workspace…");
    expect(authTransitionCopy("NAVIGATING").label).toBe("Opening your workspace…");
  });

  it("uses account-creation copy for sign-up", () => {
    expect(authTransitionCopy("CREATING_ACCOUNT").label).toBe("Creating your account…");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run src/lib/auth-transition.test.ts --reporter=verbose`

Expected: FAIL because the transition module does not exist.

- [ ] **Step 3: Implement the transition contract**

Create `src/lib/auth-transition.ts` with this exact stage union:

```ts
export type AuthTransitionStage =
  | "IDLE"
  | "AUTHENTICATING"
  | "CREATING_ACCOUNT"
  | "CLAIMING_INVITATION"
  | "ACTIVATING_ORGANIZATION"
  | "CREATING_WORKSPACE"
  | "NAVIGATING"
  | "ERROR";

const COPY: Record<AuthTransitionStage, { label: string; description?: string }> = {
  IDLE: { label: "Ready" },
  AUTHENTICATING: { label: "Signing you in…", description: "Verifying your secure credentials." },
  CREATING_ACCOUNT: { label: "Creating your account…", description: "Setting up your secure Contour identity." },
  CLAIMING_INVITATION: { label: "Checking your agency access…", description: "Resolving invitations and membership." },
  ACTIVATING_ORGANIZATION: { label: "Securing your workspace…", description: "Activating the correct agency context." },
  CREATING_WORKSPACE: { label: "Creating your workspace…", description: "Preparing your agency operations environment." },
  NAVIGATING: { label: "Opening your workspace…", description: "Taking you to the correct Contour surface." },
  ERROR: { label: "Action could not be completed" },
};

export const authTransitionCopy = (stage: AuthTransitionStage) => COPY[stage];
export const shouldBlockAuthSurface = (stage: AuthTransitionStage) => !["IDLE", "ERROR"].includes(stage);
```

- [ ] **Step 4: Refactor the email and quick-login flows**

In `src/components/auth/auth-form.tsx`:

- Replace `isSubmitting` with `stage: AuthTransitionStage`.
- Set `CREATING_ACCOUNT` or `AUTHENTICATING` before Better Auth.
- On success, advance through `CLAIMING_INVITATION`, `ACTIVATING_ORGANIZATION`, and `NAVIGATING` around the existing operations.
- Do not reset to `IDLE` before `window.location.href`.
- On any returned or thrown error, set `ERROR`, preserve the form, then render the existing error alert.
- Render `ContourTransitionScreen` whenever `shouldBlockAuthSurface(stage)` is true after credential submission or OAuth initiation.
- Use `PendingButtonContent` in the submit and Google buttons so the initiating action responds immediately.

The success path must follow this shape:

```tsx
setStage(isSignUp ? "CREATING_ACCOUNT" : "AUTHENTICATING");
const result = isSignUp
  ? await authClient.signUp.email({ name, email, password, callbackURL: onboardingUrl })
  : await authClient.signIn.email({ email, password, rememberMe: true, callbackURL: onboardingUrl });
if (result.error) return fail(result.error.message);
setStage("CLAIMING_INVITATION");
const claim = await claimInvitation();
if (claim.organizationId) {
  setStage("ACTIVATING_ORGANIZATION");
  await authClient.organization.setActive({ organizationId: claim.organizationId });
}
setStage("NAVIGATING");
window.location.href = resolveDestination(claim);
```

- [ ] **Step 5: Migrate onboarding, invitation, and access-request states**

- `onboarding/page.tsx`: use `CREATING_WORKSPACE` for the regulatory submission and `NAVIGATING` before destination changes; keep invite-checking inside `SectionPendingState`.
- `accept-invitation/[id]/page.tsx`: show section feedback for initial lookup; use Tier 3 for claim, activation, and navigation; keep role-change confirmation interactive until the claim starts.
- `request-access/[token]/page.tsx`: use `PendingButtonContent` with `Submitting request…`, disable immediately, preserve the success result, and restore the form on rejection.

- [ ] **Step 6: Add route-local identity loading boundaries**

Each identity `loading.tsx` returns:

```tsx
import { ContourTransitionScreen } from "@/components/ui/contour-transition-screen";

export default function Loading() {
  return <ContourTransitionScreen label="Opening Contour…" description="Resolving your secure workspace." />;
}
```

Do not move the existing identity routes into a new layout group.

- [ ] **Step 7: Verify identity flows**

Run:

```powershell
pnpm exec vitest run src/lib/auth-transition.test.ts src/components/ui/loading-feedback.test.tsx --reporter=verbose
pnpm exec eslint src/lib/auth-transition.ts src/lib/auth-transition.test.ts src/components/auth/auth-form.tsx src/app/onboarding/page.tsx 'src/app/accept-invitation/[id]/page.tsx' 'src/app/request-access/[token]/page.tsx'
```

Manually verify at mobile and desktop widths:

1. Failed sign-in restores the form and announces the error.
2. Successful sign-in never returns to an idle button while claim/redirect continues.
3. Sign-up shows account then workspace copy.
4. Google initiation shows the transition immediately.

- [ ] **Step 8: Commit identity loading**

```powershell
git add -- src/lib/auth-transition.ts src/lib/auth-transition.test.ts src/components/auth/auth-form.tsx src/app/onboarding/page.tsx 'src/app/accept-invitation/[id]/page.tsx' 'src/app/request-access/[token]/page.tsx' 'src/app/sign-in/[[...sign-in]]/loading.tsx' 'src/app/sign-up/[[...sign-up]]/loading.tsx' src/app/onboarding/loading.tsx
git commit -m "feat(auth): add truthful loading transitions"
```

---

### Task 3: Migrate Core Operations and Property Workflows

**Files:**
- Modify: `src/app/(dashboard)/dashboard/properties/page.tsx`
- Modify: `src/components/properties/property-360-detail-modal.tsx`
- Modify: `src/components/properties/property-image-uploader.tsx`
- Modify: `src/components/properties/title-deed-ocr-uploader.tsx`
- Modify: `src/components/properties/location-coordinate-picker.tsx`
- Modify: `src/app/(dashboard)/dashboard/pipeline/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/sales/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/leases/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/statements/page.tsx`
- Create: `src/lib/operation-feedback.ts`
- Create: `src/lib/operation-feedback.test.ts`

**Interfaces:**
- Consumes all Task 1 presentation components and keyed-pending helpers.
- Produces `operationPendingLabel(action)` and `operationActionKey(recordId, action)`; domain pending state stays in the owning page/modal.

- [ ] **Step 1: Write the failing operation-feedback contract test**

Create `src/lib/operation-feedback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { operationActionKey, operationPendingLabel } from "./operation-feedback";

describe("operation feedback contract", () => {
  it("provides truthful labels for core mutations", () => {
    expect(operationPendingLabel("PROPERTY_PUBLISH")).toBe("Publishing property…");
    expect(operationPendingLabel("DEAL_MOVE")).toBe("Moving deal…");
    expect(operationPendingLabel("SALE_RECORD")).toBe("Recording conveyance…");
    expect(operationPendingLabel("STATEMENT_AUTHORIZE")).toBe("Authorising statement…");
  });

  it("separates actions on the same record", () => {
    expect(operationActionKey("client-1", "CLIENT_SAVE")).toBe("client-1:client-save");
    expect(operationActionKey("client-1", "CLIENT_DELETE")).toBe("client-1:client-delete");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run src/lib/operation-feedback.test.ts --reporter=verbose`

Expected: FAIL because `operation-feedback.ts` does not exist.

- [ ] **Step 3: Implement the operation-feedback contract**

Create `src/lib/operation-feedback.ts`:

```ts
export type OperationAction =
  | "PROPERTY_PUBLISH" | "PROPERTY_SAVE" | "DEAL_CREATE" | "DEAL_SAVE" | "DEAL_MOVE" | "DEAL_CLOSE"
  | "CLIENT_SAVE" | "CLIENT_DELETE" | "SALE_RECORD" | "LEASE_CREATE" | "STATEMENT_CREATE" | "STATEMENT_AUTHORIZE";

const LABELS: Record<OperationAction, string> = {
  PROPERTY_PUBLISH: "Publishing property…",
  PROPERTY_SAVE: "Saving property…",
  DEAL_CREATE: "Creating deal…",
  DEAL_SAVE: "Saving deal…",
  DEAL_MOVE: "Moving deal…",
  DEAL_CLOSE: "Closing deal…",
  CLIENT_SAVE: "Saving client changes…",
  CLIENT_DELETE: "Deleting client…",
  SALE_RECORD: "Recording conveyance…",
  LEASE_CREATE: "Creating lease…",
  STATEMENT_CREATE: "Generating statement…",
  STATEMENT_AUTHORIZE: "Authorising statement…",
};

export const operationPendingLabel = (action: OperationAction) => LABELS[action];
export const operationActionKey = (recordId: string, action: OperationAction) =>
  `${recordId}:${action.toLowerCase().replaceAll("_", "-")}`;
```

Run the test again and expect PASS before changing product screens.

- [ ] **Step 4: Add property creation and edit feedback**

- Add `isPublishing` to the property catalogue and set it around `handleCreateProperty` with `try/finally`.
- Disable modal close and submit while publishing.
- Replace button content with `<PendingButtonContent pending={isPublishing} pendingLabel="Publishing property…">Publish Listing</PendingButtonContent>`.
- Keep the existing skeleton for initial property loading.
- Replace edit-modal `Loader2` with `PendingButtonContent` using `Saving property…`.
- For image upload/removal, track pending by image identifier and use `SectionPendingState` or the `sm` sun within the affected tile.
- For OCR and location search, replace rotating navigation/refresh icons with the `md`/`sm` sun while keeping result and error panels unchanged.

- [ ] **Step 5: Add pipeline mutation feedback**

Use one `ReadonlySet<string>` state named `pendingDealActions`. Wrap each mutation key with `setKeyPending`:

```tsx
const actionKey = `${dealId}:move`;
setPendingDealActions((state) => setKeyPending(state, actionKey, true));
try {
  await updateDealStage(dealId, nextStage);
} finally {
  setPendingDealActions((state) => setKeyPending(state, actionKey, false));
}
```

- Show `Moving deal…` only on the affected card.
- Add `Creating deal…`, `Saving deal…`, and `Closing deal…` pending labels to the three modal actions.
- Disable close/outcome controls during the owning mutation.
- Preserve current local form values when a request fails.

- [ ] **Step 6: Add client, sale, lease, and statement feedback**

- Clients: keep existing edit pending state but replace spinner markup; add keyed `Deleting client…` confirmation state.
- Sales: add `isRecordingSale`; render `Recording conveyance…`; lock the modal until success/error.
- Leases: add `isCreatingLease`; render `Creating lease…` and preserve the form on failure.
- Statements: add `isCreatingStatement` plus keyed authorization state `${statementId}:authorize`; replace spinning `Bot` with the sun mark.

Every handler must use the same error-safe control flow. For example, property publication uses:

```tsx
setPending(true);
setError("");
try {
  const response = await fetch("/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || "Action failed.");
  // existing success state
} catch (error) {
  setError(error instanceof Error ? error.message : "Action failed.");
} finally {
  setPending(false);
}
```

Navigation-success branches are the only exception: they keep pending until navigation.

- [ ] **Step 7: Run core-operation verification**

Run:

```powershell
pnpm exec vitest run src/lib/loading-feedback.test.ts src/lib/operation-feedback.test.ts --reporter=verbose
pnpm exec eslint 'src/app/(dashboard)/dashboard/properties/page.tsx' src/components/properties/property-360-detail-modal.tsx src/components/properties/property-image-uploader.tsx src/components/properties/title-deed-ocr-uploader.tsx src/components/properties/location-coordinate-picker.tsx 'src/app/(dashboard)/dashboard/pipeline/page.tsx' 'src/app/(dashboard)/dashboard/clients/page.tsx' 'src/app/(dashboard)/dashboard/sales/page.tsx' 'src/app/(dashboard)/dashboard/leases/page.tsx' 'src/app/(dashboard)/dashboard/statements/page.tsx'
```

Expected: new regression tests pass. Record the repository's existing lint findings separately from new findings; do not call an existing red lint baseline clean.

- [ ] **Step 8: Commit core-operation feedback**

Stage the explicit files above plus `src/lib/operation-feedback.ts` and `src/lib/operation-feedback.test.ts`. Confirm `git diff --cached --name-only` contains no unrelated files, then commit:

```powershell
git commit -m "feat(operations): standardize pending action feedback"
```

---

### Task 4: Migrate Documents, Settings, Billing, and Analytics

**Files:**
- Modify: `src/components/vault/vault-tree.tsx`
- Modify: `src/components/vault/vault-access-modal.tsx`
- Modify: `src/components/vault/upload-document-modal.tsx`
- Modify: `src/components/vault/request-document-modal.tsx`
- Modify: `src/components/vault/folder-collaborators-modal.tsx`
- Modify: `src/components/vault/document-details-modal.tsx`
- Modify: `src/app/(dashboard)/dashboard/documents/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/documents/access/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/settings/page.tsx`
- Modify: `src/components/auth/mfa-setup-dialog.tsx`
- Modify: `src/app/(dashboard)/dashboard/billing/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/analytics/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/analytics/print/page.tsx`
- Modify: `src/lib/operation-feedback.ts`
- Modify: `src/lib/operation-feedback.test.ts`

**Interfaces:**
- Consumes Task 1 components and keyed helpers.
- Extends Task 3's operation-feedback contract for management actions.
- Keeps file-specific upload status objects as the source of truth; the shared loader is presentation only.

- [ ] **Step 1: Write failing management-action label tests**

Append to `src/lib/operation-feedback.test.ts`:

```ts
it("provides truthful labels for vault and management mutations", () => {
  expect(operationPendingLabel("DOCUMENT_UPLOAD")).toBe("Uploading document…");
  expect(operationPendingLabel("DOCUMENT_VERIFY")).toBe("Verifying document…");
  expect(operationPendingLabel("MEMBER_ROLE_CHANGE")).toBe("Updating member role…");
  expect(operationPendingLabel("CHECKOUT_CREATE")).toBe("Preparing secure checkout…");
  expect(operationPendingLabel("REPORT_GENERATE")).toBe("Generating report…");
});
```

Run: `pnpm exec vitest run src/lib/operation-feedback.test.ts --reporter=verbose`

Expected: FAIL because those action literals and labels do not exist.

- [ ] **Step 2: Extend the operation-feedback contract**

Add these literals to `OperationAction` and exact entries to `LABELS`:

```ts
| "DOCUMENT_UPLOAD" | "DOCUMENT_DOWNLOAD" | "DOCUMENT_VERIFY" | "DOCUMENT_DELETE" | "DOCUMENT_REQUEST"
| "COLLABORATOR_ADD" | "COLLABORATOR_REMOVE" | "VAULT_ACCESS_UPDATE" | "LOGO_UPLOAD"
| "ACCESS_LINK_CREATE" | "ACCESS_REQUEST_APPROVE" | "ACCESS_REQUEST_DECLINE"
| "MEMBER_ROLE_CHANGE" | "MEMBER_SUSPEND" | "MEMBER_DELETE" | "INVITATION_CREATE" | "INVITATION_REVOKE"
| "MFA_ENABLE" | "MFA_VERIFY" | "MFA_DISABLE" | "CHECKOUT_CREATE" | "ANALYTICS_REFRESH" | "REPORT_GENERATE"
```

Add these exact entries to `LABELS`:

```ts
DOCUMENT_UPLOAD: "Uploading document…",
DOCUMENT_DOWNLOAD: "Preparing download…",
DOCUMENT_VERIFY: "Verifying document…",
DOCUMENT_DELETE: "Deleting document…",
DOCUMENT_REQUEST: "Creating secure request…",
COLLABORATOR_ADD: "Adding collaborator…",
COLLABORATOR_REMOVE: "Removing collaborator…",
VAULT_ACCESS_UPDATE: "Updating vault access…",
LOGO_UPLOAD: "Uploading agency logo…",
ACCESS_LINK_CREATE: "Creating access link…",
ACCESS_REQUEST_APPROVE: "Approving access request…",
ACCESS_REQUEST_DECLINE: "Declining access request…",
MEMBER_ROLE_CHANGE: "Updating member role…",
MEMBER_SUSPEND: "Updating member access…",
MEMBER_DELETE: "Removing member…",
INVITATION_CREATE: "Creating invitation…",
INVITATION_REVOKE: "Revoking invitation…",
MFA_ENABLE: "Enabling MFA…",
MFA_VERIFY: "Verifying code…",
MFA_DISABLE: "Disabling MFA…",
CHECKOUT_CREATE: "Preparing secure checkout…",
ANALYTICS_REFRESH: "Refreshing analytics…",
REPORT_GENERATE: "Generating report…",
```

Run the test again and expect PASS.

- [ ] **Step 3: Replace vault spinner variants without flattening state**

- `vault-tree.tsx`: use keyed action IDs `${docId}:download`, `${docId}:delete`, and `${docId}:verify`; show the sun only beside the affected action.
- `upload-document-modal.tsx`: replace `Loader2` with `PendingButtonContent`; retain filename, archived-state restriction, and upload errors.
- `request-document-modal.tsx`: use `Creating secure request…` and keep the generated link visible after success.
- `folder-collaborators-modal.tsx`: use `${memberId}:remove` for removals and `add` for the add form so one removal does not disable every row.
- `document-details-modal.tsx`: use `SectionPendingState` for preview/extraction and inline sun marks for download/verify actions.
- `vault-access-modal.tsx` and documents access page: key pending state by user ID.

- [ ] **Step 4: Migrate settings actions to keyed feedback**

Create a single `pendingSettingsActions` set and these keys:

```ts
"logo:upload"
"access-link:create"
`${requestId}:approve`
`${requestId}:decline`
`${memberId}:role`
`${memberId}:suspend`
`${memberId}:delete`
"invitation:create"
`${invitationId}:revoke`
"mfa:disable"
```

Each row renders its own `PendingButtonContent`; only conflicting controls on that row are disabled. Preserve confirmation dialogs until success or failure is resolved.

- [ ] **Step 5: Migrate billing and MFA transitions**

- MFA setup: `Enabling MFA…` and `Verifying code…` within the dialog; do not clear the entered code on a recoverable server error.
- Billing initial data retains its existing page state.
- Checkout/plan change uses inline `Preparing secure checkout…`, then `ContourTransitionScreen label="Opening secure checkout…"` once the external navigation URL is accepted.
- If checkout creation fails, remove the transition, restore the button, and announce the server error.

- [ ] **Step 6: Migrate analytics and print actions**

- Keep the existing report visible during AI refresh, set the report container `aria-busy="true"`, and show a compact `SectionPendingState label="Refreshing analytics…"` without erasing stale data.
- Replace the spinning `Sparkles` and `RefreshCw` icons.
- Replace the print page border spinner and `Loader2` with `PendingButtonContent` labelled `Generating report…`.

- [ ] **Step 7: Verify management surfaces**

Run targeted tests from Tasks 1–3 and targeted ESLint over every Task 4 file. Manually exercise one success and one forced failure for upload, collaborator removal, member role change, checkout creation, and PDF generation. Confirm each failure restores only its owning control.

- [ ] **Step 8: Commit management feedback**

Stage only the Task 4 files and commit:

```powershell
git commit -m "feat(management): unify loading feedback"
```

---

### Task 5: Add Offline-Honest Field and Public Loading States

**Files:**
- Create: `src/lib/field-sync-feedback.ts`
- Create: `src/lib/field-sync-feedback.test.ts`
- Modify: `src/app/(kiosk)/agent/page.tsx`
- Modify: `src/app/upload/[token]/page.tsx`
- Modify: `src/app/map/[[...orgSlug]]/page.tsx`

**Interfaces:**
- Consumes Task 1 components.
- Produces: `fieldSyncCopy(status)` for `SAVING_LOCAL`, `QUEUED`, `SYNCING`, `SYNCED`, and `FAILED`.

- [ ] **Step 1: Write the failing offline-truth test**

Create `src/lib/field-sync-feedback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fieldSyncCopy } from "./field-sync-feedback";

describe("field sync feedback", () => {
  it("does not call a local queue write synced", () => {
    expect(fieldSyncCopy("QUEUED")).toEqual({
      label: "Saved offline — awaiting sync",
      confirmed: false,
    });
  });

  it("reserves confirmation for server sync", () => {
    expect(fieldSyncCopy("SYNCED")).toEqual({
      label: "Synced",
      confirmed: true,
    });
  });

  it("keeps a failed sync actionable", () => {
    expect(fieldSyncCopy("FAILED")).toEqual({
      label: "Sync failed — retry required",
      confirmed: false,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run src/lib/field-sync-feedback.test.ts --reporter=verbose`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the field sync copy contract**

Create `src/lib/field-sync-feedback.ts`:

```ts
export type FieldSyncStatus = "SAVING_LOCAL" | "QUEUED" | "SYNCING" | "SYNCED" | "FAILED";

const COPY: Record<FieldSyncStatus, { label: string; confirmed: boolean }> = {
  SAVING_LOCAL: { label: "Saving on this device…", confirmed: false },
  QUEUED: { label: "Saved offline — awaiting sync", confirmed: false },
  SYNCING: { label: "Syncing with Contour…", confirmed: false },
  SYNCED: { label: "Synced", confirmed: true },
  FAILED: { label: "Sync failed — retry required", confirmed: false },
};

export const fieldSyncCopy = (status: FieldSyncStatus) => COPY[status];
```

- [ ] **Step 4: Migrate field-agent mutations**

- Add local pending states for create property, create client, create offer, and development quick login.
- Use `PendingButtonContent` with `Saving property…`, `Saving client…`, and `Submitting offer…`.
- When PowerSync/local persistence accepts a mutation without server confirmation, render `fieldSyncCopy("QUEUED")` instead of success copy.
- The existing sync indicator uses the compact sun only for `SYNCING`; `QUEUED`, `SYNCED`, and `FAILED` use static status marks/text.
- Do not block navigation for queued offline work unless leaving would discard unsaved form input.

- [ ] **Step 5: Migrate token upload and public map feedback**

- Token validation uses `SectionPendingState label="Checking secure upload link…"`.
- PIN verification uses inline `Verifying access code…`.
- Upload uses section feedback with the selected filename and `Uploading document…`; retain existing success/error results.
- Public map refresh preserves existing pins/cards and marks the map region busy; initial known-shape loading keeps its current placeholder/skeleton.

- [ ] **Step 6: Verify field/public behavior**

Run:

```powershell
pnpm exec vitest run src/lib/field-sync-feedback.test.ts src/lib/loading-feedback.test.ts --reporter=verbose
pnpm exec eslint src/lib/field-sync-feedback.ts src/lib/field-sync-feedback.test.ts 'src/app/(kiosk)/agent/page.tsx' 'src/app/upload/[token]/page.tsx' 'src/app/map/[[...orgSlug]]/page.tsx'
```

Manually simulate offline mode and confirm local acceptance never renders `Synced` until the server/sync layer confirms it.

- [ ] **Step 7: Commit field/public feedback**

```powershell
git add -- src/lib/field-sync-feedback.ts src/lib/field-sync-feedback.test.ts 'src/app/(kiosk)/agent/page.tsx' 'src/app/upload/[token]/page.tsx' 'src/app/map/[[...orgSlug]]/page.tsx'
git commit -m "feat(field): add offline-honest loading feedback"
```

---

### Task 6: Add Scoped Route Loading Boundaries and Remove Spinner Drift

**Files:**
- Create: `src/app/(dashboard)/dashboard/loading.tsx`
- Create: `src/app/(kiosk)/agent/loading.tsx`
- Create: `src/app/route-loading.test.tsx`
- Modify: `src/components/ui/skeleton.tsx` — add the shared `DashboardSkeleton` export.
- Modify: `src/components/ui/files.tsx`
- Modify: `src/components/properties/property-location-map.tsx`
- Modify: `src/components/marketing/social-media-card-generator-modal.tsx`
- Exclude: `src/components/marketing/film-scroll-canvas.tsx` because it is a marketing canvas asset loader, not an application action state.

**Interfaces:**
- Consumes Task 1 components and existing skeleton exports.
- Produces route-level fallbacks only; no global request state.

- [ ] **Step 1: Write the failing route-boundary test**

Create `src/app/route-loading.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DashboardLoading from "./(dashboard)/dashboard/loading";
import FieldLoading from "./(kiosk)/agent/loading";

describe("route loading boundaries", () => {
  it("uses representative dashboard skeletons", () => {
    const html = renderToStaticMarkup(<DashboardLoading />);
    expect(html).toContain("data-dashboard-skeleton");
    expect(html).not.toContain("contour-transition-screen");
  });

  it("uses compact branded field feedback", () => {
    const html = renderToStaticMarkup(<FieldLoading />);
    expect(html).toContain("data-field-console");
    expect(html).toContain("Opening field workspace");
  });
});
```

Run: `pnpm exec vitest run src/app/route-loading.test.tsx --reporter=verbose`

Expected: FAIL because both route loading modules do not exist.

- [ ] **Step 2: Add dashboard and field route boundaries**

Add this representative skeleton to `src/components/ui/skeleton.tsx`:

```tsx
export function DashboardSkeleton() {
  return (
    <main data-dashboard-skeleton className="min-h-screen space-y-6 bg-[#FBF9F5] p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <DashboardMetricSkeleton key={index} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 xl:col-span-2" />
        <ActionQueueSkeleton />
      </div>
    </main>
  );
}
```

Dashboard boundary requirements:

```tsx
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <DashboardSkeleton />;
}
```

Do not use the sun transition for known dashboard geometry.

Field boundary requirements:

```tsx
import { SectionPendingState } from "@/components/ui/section-pending-state";

export default function Loading() {
  return (
    <main data-field-console className="min-h-screen bg-[#F7F4EE] p-4">
      <SectionPendingState label="Opening field workspace…" compact />
    </main>
  );
}
```

- [ ] **Step 3: Re-run the spinner inventory**

Run:

```powershell
rg -n "Loader2|animate-spin|border-t-.*animate-spin|Bot.*animate-spin|Sparkles.*animate-spin|RefreshCw.*animate-spin" src/app src/components --glob '*.tsx'
```

Classify every remaining hit as one of:

1. Migrated product action that must use the sun loader.
2. Existing skeleton or non-action visual that remains intentionally unchanged.
3. The documented marketing film-canvas exception outside the application feedback contract.

Replace every category 1 hit. Record category 2 and 3 exceptions in the implementation notes section appended to the spec.

- [ ] **Step 4: Verify skeleton preservation**

Compare the property catalogue, dashboard home, analytics, and documents initial-loading branches before and after. Confirm representative skeleton markup remains and no sun loader replaced known card/table structure.

- [ ] **Step 5: Run the route-boundary test and commit**

Run: `pnpm exec vitest run src/app/route-loading.test.tsx --reporter=verbose`

Expected: PASS.

Stage the new boundaries, any shared skeleton change, and only verified spinner-cleanup files. Commit:

```powershell
git commit -m "refactor(ui): finish loading state migration"
```

---

### Task 7: Perform Full Verification and Visual Quality Gate

**Files:**
- Modify: `docs/superpowers/specs/2026-09-23-contour-loading-feedback-system-design.md` only to append verified implementation exceptions or deviations.
- No production changes unless a failing verification identifies a defect; such fixes follow a new red-green cycle before proceeding.

**Interfaces:**
- Consumes all prior tasks.
- Produces the final evidence set and re-entry documentation.

- [ ] **Step 1: Run the full automated suite**

Run:

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected handling:

- Report exact pass/fail counts.
- Keep focused loading-feedback tests separate from repository-wide results.
- If the known baseline typecheck or lint errors remain, list them verbatim and prove no new errors originate in changed loading-system files using targeted commands.
- Do not call a timeout or silent process a pass.

- [ ] **Step 2: Run focused loading tests and targeted lint**

Run:

```powershell
pnpm exec vitest run src/components/ui/loading-feedback.test.tsx src/lib/loading-feedback.test.ts src/lib/auth-transition.test.ts src/lib/operation-feedback.test.ts src/lib/field-sync-feedback.test.ts src/app/route-loading.test.tsx --reporter=verbose
pnpm exec eslint src/components/ui/contour-sun-loader.tsx src/components/ui/pending-button-content.tsx src/components/ui/section-pending-state.tsx src/components/ui/contour-transition-screen.tsx src/lib/loading-feedback.ts src/lib/auth-transition.ts src/lib/operation-feedback.ts src/lib/field-sync-feedback.ts
```

Expected: focused tests and lint exit 0.

- [ ] **Step 3: Run browser verification**

Start the verified local app and exercise:

1. Email sign-up success and failure.
2. Email sign-in success and failure.
3. Workspace creation and invite claim.
4. Property publish and image upload.
5. Pipeline move and deal close.
6. Sale record, lease create, and statement authorization.
7. Document upload, preview, verify, download, and collaborator removal.
8. Settings role change and invite generation.
9. Billing checkout creation failure and success handoff.
10. Field offline create, queued state, reconnect, and synced confirmation.

Check 390×844 mobile, 768px tablet, and 1440px desktop. Confirm no button width jump, modal focus escape, duplicate submission, blank transition, or stale overlay.

- [ ] **Step 4: Verify reduced motion and accessibility**

- Emulate `prefers-reduced-motion: reduce` and confirm orbit rotation stops while status text and static mark remain.
- Navigate every representative pending control by keyboard.
- Confirm blocking transitions receive focus and the underlying surface is inert.
- Inspect live regions to ensure status text is announced once, not duplicated by decorative loaders.

- [ ] **Step 5: Run the required Impeccable detector once**

Run after all UI edits:

```powershell
node C:\Users\sewar\repos\Contour\.agents\skills\impeccable\scripts\detect.mjs --json src/components/ui src/components/auth/auth-form.tsx src/app/onboarding 'src/app/(dashboard)/dashboard' 'src/app/(kiosk)/agent' src/app/upload
```

Verify every finding in context. Fix true loading-system regressions; document false positives and unrelated legacy findings separately.

- [ ] **Step 6: Inspect final Git state and diff**

Run:

```powershell
git diff --check
git status --short --branch
git diff --stat
git log --oneline -8
```

Confirm unrelated commission work is preserved and every loading-system commit contains only its intended slice.

- [ ] **Step 7: Commit verification documentation if changed**

If verified exceptions were appended to the spec:

```powershell
git add -- docs/superpowers/specs/2026-09-23-contour-loading-feedback-system-design.md
git commit -m "docs(ux): record loading system verification"
```

If the spec did not change, do not create an empty commit.
