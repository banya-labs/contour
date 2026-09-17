/**
 * Automated Verification Script: Property Creation & Image Upload Audit
 */

process.env.NODE_ENV = "development";
process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { createPropertySchema } from "../src/lib/validations";
import { SUBURB_DEFAULT_COORDINATES } from "../src/components/properties/location-coordinate-picker";

async function runAuditTests() {
  console.log("================================================================================");
  console.log("  CONTOUR PROPERTY CREATION & IMAGE UPLOAD AUDIT VERIFICATION");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  // ── TEST 1: Property Creation with ZERO Photos (User Requirement) ───────────
  console.log("── TEST GROUP 1: Property Creation without Images (Zero Photos)");
  const zeroPhotoPayload = {
    title: "Chudleigh Garden Villa",
    suburb: "Chudleigh",
    city: "Lusaka",
    listingType: "FOR_SALE",
    askingPrice: 2800000,
    currency: "ZMW",
    bedrooms: 3,
    bathrooms: 2,
    plotSizeSqm: 650,
    landmarkDirections: "Near Chudleigh Baptist Church",
    mandateDeclarationAgreed: true,
    mandateType: "SOLE_MANDATE",
    photos: [], // 0 photos!
  };

  const parsedZeroPhotos = createPropertySchema.safeParse(zeroPhotoPayload);
  assert(parsedZeroPhotos.success, "Property with 0 photos passes createPropertySchema validation");
  if (!parsedZeroPhotos.success) {
    console.error("Validation error:", parsedZeroPhotos.error.format());
  }

  // ── TEST 2: Property Creation with Missing Description (Auto-generation) ───
  console.log("\n── TEST GROUP 2: Missing Description Handling");
  const noDescriptionPayload = {
    title: "Woodlands Prime Residence",
    suburb: "Woodlands",
    city: "Lusaka",
    listingType: "FOR_SALE",
    askingPrice: 4200000,
    currency: "ZMW",
    mandateDeclarationAgreed: true,
    mandateType: "SOLE_MANDATE",
    // description is completely omitted!
  };

  const parsedNoDesc = createPropertySchema.safeParse(noDescriptionPayload);
  assert(parsedNoDesc.success, "Property with omitted description passes schema validation (no longer required)");

  // ── TEST 3: Property Creation with Multiple Photos ──────────────────────────
  console.log("\n── TEST GROUP 3: Multi-Photo Listing Payload");
  const multiPhotoPayload = {
    title: "Luxury Kabulonga Embassy Residence",
    suburb: "Kabulonga",
    city: "Lusaka",
    listingType: "FOR_SALE",
    askingPrice: 6500000,
    currency: "ZMW",
    bedrooms: 5,
    bathrooms: 4.5,
    plotSizeSqm: 1800,
    description: "Diplomatic-grade residence with perimeter sensor wall and guardhouse.",
    photos: [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg",
      "https://example.com/photo3.jpg",
      "https://example.com/photo4.jpg",
    ],
    featuredPhoto: "https://example.com/photo1.jpg",
    mandateDeclarationAgreed: true,
  };

  const parsedMulti = createPropertySchema.safeParse(multiPhotoPayload);
  assert(parsedMulti.success, "Property with 4 photos passes schema validation");
  assert(parsedMulti.data?.photos.length === 4, "Retains all 4 photos in parsed payload");
  assert(parsedMulti.data?.featuredPhoto === "https://example.com/photo1.jpg", "Retains custom featuredPhoto");

  // ── TEST 4: Map Pin & Custom Coordinates Integration ───────────────────────
  console.log("\n── TEST GROUP 4: Location & Coordinate Picker Integration");
  const mapPickerCoordinatesPayload = {
    title: "Roma Park Executive Office Stand",
    suburb: "Roma Park",
    city: "Lusaka",
    listingType: "FOR_SALE",
    askingPrice: 5000000,
    currency: "ZMW",
    latitude: -15.378125,
    longitude: 28.312456,
    landmarkDirections: "Opposite Commercial Gate 2",
    mandateDeclarationAgreed: true,
  };

  const parsedCoords = createPropertySchema.safeParse(mapPickerCoordinatesPayload);
  assert(parsedCoords.success, "Payload with map picker latitude & longitude passes schema validation");
  assert(parsedCoords.data?.latitude === -15.378125, "Latitude correctly preserved");
  assert(parsedCoords.data?.longitude === 28.312456, "Longitude correctly preserved");

  // Suburb dictionary completeness
  assert(Boolean(SUBURB_DEFAULT_COORDINATES["Kabulonga"]), "Kabulonga coordinates configured");
  assert(Boolean(SUBURB_DEFAULT_COORDINATES["Woodlands"]), "Woodlands coordinates configured");
  assert(Boolean(SUBURB_DEFAULT_COORDINATES["Roma Park"]), "Roma Park coordinates configured");
  assert(Boolean(SUBURB_DEFAULT_COORDINATES["Leopards Hill"]), "Leopards Hill coordinates configured");

  // ── TEST 5: Edge Case Mitigations ──────────────────────────────────────────
  console.log("\n── TEST GROUP 5: Creation Edge Case Mitigations");

  // Zero / missing plot size
  const zeroPlotSizePayload = {
    title: "Rhodes Park Apartment",
    suburb: "Rhodes Park",
    listingType: "FOR_RENT",
    rentalPrice: 2500,
    currency: "USD",
    plotSizeSqm: 0, // 0 plot size for apartment
    mandateDeclarationAgreed: true,
  };
  const parsedZeroPlot = createPropertySchema.safeParse(zeroPlotSizePayload);
  assert(parsedZeroPlot.success, "Plot size of 0 is accepted (nonnegative constraint)");

  // Empty string owner email
  const emptyEmailPayload = {
    title: "Mass Media Townhouse",
    suburb: "Mass Media",
    listingType: "FOR_RENT",
    rentalPrice: 1800,
    ownerEmail: "", // empty string
    mandateDeclarationAgreed: true,
  };
  const parsedEmptyEmail = createPropertySchema.safeParse(emptyEmailPayload);
  assert(parsedEmptyEmail.success, "Empty string ownerEmail is safely accepted without throwing email format error");

  console.log("\n================================================================================");
  console.log(`  SUMMARY: ${passed} passed, ${failed} failed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditTests();
