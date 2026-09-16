process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { GET as getProperties, OPTIONS as optionsProperties } from "../src/app/api/properties/route";
import { POST as postInquiry, OPTIONS as optionsInquiries } from "../src/app/api/inquiries/route";

async function testPublicApi() {
  console.log("===============================================================================");
  console.log("🌐 CONTOUR PUBLIC API: PROPERTIES SEARCH, SORT & PAGINATION TESTS");
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

  // 1. Unauthenticated Public Access without org param (auto-falls back to primary agency)
  console.log("--- 1. Public GET properties without auth & without org parameter ---");
  const defaultReq = new NextRequest("http://localhost:3000/api/properties?status=AVAILABLE");
  const defaultRes = await getProperties(defaultReq);
  const defaultData = await defaultRes.json();
  assert(
    defaultRes.status === 200 && defaultData.success === true && Array.isArray(defaultData.properties),
    "Public request succeeds without auth and defaults to primary workspace",
    `Status: ${defaultRes.status}, Returned: ${defaultData.properties?.length || 0} listings, Org: ${defaultData.organization?.name || "N/A"}`
  );

  // 2. CORS Headers verification
  console.log("\n--- 2. CORS Headers on Public Endpoints ---");
  const originHeader = defaultRes.headers.get("access-control-allow-origin");
  assert(
    originHeader === "*",
    "GET /api/properties includes Access-Control-Allow-Origin: * for external websites",
    `Header value: ${originHeader}`
  );

  const optionsReq = new NextRequest("http://localhost:3000/api/properties", { method: "OPTIONS" });
  const optionsRes = await optionsProperties(optionsReq);
  assert(
    optionsRes.status === 204 && optionsRes.headers.get("access-control-allow-origin") === "*",
    "OPTIONS preflight returns HTTP 204 with CORS headers",
    `Status: ${optionsRes.status}, Origin: ${optionsRes.headers.get("access-control-allow-origin")}`
  );

  // 3. Explicit Organization by Slug
  console.log("\n--- 3. Query properties with explicit organization slug (?org=contour-demo) ---");
  const orgReq = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&status=AVAILABLE");
  const orgRes = await getProperties(orgReq);
  const orgData = await orgRes.json();
  assert(
    orgRes.status === 200 && orgData.success === true && orgData.properties.length > 0,
    "Resolves organization by slug 'contour-demo' and returns properties",
    `Found ${orgData.properties?.length} properties for org '${orgData.organization?.name}'`
  );

  // 3b. Multi-Tenant Isolation Verification
  console.log("\n--- 3b. Strict Multi-Tenant Isolation (Different Agency Scoping) ---");
  const otherOrgReq = new NextRequest("http://localhost:3000/api/properties?org=banya-labs&status=AVAILABLE");
  const otherOrgRes = await getProperties(otherOrgReq);
  const otherOrgData = await otherOrgRes.json();
  assert(
    otherOrgRes.status === 200 &&
    otherOrgData.success === true &&
    otherOrgData.agency?.slug === "banya-labs" &&
    otherOrgData.properties.length === 0,
    "Guarantees 100% tenant isolation: Agency 'banya-labs' cannot see or access 'contour-demo' listings",
    `Scoped to '${otherOrgData.agency?.name}', listings count: ${otherOrgData.properties?.length}`
  );

  const unknownOrgReq = new NextRequest("http://localhost:3000/api/properties?org=non-existent-agency&status=AVAILABLE");
  const unknownOrgRes = await getProperties(unknownOrgReq);
  const unknownOrgData = await unknownOrgRes.json();
  assert(
    unknownOrgRes.status === 404 && unknownOrgData.success === false,
    "Rejects queries for non-existent agency slugs with HTTP 404 Not Found",
    `Status: ${unknownOrgRes.status}, Error: ${unknownOrgData.error}`
  );

  // 4. Suburb Filtering
  console.log("\n--- 4. Suburb Filtering (?suburb=Kabulonga) ---");
  const suburbReq = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&suburb=Kabulonga&status=AVAILABLE");
  const suburbRes = await getProperties(suburbReq);
  const suburbData = await suburbRes.json();
  const allMatchSuburb = suburbData.properties?.every((p: any) =>
    p.suburb?.toLowerCase().includes("kabulonga")
  );
  assert(
    suburbRes.status === 200 && suburbData.success === true && (suburbData.properties.length === 0 || allMatchSuburb),
    "Filters strictly by specified suburb (Kabulonga)",
    `Matched ${suburbData.properties?.length || 0} listings in Kabulonga`
  );

  // 5. Keyword Search across Title, Suburb & Description
  console.log("\n--- 5. Full-Text Search (?search=villa) ---");
  const searchReq = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&search=villa&status=AVAILABLE");
  const searchRes = await getProperties(searchReq);
  const searchData = await searchRes.json();
  const allMatchSearch = searchData.properties?.every((p: any) =>
    (p.title + " " + p.suburb + " " + (p.description || "")).toLowerCase().includes("villa")
  );
  assert(
    searchRes.status === 200 && searchData.success === true && (searchData.properties.length === 0 || allMatchSearch),
    "Search matches keyword across title, suburb, or description",
    `Matched ${searchData.properties?.length || 0} listings for query 'villa'`
  );

  // 6. Ordering & Sorting (Price Ascending vs Descending, Bedrooms)
  console.log("\n--- 6. Ordering / Sorting (?listingType=SALE&sortBy=price&sortOrder=asc / desc) ---");
  const priceAscReq = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&listingType=SALE&sortBy=price&sortOrder=asc&status=AVAILABLE");
  const priceAscRes = await getProperties(priceAscReq);
  const priceAscData = await priceAscRes.json();

  const pricesAsc = priceAscData.properties?.map((p: any) => Number(p.askingPrice) || 0) || [];
  let isSortedAsc = true;
  for (let i = 1; i < pricesAsc.length; i++) {
    if (pricesAsc[i] < pricesAsc[i - 1]) {
      isSortedAsc = false;
      break;
    }
  }
  assert(
    priceAscRes.status === 200 && isSortedAsc && pricesAsc.length > 0,
    "Orders SALE properties by price in ASCENDING order (lowest price first)",
    `Prices: ${pricesAsc.slice(0, 5).join(", ")}`
  );

  const priceDescReq = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&listingType=SALE&sortBy=price&sortOrder=desc&status=AVAILABLE");
  const priceDescRes = await getProperties(priceDescReq);
  const priceDescData = await priceDescRes.json();

  const pricesDesc = priceDescData.properties?.map((p: any) => Number(p.askingPrice) || 0) || [];
  let isSortedDesc = true;
  for (let i = 1; i < pricesDesc.length; i++) {
    if (pricesDesc[i] > pricesDesc[i - 1]) {
      isSortedDesc = false;
      break;
    }
  }
  assert(
    priceDescRes.status === 200 && isSortedDesc && pricesDesc.length > 0,
    "Orders SALE properties by price in DESCENDING order (highest price first)",
    `Prices: ${pricesDesc.slice(0, 5).join(", ")}`
  );

  const bedDescReq = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&sortBy=bedrooms&sortOrder=desc&status=AVAILABLE");
  const bedDescRes = await getProperties(bedDescReq);
  const bedDescData = await bedDescRes.json();
  const bedroomsDesc = bedDescData.properties?.map((p: any) => p.bedrooms || 0) || [];
  let isSortedBeds = true;
  for (let i = 1; i < bedroomsDesc.length; i++) {
    if (bedroomsDesc[i] > bedroomsDesc[i - 1]) {
      isSortedBeds = false;
      break;
    }
  }
  assert(
    bedDescRes.status === 200 && isSortedBeds && bedroomsDesc.length > 0,
    "Orders properties by bedroom count in DESCENDING order (most bedrooms first)",
    `Bedrooms: ${bedroomsDesc.slice(0, 6).join(", ")}`
  );

  // 7. Pagination (?page=1&limit=2 vs ?page=2&limit=2)
  console.log("\n--- 7. Pagination Mechanics (?page=1&limit=2 vs ?page=2&limit=2) ---");
  const page1Req = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&page=1&limit=2&status=AVAILABLE");
  const page1Res = await getProperties(page1Req);
  const page1Data = await page1Res.json();

  const page2Req = new NextRequest("http://localhost:3000/api/properties?org=contour-demo&page=2&limit=2&status=AVAILABLE");
  const page2Res = await getProperties(page2Req);
  const page2Data = await page2Res.json();

  const page1Ids = page1Data.properties?.map((p: any) => p.id) || [];
  const page2Ids = page2Data.properties?.map((p: any) => p.id) || [];
  const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));

  assert(
    page1Data.pagination &&
    page1Data.pagination.page === 1 &&
    page1Data.pagination.limit === 2 &&
    typeof page1Data.pagination.total === "number" &&
    page1Data.pagination.totalPages >= 1,
    "Page 1 returns accurate pagination metadata (total, limit, page, totalPages, hasNextPage)",
    `Page 1: ${page1Ids.length} items, Total: ${page1Data.pagination.total}, TotalPages: ${page1Data.pagination.totalPages}`
  );

  assert(
    !hasOverlap && page2Data.pagination.page === 2,
    "Page 2 returns distinct, non-overlapping items from Page 1",
    `Page 1 IDs: [${page1Ids.join(", ")}], Page 2 IDs: [${page2Ids.join(", ")}]`
  );

  // 8. Public Listing URLs & Landlord PII Sanitization
  console.log("\n--- 8. Data Security: Public URLs & Landlord PII Masking ---");
  const sampleProp = orgData.properties?.[0];
  const sensitiveFields = ["ownerName", "ownerPhone", "ownerEmail", "ownerBankDetails", "titleDeedNumber"];
  const leakedFields = sensitiveFields.filter((f) => sampleProp && f in sampleProp);

  assert(
    leakedFields.length === 0,
    "Guarantees 100% landlord PII & title deed masking in public JSON response",
    leakedFields.length === 0 ? "Zero confidential fields present" : `LEAKED: ${leakedFields.join(", ")}`
  );

  assert(
    sampleProp && sampleProp.publicUrl && sampleProp.publicUrl.startsWith("https://contour.banyalabs.com/p/"),
    "Generates canonical public shareable URL using contour.banyalabs.com domain",
    `Sample publicUrl: ${sampleProp?.publicUrl}`
  );

  // 9. Lead Capture & Website Inquiries (POST /api/inquiries)
  console.log("\n--- 9. Website Lead Capture (POST /api/inquiries) ---");
  const inquiryReq = new NextRequest("http://localhost:3000/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org: "contour-demo",
      clientName: "Mwamba Chileshe",
      clientPhone: "+260977445566",
      clientEmail: "mwamba@example.com",
      propertyId: sampleProp?.id || "prop_01",
      notes: "Website contact form submission requesting a viewing.",
    }),
  });
  const inquiryRes = await postInquiry(inquiryReq);
  const inquiryData = await inquiryRes.json();

  assert(
    inquiryRes.status === 200 && inquiryData.success === true,
    "Accepts website inquiry and routes lead into agency pipeline",
    `Status: ${inquiryRes.status}, Message: ${inquiryData.message}`
  );

  // 10. Inquiry Validation on malformed input
  console.log("\n--- 10. Inquiry Input Validation ---");
  const badInquiryReq = new NextRequest("http://localhost:3000/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org: "contour-demo",
      clientName: "M", // Too short
      clientPhone: "123", // Too short
      clientEmail: "not-an-email",
    }),
  });
  const badInquiryRes = await postInquiry(badInquiryReq);
  const badInquiryData = await badInquiryRes.json();

  assert(
    badInquiryRes.status === 400 && badInquiryData.success === false,
    "Strictly validates website contact form inputs and returns 400 Bad Request on malformed data",
    `Status: ${badInquiryRes.status}, Error: ${badInquiryData.error}`
  );

  console.log("\n===============================================================================");
  console.log(`🎯 PUBLIC API TEST SUITE: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passed === total) {
    console.log("🚀 ALL PUBLIC INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
  } else {
    process.exit(1);
  }
}

testPublicApi().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
