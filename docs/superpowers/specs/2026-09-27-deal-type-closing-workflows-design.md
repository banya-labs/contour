# Deal-Type Closing Workflows Design

## Project context

Contour currently uses one Verification & Closing workflow for all deals. Rental placement deals need a lease-creation handoff, while property-sale deals need a document-first closing workspace with configurable requirements and client upload requests.

## Goals

- Give rental placement deals a dedicated Start Lease flow.
- Keep property-sale closing focused on configurable documents and manager approval.
- Reuse the existing Vault document-request/upload portal.
- Link requests and uploads to the correct organization, inquiry/deal, and property.
- Preserve immutable per-deal closing requirement snapshots.
- Keep Won/Lost transitions and duplicate active-lease protection safe.

## Non-goals

- Replacing the existing Vault storage or upload-token system.
- Redesigning the desktop Kanban pipeline.
- Introducing a second document-storage or client-portal system.
- Changing existing lease payment, arrears, or statement workflows.

## Domain contract

The closing experience is selected from the deal transaction type:

- `RENTAL_PLACEMENT`: closing presents Start Lease and Lost actions. Start Lease creates an active lease using the deal's property, inquiry, and contact context, then completes the deal as Won.
- `PROPERTY_SALE`: closing presents the document workspace, configurable checklist items, client document-request creation, and manager Won/Lost actions.

The transaction type must be resolved from persisted deal data on the server. The client must not be trusted to choose a different closing mode.

## Data model

Extend existing closing/Vault relationships so a document request can be traced to the inquiry/deal and its closing workflow. Requirement snapshots remain immutable after workflow creation. Document requirements used by the sale workspace must identify the expected evidence/document without weakening the existing Vault classification and organization checks.

Rental lease creation must continue using the existing Lease model and API validation. The lease retains `inquiryId` as its deal lineage. The server must verify that the inquiry, property, and organization match before creating the lease or completing the deal.

## User flows

### Rental

1. Manager opens a rental deal in Verification & Closing.
2. The panel displays the linked property and client as read-only context.
3. Manager opens Start Lease; fields are prefilled from the deal and remain editable where appropriate.
4. Successful lease creation refreshes the deal and records Won through the canonical transition boundary.
5. Existing active-lease conflicts return a clear error and leave the deal open.

### Sale

1. Manager opens a sale deal in Verification & Closing.
2. The panel shows checklist requirements and linked Vault evidence.
3. Manager uploads evidence or creates a request for missing documents.
4. The request dialog is prelinked to the deal/property and can create a secure client upload link.
5. Client uploads are visible in the deal workspace through the existing Vault document APIs.
6. Manager can mark Won only when required requirements are ready; Lost still requires a reason.

## Security and reliability

- Every read and mutation is organization-scoped and verifies inquiry/property lineage.
- Client upload links remain time-limited and use existing consent, PIN, and audit behavior.
- No legal-vault object becomes public through this feature.
- Lease creation and deal completion must not produce a Won deal without a successfully persisted lease.
- Duplicate active leases remain rejected transactionally.

## Phased delivery

1. Establish the server-side deal-type contract and rental Start Lease handoff.
2. Add sale closing evidence and deal-linked document-request APIs.
3. Build the sale closing workspace and rental/sale panel split.
4. Add focused tests and browser verification across both paths.

## Acceptance criteria

- A rental deal opens a Start Lease flow with property and client already selected.
- A sale deal never shows Start Lease controls.
- A successful rental close creates one lease linked to the inquiry and property and then closes the deal as Won.
- A sale manager can request configured missing documents from the same closing workspace.
- Client uploads from the generated link appear under the correct deal/property and organization.
- Existing manager approval, Lost reason, Vault access, and tenant isolation rules remain enforced.
