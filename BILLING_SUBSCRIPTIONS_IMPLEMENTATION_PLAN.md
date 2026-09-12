# Contour Billing, Subscriptions & Plans Implementation Plan

## 1. Product outcome

Make billing understandable and operational from Settings. A workspace owner must be able to answer, within one screen:

- What plan am I on?
- Am I trialing, active, past due, cancelled, or blocked?
- When does my trial or current billing period end?
- What will I pay next, in which currency, and when?
- What features and limits does each plan include?
- How do I upgrade, downgrade, renew, or contact billing support?
- What did I pay previously, and how do I download each receipt/invoice?

The system must also be able to accept money reliably through the selected payment provider. A button that only changes browser state is not billing.

## 2. Current-state findings

- `Organization` stores a plan tier, status, and Lenco references, but there is no first-class `Subscription` or `Invoice` model.
- `Payment` stores organization-scoped checkout attempts with idempotency, provider status, amount, currency, and completion time.
- Lenco checkout exists at `/api/billing/checkout` and is protected by auth, tenant scope, validation, and an idempotency key.
- Lenco webhook processing exists at `/api/webhooks/lenco`, including signature validation, event deduplication, provider re-query, and subscription-tier activation.
- `/dashboard/billing` contains hard-coded client-side invoice rows and optimistic plan updates. It does not load payment history and can imply success before a pending payment has settled.
- Settings only displays three plan labels and a link to the billing page. It does not expose prices, feature comparison, payment history, or next payment details.
- Trial dates are currently derived from `Organization.createdAt + 14 days`; this is useful as a fallback but is not an explicit subscription lifecycle field.
- Payment acceptance is not production-ready until Lenco credentials, callback/webhook configuration, settlement/reconciliation, and end-to-end provider verification are completed.

## 3. Guardrails and decisions

### Tenant safety

- Every billing read and write resolves the authenticated organization server-side. Never accept `organizationId` from the browser.
- Payment references, invoice identifiers, and receipt downloads must be checked against the authenticated organization before returning data.
- Webhook payloads remain untrusted until signature validation, deduplication, and provider status verification succeed.

### Payment architecture

- Keep Lenco as the initial Zambia-first provider because the current product already targets ZMW mobile money and has an adapter in place.
- Keep provider-specific code behind a billing adapter boundary so Paystack, Flutterwave, or a second regional provider can be added without rewriting plan or invoice logic.
- Treat mobile-money and card checkout as asynchronous by default. A `PENDING` response is not a paid subscription.
- Do not claim VAT/ZRA compliance or issue a tax invoice until the legal entity, tax fields, numbering policy, and document requirements are confirmed.

### Billing data model

Introduce these durable concepts in a backward-compatible migration:

1. `Subscription`: one current and historical subscription lifecycle per organization, with plan, interval, status, provider IDs, current period start/end, trial end, cancel-at-period-end, and timestamps.
2. `Invoice`: immutable billing document metadata linked to an organization and optional payment/subscription, with invoice number, status, amount, currency, issued/due/paid dates, provider reference, and storage pointer for a generated document.
3. `Payment` remains the provider transaction/attempt ledger. It must not be used as the invoice itself.
4. `WebhookEvent` remains the provider event inbox and must record enough data to replay or reconcile safely.

Use additive fields first. Do not remove existing organization subscription fields until all reads and writes use the new lifecycle model.

## 4. Phased delivery

### Phase 0 — Provider readiness and commercial truth

- Confirm plan names, limits, feature entitlements, trial duration, grace period, cancellation policy, refunds, and supported currencies.
- Confirm the legal merchant entity, settlement account, receipt/invoice requirements, and whether prices are tax-inclusive.
- Verify current Lenco API endpoints, webhook signature rules, test credentials, callback URLs, and supported channels against current provider documentation.
- Add explicit environment documentation and a provider readiness checklist.
- Exit criteria: a test payment can be initiated and the team can explain exactly when access changes state.

### Phase 1 — Billing visibility and settings UX (first implementation slice)

- Add an organization-scoped billing summary endpoint.
- Load current plan/status/trial state from the server in Settings and the billing page.
- Show a prominent current-plan card with status, trial end or next renewal, limits, and the primary action.
- Show all pricing tiers with monthly/annual pricing, feature lists, current-plan marking, and upgrade/downgrade actions.
- Show last successful payment and next payment estimate where data supports it; label estimates clearly.
- Load real payment history instead of local placeholder rows.
- Add organization-scoped downloadable receipt artifacts for completed payments, with a clear “receipt” label until formal invoices are implemented.
- Represent loading, empty, pending, failed, and unavailable provider states explicitly.
- Exit criteria: a workspace owner can understand status, compare plans, begin an upgrade, and download a real recorded payment receipt from Settings.

### Phase 2 — Subscription lifecycle and entitlements

- Add `Subscription` and `Invoice` Prisma models and migration.
- Create a subscription service that owns activation, renewal, grace period, cancellation, and reactivation transitions.
- Create entitlement helpers for plan limits/features and enforce them server-side at critical write boundaries.
- Add current-period dates and a durable trial end date; stop deriving paid lifecycle from organization creation time.
- Add scheduled reconciliation/renewal jobs with retry and dead-letter handling.
- Exit criteria: the database is the source of truth for access and period dates, including after webhook retries.

### Phase 3 — Production checkout and webhook hardening

- Complete Lenco adapter coverage for mobile money, card, and supported bank/virtual-account flows.
- Add provider status polling for pending payments and safe retry UX.
- Make webhook processing idempotent per provider event and per payment transition.
- Add replay/reconciliation tooling for failed or unknown webhook events.
- Add rate limiting, structured billing correlation IDs, and alerting for failed webhooks, payment failures, and reconciliation drift.
- Never activate a paid plan solely from a client callback or optimistic response.

### Phase 4 — Invoices, receipts, refunds, and finance operations

- Generate immutable invoice numbers and formal PDF/HTML documents from server-side data.
- Store documents in MinIO under organization-scoped keys; return short-lived download URLs.
- Add invoice line items, tax/discount fields, billing address, merchant details, payment method summary, and provider transaction ID.
- Add refund/credit-note states and an admin-only operational workflow.
- Add export for bookkeeping and a finance reconciliation report.
- Exit criteria: finance can reconcile every successful payment to an invoice and settlement record.

### Phase 5 — Self-service subscription management

- Add change-plan preview with proration policy stated before confirmation.
- Add cancel-at-period-end, resume, downgrade scheduling, and payment-method update flows.
- Add failed-payment reminders and grace-period banners.
- Add owner/admin permissions for billing actions and immutable audit events.
- Add customer support escalation path with payment reference and safe diagnostic context.

### Phase 6 — Commercial optimization

- Measure trial-to-paid conversion, upgrade conversion, payment success rate by channel, involuntary churn, and invoice download usage.
- Test plan packaging and annual discount only after payment reliability is proven.
- Add feature gating based on observed value, not arbitrary UI-only restrictions.

## 5. API surface

Initial and target endpoints:

| Endpoint | Purpose | State |
|---|---|---|
| `GET /api/billing/summary` | Current plan, status, trial/period dates, next payment, last payment | Phase 1 |
| `GET /api/billing/payments` | Paginated organization-scoped payment ledger | Phase 1 |
| `GET /api/billing/payments/:id/receipt` | Download a recorded payment receipt | Phase 1 |
| `POST /api/billing/checkout` | Start an idempotent provider checkout | Existing; harden Phase 3 |
| `POST /api/webhooks/lenco` | Verify and apply provider events | Existing; harden Phase 3 |
| `POST /api/billing/plan-change` | Preview/confirm upgrade or downgrade | Phase 5 |
| `POST /api/billing/cancel` | Cancel at period end | Phase 5 |
| `POST /api/billing/reconcile` | Admin/provider reconciliation | Phase 3/4 |

All list endpoints require bounded pagination. All mutation bodies use shared Zod schemas. Error responses must not leak provider secrets or cross-tenant records.

## 6. Verification plan

- Type-check and lint all billing changes.
- Unit-test plan pricing, cycle/currency formatting, status mapping, trial/renewal date logic, idempotency, and receipt authorization.
- Integration-test tenant isolation: organization A cannot read organization B payments or receipts.
- Integration-test webhook replay, duplicate event delivery, failed provider re-query, pending-to-success, and success-to-failed rejection.
- Browser-test Settings and Billing at mobile and desktop widths, including loading, empty, pending, failed, and trial-ending states.
- Run a provider sandbox payment with mobile money and card if credentials are available; otherwise report the exact external blocker.

## 7. Immediate implementation slice

This change starts Phase 1 by:

1. Adding a real billing summary/payment-history read API.
2. Rebuilding the Settings billing tab into a useful overview with status, trial/renewal context, plan comparison, and a direct upgrade CTA.
3. Updating the billing page to use server data and show honest payment states.
4. Adding organization-scoped downloadable receipt artifacts for completed payments.
5. Keeping the existing checkout/webhook behavior intact while removing fake client-only invoices.

## 8. Open decisions before Phase 2

- Final provider: Lenco only, or Lenco plus a fallback gateway?
- Trial duration and what happens at expiry: read-only, hard lock, or grace period?
- Tax treatment and invoice legal requirements for the operating entity.
- Proration policy for mid-cycle plan changes.
- Whether annual plans are charged upfront or represented as a monthly-equivalent display only.
- Billing owner permissions: organization owner only, or delegated finance admins?
