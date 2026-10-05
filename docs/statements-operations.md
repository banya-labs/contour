# Statement operations and rollout

Tenant, agent commission, sale, and internal sale commission documents use immutable JSON snapshots in PostgreSQL and the authenticated `/statements/[id]` viewer. PDFs are generated on demand with the existing browser PDF libraries; no binary documents or new dependencies are stored. Saved landlord routes and approval transitions remain supported; a fresh landlord revision preserves earlier financial values.

## Staff workflows

- Lease details: Prepare tenant statement. Authorized management first verifies the opening balance before rent in its effective month (zero is valid), then chooses agency payment instructions. Recipient edits and notes apply only to the saved document. Full monthly rent uses confirmed receipts allocated to that lease and period; deposits do not reduce rent. Older terminated leases require an effective termination date.
- Payment instructions: management/finance edits bank, mobile-money, cash or cheque instructions in the tenant preparation dialog. Existing documents retain their saved instructions.
- Agent Earnings: choose the existing duration, generate the filtered statement, or open a slip and generate its individual-deal statement. Paid totals only include AGENT_PAID_OUT; earned/agency-received does not assert agent settlement. Currency totals stay separate.
- Sale details: generate the client statement or the separate internal commission statement. Unknown deposits, balances and buyer/transfer details remain explicitly unknown.
- Record Sale: select an eligible property and client contact, optionally add the contact inline, choose the closing agent and agreed value, and start/resume the existing closing workflow. Only the authorized readiness-gated Won action creates the commercial transaction. Transfer completion remains separate.
- Preview, download and print are enabled after the A4 layout fits. Long notes get separate sections; oversized content blocks export with an actionable error. The owning agent can generate a revision; management viewing another agent's saved statement can download/print it without changing its agent identity.
- Every statement page uses the agency logo captured with the document at the top, with the Contour Circle as the fallback when no logo is present or the image cannot load. The full-colour Contour wordmark appears in every footer. The shared layout applies to saved landlord, tenant, agent commission, sale and internal commission statements in preview, PDF and print; print colour preservation is requested from the browser.

## API contracts

All endpoints use the existing authenticated `/api` convention, current organization scope, server Zod validation and source authorization. Financial document responses are private/no-store. The exact schemas are `src/lib/statements/document.ts` and `src/lib/sales-closing.ts`.

| Endpoint | Contract | Authorization |
| --- | --- | --- |
| POST /api/statement-documents | UUID idempotencyKey and kind TENANT, AGENT_COMMISSION, SALE or SALE_COMMISSION; returns saved id | Lease read plus assignment for tenants; own PWA commissions; finance read for sales |
| GET /api/statement-documents/:id | Saved snapshot, revision and permitted regeneration input | Current organization/source access; own agent or finance-authorized management |
| GET /api/statement-payment-instructions | Bounded configurations and canManage | Lease read; non-management sees active configurations |
| POST /api/statement-payment-instructions | Optional id, label, method, active and required method-specific details | Finance manage, or organization update plus lease manage; audited |
| POST /api/leases/:id/opening-balance | Amount, effective month/year, verification reason; optional historical termination date | Same authorized management/finance rule; audited |
| POST /api/sales/closing | propertyId, contactId, closingAgentId, agreedValue, currency, UUID idempotencyKey; optional inquiryId; returns inquiryId | Pipeline update plus PWA inquiry update; management required for another agent |
| POST /api/sales | Direct completion rejected with 409 CLOSING_WORKFLOW_REQUIRED | Existing finance permission retained |
| POST /api/statements | Existing property/month/year/currency contract plus optional regenerate | Existing landlord permissions/approval workflow |

Tenant generation additionally requires leaseId, month/year, recipient name/phone/email/address, selected paymentInstructionIds and optional notes. Agent generation requires duration today/week/month/all and optional transactionId/anchor. Sale variants require transactionId. Opening balances are account balances immediately before charges in the effective month, avoiding double counting.

## Production rollout gate

Migration: `prisma/migrations/20261005071000_statement_documents/migration.sql`. Adds lease verification/termination fields, organization payment instructions, immutable statement documents, landlord revision identity, and durable closing request idempotency. Back up and apply with `pnpm exec prisma migrate deploy` only after explicit production authorization. Apply before deploying these queries; then regenerate the client/build and verify live authenticated lease, PWA, sales and closing flows. A Git push or local build is not production deployment proof.

Existing leases remain unverified until a manager records their opening balance. Historical saved landlord statements remain readable. New landlord generation requires the relevant lease balances to be verified. Existing terminated leases need their actual termination date. Historical unknown values are not automatically inferred.

The adjacent rollback.sql is for an unused development migration only and refuses to discard saved statements, payment instructions, closing requests, lease verification/termination data or landlord revisions. After use, preserve financial history and roll forward. The refusal guard was exercised on the local database and preserved all six saved synthetic documents.

## Verification evidence

- 375 tests passed, one pre-existing skipped test. A synthetic test auth secret was supplied only to the test process.
- Nonincremental TypeScript and Prisma validation passed. Production build passed; it skips lint/type validation by repository configuration, so those checks were run separately.
- Changed-source lint: 67 existing errors and 23 existing warnings, versus 69/23 at the starting commit; no introduced findings. New statement/closing source has no lint errors. UI detector returned no findings.
- Final additive SQL was applied to a fresh isolated PostgreSQL 18 database on 127.0.0.1:55479. The baseline vector field used bytea because local pgvector is unavailable; this migration does not alter vector data. Real Prisma tests passed immutable snapshots, recipient isolation, concurrent idempotency, contact deduplication, one closing workflow without a sale, terminal-resume replay, source organization/agent access and assignment revocation. This is not production migration evidence.
- Intercepted browser tests run the real React pages with fixture auth/router/PowerSync/API data. Tenant and landlord PDFs/print were exercised on desktop/mobile, including maximum multiline input and page overflow checks. Both sale variants and agent period/deal statements passed actual PDF download and print generation. Inline contact creation, closing entry and later-page under-offer selection passed. API permission/concurrency behavior was tested separately with source and local DB tests.
- Dependency audit reported 5 high, 2 moderate and 1 low existing advisories across braces, brace-expansion and DOMPurify. No dependency or lockfile was changed; the unpatched braces advisory remains a release risk.

Repeat checks: `pnpm exec vitest run --maxWorkers=1`, `pnpm exec tsc --noEmit --incremental false`, `pnpm exec prisma validate`, `pnpm build`, and `node scripts/test-refresh-analytics.mjs`. The database script `scripts/test-statements-db.ts` refuses any database outside the named isolated loopback test databases; provision the baseline and migration before running it.

Statement headers resolve the current agency logo when the document is read, including legacy landlord statements. Uploaded private logo keys are validated against the active agency and embedded as small image data URLs for preview, print and PDF; they are not stored as binary data in the database. Missing or unreadable logos use the Contour circle, and the full-colour Contour footer remains. Saved financial snapshots are unchanged. Verification: 17 focused tests and typecheck pass; a synthetic agency-logo preview and three-page PDF download were exercised in the browser.
