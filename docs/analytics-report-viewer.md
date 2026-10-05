# Analytics report generation and viewing

The generation dialog prepares the selected report through the authenticated analytics APIs. A complete saved AI narrative is reused; otherwise the AI endpoint must return a complete narrative before the report becomes ready. Failed or malformed AI responses show an error and a retry action.

After preparation, **Open report viewer** opens the report from the user's click. The URL retains the preset, custom start/end dates, and title captured at generation time. A blocked popup leaves the report ready and displays an error so the user can retry opening it.

The viewer independently loads the reporting window through authenticated APIs. Report contents are not handed between tabs through browser storage. Reloading or opening the URL in another tab therefore uses the current authenticated workspace. The viewer requires complete AI insights before rendering report pages or offering PDF download/print. Request cancellation prevents earlier responses from replacing a newer reporting window. Retry retains the selected period.

No database schema change or migration is required.

## Verification

- Unit regressions: `pnpm exec vitest run src/lib/analytics/report-viewer.test.ts --maxWorkers=1`.
- Browser fixture smoke: `node scripts/test-refresh-analytics.mjs`.
- Full unit suite: `pnpm run test --maxWorkers=1` with the existing required environment variables set.

The browser smoke renders the real dashboard pages and report viewer with fixture authentication, routing, and intercepted API responses. It checks creation shortcuts, selected-record restoration/closing, contact search, lease prefill, AI failure/retry, viewer reload, and blocked-popup recovery. It does not prove live provider availability, production tenant permissions, or deployment readiness. The property detail dialog's map/media internals are outside this check.

## Consolidation checks — 2026-10-05

- Full unit suite: 354 passed, one existing test skipped.
- Browser fixture smoke: all creation, restoration, prefill, search, and analytics checks passed; no browser runtime errors. Popup-error and viewer screenshots are retained locally under `.artifacts/refresh-analytics`.
- Production build: passed, including 123 generated pages. TypeScript and ESLint are checked separately because the existing build configuration skips them.
- Nonincremental TypeScript check: `pnpm exec tsc --noEmit --incremental false` passed after local dependency/client regeneration.
- Targeted ESLint comparison against the starting main commit: no introduced findings; inherited findings remain (32 errors, 34 warnings across touched source/test files, reduced from 37 errors and 35 warnings).
- Production dependency audit: one high advisory in transitive `braces` and one low advisory in transitive `dompurify`. Dependency versions and lockfile are unchanged by this release; dependency remediation remains separate work.
