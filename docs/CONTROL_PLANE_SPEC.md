# Contour Control Plane Specification

## Purpose

The Contour Control Plane is a separate, privileged internal operations surface for platform governance. It manages agencies, users, subscriptions, support access, configuration, offers, account state, and platform health without weakening agency tenant boundaries.

It is not an agency dashboard and must never rely on an agency role such as `SUPER_ADMIN` alone for platform access.

## Bootstrap and internal staff

- `CONTOUR_CONTROL_PLANE_OWNER_EMAILS` in deployment environment variables defines the initial platform owners.
- Email comparison is normalized server-side and never trusted from browser state.
- Bootstrap owners can add internal staff from the Control Plane after the persisted staff model is implemented.
- Persisted staff require an explicit platform role and status; owner access cannot be granted by an agency administrator.
- Recommended roles: Platform Owner, Operations, Support, Finance, Compliance, and Read-only Analyst.

## Privileged access rules

- Every Control Plane read and mutation is authenticated, authorized server-side, and audit logged.
- “View as agency” and “act as agency” are separate capabilities.
- Impersonation is time-limited, reason-required, visibly marked, and cannot silently inherit platform-owner powers.
- Destructive actions use soft deletion, recovery windows, confirmation phrases, and elevated re-authentication.
- Account suspension, permanent deletion, billing overrides, and bulk actions require explicit confirmation and immutable audit records.
- Legal vault and identity data access is denied by default for support and analytics roles.

## Initial navigation

1. Overview: agency count, active users, subscription distribution, support queue, system readiness.
2. Agencies: search, health, plan, owner, usage, status, and controlled agency view.
3. People: platform staff plus agency members, with safe scoped access.
4. Subscriptions: plan state, trial, payments, discounts, credits, and offer history.
5. Support access: approved time-limited view/act sessions.
6. Audit: immutable administrative event stream and export log.
7. System: readiness, queues, storage, integrations, and incident controls.

## Visual direction

The Control Plane inherits Contour’s existing editorial system: warm paper background, white ledger-like cards, near-black headings, Contour red action accents, mono labels and financial values, compact borders, and the existing Contour wordmark. It should feel like an operator’s ledger, not a generic SaaS admin template.

## Delivery sequence

1. Bootstrap access gate and truthful branded shell.
2. Persisted platform staff, roles, status, and audit events.
3. Agency directory and read-only usage/subscription overview.
4. Time-limited support access and impersonation.
5. Subscription discounts, offers, account state controls, and recovery workflows.
6. Destructive-action controls, security review, and production audit gate.
