# Statements and Sales Closing Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task. Steps use checkbox syntax for tracking.

**Goal:** Deliver tenant, agent, sale, and internal commission PDFs and start sales through the existing closing workflow.

**Architecture:** Store immutable, typed document snapshots with organization/source/agent lineage. Build each document on the server and render it through one authenticated, paginated A4 viewer. Use the existing Contact, Inquiry, ClosingWorkflow and Transaction lifecycle.

**Tech Stack:** Next.js 15, TypeScript, Prisma/PostgreSQL, Zod, existing html2canvas/jsPDF, Vitest and Playwright.

**Spec:** `docs/statements-and-sales-closing-design.md` (approved by user).

## Global Constraints

- Recipient edits are statement-specific; payment instructions are agency-managed.
- Full monthly rent, verified opening balance for older/imported leases, first/last occupied months charged in full.
- Organization scope, source permissions and agent assignment enforced server-side; no dashboard permission granted to field agents.
- No new dependencies, PDF blobs in PostgreSQL, fabricated payout/transfer claims, or production migration without authorization.
- Keep saved landlord statements and existing closing approval/evidence rules.

## Review Focus

- Cross-agent/document id tampering must fail, even after assignment changes.
- Opening-period boundary and payment allocation must not double count.
- Pending/bounced payments and future due dates must not inflate cleared receipts or arrears.
- Long financial lists must paginate without clipping rows.
- Retried/concurrent sale starts and Won actions must not duplicate financial transactions.

### Task 1: Shared documents and rental statements

**Files:** `prisma/schema.prisma`, additive migration/rollback guidance; `src/lib/statements/{document,ledger,service}.ts` and tests; `/api/statement-documents`, `/api/statement-documents/[id]`, `/api/statement-payment-instructions`, `/api/leases/[id]/opening-balance`; `src/components/statements/{statement-viewer,tenant-statement-dialog,payment-instructions-editor}.tsx`; `/statements/[id]`; leases page and landlord generation route.

**Interfaces:** `calculateTenantLedger(input): TenantLedger`; `StatementSnapshot` with version/title/branding/details/sections/notices; `generateStatementDocument(ctx, input): {id}`; API generation uses discriminated `kind` and `idempotencyKey`; saved viewer GET returns snapshot after authorization.

- [x] Write/run failing ledger tests for verified baseline, full-month charges, credits, pending/bounced payments, first due date, termination, currency, and old-lease refusal.
- [x] Implement ledger using Prisma.Decimal and monthly allocation; save verified baseline and termination date with audit entries.
- [x] Add scoped payment configuration and snapshots, validate/generate/read with idempotency and revisions; test own/foreign source access and private responses.
- [x] Implement shared multi-page A4 viewer and preparation/payment configuration UI, preserve old landlord viewer URLs and document revisions.
- [x] Run focused tests/Prisma validation and commit task.

### Task 2: Agent commission exports and filter correctness

**Files:** `src/lib/statements/period.ts` and tests, commission builder in `service.ts`; agent summary API and PWA Earnings controls.

**Interfaces:** `resolveEarningsPeriod(period, timezone, now): {start,end,label}` shared by API/export/UI; one-deal generation uses `transactionId`, current filter uses `period`.

- [x] Write/run failing period tests for Monday/Sunday, month/day boundaries and organization timezone; test status totals separated by currency.
- [x] Implement agent-scoped exports and correct paid/earned labels, actual split rates, missing settlement data, and all currencies.
- [x] Add Generate statement and per-deal statement links; use `/statements/[id]` without dashboard access.
- [x] Run focused tests and commit task.

### Task 3: Sales statements

**Files:** sales document builders in `service.ts`, permissions tests, sales detail UI.

**Interfaces:** generation kinds `SALE` and `SALE_COMMISSION` take `transactionId`; client-facing snapshot excludes agent split/commission; internal snapshot requires finance access.

- [x] Write/run client-facing disclosure tests, null deposit/balance tests and historical buyer absence tests.
- [x] Build sale document variants from recorded transactions, organization, property and inquiry; expose separate actions in sale details.
- [x] Remove fabricated transfer references/names from sales display.
- [x] Run focused tests and commit task.

### Task 4: Closing initiation and full verification

**Files:** `src/lib/sales-closing.ts` and tests, `/api/sales/closing`, `/api/sales`, `src/components/closing/start-sale-dialog.tsx`, sales page; browser fixture extension and operations docs.

**Interfaces:** `startSaleClosing(tx, {organizationId, actorId, propertyId, contactId, agreedValue, currency, closingAgentId, inquiryId?, idempotencyKey}): {inquiryId}`; opens existing `ClosingWorkflowPanel`.

- [x] Write/run failing initiation tests for unavailable/foreign property/contact/agent, existing inquiry reuse, retry/concurrency and no Transaction/SOLD mutation on start.
- [x] Implement atomic initiation with contact identity reuse, assignment checks, advisory serialization, existing workflow ensure and audit; guard legacy POST /api/sales against bypass.
- [x] Replace Record Sale modal with property/contact/inline-new-contact dialog and closing workflow; keep new-link consumption and refresh events.
- [x] Verify readiness-gated Won and transaction uniqueness remain unchanged.
- [x] Run full Vitest, nonincremental TypeScript, lint delta, dependency audit, production build, desktop/mobile browser exports and multipage print.
- [x] Fresh whole-branch review, repair findings, commit verified result. Report production migration/deployment separately.

## Execution ledger

- User approved the design and explicitly instructed implementation. Native execution selected to keep shared interfaces coherent.
- Ruling: proceed without another approval round; this implements the plan the user approved.
- Tasks 1–4: implemented together because the shared viewer, document contract, persistence and closing UI are tightly coupled; one coordinated feature commit will carry the verified result.
- Tests: initial ledger, period and initiation tests ran RED then GREEN. Disclosure/service tests were added after their initial implementation; this is a documented test-order deviation.
- Review: repaired landlord overdue totals, closing resume idempotency, paginated eligible inventory, maximum-content A4 gating, and management regeneration identity. Detailed validation and remaining production gate are in docs/statements-operations.md.
- No production migration or deployment performed.
