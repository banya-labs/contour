# Contour Control Plane Operations Design

## Project context

Contour needs a first-class internal operations surface for Banya Labs owners, co-founders, and approved staff. The Control Plane must provide safe, auditable visibility and controlled actions across tenant organizations, users, subscriptions, billing offers, support access, account state, and platform analytics without weakening agency tenant isolation.

## Goals

- Provide one authenticated `/admin` application shell with a persistent responsive sidebar.
- Make access status explicit: unauthenticated, authenticated-but-not-authorized, or authorized internal staff.
- Replace placeholder overview cards with server-backed platform metrics.
- Let authorized operators open an agency detail workspace and move between summary, people, properties, transactions, subscription, support access, activity, and configuration views.
- Preserve least privilege, typed confirmation, reason capture, expiry/recovery, and immutable platform audit events for privileged actions.
- Match Contour's existing editorial visual language and responsive PWA-aware design system.

## Non-goals for the first release

- Permanent hard deletion of tenant data.
- Unbounded cross-tenant data export.
- Client-side-only authorization or impersonation.
- Replacing the existing agency dashboard or member RBAC system.
- Real-time event streaming; initial analytics may use bounded server queries and refresh controls.

## Information architecture

```text
/admin
  /admin                         Overview
  /admin/agencies                 Agency directory
  /admin/agencies/[organizationId] Agency workspace
  /admin/staff                    Platform staff and internal access
  /admin/subscriptions            Plans, trials, payment state
  /admin/offers                   Platform offers and grants
  /admin/support-access           Active and historical support sessions
  /admin/analytics                Platform analytics
  /admin/audit                    Administrative audit log
  /admin/settings                 Control Plane settings and policy visibility
```

The shared shell contains the Contour mark, Control Plane label, navigation groups, current operator identity/role, return-to-workspace link, and sign-out action. Desktop uses a fixed sidebar; mobile uses a drawer with the same route and permission model.

## Access and authentication

The normal Better Auth sign-in remains the identity entry point. `/admin` and all descendants are server-gated.

1. No session: redirect to `/sign-in?returnTo=/admin`.
2. Valid session without active platform staff access: render an access-denied page with no platform data and the message “Control Plane access not granted. Contact Contour management if you believe this is incorrect.”
3. Active platform staff: render the shell and authorize each page/action through `getPlatformActor` and `canPlatformRole`.

Bootstrap owner emails in `CONTOUR_CONTROL_PLANE_OWNER_EMAILS` remain an emergency/bootstrap path. Persisted `PlatformStaff` records are the normal path for future staff. Owner bootstrap and persisted staff checks must fail closed when configuration or database lookups are unavailable.

## Platform navigation and permissions

| Area | Read capability | Mutation capability |
|---|---|---|
| Overview | `platform.read` | none |
| Agencies | `agency.read` | `agency.configure`, `account.suspend`, `account.delete` |
| Staff | `staff.manage` | `staff.manage` |
| Subscriptions | `billing.read` | `billing.adjust` |
| Offers | `billing.read` | `billing.adjust` |
| Support access | `support.impersonate` | `support.act_as` |
| Analytics | `platform.read` / scoped finance data | none initially |
| Audit | `audit.read` | none |
| Settings | `system.read` | owner-only policy changes in a future phase |

Navigation items should be hidden when the operator lacks the corresponding read capability, but every route and API must enforce authorization independently.

## Overview analytics

The overview API returns bounded, organization-aware platform aggregates:

- total organizations, active organizations, locked/suspended organizations, and trial organizations;
- total members, active users, and active field agents;
- total listed properties and aggregate listed property value grouped by currency;
- transactions and agency/agent commission totals for the selected period grouped by currency;
- subscription plan/status distribution;
- new organizations and activity trend for a bounded date range;
- a bounded list of recent platform audit events.

Analytics use an explicit period filter (`today`, `week`, `month`, `quarter`, `year`, `all`) with a bounded default and a maximum date span for expensive queries. Currency totals are never silently converted; they are grouped by currency unless a verified exchange-rate service is introduced in a separate approved change.

## Agency workspace

`/admin/agencies/[organizationId]` is the operator's agency workspace. It displays only the selected organization's data and keeps the organization ID server-derived from the route and verified on every query.

Tabs:

- Summary: status, subscription, counts, activity, and safe next actions.
- People: members, role assignments, account status, and member activity.
- Properties: bounded inventory list and aggregate value by currency.
- Transactions: bounded sales/lease transaction ledger and commission state.
- Subscription: plan, trial, payment state, offers, and grants.
- Support access: create/revoke view sessions and ACT_AS sessions with expiry.
- Activity: organization-scoped audit records and operator actions.
- Configuration: controlled organization profile changes.

Privileged actions remain explicit, reason-required, typed-confirmation where destructive, and write both organization audit records and platform audit events. The UI must show the action's scope, operator, reason, expiry/recovery state, and result.

## Visual system

- Use existing Contour tokens and components rather than introducing a second design language.
- Use `editorial-bg`/paper backgrounds, white bordered panels, charcoal typography, Contour red for privileged emphasis, serif page titles, and compact mono metadata labels.
- Prefer dense operational tables on desktop and stacked cards on mobile.
- Use clear status badges for account state, subscription state, support session mode, and staff role.
- Destructive controls are visually separated, require confirmation, and are never the primary call to action.
- Loading, empty, forbidden, expired-session, and error states are designed as first-class screens.

## Data and API boundaries

- Add a dedicated platform metrics API rather than calculating aggregates in client components.
- Use bounded pagination for agencies, members, transactions, audit records, and properties.
- Validate query parameters and mutation bodies with Zod.
- Derive actor, platform role, organization scope, and support session state server-side.
- Do not place agency PII in aggregate responses or URLs beyond the selected opaque organization ID.
- Preserve audit records for every platform mutation and support access lifecycle event.

## Delivery phases

### Phase 1: Shell and access states

Shared layout, sidebar, responsive drawer, breadcrumbs, operator identity, sign-out, access-denied page, route-aware loading/error states.

### Phase 2: Overview dashboard

Platform metrics API, KPI cards, period filter, subscription distribution, organization/property/transaction summaries, and recent audit activity.

### Phase 3: Agency workspace

Agency detail route, tabs, bounded organization data, and contextual support/action panels.

### Phase 4: People and support operations

Platform staff management, agency member detail, support session history, and access request workflows.

### Phase 5: Analytics and audit

Dedicated analytics views, richer date comparisons, audit search/filtering, and safe report exports.

## Verification and acceptance criteria

- An unauthenticated request cannot see Control Plane data.
- An authenticated non-staff user sees only the access-denied state.
- Staff see only navigation and actions allowed by their platform role.
- Overview metrics are server-backed, bounded, currency-aware, and do not expose tenant rows.
- Agency detail queries cannot cross organization scope.
- ACT_AS and destructive actions require their existing explicit controls and create audit events.
- Desktop and mobile layouts use the Contour visual tokens and remain usable at PWA width.
- Typecheck, focused unit tests, full tests, build, and route-level browser smoke tests are run separately and reported honestly.
