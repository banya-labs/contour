# Contour Commercial Launch Journey

**Date:** 2026-09-22  
**Product:** Contour — multi-tenant real-estate operations and field-agent system for Southern Africa  
**Starting point:** Horizon 2 pilot delivery / Engineering Phase 6 stabilization  
**Launch target:** one paying, referenceable brokerage operating daily on Contour with verified billing, tenant isolation, backups, support, and rollback.

## 1. Launch thesis

Commercial launch is not the date a landing page goes live. It is the point at which a real brokerage can:

1. create an organization and invite or approve staff;
2. create and manage properties, clients, mandates, deals, leases, and documents;
3. use the field PWA with intermittent connectivity and recover from sync failure;
4. see truthful trial, plan, payment, and receipt state;
5. trust that another tenant cannot access its data;
6. receive human support and recover from an operational incident.

The critical path is therefore **stabilize → prove one pilot → charge reliably → repeat onboarding → expand**. New surface-area features are paused unless they directly close a launch gate.

## 2. Launch journey

| Stage | Customer experience | Internal proof required | Exit gate |
|---|---|---|---|
| Discover | Prospect sees the Zambia-first value proposition and requests a demo | Landing, pricing, lead capture, analytics, privacy/contact details | Qualified demo booked |
| Evaluate | Operator sees a realistic workspace and field workflow | Seeded demo tenant, scripted walkthrough, performance baseline | Pilot acceptance signed |
| Onboard | Owner creates workspace, configures agency, logo, currency, roles, and team | Auth, onboarding, RBAC, access-request flow, audit trail | First listing and user created |
| Operate | Agents work properties, clients, pipeline, documents, and PWA sync | Tenant-safe APIs, offline queue, conflict/retry behavior, support runbook | Seven consecutive days of successful use |
| Convert | Owner understands trial, selects tier, pays, and receives proof | Provider checkout, signed/idempotent webhooks, entitlement enforcement, receipt | First settled payment reconciled |
| Retain | Team sees value and gets help before failure becomes churn | Health checks, alerts, usage review, export/backup, incident response | 30-day renewal intent |
| Expand | Additional brokerages self-serve or receive assisted onboarding | Repeatable deployment, onboarding checklist, product metrics, case study | Three paying organizations or explicit go/no-go review |

## 3. Delivery phases and implementation plans

### Phase 0 — Freeze scope and establish the release baseline

**Objective:** make the current repository and production target measurable.

**Implementation:**

- Freeze the launch scope to the workflows in the journey above.
- Record environment ownership: application, database, object storage, payment provider, email/access links, DNS, monitoring, and support contact.
- Verify `main`, deployment commit, environment variables, database URL mode, storage bucket, and provider credentials without exposing secrets.
- Run the authoritative checks in clean CI/Linux where Windows hangs: `pnpm exec tsc --noEmit --incremental false`, `pnpm test`, ESLint CLI, `pnpm build`, Prisma validation, and migration status.
- Create a release checklist and a single decision log for exceptions.

**Acceptance:** clean worktree; reproducible CI checks; known commit deployed to staging; every failed check has an owner and ticket.

**Exit gate:** no unknown build, migration, or environment state.

### Phase 1 — Production identity, tenant isolation, and onboarding

**Objective:** make workspace creation and staff access safe and repeatable.

**Implementation:**

- Make Better Auth the single production authentication path; remove or quarantine unused Clerk paths and server-side development bypasses.
- Complete organization profile, market/currency, logo, first-run checklist, and owner setup.
- Complete link-based access requests: hashed token, authenticated first/last-name request, admin approve/decline, role assignment, expiry/revocation, and audit events.
- Derive organization scope server-side on every protected route and mutation; add cross-tenant integration tests for dashboard, PWA, documents, public listings, MCP, and billing.
- Define role matrix for owner, manager, agent, finance, and read-only users; test denial as carefully as success.

**Acceptance:** a new owner reaches a usable workspace in 10 minutes; a second tenant cannot read, mutate, or infer the first tenant's records; access-request migration is applied and recorded.

**Exit gate:** onboarding and tenant-isolation test suite passes against an isolated database.

### Phase 2 — Core brokerage workflow and field reliability

**Objective:** prove that the product replaces the operator's daily work.

**Implementation:**

- Define canonical states and audit history for property, client, mandate, deal, lease, payment, and document records.
- Finish create/edit/detail/delete flows with client-side and server-side validation, pagination, bounded reads, and non-leaking errors.
- Verify the agent PWA on phone and desktop: property/client/mandate sync, offline capture, retry queue, conflict behavior, map state, media, and install flow.
- Add operational exports for listings, clients, pipeline, and payments so the customer is never trapped in the system.
- Complete legal-vault upload/download authorization, object integrity checks, retention rules, and human review for sensitive documents.

**Acceptance:** pilot script completes from lead/property intake through deal or lease follow-up; offline changes recover without silent data loss; sensitive documents are tenant- and role-scoped.

**Exit gate:** seven-day pilot rehearsal with no severity-1/2 workflow failures.

### Phase 3 — Billing and commercial conversion

**Objective:** turn usage into collected, reconciled revenue.

**Implementation:**

- Persist organization-level 14-day trial state and clear trial-end behavior.
- Complete the pricing matrix and entitlement map for Starter, Growth, and Enterprise; enforce limits server-side with truthful `402` responses where appropriate.
- Harden Lenco checkout with idempotency keys, organization ownership checks, correlation IDs, and safe retry behavior.
- Verify webhook signatures, event deduplication, ordering tolerance, subscription/payment state transitions, and reconciliation tooling.
- Surface current plan, trial/period end, next payment, last payment, payment history, receipt download, upgrade, downgrade, cancellation, and billing support.
- Test provider failure, duplicate webhook, delayed settlement, refund, cancelled subscription, and expired trial scenarios.

**Acceptance:** a test organization can trial, pay, receive a provider-confirmed event, gain entitlements, download a receipt, and lose/restore access according to persisted state.

**Exit gate:** first real payment settled and reconciled in staging, then one controlled production payment.

### Phase 4 — Pilot deployment and customer proof

**Objective:** run the MAL showcase pilot as a controlled commercial rehearsal.

**Implementation:**

- Prepare a production-like tenant with real operating roles, sanitized import data, and a named customer owner.
- Conduct role-based training for owner, manager, finance, and field agents in Rhodes Park/Lusaka.
- Run daily check-ins for the first week; capture time-to-first-value, active agents, listings created, follow-ups completed, sync failures, and support requests.
- Keep a manual support seam through WhatsApp/phone; document every repeated question for product or help content.
- Deploy the embeddable public catalogue only after public listing scope, cache invalidation, rate limits, and PII masking are verified.

**Acceptance:** customer completes seven operating days, creates measurable business activity, and signs pilot acceptance with known gaps explicitly recorded.

**Exit gate:** referenceable pilot, first paid conversion, and no unresolved data-integrity incident.

### Phase 5 — Operational readiness and controlled launch

**Objective:** make the system supportable beyond founder intervention.

**Implementation:**

- Add `/health` and `/ready` checks covering app, database, storage, queue, and provider configuration.
- Configure structured logs with request/correlation ID, organization ID, actor ID, outcome, and latency; never log secrets or sensitive document contents.
- Add alerts for 5xx rate, latency, failed webhooks, queue depth, storage failures, sync failures, and database connectivity.
- Test encrypted backups and a restore into a clean environment; document RPO/RTO and who can execute recovery.
- Write incident runbooks for auth outage, payment mismatch, tenant-isolation report, storage outage, sync corruption, and rollback.
- Perform dependency/security audit, POPIA data-flow review, retention/deletion review, and pre-launch penetration review of public and machine surfaces.
- Rehearse blue-green/rolling deploy and rollback from the exact release artifact.

**Acceptance:** an on-call operator can detect, diagnose, contain, recover, and communicate a representative incident without the original implementer.

**Exit gate:** production-readiness review signed by product, engineering, and the pilot customer owner.

### Phase 6 — Commercial launch and repeatable sales

**Objective:** move from one successful pilot to a repeatable business.

**Implementation:**

- Publish the final landing/pricing pages, terms, privacy notice, support channel, and launch FAQ.
- Define assisted onboarding package, implementation fee if applicable, training schedule, and response-time promise.
- Track funnel and product metrics: demo-to-pilot, pilot-to-paid, time-to-first-listing, weekly active agents, listings per organization, follow-up completion, payment success, support volume, and 30/60/90-day retention.
- Onboard the next two brokerages using the same checklist; do not customize the core product without a paid commercial reason.
- Hold a 30-day launch review and decide whether to expand, narrow ICP, or pause for reliability work.

**Acceptance:** three paying organizations or a documented evidence-based decision not to scale acquisition yet.

**Exit gate:** repeatable onboarding, collected revenue, healthy support load, and a referenceable case study.

## 4. Critical-path backlog

1. Verify clean CI/build/type/test baseline.
2. Confirm and apply approved pending migrations through the deployment process.
3. Remove production auth/dev bypass ambiguity and complete cross-tenant tests.
4. Finish billing state machine and one controlled payment.
5. Run the MAL pilot and measure seven consecutive operating days.
6. Complete backups, monitoring, incident response, and rollback rehearsal.
7. Launch to two additional paying organizations.

## 5. Metrics and launch thresholds

| Area | Launch threshold |
|---|---|
| Reliability | No open severity-1 defects; no unresolved data-loss defect; documented rollback |
| Security | Cross-tenant tests pass; public upload/download controls reviewed; secrets absent from logs |
| Billing | Settled payment reconciles; duplicate/out-of-order webhook tests pass; entitlement state is persisted |
| Adoption | Pilot owner and agents use the product weekly for seven days; first value within one working day |
| Support | Named owner, support channel, severity definitions, and response targets documented |
| Operations | Backup restore verified; `/health` and `/ready` monitored; incident runbooks rehearsed |
| Commercial | First paid customer live; two further qualified prospects in pipeline; pricing and contract terms approved |

## 6. Explicit non-goals before launch

- Regional expansion beyond the initial Zambia/Lusaka ICP.
- Full government title-deed automation or treating cadastral/OCR output as legal proof.
- Complex AI automation that is not tied to a measured customer workflow.
- Broad UI redesigns that do not improve onboarding, daily operations, conversion, or retention.
- Production migration execution without an approved backup, owner, and rollback plan.

## 7. Definition of commercial launch

Contour is commercially launched when the Phase 6 exit gate is met: at least one customer has paid and operated successfully, the payment is reconciled, tenant isolation and recovery evidence are signed off, support and incident operations exist, and the next two customers can be onboarded using the documented journey.

