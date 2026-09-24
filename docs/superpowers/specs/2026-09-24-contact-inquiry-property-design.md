# Contacts, inquiries, and property attachment

## Goal

Separate reusable client contacts from their property inquiries while preserving the current tenant-scoped CRM and pipeline workflow.

## Approved behavior

- A contact is a tenant-scoped client identity with name, phone, email, and optional notes.
- A contact can have multiple inquiries over time.
- Every inquiry belongs to exactly one contact.
- An inquiry may start without a property while it is being qualified.
- An inquiry must have a property before it can enter the operating pipeline beyond the initial inquiry stage.
- Existing inquiry records must remain available and be backfilled to contacts during migration.

## Data contract

- Add `Contact` with `organizationId`, `name`, `phone`, optional `email`/`notes`, timestamps, and a one-to-many `inquiries` relation.
- Add required `contactId` to `Inquiry` with an index and tenant-safe relation.
- Keep inquiry-level snapshot fields temporarily for compatibility with public/API integrations, but use the contact relation for CRM identity and selection.

## Surfaces

- Contacts page: list contacts and add a contact.
- Inquiries page: list inquiries and add an inquiry by selecting a contact.
- Pipeline: select an existing inquiry/contact and require a property attachment before creating or advancing a pipeline opportunity.
- APIs validate organization ownership for contacts, inquiries, and properties on every mutation.

## Verification

- Prisma migration and backfill reviewed, not applied to production automatically.
- Focused tests cover contact creation, inquiry-to-contact ownership, property attachment, and pipeline rejection when required relationships are missing.
- Run typecheck, focused tests, full tests, and build separately.
