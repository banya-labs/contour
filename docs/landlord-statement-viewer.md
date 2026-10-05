# Landlord statement preview and export

Generate a statement from the lease details dialog or the landlord statements list, then select **Open statement viewer**. Existing statements have a **View / download statement** link. Generation saves the ledger snapshot before opening a viewer; it never writes HTML into an empty popup.

The authenticated `/dashboard/statements/[id]/print` page loads the saved statement through `/api/statements/[id]`. The API requires `statements.read`, scopes the lookup to the active organization, returns a generic 404 for unavailable statements, and disables response caching. Reloading the viewer preserves the selected statement without recalculating its amounts.

The viewer follows the agency analytics report presentation: a dark toolbar, agency branding, A4 paper preview, zoom controls, PDF generation progress, and visible loading/error/retry states. **Download PDF** uses the existing html2canvas/jsPDF dependencies. **Print statement** invokes the current browser's print dialog with an A4 stylesheet and hidden workspace controls. It can also save a PDF through the browser.

Rent, fees, maintenance, arrears, payout values, generation, and approval rules continue to use the existing saved-statement workflow. Drafts explicitly show that management approval is pending and do not confirm a payout. No migration or dependency change is required.

## Verification

- `pnpm run test --maxWorkers=1`: includes scoped API lookup and saved-viewer loading tests.
- `pnpm exec tsc --noEmit --incremental false` and `pnpm build`.
- `node scripts/test-refresh-analytics.mjs`: real React pages in Chromium with fixture authentication and intercepted APIs; verifies generation without an automatic popup, saved viewer reload, actual PDF download, print stylesheet, list links, denied/missing statements, retry, and mobile controls.
- Browser artifacts are written to `.artifacts/refresh-analytics/`, including the downloaded and browser-printed PDFs. These checks do not prove production deployment or live tenant data integration.
