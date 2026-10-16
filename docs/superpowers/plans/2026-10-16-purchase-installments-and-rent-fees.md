# Property Purchase Installments and Rental Property Agency Commission Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task after the proposed commercial rules have been reviewed. Independent agent work requires explicit authorization.

**Goal:** Deliver two distinct capabilities: **(1) installment payment tracking for property purchases**, and **(2) an additional configuration on each rental property defining how the agency receives rental commission: an upfront amount, such as one month's rent, or a percentage of rent for an agreed period**.

**Confirmed scope clarification — 16 October 2026:** Rental commission configuration belongs on the **rental property**, available when adding or editing it. Lease creation inherits and snapshots that property's approved commission configuration for the tenancy. Lease screens and landlord statements consume those terms; they are not the primary configuration entry point. This configuration defines the agency's commission, not the tenant's payment schedule or the individual agent's share.

**Architecture:** Extend Contour's existing sale, lease, payment, closing and statement infrastructure. Keep contractual amounts, verified receipts, agency fees and payouts distinct. Use PostgreSQL transactions and immutable financial events rather than editable balance fields as the source of truth.

**Tech stack:** Existing Next.js, TypeScript, Prisma 6, PostgreSQL, Zod, Vitest, tenant permissions, audit logs and statement viewer. No new package, payment gateway, database or accounting platform is proposed.

**Spec:** Sections 1–9 of this document are the proposed design; sections 10–14 are the implementation and release plan. Status: **proposal for review, not approval to implement or migrate production**.

**Evidence baseline:** Local source at `42461adf83521065b17bcdbd3e195196b58f9eaa`, reviewed on 16 October 2026. Plan branch: `chore/installments-rent-fee-plan`. Existing unrelated untracked audit/video artifacts were left untouched. Source inspection does not establish the state of the production database or deployment.

## Global constraints

- Confirmed by Seward: **installment tracking is for property purchases only**. Do not add rent installment schedules.
- Confirmed by Seward: **rental properties need an additional agency commission configuration**, with upfront amount/months-of-rent or percentage-for-period options. Individual agent commission splits remain separate.
- Preserve readiness-gated sale closing, contact/inquiry identity, tenant isolation, and the independent title-transfer workflow.
- Keep existing saved statements readable and financially unchanged; corrections create new events and document revisions.
- Use decimal arithmetic with two currency decimal places, money strings on new API contracts, and no mixed-currency totals.
- Use the organization's timezone for dates, with the existing `Africa/Lusaka` fallback. Due dates are local calendar dates; a payment becomes overdue on the following local day.
- No interest, late penalties, FX conversion, automatic bank movement, automated refunds or automatic forfeiture in the first release.
- Financial writes require connectivity. Offline drafts may be retained, but must never display a receipt or settled balance before server confirmation.
- Additive migrations only; no production migration without explicit authorization. No binary evidence stored in PostgreSQL.

## Review focus

1. Duplicate requests and simultaneous receipts must not settle the same balance twice — tasks 2–4 and 7.
2. A bank reference or uploaded screenshot must not count as verified cash — tasks 3 and 7.
3. Rescheduling or cancellation must preserve receipts and prior agreed schedules — tasks 2–4.
4. A late rent receipt must use the agreement for its allocated rental period — tasks 6–8.
5. A statement revision must not deduct a fee or authorize a landlord payout twice — task 8.

## 1. Intended outcomes and user stories

### Point 1 — Property purchase installment tracking

As a manager, I can agree a purchase price, deposit and dated installments, see what the buyer has actually paid, identify overdue amounts, and record corrections with a reason. As finance, I can verify supporting payment evidence and distinguish money received by the agency from payments verified as received by the seller or conveyancer.

Success means staff can answer, for each purchase: agreed price, verified paid amount, remaining principal, overdue amount, next due date, payment history, current plan version and who approved changes.

### Point 2 — Agency commission configuration on rental properties

As a manager adding or editing a **rental property**, I can configure **“How does the agency receive commission for this rental property?”** in an additional **Rental agency commission** section. Show this section for `FOR_RENT` and the rental side of `BOTH`; preserve the separate sale commission configuration for `BOTH` properties.

- **Upfront agency commission:** a fixed amount or the equivalent of a chosen number of months' rent, such as one month's rent.
- **Percentage agency commission:** a percentage of rent for a specified period, such as 10% for 12 months, with “until lease end” as an explicit option. Using collected rent as the calculation base remains a proposed commercial rule.

The property form previews the agency commission before saving. Starting a lease shows the inherited property configuration and freezes an approved version for that tenancy. Later edits to the property's configuration apply to future leases and must not silently alter existing lease commission or historical statements. An active lease change requires an explicit, audited amendment.

**The two delivery points must remain visible throughout implementation:** purchase installments are a buyer payment-tracking feature; rental agency commission is a property configuration feature with downstream calculation and reporting. Rent receipt/statement work below supports that commission configuration and must not be presented as a rent installment feature.

Business value: support installment buyers without losing collection follow-up, reduce disputes over rental fees, and give management reliable balances and owner statements.

## 2. Current source evidence and gaps

| Existing source | Observed behavior | Required change |
| --- | --- | --- |
| `prisma/schema.prisma`: `Transaction` | Stores gross value, nullable deposit/balance and commission/transfer statuses | Add explicit plan, schedule and receipt records; do not treat deposit/balance fields as proof of payment |
| `src/app/api/sales/[id]/transfer/route.ts` | Accepts manually supplied deposit/balance alongside transfer changes | Reject manual money changes once a sale uses the new ledger; retain historical labels for unmigrated records |
| `src/lib/sales-closing.ts`, `src/app/api/sales/closing/route.ts` | Starts/resumes closing without asserting a completed sale | Attach proposed terms to the inquiry; activate against the transaction only through authorized Won |
| `src/app/api/clients/[id]/transition/route.ts`, `[id]/route.ts` | Contain transaction-creation paths | Audit and route all legitimate Won paths through a shared activation service; no duplicate sale/plan creation |
| `src/app/api/sales/route.ts` | Lists transactions; direct POST completion returns 409 | Preserve the closing gate; ensure installment views select `PROPERTY_SALE`; add bounded queries |
| `Lease.managementFeePercent`, `Property.agencyCommissionPct` | Two persisted rental fee percentages | Add explicit rental property commission configuration; approved lease snapshots supply the authoritative historical calculation terms |
| `src/app/api/statements/route.ts` | Landlord fee is gross rent multiplied by the property's percentage | Consume posted fee entries per lease and retain historical statement snapshots |
| `src/lib/rental-closing.ts` | Creates a rental placement transaction using a property percentage; separate lease-creation path also exists | Both setup paths inherit the approved property commission configuration and snapshot it; prevent placement and management fee double counting |
| `RentPayment`, `recordRentPaymentSchema` | Receipt/status/month fields exist; no rent receipt creation handler found in the inspected source | Add a minimal verified rent receipt workflow needed to calculate fee shares; this is not rent installment scheduling |
| `src/lib/statements/ledger.ts` | Supports verified opening balances, full monthly rent, partial confirmed rent receipts and credits | Preserve tenant rent calculation and deposit separation; integrate explicit reversals without changing the monthly billing rule |
| `src/lib/statements/service.ts`, `document.ts` | Immutable tenant/sale/commission documents and shared viewer already exist | Extend sale and landlord content; retain old snapshot readers |
| `src/lib/authorization.ts` | Finance officer has finance permissions, broker manager has lease permissions, field agent has PWA permissions | Define feature permissions explicitly; role names alone are insufficient |

The installment ledger must also stay separate from `src/lib/billing-ledger.ts` and Lenco subscription webhooks: those concern the agency's Contour subscription, not a property buyer's purchase payments.

## 3. Approach and boundaries

| Option | Benefit | Limitation | Recommendation |
| --- | --- | --- | --- |
| Add more deposit/balance fields and a fee toggle | Small initial change | Cannot explain allocations, corrections, partial receipts or historic terms | Reject |
| Domain-specific purchase ledger plus rental property commission configuration and lease snapshots/entries | Reuses existing workflows; supports an auditable balance and statements | Requires additive schema and coordinated property/finance/UI work | **Recommended** |
| Build a general accounting/credit-servicing platform | Broad future flexibility | Adds accounting, lending and reconciliation scope beyond this requirement | Defer |

First release records and verifies payments made through existing channels. It does not process a payment or issue legal lending terms. Before actual contracts are issued, the operator must confirm the wording, commission timing, cancellation and refund treatment used in those contracts; Contour records those approved terms.

Two coordinated workstreams share money, audit and access conventions but have separate source records. Purchase installments can ship before rental fees. Each release requires its own test and rollout gate.

## 4. Property purchase rules

### 4.1 Agreement and schedule

- Draft a plan from a real sale inquiry linked to its existing contact and property. No placeholder buyer or duplicate contact.
- Choose **Pay in full** or **Installments**. Both use the receipt ledger; pay-in-full has one scheduled obligation.
- Capture agreed price/currency, optional deposit amount and due date, and either a monthly schedule or individually dated installments.
- The deposit is part of the agreed price. Deposit plus installments must equal the price exactly.
- Generate monthly dates from the original chosen day; clamp to the last valid day of shorter months without drifting later months. Put rounding residue into the final installment.
- Proposed maximum: 360 schedule lines and a 30-year horizon. Reject zero/negative lines, missing dates, duplicate line identifiers and totals that do not reconcile.
- Show a chronological preview and require management approval with contract/evidence reference before activation. Past due dates are allowed only in an explicitly reviewed historical import.
- Draft terms can be saved during closing. Activation requires the tenant-scoped `PROPERTY_SALE` transaction produced by the existing authorized Won flow.
- New first-release receipts are recorded only after activation. Reservation deposits before commercial close are a later extension; operators must not falsely mark Won just to enter one.

### 4.2 Receipts, allocations and balances

Record amount, currency, actual payment date, method, reference, recipient/custodian, evidence reference and recorder. Custodian is `AGENCY`, `SELLER` or `CONVEYANCER`; the last two require evidence of receipt and verification. A buyer's claim alone is pending.

Record pending first. Only a finance-authorized confirmation reduces the buyer's balance. A privileged recorder may use a combined record-and-confirm action, but both actions must be audited. Preserve actual payment date and confirmation time separately.

Apply verified money to the oldest unpaid schedule line, ordered by due date then line sequence. Allocate across multiple lines when needed. Display the allocation preview before confirmation; do not let a caller move money to another buyer, sale or organization. Pending/bounced/rejected receipts do not reduce the balance.

For an as-of date:

```text
verifiedPaid = confirmed principal receipts − confirmed principal refunds/reversals
outstandingPrincipal = agreed price − verifiedPaid
overdue = sum(unpaid portions of lines whose due date has passed)
futureDue = outstandingPrincipal − overdue
```

Reject a receipt exceeding outstanding principal in release one, with a clear error; do not silently lose or cap money. Pending entries may collectively exceed the balance, but confirmation rechecks under a sale lock and rejects the excess. Staff correct an overpayment outside this ledger until buyer credit support is explicitly added.

Illustration: price **K300,000**, deposit **K60,000**, then **12 × K20,000**. With a verified deposit and K8,000 against the first installment, verified paid is K68,000 and outstanding is K232,000. After that installment's due date, overdue is K12,000; future installments are not overdue.

### 4.3 Lifecycle, changes and cancellation

- Plan lifecycle: `DRAFT → ACTIVE → COMPLETED`, or `CANCELLED`. Schedule history uses immutable revisions; `OVERDUE` is a calculated collection condition, not a replacement lifecycle.
- Completion requires zero outstanding principal. Commercial Won, paid in full and title transfer complete remain separate facts.
- Reschedule by approving a new version of remaining unpaid obligations, with effective date, reason, actor and source evidence. Preserve paid portions and old allocations. Lock the sale so a concurrent receipt cannot be lost.
- Normal rescheduling cannot change the price, buyer, currency or property. Those require a separately scoped contract amendment; do not hide a discount in a schedule edit.
- Cancellation blocks ordinary future collection. Preserve the balance, receipts and allocations, and display “cancelled — settlement review required.” It does not erase debt, relist the property, reverse Won, refund money or forfeit the deposit automatically.
- Correct confirmed entries with linked reversal events and a replacement receipt when necessary. A refund is a separately recorded, evidenced cash-out event, linked to original confirmed money and custodian, capped at the unrefunded amount. No automated transfer is initiated.
- Sale commission remains governed by its existing agreement. Buyer principal receipts must never automatically mark agency commission received or the agent paid out.
- Existing title-transfer permissions remain; display outstanding purchase balance and require an audited management reason if completing transfer while principal remains outstanding. Do not imply that the software establishes legal title.

## 5. Rental property agency commission configuration and rules

### Property configuration and inheritance

- Store the agency's commission choice against the rental property, not solely against a lease or organization-wide default.
- Provide upfront amount/months-of-rent and percentage-for-period as the two primary options. Explicit no-commission remains an approved exception.
- For percentage duration, store the number of eligible rental months or “until lease end” on the property configuration. Resolve actual first/last months against the tenancy start when the lease snapshot is approved.
- For months-of-rent commission, show an illustrative amount using the property's advertised rent, then freeze the actual amount using the agreed monthly rent at lease activation. Fixed amounts retain their configured currency and must match the lease currency.
- Version property configuration changes. Keep the source configuration ID/version on the lease commission snapshot and downstream entries.
- Editing the property must not reset recovered upfront commission, change active lease terms, or recalculate historical commissions. Changing an active tenancy requires explicit approval of a new effective lease commission version.
- A property may be saved without complete commission terms, labelled “Rental commission needs configuration”; require reviewed terms before lease commission activation or deductions. This avoids blocking initial listing capture while preventing guessed fees.

### 5.1 Upfront amount / months of rent

On the rental property, capture mode `UPFRONT`, calculation `FIXED_AMOUNT` or `MONTHS_OF_RENT`, currency, agreed amount or rent-month multiplier, and evidence reference. At lease activation, snapshot the approved property configuration and agreed rent, resolve the effective start, and freeze the resulting commission target amount.

**Proposed collection rule:** deduct the agency fee first from verified rent received for this lease until the target is recovered. “Upfront” describes the contractual fee, not proof that it has been received. Partial rent receipts may recover it over several receipts. The landlord agreement must authorize this priority before activation.

Example: monthly rent **K5,000**, agency fee **one month's rent = K5,000**. A first verified receipt of K3,000 yields K3,000 agency / K0 landlord and K2,000 fee remaining. A later K2,000 completes the agency fee. The next K5,000 yields K0 agency / K5,000 landlord, before approved maintenance deductions.

Do not add a recurring percentage on top in the first release. If the fee is invoiced separately to the landlord rather than retained from rent, record that as a later supported collection mode; do not pretend that an invoice is a rent deduction.

### 5.2 Percentage for a period

On the rental property, capture mode `PERCENTAGE`, rate greater than 0 and at most 100, duration in rental months or explicit “until lease end”, currency, and evidence reference. At lease activation, snapshot these terms and resolve the first/last eligible rental months. Reject overlapping approved agreements for the same lease and rental period.

- Base: **verified collected rent allocated to eligible rental periods**. Exclude deposits, maintenance recoveries, future unpaid rent and buyer purchase payments.
- Eligibility follows the rental month, not when cash arrived. A late receipt for an eligible month still earns the agreed fee; a receipt for a month outside the range does not.
- First release supports explicit full rental months, matching the current full-month lease billing rule. Mid-month fee proration is outside scope.
- Rent increases do not alter a frozen upfront amount. For percentage agreements the percentage applies to actual eligible collected rent; any rent change must follow separately approved lease terms.
- A zero-fee agreement is explicit mode `NONE` with management approval, not an accidentally missing fee.

Example: rent **K5,000**, fee **10%** for the first **12 rental months**. K3,000 verified rent produces K300 agency / K2,700 landlord. The remaining K2,000 produces K200 / K1,800. The total for that month is K500 / K4,500. Month 13 earns no fee under that agreement; an approved successor agreement is required to continue charging.

### 5.3 Precision, posting and reversals

- Round cumulative percentage fee per agreement/rental month to two decimal places; each new fee entry is the rounded cumulative fee minus already posted net fees. This prevents different receipt splits changing the final fee.
- Upfront fee on a receipt is `min(eligible receipt amount, target − net recovered fee)`. Lock the lease/agreement before calculating it.
- Post fees atomically on receipt confirmation, with receipt ID, agreement version, rental month, cash posting date and actor. Statement generation only reads entries and never earns the fee again.
- For new ledger-backed landlord statements, use cash posting month for collections/fees/maintenance and show rental allocation month separately. Tenant statements continue using the contractual rent period. Label this distinction in both documents.
- Confirmation posts in the current open cash period; actual payment date remains visible. Do not silently backdate into a paid-out period. Historical imports need reviewed opening balances instead.
- Reversal of a fee source reverses its original fee allocation, preserving links and prior documents. Recompute percentage deltas under lock. If an upfront reversal reopens an unrecovered amount, future receipts recover it; do not rewrite already paid landlord statements.
- If a reversal follows a landlord payout, show a separately approved settlement adjustment/carry-forward. Block automated netting until finance reviews it. Never issue a negative cash payout.
- Approved maintenance deductions remain separate. Excess deductions become an explicit carry-forward balance for review, not a negative payment instruction.
- Ending a lease stops future rent obligations according to the existing termination date. Historical eligible receipts still use their historical fee version. Unrecovered upfront fees remain visible for settlement; no automatic landlord debt or waiver is invented.

### 5.4 Rental placement and agent commissions

There must be one source for the agency's actual rental fee. The current rental placement `Transaction` and the landlord fee deduction cannot both count the same receipt as revenue.

Proposed first-release treatment: new rental transactions retain commercial close identity and any explicitly approved placement entitlement, while rental fee ledger entries supply actual collected fee totals. Do not infer a separate placement charge from the property's old percentage. Agent entitlements and payouts remain separate; percentage-duration forecast totals must be labelled forecasts and must never enter collected revenue. Existing historical transactions retain their recorded values and “legacy terms” label until reviewed.

## 6. Proposed data model

All new financial tables have `organizationId`, IDs, currency where relevant, actor/timestamps and restrictive source relations. Add composite tenant/source foreign keys using supporting unique keys; a plain foreign key on `id` alone does not prove tenant equality. Avoid cascading deletion of financial history.

| Model | Main fields and relationships | Integrity rules |
| --- | --- | --- |
| `SalePaymentPlan` | inquiryId, nullable unique transactionId, buyerContactId, price, currency, lifecycle, currentRevision, version, approval/evidence | One plan per inquiry; transaction must be PROPERTY_SALE from that inquiry; identity/currency frozen after activation |
| `SalePlanRevision` | planId, revision, effectiveDate, reason, approval actor/time, supersedesId | Unique organization/plan/revision; approved revision immutable |
| `SaleInstallment` | revisionId, sequence, kind DEPOSIT/INSTALLMENT/FULL_PAYMENT, amount, dueDate, carriedPaidAmount | Unique revision/sequence; positive amount; full revision reconciles price and preserved paid portions |
| `SalePaymentEvent` | planId, kind RECEIPT/CONFIRM/REJECT/REVERSAL/REFUND, amount, paymentDate, postedAt, custodian, method/reference, sourceEventId, evidence, idempotencyKey, payloadHash | Append-only; one confirmation per receipt; refunds/reversals require an eligible source; unique organization/idempotencyKey |
| `SalePaymentAllocation` | confirmation/reversal eventId, installmentId, amount, reversedAllocationId | Append-only signed postings; sum cannot exceed event amount or remaining obligation under lock |
| `PropertyRentalCommissionConfig` | propertyId, revision, mode NONE/UPFRONT/PERCENTAGE, calculation, fixedAmount/currency, monthsMultiplier, percentage, durationMonths or untilLeaseEnd, approval/evidence | Organization-owned property configuration; only FOR_RENT/BOTH; versioned approval; sale commission fields remain separate |
| `RentalFeeAgreement` | leaseId, sourcePropertyConfigId/revision, revision, mode NONE/UPFRONT/PERCENTAGE, calculation, frozenRent, targetAmount, monthsMultiplier, percentage, start/end rental month, approval/evidence, activationCashPeriod | Approved immutable tenancy snapshot of property commission terms; no period overlap; exactly the fields required by chosen mode |
| `RentalFeeEntry` | agreementId, rentPaymentId, amount, sourceAmount, rental month, postedAt, reversalOfId, reason | Immutable positive fee or linked negative reversal; unique source posting key |
| `RentPaymentEvent` | rentPaymentId, kind CONFIRM/REJECT/REVERSE, actor, postedAt, reason/evidence, idempotencyKey | Preserve old RentPayment rows; new status projection is backed by events; net receipts/fees exclude reversed money |

`SalePlanRevision` deliberately keeps settled schedule portions and references original allocations. On reschedule, the read model combines preserved settled history with current unpaid obligations; never sum all revision lines as new debt. Store revision lineage in statement snapshots.

The exact composite relations/check constraints and enums must be finalized in the schema task, before SQL is applied. Cross-row constraints such as total allocations, total refunds and schedule sums are enforced by a locked transactional service, with database uniqueness/checks as additional protection. Do not attempt cross-row `CHECK` expressions.

Indexes: organization/plan/status; organization/plan/postedAt/id; organization/revision/dueDate; organization/property/config revision; organization/lease/effective rental month; organization/rentPaymentId; organization/fee postedAt; organization/sourceEventId. Due and collection queries must use scoped indexes and cursor pagination.

Retain `Transaction.depositAmount` and `balanceAmount` for old records. For activated plans, expose derived deposit paid and principal outstanding; reject writes to these legacy fields. Add a source discriminator (`LEGACY_RECORDED` or `PAYMENT_LEDGER`) to API summaries instead of showing an invented zero for unknown historic data.

## 7. API and permissions

Write an OpenAPI contract first at `docs/api/property-finance.openapi.yaml`, then derive Zod validation and typed client DTOs. New endpoints use `/api/v1`; existing `/api` routes retain compatibility through the same services. Every write carries a UUID idempotency key and relevant expected version. Same key/same payload returns the original result; same key/different payload returns 409.

| Proposed route | Purpose |
| --- | --- |
| `POST /api/v1/sale-payment-plans` | Draft terms from sale inquiry; does not create a completed sale |
| `GET /api/v1/sales/:id/payment-plan` | Current approved schedule, totals and version; paginated history separately |
| `POST /api/v1/sale-payment-plans/:id/approve` | Approve draft/revision; activation still requires Won transaction |
| `POST /api/v1/sale-payment-plans/:id/revisions` | Propose reschedule with expected version and reason |
| `POST /api/v1/sale-payment-plans/:id/cancel` | Cancel collection with reason; preserve settlement balance |
| `GET/POST /api/v1/sales/:id/payments` | List/record principal receipts |
| `POST /api/v1/sales/:id/payments/:paymentId/events` | Confirm, reject, reverse or record evidenced refund |
| `GET/POST /api/v1/properties/:id/rental-commission` | Read approved property configuration/history or save a proposed configuration version |
| `POST /api/v1/properties/:id/rental-commission/:configId/approve` | Approve the property's rental agency commission configuration |
| `GET/POST /api/v1/leases/:id/fee-agreements` | Read inherited commission history or propose an explicit active-lease amendment |
| `POST /api/v1/leases/:id/fee-agreements/:agreementId/approve` | Approve future terms or reviewed cutover |
| `GET/POST /api/v1/leases/:id/rent-payments` | Minimal receipt recording/listing against existing monthly RentPayment |
| `POST /api/v1/leases/:id/rent-payments/:paymentId/events` | Verify/reject/reverse rent and post linked fees |
| `GET /api/v1/collections` | Paged purchase-only due/overdue list, filtered by currency and assigned agent |

Proposed DTO rules: money is a positive canonical decimal string with at most two fraction digits; full refund/reversal amounts are resolved from the source; dates use YYYY-MM-DD for obligations and ISO timestamps for events. At most 360 schedule lines, 50 rows per default page/100 maximum, 500 characters for reasons, existing private evidence IDs rather than arbitrary URLs. Reject unknown status transitions and dates after the organization's current day for actual receipts. Bound all text and query ranges. Validate in both UI and server.

Add explicit permissions to the existing authorization registry and group mappings:

- `sales.payments.read`, `sales.payments.record`, `sales.payments.verify`, `sales.plans.manage`.
- `rental.fees.manage`, `rental.payments.read`, `rental.payments.record`, `rental.payments.verify`.

Proposed role mapping: owner has all; finance officer has all feature permissions; broker manager manages plans/fee agreements and reads balances but does not verify cash unless explicitly granted finance authority. Field agents see assigned purchase progress through a redacted PWA DTO and may submit a payment claim as pending if granted record permission; they cannot confirm/refund/reverse, view bank evidence or change fee terms. Admin staff receive no financial write authority by default. Landlord/tenant roles receive no new portal access in this release.

Use `createApiHandler`, server-resolved organization/actor, permission plus source-assignment checks, private/no-store responses and generic 404s for inaccessible IDs. Validate organization equality for every nested ID and evidence object. Add public/machine rate limits according to existing conventions; no new MCP/Dify financial writes in this release.

Return 400 for invalid input, 403 for a permitted source but forbidden action, 404 for unavailable sources, 409 for stale versions/idempotency/invalid transitions and 429 for throttling. Return machine-readable error codes for amount exceeds balance, missing evidence and unapproved plan.

## 8. Screens and workflow integration

### Purchase workflow

1. Existing closing screen gains **Payment terms** with full payment/installments, deposit and schedule preview. Saving terms does not close the deal.
2. Approved Won binds and activates the plan in the same transaction that creates/reuses the sale.
3. Sales detail gains **Payment plan**, showing price, verified paid, outstanding, overdue and next due; transfer and commission remain separately labelled.
4. Schedule rows show due date, expected, applied and remaining, with derived Unpaid/Part-paid/Paid/Overdue indicators. Show pending receipts separately.
5. **Record payment** captures recipient, amount, date, method/reference and private evidence; confirmation shows exact allocation and new balance.
6. Finance can confirm/reject, reverse with reason, record evidenced refund, reschedule or cancel. All history remains visible with current permissions.
7. Sales list adds payment status/due filters. Collections shows the next action, owner and overdue amount; no automatic outreach is required for the first release.
8. Assigned agent PWA shows the same server-calculated purchase progress. Preserve form drafts on transient failure; replay uses the original request key.

### Rental workflow

1. **Add/Edit Property:** show an additional **Rental agency commission** section for `FOR_RENT` and the rental side of `BOTH`. Ask **How does the agency receive commission?** with the two primary options: **Upfront amount** and **Percentage of rent for a period**.
2. **Upfront configuration:** capture fixed amount or months of rent and show the illustrative agency commission, such as “Agency receives one month's rent”. The actual agreed rent is frozen when a lease starts.
3. **Percentage configuration:** capture percentage and duration, such as “Agency receives 10% of rent for 12 months”, or explicit “until lease end”. Preview the commission and landlord remainder using the advertised rent, with collected-rent calculation clearly labelled as proposed until confirmed.
4. **Property details:** display the current approved rental commission configuration, its version and whether it applies only to future tenancies. Keep sale commission separately labelled for `BOTH`.
5. **Add Lease / Start Lease:** inherit the property's approved configuration, show the resolved commission amounts/dates, and save an immutable tenancy snapshot. If terms are missing, direct authorized staff to configure this property; do not make the lease form the sole place this setting exists.
6. **Edit existing property:** explain that changes apply to future leases. Offer a separate authorized amendment workflow when an active tenancy also needs different commission terms.

Use the same commission fields/schema in property create/edit and the inherited lease review. Include explicit No agency commission for approved exceptions.

Lease details show approved terms, fee target/recovered/outstanding or percentage/period, receipt history, and an agency/landlord preview for a proposed payment. If no agreement is approved, mark “Fee terms need review” and block new fee deductions; do not guess a fallback.

Use responsive components at desktop and 390px mobile width, accessible labels, inline errors, keyboard focus, loading/error/retry states and horizontally safe schedule tables/cards. Follow existing workspace refresh events and cache invalidations for sales, leases, statements, agent summary, analytics and action queues.

## 9. Statements, reporting and legacy cutover

- Buyer sale statement: approved schedule, confirmed principal receipts, recipient/custodian, paid, outstanding, overdue, next due, reversals/refunds and as-of date. Internal commission data stays in the internal variant.
- Rental tenant statement: retain full-month charges and verified opening balance semantics; subtract only net confirmed rent, not an agency fee. The tenant owes rent, not the agency/landlord allocation twice.
- Landlord statement: cash collected, agency fee entries with agreement reference, maintenance, settlement adjustments and net amount available. Show actual recorded payout separately from calculated entitlement.
- Saved statements remain immutable. Add optional source IDs/revision/cutoff fields or a backward-compatible v2 schema; retain v1 rendering. New generation reads finance facts in one consistent transaction/cutoff.
- Generation never creates a fee entry. Repeated generation or document revision cannot earn the fee twice.
- Preserve the existing statement approval chain. Carry a shared settlement identity across revisions of a property/cash period. A paid-out period cannot be paid again through a regenerated revision; differences require a reviewed adjustment in an open period. Use the audit log and a locked period settlement record if existing data cannot enforce this invariant.
- Reports distinguish purchase principal, agency-held purchase cash, externally verified principal, rental collections, rental agency fees, commission entitlement and agent payout. Never add principal receipts to company revenue. Keep each currency separate.
- Existing property percentages and historical rental placement transactions are migration evidence only. Produce a review report comparing lease percent, property percent and saved statements, then populate reviewed rental property commission configurations; do not auto-select a conflicting value or overwrite separate sale commission on BOTH properties.
- Existing sales start as **Historical balance unverified**. A manager verifies a cutover amount, date, recipient/custodian and source evidence; append an opening principal event excluded from current-period cash collection. Create only the remaining schedule. Never infer confirmed paid = price minus an arbitrary legacy balance without approval.
- Existing leases need an approved effective fee agreement and verified recovered-upfront amount (including zero). Add a cutover opening fee event/reference; do not reconstruct old fees blindly or re-deduct them.
- Activate new rent fee accounting only at an approved open cash-period boundary. Earlier unposted receipts need explicit review; keep historical statements and legacy fee totals separate. New code must not silently rewrite a paid-out month.

## 10. File responsibility map

Paths below are proposed unless listed as existing in section 2.

| Area | Files |
| --- | --- |
| Contract/types/validation | `docs/api/property-finance.openapi.yaml`; `src/lib/property-finance/types.ts`; `src/lib/validations/property-finance.ts` |
| Purchase calculations | `src/lib/property-finance/sale-schedule.ts`; `sale-balances.ts`; `sale-payments.ts`; `sale-plans.ts` |
| Rental configuration/calculations | `src/lib/property-finance/property-rental-commission.ts`; `rental-fees.ts`; `rental-payments.ts`; `rental-agreements.ts` |
| Shared transactional controls | `src/lib/property-finance/idempotency.ts`; `access.ts`; `cutover.ts` |
| Schema | `prisma/schema.prisma`; new timestamped migrations with adjacent guarded `rollback.sql` |
| API | New `src/app/api/v1/` routes corresponding to section 7; existing sales/transfer/lease/statement routes delegate to shared services |
| Closing | `src/lib/sales-closing.ts`; `rental-closing.ts`; both `src/app/api/clients/[id]/` Won paths; `src/components/closing/closing-workflow-panel.tsx` and `start-lease-dialog.tsx` |
| Property and finance UI | `src/components/property-finance/sale-payment-plan.tsx`; `sale-payment-dialog.tsx`; `rental-fee-fields.tsx`; `rent-payment-dialog.tsx`; existing property create/edit/detail components and dashboard properties/sales/leases pages |
| Property persistence | Existing `src/app/api/properties/route.ts` and property validation schemas; delegate rental commission configuration to the shared versioned service without overwriting sale commission |
| Statements/reporting | Existing `src/lib/statements/{service,document,ledger,viewer,legacy-landlord}.ts`; `src/app/api/statements/route.ts`; `src/lib/analytics/report-engine.ts`; agent summary and MCP/Dify read adapters |
| Access/refresh | `src/lib/authorization.ts`; `authorization-groups.ts`; `machine-permissions.ts`; `workspace-events.ts`; existing cache tags |
| Operations | `scripts/audit-property-finance.ts`; `scripts/test-property-finance-db.ts`; `docs/property-finance-operations.md` |

## 11. Implementation tasks

Each task follows the same sequence: add the named failing tests; run the focused test and inspect the expected failure; implement; rerun to pass; inspect the diff and commit the scoped files using the suggested message. Do not treat a skipped or infrastructure-blocked check as passed.

### Task 1 — Freeze contracts and access rules (1–2 days)

**Files:** contract, types and validation files from section 10; authorization registry/groups and tests.

**Interfaces:** `Money = string`; `LocalDate = string`; `SaleBalanceSummary = { price, verifiedPaid, outstandingPrincipal, overdue, nextDueDate, currency, asOf, version }`; `RentalFeePreview = { receiptAmount, agencyFee, landlordShareBeforeExpenses, feeRemaining, currency, agreementId }`. All money members use `Money`; nextDueDate and feeRemaining may be null.

- [ ] Resolve the decisions in section 14; record accepted values before product implementation.
- [ ] Write OpenAPI request/response schemas, errors, status transitions, pagination and access matrix; define event/revision IDs and evidence contracts.
- [ ] Add `property-finance.test.ts`: accept exact money strings; reject negative/overprecision amounts, future actual receipts, invalid dates, >360 lines and wrong mode fields.
- [ ] Add authorization tests for owner, finance officer, broker manager, admin and assigned/unassigned field agents. Verify finance officers can perform approved actions without unrelated `leases.manage` gates.
- [ ] Run `pnpm exec vitest run src/lib/validations/property-finance.test.ts src/lib/authorization.test.ts src/lib/authorization-groups.test.ts`; expected all pass after implementation.
- [ ] Commit `docs(finance): define installment and rental fee contracts`.

### Task 2 — Add schema, constraints and reviewed cutover (2–3 days)

**Files:** Prisma schema, new migrations/rollback, `cutover.ts`, audit script, schema/migration tests.

**Interfaces:** `auditPropertyFinance(organizationId)` produces unresolved legacy balances, fee conflicts and missing identity/evidence without mutating records. `approveFinanceCutover(ctx, input)` appends reviewed opening events and returns source IDs; it does not claim fresh cash.

- [ ] Add migration tests for composite tenant references, positive amounts, unique event keys, immutable approved revisions, refund sources, and restricted deletion.
- [ ] Add the section 6 models, plus explicit opening-event support and statement settlement identity needed by section 9; use decimal columns and calendar dates for obligations.
- [ ] Implement a read-only audit output, then manager-approved per-record import with source evidence. Same import key must not double count opening principal/fees.
- [ ] Test that conflicting property/lease percentages remain unresolved, an unknown historical deposit stays unknown, and imported totals do not inflate current collection reports.
- [ ] Run `pnpm exec prisma validate`, focused migration tests and migrations against an isolated disposable PostgreSQL database. Inspect indexes and representative query plans.
- [ ] Add guarded rollback guidance: unused development schema only; refuse removal after financial events exist. Production uses roll-forward correction.
- [ ] Commit `feat(finance): add audited purchase and rental fee records`.

### Task 3 — Build purchase schedules and payment engine (3–4 days)

**Files:** `sale-schedule.ts`, `sale-balances.ts`, `sale-plans.ts`, `sale-payments.ts`, `idempotency.ts` and adjacent tests.

**Interfaces:** `buildSaleSchedule(input): InstallmentDraft[]`; `calculateSaleBalance(input): SaleBalanceSummary`; `recordSalePayment(ctx,input)`; `appendSalePaymentEvent(ctx,input)`; `reviseSalePlan(ctx,input)`. Transactional services return saved IDs, current version and balance summary.

- [ ] Test K300,000 / K60,000 / twelve K20,000 lines, unequal custom installments, rounding residue, leap-day/month-end generation, and due-today versus overdue-tomorrow.
- [ ] Test K68,000 paid / K232,000 outstanding / K12,000 overdue example; pending and rejected claims leave principal unchanged; verified external receipt reduces principal without adding agency-held cash.
- [ ] Implement FIFO allocations and locked event posting. Lock parent sale/plan using parameterized PostgreSQL row locks through the existing Prisma 6 transaction client; lock source events for refunds. Enforce expected versions and retry at most three serialization/deadlock failures with jitter outside the transaction.
- [ ] Test duplicate same-payload replay, conflicting key 409, simultaneous final receipts, reversal restoring debt, refund caps, and different organizations using the same client key.
- [ ] Test rescheduling leaves old documents/allocations intact, cannot alter price/currency, and races safely with confirmation. Test cancellation retains outstanding balance and blocks ordinary confirmation.
- [ ] Run `pnpm exec vitest run src/lib/property-finance/sale-schedule.test.ts src/lib/property-finance/sale-balances.test.ts src/lib/property-finance/sale-payments.test.ts src/lib/property-finance/sale-plans.test.ts` plus real DB races in task 10.
- [ ] Commit `feat(sales): track purchase schedules and verified receipts`.

### Task 4 — Purchase APIs, closing and transfer integration (2–3 days)

**Files:** sale plan/payment/collections routes; existing closing and transaction-creation routes; sales/transfer route and tests; `access.ts`.

**Interfaces:** section 7 routes delegate to task 3; `activateSalePlan(tx,{organizationId,inquiryId,transactionId,actorId})` is called inside the authorized Won transaction.

- [ ] Add route tests for all roles, foreign tenant/nested IDs, evidence access, stale version and idempotency semantics.
- [ ] Validate that draft terms do not create a completed sale; Won binds one plan to one transaction even on concurrent/replayed calls. Audit both current transaction-creation paths before centralizing.
- [ ] Add paginated purchase summaries and collections; filter rental transactions out. Agent access must use assignment-aware projections rather than a broad finance route.
- [ ] Reject legacy deposit/balance mutations for ledger-backed sales. Preserve transfer functionality and add the audited outstanding-balance override rule.
- [ ] Prove payment completion does not mark commission paid or title transferred; transfer cancellation does not erase financial events.
- [ ] Run new route tests plus existing `sales-closing.test.ts`, closing transition tests, and `sales/[id]/transfer/route.test.ts`.
- [ ] Commit `feat(sales): connect installment plans to closing and collection APIs`.

### Task 5 — Purchase screens and assigned-agent visibility (2–3 days)

**Files:** purchase finance components, closing panel, sales page, existing agent detail/summary surfaces and refresh adapters.

**Interfaces:** consumes task 4 DTOs; UI never recomputes authoritative balances.

- [ ] Add schedule editor, review preview, payment history/verification actions, rescheduling/cancellation dialogs and collections filters.
- [ ] Label bank evidence as pending; display recipient/custodian and confirmation time; show historical unverified state without a misleading zero balance.
- [ ] Add read-only assigned purchase progress to the PWA; any authorized recording is a pending claim only. Show a clear connection requirement for posting.
- [ ] Verify keyboard/focus/error states, 390px layout, duplicate clicks, timeout/retry replay, stale version refresh and retention of unsaved input.
- [ ] Browser-test the section 4 illustration, partial payment, late payment, external recipient, reversal, reschedule and cancellation. Verify list/detail/agent totals agree.
- [ ] Commit `feat(sales): add purchase installment and payment workflows`.

### Task 6 — Rental property commission configuration and calculation engine (2–3 days)

**Files:** `property-rental-commission.ts`, `rental-fees.ts`, `rental-agreements.ts`, property commission API routes, property validation and tests.

**Interfaces:** `savePropertyRentalCommission(ctx,input)`; `approvePropertyRentalCommission(ctx,input)`; `snapshotPropertyRentalCommission(tx,input)`; `previewRentalFee(input): RentalFeePreview`; `approveRentalFeeAgreement(ctx,input)`; `postRentalFee(tx,input)` returns immutable entry IDs and preview. A tenancy snapshot references the approved property configuration/version; posting inputs carry approved agreement version, verified receipt ID, rental month and cash posting period.

- [ ] Add versioned property configuration persistence, approval and read APIs. Test upfront amount/months and percentage/duration validation, FOR_RENT/BOTH eligibility, cross-tenant access, and preservation of sale commission for BOTH properties.
- [ ] Test that both lease creation paths inherit identical property terms, resolve duration from the lease start, freeze months-of-rent against agreed rent, and retain source configuration lineage. Later property edits must leave active lease snapshots, recovered fees and old statements unchanged.
- [ ] Add the two section 5 examples as exact assertions, including recovered-upfront cap, explicit NONE and percentage month 13 = zero.
- [ ] Test cumulative rounding: K0.05 + K0.05 at 10% yields total K0.01, the same as one K0.10 receipt; reverse the applicable source and test correction deltas.
- [ ] Test late receipt uses historic rental-month agreement, future agreements cannot overlap, deposits do not earn fees, and missing approved terms block deductions.
- [ ] Test rent changes do not change frozen upfront target; fee mode revision cannot retroactively charge a paid period; termination keeps eligible historic receipts attributable.
- [ ] Implement pure decimal preview and locked postings, sharing no buyer principal records.
- [ ] Run `pnpm exec vitest run src/lib/property-finance/property-rental-commission.test.ts src/lib/property-finance/rental-fees.test.ts src/lib/property-finance/rental-agreements.test.ts` plus the property commission route tests.
- [ ] Commit `feat(rentals): add upfront and period percentage fee agreements`.

### Task 7 — Property commission settings UI, lease inheritance and receipt verification (2–3 days)

**Files:** `rental-payments.ts`; fee/rent payment API routes; property create/edit/detail components and API integration; lease creation and rental closing; `rental-fee-fields.tsx`, `rent-payment-dialog.tsx`, leases page/start-lease dialog.

**Interfaces:** `recordRentalPayment(ctx,input)` and `appendRentalPaymentEvent(ctx,input)` write existing RentPayment plus audit events and call task 6 fee posting in the same transaction.

- [ ] Test pending → confirmed posts one fee, rejection posts none, repeat confirmation is idempotent, and reversal posts an exact linked correction.
- [ ] Validate receipt currency/month/lease identity and evidence. One existing RentPayment represents one rental month; multi-month bank transfers must be entered as separately referenced monthly allocations in this release, with no duplicate receipt-number reuse.
- [ ] Add the additional Rental agency commission section to property create/edit and show a summary in property details. Use a shared schema/component for upfront amount/months and percentage/duration. Test persistence after save/reload, desktop/mobile layout and independent sale/rental commission settings for BOTH.
- [ ] Make direct lease creation and rental closing inherit and snapshot the approved property configuration. Save snapshot activation atomically with lease setup; missing terms direct staff to property configuration. Do not silently fall back to the legacy percentage or rewrite existing lease snapshots on property edit.
- [ ] Remove duplicate new-rental revenue recognition; retain explicit legacy entitlement display. Test that one receipt contributes once to collected agency fee even with a rental placement transaction present.
- [ ] Verify property create/edit, property details and both lease review flows display consistent upfront/percentage terms; include confirmation, partial receipt, retry, reversal and missing-configuration browser flows.
- [ ] Run focused new tests plus existing `rental-closing.test.ts`, `lease-workflow.test.ts` and lease schema/route tests.
- [ ] Commit `feat(rentals): connect verified rent receipts and fee setup`.

### Task 8 — Statements and settlement safety (2–3 days)

**Files:** statement service/document/ledger/viewer, landlord route, statement approval workflow, settlement identity migration/service if required.

**Interfaces:** statement builders consume task 3 balances and task 6 posted fees with an explicit as-of cutoff. They do not post financial events.

- [ ] Extend buyer and landlord documents per section 9; keep v1 readable and separate client-facing/internal sections.
- [ ] Add source event IDs, plan/agreement revision and finance cutoff to new snapshots. Generate from a consistent transaction; repeated generate creates no receipts or fee postings.
- [ ] Test tenant ledger does not deduct agency fees; rental receipt reversals restore tenant debt; monthly cash statement shows late rent's allocation period correctly.
- [ ] Test two revisions reference one settlement identity, a PAID_OUT period cannot be paid again, and post-payout reversal requires a reviewed open-period adjustment.
- [ ] Test expenses greater than available rent produce zero payable cash plus explicit carry-forward requiring approval.
- [ ] Verify multi-page sale schedules and receipt histories in preview/PDF/print; preserve agency branding and old documents.
- [ ] Run all statement and statement-workflow tests plus browser export checks.
- [ ] Commit `feat(statements): show installment balances and agreed rental fees`.

### Task 9 — Collection reporting, reminders and machine read parity (1–2 days)

**Files:** analytics report engine, agent summary, existing dashboard work queue, relevant MCP/Dify read services and tests.

**Interfaces:** shared `getPurchaseCollections(ctx,filters)` returns paginated due/overdue items and totals grouped by currency; reports read fee events rather than re-earn fees.

- [ ] Add purchase collection filters/queue and totals; use due dates and net confirmed allocations rather than commission or transfer status.
- [ ] Separate principal from revenue and agency-held from external cash. Test that a K60,000 buyer deposit contributes K0 agency revenue.
- [ ] Update read adapters so reports cannot contradict the ledger; add source labels for legacy/unverified rows and remove universal rental percentage assumptions in affected output.
- [ ] Keep collection reminders manual in the MVP. Optional later automatic messaging requires an approved template/channel policy and deduplication; do not reuse rent arrears wording for property purchases.
- [ ] Verify existing rental arrears behavior remains rental-only; no purchase schedules enter its reminder route.
- [ ] Run report/agent/machine permission tests and reconcile one synthetic sale/lease across UI, API, statements and reports.
- [ ] Commit `feat(finance): report purchase collections and actual rental fees`.

### Task 10 — Real DB checks, operations and phased release (2–3 days)

**Files:** DB test script, audit script and operations document; any fixes demonstrated by failures.

- [ ] On a named isolated database, test constraints, migration/backfill twice, concurrent confirmation/refunds/revisions, rollback refusal, cross-tenant references and paid-out statement revision protection. The DB script must refuse production/unnamed targets.
- [ ] Run `pnpm exec vitest run --maxWorkers=1`, `pnpm exec tsc --noEmit --incremental false`, `pnpm exec prisma validate`, focused lint and `pnpm build`. Inspect failures separately from existing baselines.
- [ ] Run `pnpm audit --prod` before release and record severity/current status. No new dependency is expected; inherited advisories require an explicit release decision.
- [ ] Browser-test desktop and PWA with synthetic data: full/partial/late payments, evidence verification, refund/reversal, month-end, expired percentage terms, cutover and all permission classes.
- [ ] Document migration, backup/restore evidence, discrepancy review, operator training, cutover dates, counters/alerts and support procedures.
- [ ] Release purchase workstream first behind organization activation; reconcile a pilot sale. Release rental fee workstream only after reviewed agreements and an open-period cutover; reconcile a pilot lease and landlord statement.
- [ ] For production: obtain explicit migration authorization, back up, apply committed migrations with `pnpm exec prisma migrate deploy`, deploy compatible code and verify authenticated live behavior. Verify commit/deployment/database state separately.
- [ ] Rollback: disable new writes for the pilot, retain financial events/documents and roll forward a fix. Never return ledger-backed records to freely editable balance fields.
- [ ] Commit `docs(finance): add reconciliation and rollout runbook`.

## 12. Acceptance checklist

- [ ] A property purchase supports a deposit and multiple installments without changing the agreed total.
- [ ] Multiple partial receipts can settle one obligation, and one receipt can settle multiple obligations.
- [ ] Pending payments never reduce outstanding/overdue balances; verified seller/conveyancer payments are correctly classified.
- [ ] Paid, outstanding, overdue and next due agree across sales, PWA, collection queue, reports and buyer statements.
- [ ] Retries/concurrent writes cannot double count money or exceed refund/balance limits.
- [ ] Reschedule/cancellation/reversal preserve earlier schedules, events and saved documents.
- [ ] Purchase completion does not assert title transfer, commission receipt or agent payout.
- [ ] Rental property create/edit includes an additional agency commission configuration with upfront amount/months-of-rent or percentage-for-period options; property details display the saved choice.
- [ ] BOTH properties retain independent sale commission and rental agency commission configurations.
- [ ] Both lease setup paths inherit and snapshot approved property commission terms; later property edits do not alter existing tenancy commission, recovered fees or saved statements.
- [ ] Upfront recovery stops at the agreed target; percentage fees use eligible months and actual verified rent.
- [ ] Statements never create fees and revisions cannot permit duplicate landlord payout.
- [ ] Deposits are excluded from rental fee base; purchase principal is excluded from agency revenue.
- [ ] Cross-organization, cross-sale, unassigned-agent and private-evidence access tests pass.
- [ ] Historical unknowns stay labelled until verified; cutover cannot recreate fees or cash.
- [ ] No rent installment feature, new payment gateway or automatic outreach is introduced.

## 13. Delivery estimate and milestones

Planning estimate for one engineer familiar with Contour, including tests and review: **20–32 working days**, approximately **4–7 working weeks**, with variation driven by legacy reconciliation and the existing release baseline. Task ranges overlap in investigation; this is not a fixed commercial quote.

| Milestone | Deliverable | Indicative cumulative time |
| --- | --- | --- |
| M1 | Reviewed terms, API contract, access rules and additive schema | 3–5 days |
| M2 | Purchase schedules, verified receipt APIs and sales/PWA screens | 10–15 days |
| M3 | Rental property commission settings, lease inheritance, receipts and consistent fee posting | 14–21 days |
| M4 | Statements, reporting, reconciliation and pilot release checks | 20–32 days |

An initial purchase-only internal pilot can follow M2 once its relevant task 8–10 safeguards pass. Do not ship editable monetary fields as a shortcut around receipt verification. Bank automation, lending interest, rent installment plans, buyer/landlord portals, automatic agent payouts, tax calculations and contract generation are separate projects.

## 14. Decisions for Seward's review

The purchase-only installment scope and rental-property agency commission configuration are confirmed. Remaining collection/accounting defaults must be accepted or revised before implementation. This clarification does not authorize code changes.

| Decision | Proposed rule | Status |
| --- | --- | --- |
| Installment scope | Property purchases only | **Confirmed** |
| Rental feature and configuration location | Additional rental property setting for how the agency receives commission; inherited by leases | **Confirmed** |
| Rental commission choices | Upfront amount, such as one month's rent, or percentage of rent for an agreed period | **Confirmed** |
| Individual agent commission | Separate from the agency's rental property commission configuration | Scope distinction |
| Meaning of upfront | Fee retained first from verified rent until agreed amount recovered | Needs commercial confirmation |
| Fixed fee basis | Fixed sum or months-of-rent value frozen when approved | Proposed |
| Percentage base/period | Collected rent; eligible rental months; explicit end month or lease end | Proposed |
| Combination fee | One mode at a time; no upfront plus percentage in release one | Proposed |
| Purchase commission timing | Preserve existing commission agreement; principal does not mark commission received | Needs confirmation against actual contracts |
| Pre-close reservation deposits | Outside first release; receipts start after approved commercial close | Proposed boundary |
| Interest/penalties | None | Proposed |
| Transfer with outstanding balance | Management reason and audit required; no automatic block based solely on balance | Proposed |
| Cancellation/refund | Manual reviewed settlement, evidenced recorded refund; no automatic forfeiture or transfer | Proposed |
| Historical cutover | Verified balances, fee recovery and source evidence before activation | Proposed |

## Technical references

Use the documentation for the installed Prisma major version. Current unversioned Prisma examples may use a newer API and must not be copied into this Prisma 6 repository.

- [Prisma ORM v6 transactions, concurrency and idempotency](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions): reference for short atomic writes and transaction handling.
- [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html): reference for tenant foreign keys, uniqueness and row checks; cross-row financial sums require transactional controls.
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html): reference for serializing receipt confirmation and fee recovery against the same parent record.

Plan validation: existing integration paths and current behavior inspected; illustrative monetary examples checked; requirements mapped to tasks and acceptance criteria. New file paths and schema are proposals. No application code, database migration, test suite or production behavior changed as part of this planning request.
