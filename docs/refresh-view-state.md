# Refresh-safe dashboard views

Creation links (`new=1` or `new=true`) are consumed once on opening the form. The URL is immediately cleaned using `consumeCreationLink`, so saving, cancelling, or refreshing cannot replay the creation command. Lease prefill is captured before removing it from the URL. The contacts tab owns its creation command; the parent inquiries page does not consume it.

Properties, inquiries, leases, and sales store the selected record ID in `propertyId`, `clientId`, `leaseId`, and `saleId`. Properties/inquiries also store assignment filters in `assigned`; properties/inquiries/contacts/sales store search in `search`; sales stores the transfer filter in `status`. Records are restored from the existing authenticated list response, keeping tenant access checks in the existing APIs. Form drafts and confidential record contents are not persisted by these helpers.

`usePageUrlState` uses the Next.js native History API integration. Pass `null` to `replaceState`: passing Next's internal history markers back bypasses its query-state synchronization. Updates preserve unrelated query parameters and hashes. Defaults remove the corresponding query field. The inquiry matching dialog refetches its data instead of reloading the document.

## Verification

- Focused tests: `pnpm exec vitest run src/lib/page-url-state.test.ts src/hooks/use-page-url-state.test.ts --maxWorkers=1`.
- Browser fixture checks: `node scripts/test-refresh-analytics.mjs`; these render the real pages with fixture routing/authentication and intercepted APIs, without writing tenant data.
- In an authenticated browser, open each creation shortcut, save or cancel, and refresh: the form must stay closed.
- Use the dashboard's Add Contact shortcut: it must open the contact form only, without switching to inquiry creation.
- Select a property, inquiry, lease, or sale and refresh: the same record must reopen. Close it and refresh: it must remain closed.
- Change search/assignment/transfer filters and refresh: the values must remain selected.
- Create an inquiry and close matching results: the list must update without a document reload.
- Start a lease from a rental deal: the captured prefill must survive URL cleanup and property-list loading.
