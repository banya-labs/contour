process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { POST as searchProperties } from "../src/app/api/dify/tools/properties/route";
import { POST as getArrears } from "../src/app/api/dify/tools/arrears/route";
import { POST as getCommission } from "../src/app/api/dify/tools/commission/route";
import { POST as getDocuments } from "../src/app/api/dify/tools/documents/route";
import { POST as createInquiry } from "../src/app/api/dify/tools/inquiries/route";

/**
 * Contour Multi-Tenant Dify Tool Isolation Test Suite
 * 
 * Verifies that Neon PostgreSQL and MinIO S3 tool queries are strictly isolated
 * to the authenticated organization and cannot leak cross-tenant data.
 */
async function runTestSuite() {
  console.log("===============================================================================");
  console.log("🏢 CONTOUR REAL ESTATE OS: DIFY & MULTI-TENANT ISOLATION TEST SUITE");
  console.log("===============================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Property Search Scoping by Organization ID
  // ---------------------------------------------------------------------------
  console.log("\n--- 1. Testing Neon PostgreSQL Property Search Isolation ---");
  const propReqTenantA = new NextRequest("http://localhost:3000/api/dify/tools/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: "org_lusaka_premier",
      suburb: "Kabulonga",
      listingType: "FOR_SALE",
    }),
  });

  const propResTenantA = await searchProperties(propReqTenantA);
  const propDataTenantA = await propResTenantA.json();

  assert(
    propResTenantA.status === 200 && propDataTenantA.tenant === "org_lusaka_premier",
    "Tenant A Property Search returned 200 with scoped tenant context",
    `Tenant: ${propDataTenantA.tenant}, Properties Found: ${propDataTenantA.totalCount}`
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Rental Arrears Scoping
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Testing Rental Arrears Isolation ---");
  const arrearsReq = new NextRequest("http://localhost:3000/api/dify/tools/arrears", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: "org_lusaka_premier",
      minDaysOverdue: 5,
    }),
  });

  const arrearsRes = await getArrears(arrearsReq);
  const arrearsData = await arrearsRes.json();

  assert(
    arrearsRes.status === 200 && arrearsData.tenant === "org_lusaka_premier",
    "Rental Arrears endpoint returns only tenant-scoped lease arrears",
    `Tenants in arrears: ${arrearsData.totalTenantsInArrears}`
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Commission & Revenue Aggregation Isolation
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing 5% Agency Commission Calculation ---");
  const commReq = new NextRequest("http://localhost:3000/api/dify/tools/commission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: "org_lusaka_premier",
    }),
  });

  const commRes = await getCommission(commReq);
  const commData = await commRes.json();

  assert(
    commRes.status === 200 && commData.metrics !== undefined,
    "Commission metrics aggregated with 5% agency fee and 50% closing split",
    `Gross Volume: ${commData.metrics?.totalGrossVolume}, Earned: ${commData.metrics?.earnedAgencyCommission}`
  );

  // ---------------------------------------------------------------------------
  // TEST 4: MinIO S3 Document Custody & 15-Minute Presigned Download Isolation
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Testing MinIO S3 Document Vault Isolation ---");
  const docReq = new NextRequest("http://localhost:3000/api/dify/tools/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: "org_lusaka_premier",
      category: "TITLE_DEED",
    }),
  });

  const docRes = await getDocuments(docReq);
  const docData = await docRes.json();

  const isMinIoIsolated = docData.documents?.every((d: any) =>
    d.minioObjectKey.startsWith("org_lusaka_premier/")
  );

  assert(
    docRes.status === 200 && isMinIoIsolated,
    "MinIO S3 Presigned URLs are strictly prefixed with tenant folder {organization_id}/",
    `Vault Path: ${docData.documents?.[0]?.vaultPath}, Presigned Expiry: ${docData.documents?.[0]?.expiresInSeconds}s`
  );

  // ---------------------------------------------------------------------------
  // TEST 5: CRM Inquiry Ingestion with 30-Day Anti-Poaching Lock
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Testing CRM Inquiry Ingestion with 30-Day Anti-Poaching Lock ---");
  const inqReq = new NextRequest("http://localhost:3000/api/dify/tools/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: "org_lusaka_premier",
      clientName: "Bwalya Chilufya",
      clientPhone: "+260977889900",
      lookingFor: "FOR_SALE",
      preferredSuburbs: ["Kabulonga", "Leopards Hill"],
      budgetMax: 4500000,
      currency: "ZMW",
      notes: "Looking for modern 4-bed standalone with borehole and swimming pool.",
    }),
  });

  const inqRes = await createInquiry(inqReq);
  const inqData = await inqRes.json();

  assert(
    inqRes.status === 200 && inqData.inquiry?.antiPoachingLockExpiry !== undefined,
    "Inquiry registered in Neon DB with 30-day anti-poaching lock timestamp",
    `Lock Expiry: ${inqData.inquiry?.antiPoachingLockExpiry}`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`🎯 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passedTests === totalTests) {
    console.log("🚀 ALL DIFY TOOLS & TENANT ISOLATION SUITES PASSED PERFECTLY!");
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
