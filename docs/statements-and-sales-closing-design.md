# Statements across rentals, commissions, and sales

Status: proposed design for review, 2026-10-05. Product implementation has not started.

## Intended outcome

Staff generate tenant and landlord statements from lease details. Agents export their filtered commission earnings or one deal from the PWA. Staff generate client-facing sale statements and separate internal commission statements from sale details. Every statement uses the same branded A4 preview, download, print, loading, and retry experience. Record Sale starts the existing verification and closing workflow, with a real contact and inquiry linked to the selected property.

The spoken reference to "errors" is interpreted as arrears. Sending documents remains a manual download/share action; this change does not automatically message clients.

## Existing evidence

- `src/components/statements/landlord-statement-viewer.tsx` and `/api/statements/[id]` provide the recently repaired saved landlord viewer.
- `src/app/(dashboard)/dashboard/leases/page.tsx` contains the lease statement entry point. `Lease` holds tenant identity, rent, dates, and payment day; `RentPayment` holds allocated month/year, receipt, amount, currency, method, date, and verification status.
- `src/app/(kiosk)/agent/page.tsx` uses today/week/month/all filters and digital slips. `/api/agent/summary` scopes transactions to the current agent but groups EARNED and RECEIVED into values labelled Paid; the slip also claims bank clearance unconditionally. Its displayed week range differs from the API's current-week calculation. These must be corrected with the export.
- `src/app/(dashboard)/layout.tsx` redirects staff without dashboard permission to `/agent`. A field-agent viewer cannot rely on a dashboard-only route.
- `src/app/api/sales/route.ts` currently creates a transaction and marks a property SOLD directly. The sales UI's buyer fields are not persisted through that payload, and the API requires a closingAgentId the form omits. Some displayed transfer references and fallback names are invented.
- `src/app/api/clients/[id]/transition/route.ts` already creates the closing workflow on VERIFICATION_CLOSING and gates Won on management/readiness. Won creates an inquiry-linked commission transaction; transfer completion is tracked separately.
- `Contact` has organization-scoped identity uniqueness, and `Inquiry` requires a contact. Reuse those records and identity helpers.
- The schema has no tenant statement address/payment instructions, historical rent-charge ledger, or explicit opening balance. IN_ARREARS is a status, not proof of an amount owed.

## User flows and document contents

| Document | Entry point | Contents | Audience |
| --- | --- | --- | --- |
| Tenant statement | Lease details, beside landlord statement | Tenant name/contact/address, property/unit/address, lease reference, period, due date, opening balance, rent charged, confirmed payments with references, closing balance/credit, arrears, selected payment instructions and agency contact | Tenant/client |
| Landlord statement | Same lease details | Existing saved rent collections, agency fee, approved maintenance, net payout, arrears, approval status, agency branding | Landlord/client |
| Agent commission statement | PWA Earnings: export current filter; one-deal action on a slip | Agent identity, exact date range, deal/property/reference, sale/rental type, gross value, agency percentage/amount, actual agent split percentage/amount, commission status, separate currency totals | That agent; authorized management |
| Sale statement | Selected sale details | Property/address, seller/owner, buyer contact, agreed price/currency, commercial close date, recorded deposit/balance where available, transfer status/reference, agency contact | Seller/owner/client |
| Sale commission statement | Selected sale details, separate internal action | Sale identity/property, buyer, agreed value, agency commission percentage/amount, closing agent and actual split, commission and transfer statuses | Internal finance/authorized management |

Tenant statements exclude owner remittance and agency/agent commission information. Client-facing sale statements exclude internal agent splits. Confidential identifiers such as NRC/passport numbers are excluded by default. Missing values appear as Not recorded; unknown deposits or balances must not appear as zero. A sale statement is a statement of recorded sale facts, not a receipt or evidence of title transfer.

## Lease preparation and editable information

Selecting Tenant statement opens a preparation form with the lease's tenant and property information, period, address fields, and payment-method selection. Saving/generation returns a saved document and an explicit Open statement viewer link. Generation does not open an empty popup.

Confirmed user decision: recipient/address edits apply only to the document. Updating canonical tenant/contact details is a distinct, explicit action. Saving one statement must not silently rename a shared CRM contact or change the lease.

Payment choices reuse the existing methods: bank transfer, Airtel Money, MTN Money, cash, and cheque. Agency payment instructions contain account holder, bank, account number, branch/code where relevant, payment reference, or mobile-money recipient/provider/number. Methods can be selected for the statement; bank and mobile-money details come from organization-owned configurations. Only authorized management/finance can edit those configurations, with an audit entry; agents can select configured methods and download permitted documents. A method lacking required instructions blocks generation with a field error. These are payment instructions, never a statement that payment has occurred.

Optional explanatory notes are clearly separate from calculated figures. Users cannot edit computed arrears or commissions in the statement form. Errors require correcting source records or an auditable opening balance and generating a revised statement.

## Rental calculation boundary

Statements are keyed to a lease/tenant, not merely a property: a previous tenant's payments cannot become the next tenant's credits. Each amount uses one currency and decimal arithmetic. Deposits are shown separately if included and never treated as rent paid without an explicit allocation.

The statement shows opening balance + charges in the period - confirmed allocated payments = closing balance. Pending/bounced payments are labelled separately and do not reduce the balance. A negative balance is a credit. Arrears are amounts past their due dates, not the entire future balance.

Confirmed user billing rule: full monthly charges during the lease term, with a verified opening balance and effective billing period for imported/older leases. No automatic proration, penalties, interest, maintenance recharge, or invented historical rate. If the billing rule or opening balance cannot be established, show a useful validation error and block a misleading financial statement. Historic rent changes require effective-dated source charges/terms before those periods can be claimed accurate.

The opening balance is defined immediately before the first supported billing month, so that month's full charge is added once. First and last occupied months are charged in full. The first charge is due no earlier than lease commencement; subsequent charges use the lease's payment day. For cancelled leases, preserve an effective termination date in source data before calculating charges beyond cancellation; current status alone cannot establish the historic cutoff. Keep verified opening-balance amount, currency, effective period, verifier, and audit reference together. Imported history before that baseline is excluded from both generated charges and payment deductions to prevent double counting.

The existing landlord arrears formula estimates brought-forward arrears as one month's rent for an IN_ARREARS lease. It cannot be reused as a tenant ledger. New landlord revisions should consume the same verified lease calculation; already saved landlord documents retain their original values.

## Shared preview, download, and history

Extract the landlord toolbar, A4 paper, zoom, font/image readiness, export progress, PDF pagination, print stylesheet, and retry states into shared components. Each document type has its own typed renderer and server-side allowlist of fields. Long payment/commission lists paginate onto multiple A4 pages with repeated headings and page numbers; no single-page shrinking or clipped rows.

An authenticated `/statements/[documentId]` viewer is reachable by both dashboard and PWA users. It requires a session and organization context and rechecks the document audience, source access, and current agent assignment. It is not a public sharing URL. Existing landlord URLs remain supported by the same renderer/adapter.

Generation saves a versioned JSON document snapshot and source lineage in PostgreSQL: organization, kind, source lease/transaction or agent scope, exact period, generation time/actor, and revision. Financial fields and recipient/payment instructions are validated server-side and frozen for that revision. Browser reload reads the saved snapshot; it does not calculate a different document. Concurrent retries use an idempotency key. Corrections create a new revision rather than overwriting a document previously sent. Generated PDF bytes are not stored in PostgreSQL; use the existing browser download/print mechanism. No new dependency or separate document service is needed.

An explicit re-generation action takes a fresh snapshot after ledger/status changes. Previously generated documents display their as-of time. Successful downloads do not automatically mark documents sent, approved, or paid. Generation/export audit events exclude bank numbers and personal details.

## Commission filters and honest statuses

Use one shared period resolver for PWA labels, the summary API, and document generation. Resolve today, current Monday-Sunday week, current calendar month, or all-time against the organization's timezone. Preserve exact resolved start/end boundaries in the snapshot, using an inclusive start and exclusive end. The PDF matches the selected filter, including deals with null closedAt using a documented createdAt fallback. One-deal statements identify a transaction explicitly.

FIELD_AGENT access is always constrained by organizationId and closingAgentId = authenticated userId on the server. A supplied agent id or document id cannot broaden that access. Use pwa.access for the agent's own export without granting finance.read or dashboard.read to all agents. Management access requires the applicable finance permissions.

EXPECTED, EARNED, PARTIALLY_RECEIVED, RECEIVED, and AGENT_PAID_OUT are distinct. Only AGENT_PAID_OUT is recorded agent payout. RECEIVED describes commission received by the agency; EARNED is earned commission. The current model lacks partial received/payout amounts and payout settlement timestamps, so the document displays recorded statuses and entitlements rather than inventing paid dates or cash balances. Totals remain separate for ZMW, USD, and ZAR; no adding ZAR to Kwacha totals or currency conversion.

## Record Sale enters closing

1. Record Sale opens a Start sale closing dialog, including the existing `?new=1` shortcut.
2. Select an available FOR_SALE/BOTH property and existing contact/client. Offer inline Add client using the existing validated contact editor and identity rules. Creating a client also creates/reuses the Contact record.
3. Select an existing active sale inquiry for that contact/property, or create a sale inquiry linked to both. Capture agreed value/currency and assigned closing agent. Resume an existing closing workflow instead of creating a duplicate. Never silently repurpose an inquiry for a different property.
4. In one atomic, tenant-scoped service, validate property/contact/agent membership, ownership/assignment rules, contact/inquiry identity, agreed value, and source availability; create/reuse the records and enter VERIFICATION_CLOSING using shared transition/workflow logic. Record initiation in the audit trail. Repeated submission returns the same initiation result.
5. Open the existing ClosingWorkflowPanel immediately. Keep configured requirements, direct management approvals, and current evidence options. New initiation does not mark the property SOLD, create earned commission, assert funds received, or complete transfer.
6. Only the existing authorized Won action after closing readiness creates the commercial sale/commission transaction. Preserve one transaction per inquiry and guard concurrent winners. Conveyancing remains a subsequent transfer workflow; sale-agreed and transfer-complete are different events.
7. Refresh sales, pipeline, property, commissions, overview, and agent views after completion. Give the user links to both sale statement actions.

Replacing only the modal is insufficient: the current direct POST /api/sales would still bypass closing. Replace its create-sale behavior with the shared initiation service or a clear conflict response directing callers to closing; update all legitimate callers. Do not keep a second sale-completion path. Historical transactions lacking buyer/contact/source remain readable and printable with missing-data labels; never invent or silently backfill buyers.

## Persistence and access changes

Proposed additive changes: organization-owned payment instruction configurations; explicit lease statement address/opening-balance data; a versioned statement document snapshot with source links. Final field names/contracts and migration are defined in the implementation plan after design review. Preserve LandlordStatement and its approval workflow. Document snapshots reference source identity and financial values, not PDF binaries.

Every generation/read/revision route uses authenticated organization scope, Zod input validation, permissions and assignment checks, bounded queries, private/no-store responses, and generic unavailable errors for foreign documents. Bank configuration edits are separate from export permissions. Add migrations with staged rollback guidance; do not apply any production migration without explicit production authorization.

## Delivery and acceptance

Implement in four coherent slices: shared snapshot/viewer and tenant statement; PWA commission statements/status/filter corrections; client-facing and internal sale statements; Record Sale closing initiation and removal of the bypass. Reuse the common document infrastructure throughout.

Required checks: financial examples covering opening balances, arrears vs not-yet-due charges, partial/late/pending payments, credits, dates and currencies; own-agent/cross-agent/cross-organization access; field-agent viewer access without dashboard access; filter boundary agreement; multi-page PDFs/print; generation failures/retry/reload; new/existing contact and inquiry reuse; concurrent/idempotent closing initiation; management Won/readiness; no sale/commission on initiation; separate transfer completion; full tests, TypeScript, lint delta, audit, build, and browser checks on desktop/mobile.

Production database application and runtime deployment verification are separate from local test/build and Git push evidence.

## Review decisions

The user confirmed document-specific recipient edits, agency-managed payment instructions, full-month billing, and verified opening balances. Review the coordinated document/access/closing design before implementation. No financial product code or schema has changed yet.
