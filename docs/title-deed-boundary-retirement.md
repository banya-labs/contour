# Title-deed boundary workflow retirement

The title-deed upload-to-map workflow was removed on 2026-10-05 ahead of the demo. Properties use location pins and manually entered plot sizes. Normal Vault uploads, title references, and conveyancing remain available.

Removed from runtime:

- Add Property's OCR uploader and the property detail editor's scan action, extracted boundary state, and verification badge.
- The OCR upload endpoint `/api/properties/extract-stand-boundary`.
- Extraction job endpoints `/api/properties/[id]/survey-extraction-jobs` and `/api/survey-extraction-jobs/[id]`.
- Boundary source-upload endpoint `/api/properties/[id]/boundaries/upload-session` and evidence-history endpoint `/api/properties/[id]/boundaries/[boundaryId]/evidence`.
- Boundary creation/review endpoints `/api/properties/[id]/boundaries` and `/api/properties/[id]/boundaries/[boundaryId]/verify`.
- Property creation's extracted geometry persistence, automatic Vault linking, and boundary evidence writes; property updates no longer write geometry.
- Property boundary polygons, beacon labels, boundary drawing code, demarcation badges, and boundary-based zooming across dashboard, public property, and agency maps.
- Obsolete uploader, preview, stand editor, and OCR smoke-test files. Copy that promised extraction or verified boundaries was also updated.

The removed URLs now have no route handlers. Both property write schemas reject `standBoundary` and `titleDeedDocumentId`, including attempts to clear existing geometry through legacy payloads.

## Preserved for a future implementation

Prisma schema, migrations, existing geometry, boundary evidence, extraction jobs, and stored documents are unchanged. Organization data cleanup retains its existing dependency ordering. No migration or data cleanup is required for this change.

The pure cadastral utilities and their unit tests remain under `src/lib/cadastral`. The independent government cadastre search API remains available; it does not upload title deeds or write property boundaries. Earlier implementation plans describe deferred work, not current functionality. Deleted implementations can be recovered from Git history.

Reintroduction should include tenant-safe source-document access, reliable extraction without synthetic fallbacks, explicit human review, and provenance before publishing geometry.

## Demo checks

1. Open Add Property: enter a location and plot size; confirm there is no title-deed scanner.
2. Open a property's Details editor: confirm coordinates remain editable and no scan action or boundary verification badge appears.
3. Open dashboard/public/agency maps with a property that has saved geometry: confirm pins, selection, zoom, and directions work without property polygons.
4. Confirm ordinary Vault document uploads and property title references still work.
