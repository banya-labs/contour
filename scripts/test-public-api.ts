process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { GET as getProperties } from "../src/app/api/properties/route";
import { POST as postInquiry } from "../src/app/api/inquiries/route";

async function testPublicApi() {
  console.log("===============================================================================");
  console.log("🌐 CONTOUR PUBLIC API: PROPERTIES & INQUIRIES ROUTE TESTS");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      if (detail) console.error(`   └─ ${detail}`);
    }
  }

  // 1. GET without organization slug (production mode check)
  console.log("--- 1. Testing GET properties without 'org' in production mode ---");
  process.env.NEXT_PUBLIC_DEV_MODE = "false";
  const noOrgReq = new NextRequest("http://localhost:3000/api/properties");
  const noOrgRes = await getProperties(noOrgReq);
  const noOrgData = await noOrgRes.json();
  assert(
    noOrgRes.status === 400 && noOrgData.success === false && noOrgData.error.includes("Missing required 'org'"),
    "Rejects properties query when 'org' parameter is missing in production mode",
    `Status: ${noOrgRes.status}, Error: ${noOrgData.error}`
  );
  process.env.NEXT_PUBLIC_DEV_MODE = "true";

  // 2. GET properties with valid organization (dev mode bypass)
  console.log("\n--- 2. Testing GET properties with valid organization ---");
  const validReq = new NextRequest("http://localhost:3000/api/properties?org=org_demo_contour");
  const validRes = await getProperties(validReq);
  const validData = await validRes.json();
  
  assert(
    validRes.status === 200 && validData.success === true && Array.isArray(validData.properties),
    "Successfully retrieves properties for organization",
    `Status: ${validRes.status}, Found: ${validData.properties?.length || 0} properties`
  );

  // 3. Security Check: Landlord PII sanitization in properties response
  console.log("\n--- 3. Testing landlord PII sanitization in properties output ---");
  const properties = validData.properties || [];
  let sanitizationPassed = true;
  let checkedFields: string[] = [];

  if (properties.length > 0) {
    const prop = properties[0];
    const sensitiveFields = ["ownerName", "ownerPhone", "ownerEmail", "ownerBankDetails", "titleDeedNumber"];
    for (const field of sensitiveFields) {
      if (field in prop) {
        sanitizationPassed = false;
        checkedFields.push(field);
      }
    }
  }

  assert(
    sanitizationPassed && properties.length > 0,
    "Response strictly filters out sensitive landlord/owner PII and title deed numbers",
    checkedFields.length > 0
      ? `Failed fields present: ${checkedFields.join(", ")}`
      : "All sensitive fields properly stripped from JSON response."
  );

  // 4. POST inquiry with valid payload
  console.log("\n--- 4. Testing POST inquiry with valid payload ---");
  const inquiryReq = new NextRequest("http://localhost:3000/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org: "org_demo_contour",
      clientName: "Seward Richard",
      clientPhone: "+260977112233",
      clientEmail: "seward@banyalabs.com",
      propertyId: "prop_01",
      notes: "Testing the public API form integration.",
    }),
  });
  const inquiryRes = await postInquiry(inquiryReq);
  const inquiryData = await inquiryRes.json();

  assert(
    inquiryRes.status === 200 && inquiryData.success === true && inquiryData.message === "Inquiry successfully submitted.",
    "Accepts valid inquiry payload and creates lead entry",
    `Status: ${inquiryRes.status}, Message: ${inquiryData.message}`
  );

  // 5. POST inquiry validation error on malformed payload
  console.log("\n--- 5. Testing POST inquiry validation errors ---");
  const badInquiryReq = new NextRequest("http://localhost:3000/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org: "", // Empty organization
      clientName: "A", // Too short
      clientPhone: "123", // Too short
      clientEmail: "invalid-email-address", // Invalid email format
    }),
  });
  const badInquiryRes = await postInquiry(badInquiryReq);
  const badInquiryData = await badInquiryRes.json();

  assert(
    badInquiryRes.status === 400 && badInquiryData.success === false && badInquiryData.error === "Validation failed",
    "Rejects invalid inquiry payload and returns validation error details",
    `Status: ${badInquiryRes.status}, Details: ${JSON.stringify(badInquiryData.details)}`
  );

  console.log("\n===============================================================================");
  console.log(`🎯 PUBLIC API TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passed === total) {
    console.log("🚀 ALL CONTOUR PUBLIC API INTEGRATION TESTS PASSED PERFECTLY!");
  } else {
    process.exit(1);
  }
}

testPublicApi().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
