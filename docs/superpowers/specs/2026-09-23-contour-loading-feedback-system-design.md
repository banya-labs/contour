# Contour Loading and Action Feedback System

**Date:** 2026-09-23
**Status:** Conversational design approved; written specification awaiting review
**Surfaces:** Authentication, onboarding, operations dashboard, field-agent PWA, public upload flows

## Problem

Contour has useful page skeletons, but asynchronous feedback outside those skeletons is fragmented. The repository currently contains 62 named asynchronous action handlers, 22 files with several unrelated spinner treatments, and no App Router `loading.tsx` boundaries. Some actions only change button copy, some rotate unrelated icons, and some provide no visible response while authentication, invitation resolution, database writes, uploads, or redirects are still running.

The most visible failure is account creation and sign-in. The current authentication form clears `isSubmitting` immediately after the credential request, before invitation claiming, active-organization selection, onboarding resolution, and navigation finish. The interface therefore appears idle during a real multi-step transition.

## Design Goals

1. Every user-triggered asynchronous action acknowledges input immediately and remains visibly pending until success, failure, cancellation, offline queueing, or navigation completion.
2. Contour uses one product-specific loading language based on its orange-red rising sun instead of a mixture of generic rotating icons.
3. Existing page skeletons remain the default for initial content whose shape is known.
4. Routine actions remain contextual. Full-screen blocking states are reserved for transitions where the current surface can no longer be used safely.
5. Feedback is accessible, motion-safe, responsive, and honest. No timer-driven status, fake percentage, or fake completion claim is permitted.
6. Field workflows distinguish local offline queueing from confirmed server persistence.

## Non-Goals

- Redesigning page skeletons that already match the eventual content.
- Replacing the marketing landing-page sunrise or changing its visual narrative.
- Introducing a third-party animation or toast dependency.
- Blocking the whole dashboard for a row-level, card-level, or button-level mutation.
- Showing upload percentages unless the underlying transport reports real byte progress.

## Visual Direction

The loading mark is an application-specific extension of Contour's established sun identity. It does not add decorative red circles to the marketing page and therefore does not weaken the landing page's two-circle narrative.

### Contour Sun Mark

- A solid `#FA3600` central disc.
- One restrained cadastral orbit drawn with a border or SVG stroke.
- Transform-only motion: a gentle disc breath and orbit rotation.
- No blurred glow, bouncing dots, elastic motion, or generic Lucide spinner.
- Sizes: `sm` for buttons, `md` for sections and modals, `lg` for blocking transitions.
- Reduced-motion mode keeps the mark static and changes the orbit opacity to communicate activity without rotation.
- The mark inherits light/dark surface treatment while the sun color remains the Contour accent.

### Copy

Status labels use present-participle, operation-specific language:

- `Creating your account…`
- `Securing your workspace…`
- `Signing you in…`
- `Publishing property…`
- `Uploading title deed…`
- `Saving client changes…`
- `Authorising statement…`

Generic `Loading…` is allowed only when the operation cannot be identified. Fake progress percentages and rotating nouns such as a spinning bot icon are prohibited.

## Feedback Hierarchy

### Tier 1: Inline Action Feedback

Use for button-scoped actions expected to complete without invalidating the rest of the screen.

- The initiating control retains its width and location.
- Its leading icon becomes `ContourSunLoader size="sm"`.
- Copy changes to an operation-specific pending label.
- `disabled`, `aria-disabled`, and `aria-busy` prevent duplicate execution.
- Unrelated controls remain usable unless concurrent edits would be unsafe.
- Success returns control to its normal state and uses the existing success treatment or a concise confirmation.
- Failure restores the control and places the error next to the action or form.

Examples: saving a client, approving an access request, refreshing analytics, generating an invite link, downloading a file.

### Tier 2: Section Feedback

Use when a panel, modal body, preview, map region, or affected record is temporarily unavailable.

- Existing content stays visible when stale data is safe to read.
- The affected region receives `aria-busy="true"` and a restrained overlay or dedicated pending panel.
- The medium sun mark appears with a status label.
- Focus remains inside an open modal.
- Destructive or conflicting actions in that region are disabled.
- Other page regions remain interactive.

Examples: document preview, OCR processing, map geolocation, card-stage movement, collaborator changes, property-image upload.

### Tier 3: Blocking Transition Feedback

Use only when identity, organization context, or navigation is changing and the current screen cannot safely remain interactive.

- A full-viewport `ContourTransitionScreen` appears immediately after submission succeeds or immediately on OAuth handoff initiation.
- It contains the large sun mark, Contour wordmark, one truthful primary status, and optional secondary explanation.
- It does not contain a skip action, simulated progress bar, decorative property imagery, or an independent timer.
- It remains mounted until navigation begins successfully or an error restores the previous form.
- The prior screen is inert and cannot submit twice.

Examples: account creation, sign-in, invitation claim, active-organization selection, workspace creation, and onboarding-to-destination routing.

## Component Contract

### `ContourSunLoader`

```ts
type ContourSunLoaderProps = {
  size?: "sm" | "md" | "lg";
  label: string;
  className?: string;
  decorative?: boolean;
};
```

- Defaults to `role="status"` and exposes `label` to assistive technology.
- `decorative` is permitted only when a parent status region already exposes the same label.
- Uses CSS keyframes colocated with the design tokens, with a `prefers-reduced-motion` alternative.

### `PendingButtonContent`

```ts
type PendingButtonContentProps = {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
};
```

- Standardizes stable button geometry and avoids per-screen spinner markup.
- It renders content only; the owning button remains responsible for `disabled` and event behavior.

### `SectionPendingState`

```ts
type SectionPendingStateProps = {
  label: string;
  description?: string;
  compact?: boolean;
};
```

- Used only when a skeleton would misrepresent the destination content.
- Supports light and dark operational surfaces.

### `ContourTransitionScreen`

```ts
type ContourTransitionScreenProps = {
  label: string;
  description?: string;
};
```

- Fixed viewport, safe-area aware, and higher than modal/navigation layers.
- Focus is moved to its status heading when it appears.
- Background uses the appropriate operational canvas, not the marketing splash scene.

### `usePendingAction`

A small hook may standardize duplicate-submit protection and error-safe cleanup where it reduces repetition. It must not hide domain behavior, fetch calls, offline queue semantics, or success routing.

```ts
type PendingActionState = {
  pending: boolean;
  run<T>(action: () => Promise<T>): Promise<T>;
};
```

Actions that navigate away intentionally keep their transition state mounted instead of clearing it in `finally` before navigation.

## Screen and Flow Matrix

### Authentication

| Flow | Current issue | Required feedback |
|---|---|---|
| Email sign-up | Pending state ends before claim and redirect | Inline credential submission followed by Tier 3 `Creating your account…` then `Preparing your workspace…` |
| Email sign-in | Same premature reset | Inline submission followed by Tier 3 `Signing you in…` and organization resolution |
| Google sign-in | No consistent pending state | Immediate Tier 3 `Opening secure Google sign-in…`; restore form on provider error |
| Development quick login | Text/button state does not cover claim/redirect | Same Tier 3 path as normal sign-in |
| Existing-session continuation | Direct navigation with no feedback | Tier 3 `Opening your workspace…` |
| Sign-out | Several surfaces wait silently | Inline pending control; Tier 3 only when the whole identity context is being cleared |

Authentication must not call `setIsSubmitting(false)` between successful credential authentication and the final navigation decision.

### Onboarding and Access

| Flow | Required feedback |
|---|---|
| Session and organization resolution | Tier 3 status instead of a blank or icon-only state |
| Invite lookup/check | Tier 2 within the invite panel |
| Invite claim and role confirmation | Tier 3 until organization activation and redirect complete |
| Workspace creation | Tier 3 `Creating your workspace…`; keep regulatory submission locked |
| Access request submission | Tier 1 on the submit button and a persistent success result |
| Invitation acceptance authentication | Tier 1 for credentials, then Tier 3 for claim and redirect |

### Properties and Spatial Work

| Flow | Required feedback |
|---|---|
| Publish property | Tier 1 on `Publish Listing`; modal remains open and locked |
| Save listing edit | Replace generic spinner with Tier 1 sun mark |
| Image upload/remove | Tier 2 per image item; preserve real per-file success/error states |
| Title-deed OCR/sample extraction | Tier 2 with truthful extraction copy |
| Direct vault document upload | Tier 2 in the document panel |
| Geolocation and address search | Compact Tier 2 feedback in the map control |
| Property map fetch | Retain map skeleton/placeholder; use sun mark only for refresh or geolocation actions |

### Pipeline, Clients, Sales, Leases, and Statements

| Flow | Required feedback |
|---|---|
| Create or edit deal | Tier 1 in the modal footer |
| Move pipeline stage | Tier 2 on the affected card/column; prevent a second move |
| Close won/lost deal | Tier 1 with outcome-specific copy |
| Create/edit/delete client | Tier 1; deletion names the affected record and blocks repeated confirmation |
| Record final sale | Tier 1 `Recording conveyance…`; preserve form on error |
| Create lease | Tier 1 `Creating lease…` |
| Generate statement | Tier 1 `Generating statement…` |
| Authorise statement | Tier 1 on the affected statement row/card |

Initial page data on these surfaces continues to use existing skeletons where available. A spinner must not replace a representative skeleton.

### Documents and Vault

| Flow | Required feedback |
|---|---|
| Initial tree or document list | Existing skeleton where shape is known; otherwise Tier 2 |
| Upload or requested upload | Tier 2 with filename and truthful upload status |
| Download | Tier 1 on the document action |
| Verify/unverify | Tier 1 on the affected document |
| Delete | Tier 1 in the confirmation action |
| Preview or extraction | Tier 2 in the preview panel |
| Request link creation | Tier 1; retain generated link result |
| Collaborator add/remove | Tier 1 on the relevant control/row |
| Vault access update | Tier 1 per member row |

### Settings, Billing, and Analytics

| Flow | Required feedback |
|---|---|
| Logo upload | Tier 2 in the logo panel |
| Access-link creation and request review | Tier 1 per action |
| Role change, suspension, member deletion | Tier 1 per member row; prevent concurrent conflicting mutations |
| Invite generation/revocation | Tier 1 per invitation action |
| MFA enable, verify, disable | Tier 1 within the security dialog/section |
| Checkout or plan change | Tier 3 once external checkout/navigation begins; restore on failure |
| Analytics refresh | Preserve current report while Tier 2 feedback marks it stale and refreshing |
| PDF generation/print | Tier 1 with `Generating report…`; no spinning printer icon |

### Field-Agent PWA

| Flow | Required feedback |
|---|---|
| Create property/client/offer | Tier 1 on the action, with the relevant modal locked |
| Edit client | Standard Tier 1 feedback |
| Offline mutation accepted locally | Replace loader with explicit `Saved offline — awaiting sync` state |
| Server-confirmed mutation | Explicit `Synced` state |
| Sync in progress | Compact sun mark attached to the sync indicator, not a full-screen takeover |
| Session resolution/login | Tier 3 only while identity or destination is unresolved |

The PWA must never display `Published`, `Confirmed`, or `Synced` solely because a local PowerSync write entered the queue.

### Public Upload and Shared Flows

| Flow | Required feedback |
|---|---|
| Upload-token validation | Tier 2 status card |
| PIN verification | Tier 1 in the PIN form |
| File upload | Tier 2 with selected filename and real completion result |
| Public map/listing refresh | Preserve current content and show compact Tier 2 feedback |

## Navigation Boundaries

No blanket root loader will cover every route because many Contour pages fetch client-side after rendering. Loading boundaries will be added only at route groups where server navigation can otherwise expose an empty shell. They must reuse the same loading primitives.

- Authentication/onboarding route boundaries use the transition presentation.
- Dashboard route boundaries use the closest representative skeleton, not a full-screen sun.
- Field-agent route boundaries use the lightweight field-console shell and compact sun mark.
- Client-side fetches remain governed by their owning component state.

## State and Error Rules

1. Every action has a single owner for its pending state.
2. Pending begins before the asynchronous call and ends on error, cancellation, or safe completion.
3. Navigation actions do not clear pending before `router.push`, `router.replace`, `window.location`, or OAuth handoff completes.
4. Errors remain visible near the initiating action and receive `role="alert"` when newly introduced.
5. A failed action restores the original label and preserves user-entered form data.
6. Destructive actions cannot be invoked again while pending.
7. Parallel row actions use keyed pending identifiers rather than one page-wide boolean.
8. Aborted or superseded requests must not overwrite a newer state.

## Accessibility and Motion

- Status regions use `role="status"` and `aria-live="polite"`; errors use `role="alert"`.
- Buttons expose `aria-busy` while pending and remain visually stable.
- Blocking transitions move focus to the status heading and make the underlying surface inert.
- Motion uses opacity and transforms only.
- `prefers-reduced-motion: reduce` removes orbit rotation and large scale travel while preserving a static status mark and text update.
- The sun mark and text meet WCAG AA contrast on light and dark surfaces.
- Loading feedback never depends on color or animation alone.

## Performance

- The loader is CSS/SVG and ships no new dependency or raster asset.
- Inline loaders share one component rather than importing many icon implementations.
- No blur, layout-property animation, continuous box-shadow animation, or canvas animation is used.
- For very fast non-navigation actions, the visual loader may be delayed by 120–150 ms to prevent flicker, but the control is disabled immediately.
- Authentication and organization transitions render immediately because they replace a dead period users already perceive.

## Testing Strategy

### Unit and Component Tests

- Sun loader exposes accessible status text.
- Reduced-motion styling retains visible feedback.
- Pending button content preserves both labels and stable control behavior.
- The pending-action helper prevents duplicate invocation and restores state after rejection.

### Flow Tests

- Sign-up remains pending through invitation resolution and navigation.
- Sign-in failure restores the form and announces the error.
- Workspace creation cannot submit twice.
- Property publishing, deal creation, sale recording, and statement authorization show pending feedback and preserve data on failure.
- Keyed row actions do not block unrelated rows.
- Offline PWA mutations display queued state before server confirmation.

### Visual and Accessibility Verification

- Test representative light dashboard, dark field console, modal, and full-screen transition surfaces at mobile and desktop widths.
- Verify keyboard focus, status announcements, and reduced-motion mode.
- Run the Impeccable detector once after all UI edits.
- Preserve existing skeleton snapshots and behavior.

## Delivery Slices

1. Foundation: shared components, tokens, animation, accessibility behavior, and tests.
2. Identity: sign-in, sign-up, Google handoff, onboarding, invitations, and access requests.
3. Core operations: properties, pipeline, clients, sales, leases, and statements.
4. Documents and management: vault, settings, billing, analytics, and report generation.
5. Field and public surfaces: PWA actions, offline/sync semantics, public upload, and route boundaries.
6. Verification: full tests, targeted browser flows, reduced-motion checks, and Impeccable detector.

Each slice must be independently reviewable and must not replace existing skeletons with generic loading states.

## Acceptance Criteria

- All audited user-triggered asynchronous actions provide immediate, operation-specific feedback.
- No successful authentication or onboarding flow returns to an idle-looking form before navigation.
- Generic `Loader2`, rotating domain icons, and hand-built border spinners are removed from migrated product flows unless a documented third-party boundary prevents replacement.
- Existing content skeletons remain in place.
- Owners, managers, agents, and public upload users receive feedback appropriate to their surface and permissions.
- Field actions clearly separate local queue acceptance from server synchronization.
- Duplicate submissions are prevented.
- Failures restore usable controls and preserve entered data.
- WCAG status, focus, contrast, and reduced-motion requirements pass.
- No loading animation depends on fake time or fake progress.
