# Contour Cadastral Map and Title-Deed Boundary Extraction Plan

**Status:** Proposed for review — planning only; no implementation or production data changes are included in this document.

**Project:** Contour — Real Estate Operations & Field Agent Operating System

**Date:** 2026-09-11

## 1. Objective

Allow an agency to display a property’s real surveyed stand footprint on the Contour map by combining two evidence sources:

1. A Zambia government cadastral reference layer where a matching lot is available.
2. A title deed or approved survey diagram uploaded into the private Contour vault, from which the survey coordinates can be extracted and reviewed.

The result must be useful to an agent without pretending that an unverified GIS match is legal proof of ownership. Every boundary shown in the application must have a visible provenance and verification state.

## 2. Evidence from the supplied title-deed example

The supplied one-page A4 scan is a good example of the document class the pipeline must support. It contains:

- A boundary sequence using survey points labelled A, B, C, D, and E.
- A table of sides, distances, and angles of direction.
- A coordinate table with UTM-style Easting and Northing values for each point.
- A diagram number, approval area, survey date, scale, beacon description, land description, province, survey record references, plan number, and map reference.
- A drawn polygon showing the same points and adjoining roads/reserves.

The PDF is a scanned document rather than a dependable machine-readable form. OCR must therefore be treated as an extraction assistant, not as an authority. The sample also demonstrates a critical issue: the document’s coordinate-system/zone notation must be read and confirmed rather than assumed from the property’s city. Lusaka commonly falls in UTM Zone 35S, but the application must not silently convert coordinates using that assumption if the deed says something else or the notation is ambiguous.

## 3. Source-of-truth policy

### Boundary source hierarchy

1. **Approved deed/survey diagram coordinates** — highest-quality agency evidence when the document is verified and the coordinate reference system is confirmed.
2. **Official Zambia cadastral lot geometry** — government reference overlay, matched by plot/survey identifiers and spatial comparison.
3. **Surveyor-provided GeoJSON/KML/Shapefile** — accepted as a source document and reviewed before becoming the operational boundary.
4. **Agent-drawn boundary** — operational approximation only, never presented as survey-verified.

### Required display labels

Every polygon rendered on the map must be tagged as one of:

- `Survey verified`
- `Government cadastral reference`
- `Imported survey file - pending review`
- `OCR extracted - pending review`
- `Agent approximation`

The UI must show the source, extraction/review date, survey reference where available, and the person who verified it. A boundary must never be labelled “exact” solely because it came from a public map service or OCR.

## 4. Official Zambia cadastral integration

The Zambia Ministry of Lands/National Spatial Data Infrastructure currently exposes an ArcGIS REST service named `NSDI_Vector/CadasterNew`. Its `Lots` layer is polygon geometry, supports GeoJSON/JSON/PBF query formats, and exposes fields including plot ID, map name, survey reference, survey area, survey date, land use, and geometry.

References:

- https://www.map.gov.zm/arcgis/rest/services/NSDI_Vector/CadasterNew/MapServer
- https://www.map.gov.zm/arcgis/rest/services/NSDI_Vector/CadasterNew/MapServer/0

### Integration approach

- Do not bulk-download the national layer into Contour as a first step.
- Query only a bounded area around a property or use a known plot/survey identifier.
- Request `outSR=4326` where supported so Leaflet receives WGS84 latitude/longitude coordinates.
- Keep a fallback coordinate-transform path for the service’s published spatial reference, currently reported as EPSG:32735.
- Cache government responses by normalized query and source version/date to reduce load and avoid making the map dependent on a live government service for every page load.
- Store the government source URL, source layer, record identifier, fetched timestamp, response hash, and geometry version.
- Display government geometry as a separate toggleable overlay from the deed geometry.
- Do not copy government attributes such as ownership into Contour unless the source licence and authority explicitly permit it.
- Provide a manual “No official match” state; absence of a result is not proof that the property is unregistered.

### Match algorithm

The first release should support two matching paths:

1. **Identifier match:** plot ID, map name, survey reference, diagram number, or plan number supplied by the user and matched against official attributes.
2. **Spatial match:** query lots in a small bounding box around the deed polygon centroid, then rank candidates using:
   - centroid distance,
   - polygon intersection-over-union,
   - area ratio,
   - boundary distance,
   - survey/plot identifier similarity where available.

The system should return `MATCHED`, `POSSIBLE_MATCH`, `NO_MATCH`, or `REVIEW_REQUIRED`, with scores and evidence. It must not auto-approve a low-confidence spatial match.

## 5. Title-deed upload and OCR workflow

### User journey

1. Authorized user opens a property and selects **Add surveyed boundary**.
2. User chooses **Upload title deed/survey diagram**, **Import GeoJSON/KML/Shapefile**, **Use government cadastral reference**, or **Draw approximate boundary**.
3. For a deed upload, the file enters the private vault using the existing direct-to-MinIO upload pattern.
4. The server creates an extraction job and immediately shows `Queued` rather than pretending that OCR is complete.
5. A worker renders the document at a controlled DPI and runs OCR plus table/coordinate extraction.
6. Contour displays the extracted coordinate table beside the document preview and proposed polygon.
7. An authorized reviewer confirms the CRS, point order, coordinate values, and area comparison.
8. The reviewer may correct OCR errors, but every correction retains the raw OCR value, final value, actor, and timestamp.
9. Contour optionally queries the official cadastral layer and displays the comparison overlay.
10. The reviewer chooses **Save as verified survey boundary**, **Save as pending**, or **Reject extraction**.
11. The property map renders only the approved operational geometry by default, with pending/reference layers available through the evidence panel.

### Supported document inputs

- PDF scans, including one-page diagrams.
- JPEG/PNG scans or phone photographs.
- Multi-page title deeds where the diagram is not the first page.
- Later: GeoJSON, KML, and zipped Shapefile bundles containing `.shp`, `.shx`, `.dbf`, and `.prj`.

### OCR extraction targets

The extractor should produce structured candidates for:

- Point labels: A, B, C, D, E, and any additional labels.
- Easting and Northing pairs.
- Coordinate system name, zone, hemisphere, datum, and units.
- Boundary sequence, for example `A-B-C-D-E-A`.
- Side distances and direction/bearing values.
- Diagram number, survey reference, plan number, map reference, and plot ID.
- Stated area and area unit.
- Survey date and approval metadata.
- Location/province and land description.

The extractor must preserve `rawText`, normalized value, page number, bounding box, OCR confidence, and extraction method for every field.

## 6. OCR and geometry pipeline

### Recommended processing model

Use a self-hosted pipeline by default so identity documents and land records do not leave Contour’s controlled infrastructure:

- PDF rasterization: controlled 300-400 DPI rendering.
- Image preprocessing: deskew, denoise, contrast normalization, border removal, and table-region detection.
- OCR engine: Tesseract or another self-hosted OCR engine selected after testing against real Zambian survey diagrams.
- Table extraction: coordinate-aware OCR regions rather than relying only on reading-order text.
- Parser: strict numeric and point-label parsers with locale-safe decimal handling.
- Geometry: convert coordinate pairs to WGS84, construct a closed GeoJSON polygon, and calculate area/perimeter.
- Review: human confirmation is mandatory before a deed polygon receives verified status.

Cloud OCR may be added as an opt-in fallback only after a POPIA/data-processing review. Sensitive deed documents must not be sent to an external provider by default.

### Coordinate normalization

The parser must:

- Accept decimals with or without thousands separators.
- Reject impossible or incomplete Easting/Northing pairs.
- Preserve the original string exactly for review.
- Read the CRS/zone/hemisphere from the deed when present.
- Require user confirmation when CRS information is missing or ambiguous.
- Convert through a tested projection library rather than handwritten map math.
- Keep the original source CRS and transformed WGS84 values.
- Flag coordinates outside the expected country/province bounding box.

Do not hardcode UTM Zone 35S as an invisible fallback. If a value is ambiguous, display the candidate transformations and require a reviewer to select the correct one.

### Geometry validation

Before accepting a polygon:

- At least three distinct points are required.
- The ring must be closed without duplicating malformed points.
- No self-intersections or invalid rings.
- Point order must match the extracted boundary sequence where available.
- Calculated area must be compared with the deed’s stated area, with a configurable tolerance and a clear reason when it differs.
- Calculated side lengths should be compared with the deed’s side table.
- Bearings/angles should be used as a secondary consistency check.
- Polygon must fall within the selected country/province and near the property’s stated location.
- Reviewer must be able to inspect each vertex on the map.

The system should reject or flag a polygon; it should never silently “fix” coordinates to make the area match.

## 7. Data model proposal

Add versioned evidence rather than overwriting `Property.standBoundary` without provenance.

### `PropertyBoundary`

Suggested fields:

- `id`
- `organizationId`
- `propertyId`
- `sourceType`: `TITLE_DEED`, `GOVERNMENT_CADASTRE`, `GEOJSON`, `KML`, `SHAPEFILE`, `AGENT_DRAWN`
- `status`: `PENDING`, `MATCHED`, `VERIFIED`, `REJECTED`, `SUPERSEDED`
- `geometryGeoJson` or normalized coordinate array
- `sourceCrs`
- `targetCrs` (`EPSG:4326` for map rendering)
- `plotId`, `surveyReference`, `diagramNumber`, `planNumber`
- `statedAreaSqm`, `calculatedAreaSqm`, `areaDifferencePct`
- `sourceDocumentId`
- `governmentSourceUrl`, `governmentLayer`, `governmentRecordId`, `governmentFetchedAt`
- `confidenceScore`, `validationFlags`
- `verifiedById`, `verifiedAt`, `rejectionReason`
- `createdAt`, `updatedAt`

Keep `Property.standBoundary` temporarily as a compatibility/read model or migrate the map to select the latest `VERIFIED` boundary. Do not store a presigned URL in this model.

### `SurveyExtractionJob`

Suggested fields:

- `id`, `organizationId`, `propertyId`, `sourceDocumentId`
- `status`: `QUEUED`, `PROCESSING`, `NEEDS_REVIEW`, `COMPLETED`, `FAILED`, `CANCELLED`
- `engine`, `engineVersion`
- `pageCount`, `processedPages`
- `rawOcrObjectKey` for private output
- `extractionJson` for structured candidates
- `errorCode`, `errorMessage` without stack traces or document contents
- `createdById`, `reviewedById`, `reviewedAt`, timestamps

### `BoundaryEvidenceEvent`

Record uploads, extraction runs, corrections, government matches, approvals, rejections, supersessions, and exports in the existing audit model. Include hashes and IDs, not raw OCR text or presigned URLs.

## 8. Security and privacy requirements

- Title deeds and survey diagrams remain private MinIO objects.
- Uploads require `vault.upload` or a dedicated `properties.boundary.upload` permission.
- OCR processing jobs run with tenant-scoped object access and cannot read another organization’s objects.
- Extraction output inherits the source document’s classification and access grants.
- Download links remain short-lived and are issued only after authorization.
- Do not log page images, OCR text, coordinates, PINs, storage credentials, or presigned URLs.
- Validate MIME by file signature and enforce page count, file size, image dimensions, and processing time limits.
- Malware scan before OCR and before document verification.
- Rate-limit extraction jobs per organization and user.
- Use idempotency keys so retries do not create duplicate boundaries or audit events.
- Apply retention/legal-hold rules to source deeds and OCR artifacts.
- Revoke job access and signed URLs when the source document is deleted or access is revoked.
- Treat OCR output as untrusted input; validate it with Zod before geometry processing.

## 9. Map UI design

### Evidence layers

The map should provide a clear layer switcher:

- Property pin.
- Verified deed/survey boundary.
- Government cadastral reference.
- Pending OCR/import boundary.
- Agent approximation.

Use distinct styles rather than relying only on color:

- Verified: solid strong border, restrained fill.
- Government reference: blue solid/dashed border.
- Pending: amber dashed border.
- Approximation: gray dashed border and lower opacity.

### Review panel

When a property is selected, show:

- Source document and secure “View deed” action.
- Diagram/plan/survey references.
- CRS and conversion status.
- Extracted points with confidence.
- Stated versus calculated area.
- Government match result and score.
- Verification status and reviewer.
- Actions available to the current role.

### Failure states

The UI must explain:

- “No boundary data found.”
- “Coordinates found, but the coordinate system needs confirmation.”
- “Government layer has no nearby match.”
- “OCR confidence is too low; review the document manually.”
- “Boundary is stored as an approximation and is not survey verified.”

## 10. API and worker plan

Suggested endpoints:

- `POST /api/properties/:id/boundaries/upload-session`
- `POST /api/properties/:id/boundaries/import`
- `POST /api/properties/:id/boundaries/:boundaryId/verify`
- `GET /api/properties/:id/boundaries`
- `GET /api/properties/:id/boundaries/:boundaryId/evidence`
- `POST /api/properties/:id/survey-extraction-jobs`
- `GET /api/survey-extraction-jobs/:id`
- `POST /api/cadastre/search`
- `POST /api/cadastre/matches/:id/accept`

Use Zod schemas for all payloads. Server-side handlers must derive organization and user identity from Better Auth context, not request body fields.

The extraction worker may initially be a controlled background job run by the existing application/queue infrastructure. Keep the interface job-based so OCR can move to a dedicated worker without changing the user workflow.

## 11. Delivery phases

### Phase 1 — Data contract and fixtures

- Add a sanitized fixture derived from the sample’s layout, with no real owner names or sensitive references.
- Define extraction JSON schema, CRS model, validation flags, and status transitions.
- Add coordinate conversion and polygon validation unit tests.

### Phase 2 — Government overlay prototype

- Query the Zambia `Lots` layer for a fixed Lusaka test area.
- Convert/normalize geometry to WGS84.
- Render the overlay in Leaflet without replacing the private deed boundary.
- Add caching, source metadata, timeout, and no-match states.

### Phase 3 — Private deed upload and OCR

- Add secure upload session and job creation.
- Add scan preprocessing and OCR extraction.
- Build the extraction review screen with document preview and map polygon.
- Add manual corrections and provenance tracking.

### Phase 4 — Boundary approval and property map integration

- Add versioned `PropertyBoundary` records.
- Replace direct reliance on raw `standBoundary` with verified-boundary selection.
- Add layer styling, evidence panel, audit events, and role permissions.
- Preserve manual drawing as an explicit approximation workflow.

### Phase 5 — Import formats and production hardening

- Add GeoJSON/KML import.
- Add zipped Shapefile import with `.prj` validation.
- Add asynchronous malware scanning, orphan cleanup, retention, and rate limits.
- Run production storage and cadastral-service health checks.

## 12. Acceptance tests

### Sample deed

- Upload the supplied document fixture.
- OCR identifies the point labels and coordinate table.
- Raw and normalized values are shown side by side.
- Reviewer confirms CRS/zone and sees a closed polygon in Lusaka.
- Calculated area is compared with the deed’s stated area.
- Boundary remains `NEEDS_REVIEW` until an authorized user approves it.

### Government data

- Search by plot/survey identifier returns a government candidate when available.
- Spatial search is bounded, cached, and handles service timeout.
- Government geometry is rendered separately from deed geometry.
- A mismatch requires review and never silently overwrites the deed boundary.

### Security

- Cross-organization users cannot list, download, OCR, or verify another organization’s deed.
- Field agents without boundary permissions cannot upload or approve survey boundaries.
- Presigned URLs expire and are not stored in the database.
- Invalid files, oversized files, unsupported CRS, self-intersecting polygons, and low-confidence OCR produce recoverable review states.
- All boundary approvals, corrections, imports, and rejections are audited.

## 13. Important legal and operational boundary

Contour can make survey evidence easier to review and can display government cadastral references, but it must not claim to certify ownership, title validity, or a legally binding boundary. The approved diagram, title records, surveyor, and relevant government registry remain authoritative. The product should use language such as “survey evidence”, “government cadastral reference”, and “pending verification” until a qualified reviewer confirms the source.

## 14. Decisions required before implementation

1. Confirm whether the first release should query the government ArcGIS layer live, import a periodically refreshed snapshot, or support both.
2. Confirm whether OCR must remain fully self-hosted or whether an approved cloud OCR provider may be used for low-confidence pages.
3. Confirm the acceptable area-difference tolerance between deed and calculated polygon.
4. Confirm which roles may upload, review, and approve boundaries.
5. Confirm whether the agency needs title-deed OCR for every property or only properties entering the sales/rent pipeline.
6. Confirm retention and legal-hold policy for source deeds, OCR artifacts, and rejected extraction attempts.

## 15. Definition of done

An agency user can upload a title deed or survey diagram, Contour can extract coordinate candidates without sending sensitive documents to an unapproved third party, the user can review and correct the proposed polygon, the application can compare it with Zambia’s government cadastral reference where available, and the approved boundary renders on the map with transparent provenance, tenant isolation, audit history, and a clear non-legal-certification label.
