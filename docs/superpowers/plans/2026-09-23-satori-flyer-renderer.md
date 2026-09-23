# Satori Flyer Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragile browser `html2canvas` flyer export with a deterministic Satori-to-SVG/PNG renderer while keeping editing fast, tenant-safe, and visually consistent across preview and downloaded artwork.

**Architecture:** The modal will own editable state but will convert it into a typed, normalized `FlyerRenderModel`. A server-only renderer will use Satori with explicitly loaded fonts and fixed canvas dimensions, then use the already-installed `sharp` package to rasterize SVG to PNG. Preview and download will use the same renderer output; the browser DOM preview will not be treated as the export source of truth.

**Tech Stack:** Next.js 15 App Router, TypeScript strict mode, React 19, Satori, Sharp, Zod, Vitest, Playwright/Chromium.

**Spec:** User request in this task: implement Satori for the Contour social flyer generator and audit the implementation for reliable, fast, consistent output.

**Official Satori reference verified:** [Satori README](https://github.com/vercel/satori) checked 2026-09-23. The implementation follows its documented JSX restrictions, CSS subset, font formats, image embedding guidance, runtime behavior, font embedding, and `pointScaleFactor` behavior.

## Global Constraints

- Preserve the current flyer product behavior: organization branding, assigned-agent/agency contact choice, property-derived sale/rental state, three selectable image slots, QR code, editable narrative, editable feature list, and 4:5/1:1/9:16 formats.
- Never trust client-supplied organization identity, storage keys, or cross-tenant image URLs; resolve tenant-scoped assets server-side.
- Do not send production credentials, signed URLs, or full environment values to logs.
- Do not run production migrations or change production infrastructure as part of this work.
- Keep the current browser DOM preview available behind a controlled fallback only until Satori preview parity is verified.
- Use explicit output contracts: 4:5 = 1080x1350, 1:1 = 1080x1080, 9:16 = 1080x1920.
- The renderer must fail with a user-visible, actionable error when a required asset cannot be loaded; it must not silently produce a blank or partially branded flyer.
- Use only Satori-supported static JSX; no hooks, effects, `dangerouslySetInnerHTML`, `<style>`, external stylesheets, or script resources inside the render tree.
- Set explicit `width` and `height` on every Satori image. Prefer tenant-authorized base64/data/buffer image sources so SVG-to-PNG conversion has no remote-image race.
- Fonts must be TTF, OTF, or WOFF; WOFF2 is not supported. Pass every family/weight explicitly and cache stable font definitions globally.
- Do not rely on CSS `calc()` or `z-index`; later SVG siblings paint on top. Use explicit pixel geometry and document order.
- Set `pointScaleFactor` deliberately and retain `embedFont: true` for portable SVG output unless measurements prove artifact size unacceptable.

## Review Focus

- Long agency/property names: wrap or bounded-truncate without clipping, overlap, or vertical drift.
- Long narrative and feature strings: deterministic line limits with visible ellipsis or a safe reserved layout; no text behind another section.
- Missing, expired, cross-origin, or unsupported images: predictable fallback/error behavior and no tenant leakage.
- Custom fonts unavailable or slow: bundled-font fallback and stable metrics, never a browser-dependent font race.
- All three aspect ratios and light/dark templates: exact dimensions, correct image crops, QR readability, and footer visibility.

---

### Task 1: Establish the renderer boundary and baseline evidence

**Files:**
- Modify: `src/components/marketing/social-media-card-generator-modal.tsx`
- Create: `src/lib/flyer-render-model.ts`
- Create: `src/lib/flyer-render-model.test.ts`
- Create: `scripts/capture-flyer-baseline.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `FlyerAspectRatio`, `FlyerRenderModel`, `FlyerRenderResult`, and `FLYER_CANVAS` as the shared contract used by client and server.

- [ ] **Step 1: Write failing model tests** covering all aspect ratios, sale/rental labels, contact source, maximum feature count, empty values, and normalization of long strings.
- [ ] **Step 2: Run `pnpm test src/lib/flyer-render-model.test.ts` and confirm the new contract is absent.**
- [ ] **Step 3: Implement the pure model builder.** It must accept the existing property/agency/contact state, return typed primitives only, cap features to eight, preserve exact user-edited copy, and expose dimensions from one constant.
- [ ] **Step 4: Replace duplicated local canvas constants and ad hoc values in the modal with the shared model contract.** Do not change visual behavior yet.
- [ ] **Step 5: Add the baseline capture script.** It must open the existing modal, select each aspect ratio, download the current PNG, record dimensions, and save artifacts outside `public/` for comparison.
- [ ] **Step 6: Run the focused model tests and `git diff --check`.** Record the current clipping baseline before changing the renderer.
- [ ] **Step 7: Commit with `refactor(flyer): define deterministic render model`.**

### Task 2: Add and validate renderer dependencies and bundled fonts

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/lib/flyer-fonts.ts`
- Create: `src/lib/flyer-fonts.test.ts`
- Create: `public/fonts/` font assets, using the project-approved font files
- Modify: `.gitignore` if generated renderer artifacts need exclusion

**Interfaces:**
- Produces `getFlyerFonts(): Promise<SatoriFont[]>` or an equivalent cached server-only font loader with stable family/weight/style entries.

- [ ] **Step 1: Verify current Satori and Sharp versions against their official documentation and Node.js compatibility before installing.** Pin compatible versions rather than using an unbounded latest range.
- [ ] **Step 2: Add Satori and the selected SVG-to-PNG path.** Prefer existing Sharp for rasterization unless a documented runtime constraint requires `@resvg/resvg-js`; do not add both without a measured reason.
- [ ] **Step 3: Add the exact font files required by the existing `font-heading` and `font-mono` visual language.** Include regular/bold weights actually used; do not depend on browser-installed fonts.
- [ ] **Step 4: Add tests that assert every declared font has non-empty bytes, a supported format, family, weight, and style.**
- [ ] **Step 5: Run the font tests and a minimal Satori smoke render to SVG.** Expected: SVG is returned without a network request or browser context.
- [ ] **Step 6: Commit with `build(flyer): add deterministic renderer fonts`.**

### Task 3: Implement safe server-side asset resolution

**Files:**
- Create: `src/lib/flyer-assets.ts`
- Create: `src/lib/flyer-assets.test.ts`
- Reuse/modify: existing tenant-scoped storage utilities under `src/lib/storage/`

**Interfaces:**
- Produces `resolveFlyerAssets(input): Promise<ResolvedFlyerAssets>` where every image is returned as bounded binary data or a data URI suitable for Satori.

- [ ] **Step 1: Write failing tests** for valid organization-owned images, missing images, unsupported MIME types, oversized images, duplicate image slots, and a storage key from another organization.
- [ ] **Step 2: Trace the existing S3/MinIO authorization and object-key helpers completely; do not create a second storage access path.**
- [ ] **Step 3: Implement tenant-scoped resolution.** The server must derive organization scope from the authenticated session, validate referenced property/image ownership, fetch only allowed image types, enforce byte and pixel limits, and convert images to bounded data URIs.
- [ ] **Step 4: Implement deterministic fallback policy.** Missing secondary images may use a neutral placeholder; missing hero/logo/QR must return a structured error or explicit placeholder according to the model contract.
- [ ] **Step 5: Add bounded concurrency and a short-lived in-process cache keyed by an asset fingerprint.** Never cache secrets or organization data without the organization in the key.
- [ ] **Step 6: Run storage/asset tests and verify logs contain IDs/status only, never URLs, object keys, or image bytes.**
- [ ] **Step 7: Commit with `feat(flyer): add tenant-safe render asset resolution`.**

### Task 4: Build the pure Satori flyer renderer

**Files:**
- Create: `src/lib/server/flyer-renderer.ts`
- Create: `src/lib/server/flyer-renderer.test.ts`
- Create: `src/lib/server/flyer-render-layout.tsx`
- Create: `src/lib/server/flyer-render-types.ts`

**Interfaces:**
- `renderFlyerSvg(model: FlyerRenderModel, assets: ResolvedFlyerAssets): Promise<string>`
- `renderFlyerPng(model: FlyerRenderModel, assets: ResolvedFlyerAssets): Promise<Buffer>`

- [ ] **Step 1: Write failing renderer tests** asserting exact SVG viewBox dimensions and PNG metadata for 4:5, 1:1, and 9:16.
- [ ] **Step 2: Implement a Satori-only layout component using explicit inline styles.** Use fixed pixel dimensions, flexbox, bounded text blocks, explicit `lineHeight`, `overflow: hidden`, and measured/reserved regions for hero, body, features, gallery, and footer.
- [ ] **Step 3: Replace CSS grid, responsive Tailwind classes, CSS font inheritance, and browser-only icons with supported deterministic equivalents. Satori supports `lineClamp`, but use it only with explicit block display, width, line height, and reserved height; prefer model-level truncation for hard content contracts.** Use SVG/icon paths or simple text marks where required.
- [ ] **Step 4: Implement text fitting helpers.** Each field gets a defined maximum line count and width; use a deterministic grapheme-safe truncation function that adds `…` before the boundary instead of relying on CSS clipping.
- [ ] **Step 5: Implement image crop geometry explicitly.** Calculate `object-cover`-equivalent source rectangles and render the correct crop for each slot and format.
- [ ] **Step 6: Convert SVG to PNG with Sharp at the exact target dimensions.** Assert both SVG viewBox and PNG metadata.
- [ ] **Step 7: Render a development/test artifact with Satori `debug: true` and inspect bounding boxes for the long-copy fixture; never enable debug output in production.**
- [ ] **Step 8: Add tests for long agency names, long titles, long copy, long features, empty contact details, missing logo, and dark/light themes.**
- [ ] **Step 9: Run renderer tests and a local artifact smoke script that writes one SVG and one PNG per aspect ratio.**
- [ ] **Step 10: Commit with `feat(flyer): add deterministic satori renderer`.**

### Task 5: Add authenticated preview/download API

**Files:**
- Create: `src/app/api/marketing/flyer/render/route.ts`
- Create: `src/app/api/marketing/flyer/render/route.test.ts`
- Reuse: existing `createApiHandler`, auth, organization membership, and Zod validation patterns

**Interfaces:**
- `POST /api/marketing/flyer/render`
- Request: `{ propertyId, aspectRatio, template, contactSource, copy, features, imageSlots }`
- Response: `{ svg: string, pngBase64: string, width, height, cacheKey }` for preview/download, or a structured error envelope.

- [ ] **Step 1: Write failing route tests** for unauthenticated access, inactive membership, cross-tenant property IDs, malformed aspect ratios, oversized copy/features, invalid image slots, and successful rendering.
- [ ] **Step 2: Implement a strict Zod request schema with bounded strings, arrays, and slot indices.** The client may submit edits, but property ownership, listing state, agency identity, and asset access are server-derived.
- [ ] **Step 3: Implement the route with `createApiHandler`, server-only renderer imports, tenant authorization, asset resolution, and structured timing/error metadata.**
- [ ] **Step 4: Add response-size protection.** Do not return unbounded SVG/base64; reject or use a short-lived object response if the payload exceeds the API limit.
- [ ] **Step 5: Add private/no-store cache headers and a deterministic cache key that excludes secrets.** Ensure one organization cannot retrieve another organization’s render.
- [ ] **Step 6: Run route tests and focused API-handler tests.**
- [ ] **Step 7: Commit with `feat(flyer): expose authenticated deterministic render endpoint`.**

### Task 6: Make the modal use one renderer for preview and download

**Files:**
- Modify: `src/components/marketing/social-media-card-generator-modal.tsx`
- Create: `src/components/marketing/flyer-render-preview.tsx`
- Create: `src/components/marketing/flyer-render-preview.test.tsx`
- Remove from the export path: `html2canvas` usage after parity is confirmed

**Interfaces:**
- Produces a debounced `renderFlyer()` client action and displays the returned SVG/PNG with loading, stale-result, retry, and error states.

- [ ] **Step 1: Write failing component tests** for editing copy, changing aspect ratio, changing image slot, rapid edits, stale response ordering, render failure, and successful download.
- [ ] **Step 2: Extract the current modal’s state-to-model conversion into the shared builder.** Keep organization profile fetch and existing controls unchanged.
- [ ] **Step 3: Add a debounced render request with an `AbortController` or request sequence number.** A slow earlier render must never overwrite a newer edit.
- [ ] **Step 4: Show the returned SVG in preview for crisp scalable display; use the returned PNG/blob for download.** Keep the old DOM preview behind a temporary fallback flag only for recovery while the new path stabilizes.
- [ ] **Step 5: Add explicit download handling using the returned PNG bytes/blob, exact filename normalization, and cleanup of object URLs.**
- [ ] **Step 6: Add user-visible error text for asset, authorization, timeout, and renderer failures.** Do not report success until the PNG has been received and dimension-validated.
- [ ] **Step 7: Run component tests and verify no `html2canvas` call remains on the primary path.**
- [ ] **Step 8: Commit with `refactor(flyer): use shared render output for preview and download`.**

### Task 7: Performance, reliability, and operational hardening

**Files:**
- Modify: `src/lib/server/flyer-renderer.ts`
- Modify: `src/lib/flyer-assets.ts`
- Modify: `src/app/api/marketing/flyer/render/route.ts`
- Create: `src/lib/server/flyer-render-metrics.ts`
- Create: `scripts/test-flyer-render-performance.ts`

- [ ] **Step 1: Measure cold and warm render latency for all aspect ratios with three images and a logo.** Record p50/p95 locally without logging PII or image URLs.
- [ ] **Step 2: Cache font buffers once per process and cache normalized image bytes by tenant-scoped fingerprint.** Bound cache size and lifetime.
- [ ] **Step 3: Add timeouts around remote/storage image fetches and return a typed timeout error.** Do not let one broken image hang the render request.
- [ ] **Step 4: Add concurrency limits so multiple users cannot exhaust memory through large image renders.**
- [ ] **Step 5: Add a render-size guard and verify memory stays bounded under repeated generation.**
- [ ] **Step 6: Run the performance script on cold and warm paths; define an acceptance target of p95 under 2 seconds warm for standard three-image flyers, subject to local hardware/network evidence.**
- [ ] **Step 7: Commit with `perf(flyer): bound renderer cost and asset loading`.**

### Task 8: Browser and exported-artifact verification

**Files:**
- Modify: `scripts/test-full-view-and-exact-flyer.ts` or create `scripts/test-satori-flyer-export.ts`
- Create: `scripts/compare-flyer-artifacts.ts`
- Create: `tests/fixtures/flyer/` sanitized fixture data only
- Create: `docs/superpowers/plans/artifacts/` only if the repository policy permits checked-in golden images; otherwise store artifacts in ignored output

- [ ] **Step 1: Build a Playwright smoke test** that opens the real modal, edits long copy/features, selects each ratio and theme, waits for render completion, and downloads PNGs.
- [ ] **Step 2: Assert every PNG has exact dimensions and non-zero image content.**
- [ ] **Step 3: Assert visual invariants with pixel or perceptual comparison:** footer present, QR region present, hero present, title visible, no unexpected blank bands, and no text region outside its reserved block.
- [ ] **Step 4: Test slow image loading, failed secondary image, missing logo, very long organization name, and rapid aspect-ratio switching.**
- [ ] **Step 5: Inspect the actual downloaded PNGs visually, including the user’s reported 4:5 case.** A passing DOM test is insufficient.
- [ ] **Step 6: Run `pnpm test`, the focused Playwright script, `pnpm typecheck`, `pnpm build`, and `git diff --check` separately.** Do not report a hung Windows command as passing.
- [ ] **Step 7: Commit with `test(flyer): verify deterministic exports across formats`.**

### Task 9: Audit pass after implementation

**Files:**
- Review all changed files from Tasks 1–8
- Create: `docs/superpowers/audits/2026-09-23-satori-flyer-renderer-audit.md`

- [ ] **Step 1: Correctness audit.** Trace state → model → API → tenant assets → Satori SVG → Sharp PNG → browser download. Confirm preview and download consume the same model and renderer output.
- [ ] **Step 2: Security audit.** Verify auth/membership checks, organization-derived identity, storage-key validation, response cache isolation, bounded input, no credential/PII/image logging, and no client-controlled cross-tenant asset fetch.
- [ ] **Step 3: Reliability audit.** Verify font loading, image timeouts, fallback/error semantics, stale-request protection, exact dimensions, object URL cleanup, and behavior when the renderer is unavailable.
- [ ] **Step 4: Performance audit.** Review image byte/pixel limits, concurrency, cache keys/TTL, cold/warm timings, response sizes, and memory behavior.
- [ ] **Step 5: Visual audit.** Inspect downloaded artifacts for every ratio/theme and the long-copy regression fixture; compare against the baseline and confirm the reported downward movement/clipping is gone.
- [ ] **Step 6: Documentation audit.** Update README or relevant operational documentation if local setup, fonts, renderer runtime, or test commands changed. Confirm no `.env` or generated artifacts are tracked.
- [ ] **Step 7: Produce the audit with findings classified as Blocker, Warning, or Suggestion.** No “complete” claim is allowed if any Blocker remains or if export artifacts were not inspected.
- [ ] **Step 8: Run final `git status --short` and list exactly which validations passed, failed, hung, or remain unverified.**

## Audit of This Plan

- **Coverage:** Includes the renderer contract, fonts, assets, Satori layout, PNG conversion, authenticated API, preview/download parity, performance, browser artifacts, and post-implementation audit.
- **Root-cause alignment:** Removes the current failure source—responsive DOM plus fixed-height/clamped content being rasterized by `html2canvas`—instead of adding another scaling workaround.
- **Security alignment:** Keeps MinIO/storage access server-side and tenant-scoped; client edits are treated as untrusted presentation input.
- **Consistency alignment:** Preview and download share the same fixed-size renderer, font bytes, asset bytes, and layout rules.
- **Performance alignment:** Uses existing Sharp, cached fonts, bounded image conversion, request cancellation, and concurrency limits; it does not introduce a headless browser service.
- **Known trade-off:** Satori supports a constrained CSS subset, so the layout must be intentionally rebuilt with inline styles/flexbox. Reusing the current Tailwind DOM as the renderer would recreate the same inconsistency risk.
- **Open implementation choice resolved:** Use Sharp for SVG-to-PNG because it is already installed; only add Resvg if a measured Sharp/Satori compatibility issue appears in the renderer smoke test.
- **Official-doc correction:** Satori supports `lineClamp`, `objectFit`, `objectPosition`, `overflow: hidden`, gradients, and flexbox, but it is not a full browser and does not support `calc()` or `z-index`.
- **Official-doc correction:** Use TTF/OTF/WOFF rather than WOFF2; use explicit image dimensions and embedded image bytes for PNG rendering; retain embedded font paths for portable SVG output; use `pointScaleFactor` to control Yoga pixel-grid rounding.
