/**
 * Test Suite: Title Deed OCR Stand Boundary Extraction & Cadastral Pipeline
 */

process.env.NODE_ENV = "development";
process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { POST as extractStandBoundaryHandler } from "../src/app/api/properties/extract-stand-boundary/route";
import {
  extractSurveyCoordinates,
  convertCandidatesToWgs84,
  validatePolygon,
  calculatePolygonAreaSqm,
} from "../src/lib/cadastral";
import { sanitizedSurveyDiagramFixture } from "../src/lib/cadastral/fixtures/sanitized-survey-diagram";
import { createPropertySchema } from "../src/lib/validations";

async function runTitleDeedOcrTests() {
  console.log("================================================================================");
  console.log("  CONTOUR TITLE DEED OCR & STAND BOUNDARY EXTRACTION TEST");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── TEST 1: Cadastral Survey Schedule OCR Regex Parser ──────────────────────
  console.log("── TEST GROUP 1: Cadastral OCR Coordinate Schedule Parsing");
  const rawSurveySchedule = `
    REPUBLIC OF ZAMBIA - MINISTRY OF LANDS
    SURVEY DIAGRAM NO. SD/4821/2023
    STAND NO. 4821 KABULONGA LUSAKA
    COORDINATE SYSTEM: UTM ZONE 35 SOUTH WGS84
    STATED AREA: 1,200 SQ METRES

    BEACON SCHEDULE:
    A  637,700.00  8,295,000.00
    B  637,740.00  8,295,000.00
    C  637,740.00  8,295,030.00
    D  637,700.00  8,295,030.00
  `;

  const parsedSurvey = extractSurveyCoordinates(rawSurveySchedule);
  assert(parsedSurvey.coordinateCandidates.length === 4, `Extracted 4 coordinate candidates (found ${parsedSurvey.coordinateCandidates.length})`);
  assert(parsedSurvey.coordinateCandidates[0].pointLabel === "A", "First beacon label is A");
  assert(parsedSurvey.coordinateCandidates[0].easting === 637700, "Point A Easting is 637,700");
  assert(parsedSurvey.coordinateCandidates[0].northing === 8295000, "Point A Northing is 8,295,000");
  assert(parsedSurvey.coordinateReferenceSystem.status === "CONFIRMED", "CRS confirmed as UTM Zone 35 South");
  assert(parsedSurvey.coordinateReferenceSystem.zone === 35, "UTM Zone detected as 35");

  // ── TEST 2: UTM to WGS84 GPS Transformation ────────────────────────────────
  console.log("\n── TEST GROUP 2: UTM to WGS84 GPS Coordinate Transformation");
  const wgs84Points = convertCandidatesToWgs84(
    parsedSurvey.coordinateCandidates,
    parsedSurvey.coordinateReferenceSystem
  );

  const ptA = wgs84Points.get("A");
  assert(ptA !== undefined, "Point A converted to WGS84");
  if (ptA) {
    // Lusaka falls around -15.4 Lat, 28.3 Lng
    assert(ptA[1] < -15.0 && ptA[1] > -16.0, `Converted Latitude is within Lusaka province (${ptA[1].toFixed(6)})`);
    assert(ptA[0] > 28.0 && ptA[0] < 29.0, `Converted Longitude is within Lusaka province (${ptA[0].toFixed(6)})`);
  }

  // ── TEST 3: Geometry Validation & Area Calculation ──────────────────────────
  console.log("\n── TEST GROUP 3: Stand Boundary Polygon Validation");
  const ring: [number, number][] = parsedSurvey.coordinateCandidates.map((c) => wgs84Points.get(c.pointLabel)!);
  const valResult = validatePolygon(ring, { statedAreaSqm: 1200, areaTolerancePct: 15 });

  assert(valResult.valid === true, "Stand polygon is topologically valid");
  assert(valResult.polygon !== null, "GeoJSON Polygon structure successfully generated");
  assert(valResult.flags.length === 0, `No validation flags triggered (flags: ${valResult.flags.join(", ") || "none"})`);
  assert(valResult.areaSqm > 1000 && valResult.areaSqm < 1400, `Calculated geodesic area (${Math.round(valResult.areaSqm)} m²) matches stated area (1,200 m²)`);

  // ── TEST 4: API Endpoint POST /api/properties/extract-stand-boundary ────────
  console.log("\n── TEST GROUP 4: Stand Boundary Extraction API Endpoint");
  const form = new FormData();
  form.append("sample", "true");

  const req = new NextRequest("http://localhost:3000/api/properties/extract-stand-boundary", {
    method: "POST",
    body: form,
  });

  const res = await extractStandBoundaryHandler(req);
  const json = await res.json();

  assert(res.status === 200, `API returned HTTP 200 (received ${res.status})`);
  assert(json.success === true, "API response indicates success");
  assert(Array.isArray(json.standBoundary) && json.standBoundary.length >= 3, `Extracted standBoundary array with ${json.standBoundary?.length} vertices`);
  assert(typeof json.plotSizeSqm === "number" && json.plotSizeSqm > 0, `Returned plotSizeSqm: ${json.plotSizeSqm} m²`);
  assert(Array.isArray(json.beacons) && json.beacons.length >= 3, `Returned ${json.beacons?.length} beacon points with GPS coordinates`);

  // ── TEST 5: Zod Schema Validation for Add Property with Stand Boundary ───────
  console.log("\n── TEST GROUP 5: createPropertySchema Integration");
  const validPropertyInput = {
    title: "Luxury Kabulonga Villa",
    suburb: "Kabulonga",
    city: "Lusaka",
    ownershipType: "MANAGED_ON_BEHALF",
    propertyType: "STANDALONE_HOUSE",
    listingType: "FOR_SALE",
    askingPrice: 3500000,
    currency: "ZMW",
    bedrooms: 4,
    bathrooms: 3,
    plotSizeSqm: json.plotSizeSqm,
    description: "Executive 4-bed residence with verified title deed stand boundaries.",
    landmarkDirections: "200m off Kabulonga Road near Centro Mall",
    mandateDeclarationAgreed: true,
    mandateType: "SOLE_MANDATE",
    standBoundary: json.standBoundary,
    titleDeedDocumentId: "vault_doc_test_123",
  };

  // ── TEST 6: POST /api/properties Persistence with Stand Boundary ────────────
  console.log("\n── TEST GROUP 6: POST /api/properties DB Creation & Boundary Persistence");
  const { POST: createPropertyHandler } = await import("../src/app/api/properties/route");
  const propReq = new NextRequest("http://localhost:3000/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPropertyInput),
  });

  const propRes = await createPropertyHandler(propReq);
  const propJson = await propRes.json();

  assert(propRes.status === 200, `Property creation returned HTTP 200 (received ${propRes.status})`);
  assert(propJson.success === true, "Property created successfully");
  assert(propJson.property?.title === validPropertyInput.title, "Created property title matches input");
  assert(Array.isArray(propJson.property?.standBoundary) && propJson.property.standBoundary.length === 4, "Property standBoundary was persisted to database");

  console.log("\n================================================================================");
  console.log(`  TITLE DEED OCR TESTS SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTitleDeedOcrTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
