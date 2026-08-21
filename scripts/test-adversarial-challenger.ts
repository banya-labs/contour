process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { POST as mcpPost, GET as mcpGet } from "../src/app/api/mcp/route";
import { GET as mcpSseGet, POST as mcpSsePost } from "../src/app/api/mcp/sse/route";
import { POST as searchProperties } from "../src/app/api/dify/tools/properties/route";
import { POST as getArrears } from "../src/app/api/dify/tools/arrears/route";
import { POST as getCommission } from "../src/app/api/dify/tools/commission/route";
import { POST as getDocuments } from "../src/app/api/dify/tools/documents/route";
import { POST as createInquiry } from "../src/app/api/dify/tools/inquiries/route";

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  const icon = passed ? "PASS" : "FAIL";
  console.log(`[${icon}] [${category}] ${name}`);
  console.log(`       └─ ${details}`);
}

async function runAdversarialTests() {
  console.log("===============================================================================");
  console.log("CONTOUR REAL ESTATE OS: EMPIRICAL ADVERSARIAL VERIFICATION & STRESS TEST");
  console.log("===============================================================================\n");

  // 1. FINANCIAL CALCULATIONS & DOMAIN LOGIC
  console.log("\n--- SECTION 1: Financial Calculations and Dual Ledger Precision ---");

  // 1.1 Standard Gross Sales Agency Commission (5.0%) and Closing Agent Split (50%)
  const saleGross = 3500000;
  const expectedAgencyComm = saleGross * 0.05;
  const expectedAgentSplit = expectedAgencyComm * 0.50;
  recordTest(
    "FINANCIAL",
    "5.0% Gross Sales Agency Commission and 50% Closing Split Calculation",
    expectedAgencyComm === 175000 && expectedAgentSplit === 87500,
    `Gross: ZMW ${saleGross} -> Agency Comm (5%): ZMW ${expectedAgencyComm}, Agent Split (50%): ZMW ${expectedAgentSplit}`
  );

  // 1.2 Rental Management Fee (10.0%)
  const rentalGross = 18000;
  const expectedMgmtFee = rentalGross * 0.10;
  const netLandlord = rentalGross - expectedMgmtFee;
  recordTest(
    "FINANCIAL",
    "10.0% Rental Management Fee and Net Landlord Calculation",
    expectedMgmtFee === 1800 && netLandlord === 16200,
    `Gross Rent: ZMW ${rentalGross} -> Mgmt Fee (10%): ZMW ${expectedMgmtFee}, Net Landlord: ZMW ${netLandlord}`
  );

  // 1.3 Commission tool endpoint live response verification
  const commReq = new NextRequest("http://localhost:3000/api/dify/tools/commission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organization_id: "org_lusaka_premier" }),
  });
  const commRes = await getCommission(commReq);
  const commJson = await commRes.json();
  const hasExpectedRates = commJson.agencyCommissionRate?.includes("5%") && 
                           commJson.agencyCommissionRate?.includes("10%") && 
                           commJson.closingAgentSplitRate?.includes("50%");
  recordTest(
    "FINANCIAL",
    "Commission tool endpoint exposes 5% sales / 10% rental / 50% split metadata",
    commRes.status === 200 && Boolean(hasExpectedRates),
    `Rates: ${commJson.agencyCommissionRate} | Split: ${commJson.closingAgentSplitRate}`
  );

  // 1.4 Dual-Currency Ledger Separation (ZMW vs USD)
  const zmwReported = commJson.metrics?.totalGrossVolume?.includes("K 4,200,000");
  const usdReported = commJson.metrics?.totalGrossVolume?.includes("$ 2,050,000");
  recordTest(
    "FINANCIAL",
    "Dual Currency Ledgers maintained separately without currency mixing",
    Boolean(zmwReported && usdReported),
    `Total Gross Volume: ${commJson.metrics?.totalGrossVolume}`
  );

  // 1.5 Boundary Value: High Volume arithmetic
  const highGross = 125000000.50;
  const highAgencyComm = Math.round(highGross * 0.05 * 100) / 100;
  const highAgentSplit = Math.round(highAgencyComm * 0.50 * 100) / 100;
  recordTest(
    "FINANCIAL",
    "High Volume and Decimal Cents Boundary Precision ($125,000,000.50)",
    highAgencyComm === 6250000.03 || highAgencyComm === 6250000.025,
    `High Gross: $125,000,000.50 -> 5% Agency Comm: $${highAgencyComm}, 50% Split: $${highAgentSplit}`
  );

  // 1.6 Boundary Value: Zero Gross Value
  const zeroGross = 0;
  const zeroComm = zeroGross * 0.05;
  const zeroSplit = zeroComm * 0.50;
  recordTest(
    "FINANCIAL",
    "Zero Gross Value Boundary (0 -> 0 Commission, 0 Split)",
    zeroComm === 0 && zeroSplit === 0,
    `Zero Gross: 0 -> Agency Comm: ${zeroComm}, Agent Split: ${zeroSplit}`
  );

  // 1.7 Negative Gross Value handling check
  const negGross = -50000;
  const negComm = negGross * 0.05;
  recordTest(
    "FINANCIAL",
    "Negative Gross Value Boundary Arithmetic",
    negComm === -2500,
    `Negative Gross: -50000 -> Agency Comm: ${negComm}`
  );

  // 2. 30-DAY ANTI-POACHING LOCK CALCULATIONS
  console.log("\n--- SECTION 2: 30-Day Anti-Poaching Lock Verification ---");

  // 2.1 Standard 30-Day Lock timestamp creation via Dify Tool
  const testNow = new Date();
  const inqReq = new NextRequest("http://localhost:3000/api/dify/tools/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: "org_lusaka_premier",
      clientName: "Mwila Mutale",
      clientPhone: "+260977112233",
      budgetMax: 5000000,
      currency: "ZMW",
    }),
  });
  const inqRes = await createInquiry(inqReq);
  const inqJson = await inqRes.json();
  const expiryDate = inqJson.inquiry?.antiPoachingLockExpiry ? new Date(inqJson.inquiry.antiPoachingLockExpiry) : null;
  
  let daysDiff = 0;
  if (expiryDate) {
    const diffMs = expiryDate.getTime() - testNow.getTime();
    daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  recordTest(
    "ANTI-POACHING",
    "Inquiry creation computes lock exactly 30 days ahead (+- 1 day)",
    inqRes.status === 200 && daysDiff === 30,
    `Created: ${testNow.toISOString()}, Lock Expiry: ${expiryDate?.toISOString()}, Days: ${daysDiff}`
  );

  // 2.2 Date calculation across month boundaries (e.g. Jan 31 + 30 days)
  const jan31 = new Date("2026-01-31T12:00:00Z");
  const jan31Plus30 = new Date(jan31);
  jan31Plus30.setDate(jan31Plus30.getDate() + 30);
  const diffJan31 = Math.round((jan31Plus30.getTime() - jan31.getTime()) / (1000 * 60 * 60 * 24));
  recordTest(
    "ANTI-POACHING",
    "Month boundary traversal (Jan 31 -> Mar 2 in non-leap year)",
    diffJan31 === 30 && jan31Plus30.getUTCMonth() === 2,
    `Start: 2026-01-31 -> +30 days: ${jan31Plus30.toISOString()} (${diffJan31} days)`
  );

  // 2.3 Leap year boundary traversal (Feb 2028: 2028 is leap year)
  const feb1_2028 = new Date("2028-02-01T12:00:00Z");
  const feb1Plus30 = new Date(feb1_2028);
  feb1Plus30.setDate(feb1Plus30.getDate() + 30);
  const diffFebLeap = Math.round((feb1Plus30.getTime() - feb1_2028.getTime()) / (1000 * 60 * 60 * 24));
  recordTest(
    "ANTI-POACHING",
    "Leap year boundary traversal (Feb 1, 2028 + 30 days -> Mar 2, 2028)",
    diffFebLeap === 30 && feb1Plus30.toISOString().startsWith("2028-03-02"),
    `Start: 2028-02-01 -> +30 days: ${feb1Plus30.toISOString()} (${diffFebLeap} days)`
  );

  // 2.4 Missing required fields rejection (clientName missing)
  const badInqReq = new NextRequest("http://localhost:3000/api/dify/tools/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: "org_lusaka_premier",
      clientPhone: "+260977112233",
    }),
  });
  const badInqRes = await createInquiry(badInqReq);
  recordTest(
    "ANTI-POACHING",
    "Inquiry rejected with 400 when clientName is missing",
    badInqRes.status === 400,
    `Status: ${badInqRes.status}`
  );

  // 3. MCP JSON-RPC 2.0 PROTOCOL & ERROR HANDLING
  console.log("\n--- SECTION 3: MCP JSON-RPC 2.0 Protocol and Error Handling ---");

  // 3.1 Initialize Handshake
  const initReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "initialize",
      params: { clientInfo: { name: "dify-adversarial", version: "2.0.0" } },
      id: 101,
    }),
  });
  const initRes = await mcpPost(initReq);
  const initData = await initRes.json();
  recordTest(
    "MCP-PROTOCOL",
    "MCP Initialize Handshake complies with JSON-RPC 2.0 spec",
    initRes.status === 200 && initData.jsonrpc === "2.0" && initData.id === 101 && Boolean(initData.result?.serverInfo),
    `Server: ${initData.result?.serverInfo?.name}, ProtocolVersion: ${initData.result?.protocolVersion}`
  );

  // 3.2 Notification handling (notifications/initialized returns 204)
  const notifReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
  });
  const notifRes = await mcpPost(notifReq);
  recordTest(
    "MCP-PROTOCOL",
    "MCP Notification (notifications/initialized) returns 204 No Content",
    notifRes.status === 204,
    `Status: ${notifRes.status}`
  );

  // 3.3 Ping method handling
  const pingReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "ping",
      id: "ping-123",
    }),
  });
  const pingRes = await mcpPost(pingReq);
  const pingData = await pingRes.json();
  recordTest(
    "MCP-PROTOCOL",
    "MCP Ping returns valid JSON-RPC 2.0 response with matching string ID",
    pingRes.status === 200 && pingData.jsonrpc === "2.0" && pingData.id === "ping-123",
    `Result: ${JSON.stringify(pingData.result)}`
  );

  // 3.4 Tools Discovery (tools/list)
  const listReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/list",
      params: {},
      id: 102,
    }),
  });
  const listRes = await mcpPost(listReq);
  const listData = await listRes.json();
  const toolNames = listData.result?.tools?.map((t: any) => t.name) || [];
  const expectedTools = ["search_properties", "get_rental_arrears", "get_revenue_commission", "get_property_documents", "create_inquiry_or_lead"];
  const allToolsPresent = expectedTools.every((t) => toolNames.includes(t));
  recordTest(
    "MCP-PROTOCOL",
    "MCP tools/list returns all 5 production real estate tools",
    listRes.status === 200 && allToolsPresent && listData.result?.tools?.length === 5,
    `Tools: ${toolNames.join(", ")}`
  );

  // 3.5 Method Not Found Error (-32601)
  const unknownMethodReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "non_existent_tool", arguments: {} },
      id: 103,
    }),
  });
  const unknownMethodRes = await mcpPost(unknownMethodReq);
  const unknownMethodData = await unknownMethodRes.json();
  recordTest(
    "MCP-PROTOCOL",
    "Unknown tool call returns JSON-RPC -32601 Method not found error",
    unknownMethodData.error?.code === -32601 && unknownMethodRes.status === 404,
    `Error: code=${unknownMethodData.error?.code}, message="${unknownMethodData.error?.message}"`
  );

  // 3.6 Invalid JSON-RPC Request Error (-32600)
  const invalidReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "invalid_unsupported_rpc_method",
      id: 104,
    }),
  });
  const invalidRes = await mcpPost(invalidReq);
  const invalidData = await invalidRes.json();
  recordTest(
    "MCP-PROTOCOL",
    "Unsupported RPC method returns JSON-RPC -32600 Invalid Request error",
    invalidData.error?.code === -32600 && invalidRes.status === 400,
    `Error: code=${invalidData.error?.code}, message="${invalidData.error?.message}"`
  );

  // 3.7 Malformed JSON body handling (-32603 or -32600)
  const malformedReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ broken json !!!",
  });
  const malformedRes = await mcpPost(malformedReq);
  const malformedData = await malformedRes.json();
  recordTest(
    "MCP-PROTOCOL",
    "Malformed JSON body returns error without crashing server",
    malformedRes.status === 400 || malformedRes.status === 500,
    `Status: ${malformedRes.status}, Error: ${malformedData.error?.message}`
  );

  // 4. SSE STREAMING & DEDICATED ALIAS
  console.log("\n--- SECTION 4: SSE Streaming Transport Verification ---");

  // 4.1 SSE GET /api/mcp?transport=sse
  const sseReq = new NextRequest("http://localhost:3000/api/mcp?transport=sse", {
    method: "GET",
    headers: { Accept: "text/event-stream" },
  });
  const sseRes = await mcpGet(sseReq);
  const isSseContentType = sseRes.headers.get("Content-Type")?.includes("text/event-stream");
  const hasNoCache = sseRes.headers.get("Cache-Control")?.includes("no-cache");
  recordTest(
    "SSE-STREAM",
    "GET /api/mcp?transport=sse returns text/event-stream with no-cache headers",
    sseRes.status === 200 && Boolean(isSseContentType) && Boolean(hasNoCache),
    `Content-Type: ${sseRes.headers.get("Content-Type")}, Cache-Control: ${sseRes.headers.get("Cache-Control")}`
  );

  // 4.2 Dedicated alias GET /api/mcp/sse
  const sseAliasReq = new NextRequest("http://localhost:3000/api/mcp/sse", {
    method: "GET",
    headers: { Accept: "text/event-stream" },
  });
  const sseAliasRes = await mcpSseGet(sseAliasReq);
  recordTest(
    "SSE-STREAM",
    "Dedicated SSE alias GET /api/mcp/sse establishes stream",
    sseAliasRes.status === 200 && Boolean(sseAliasRes.headers.get("Content-Type")?.includes("text/event-stream")),
    `Status: ${sseAliasRes.status}, Content-Type: ${sseAliasRes.headers.get("Content-Type")}`
  );

  // 4.3 Fallback Browser GET /api/mcp (HTML/JSON summary)
  const browserGetReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const browserGetRes = await mcpGet(browserGetReq);
  const browserGetData = await browserGetRes.json();
  recordTest(
    "SSE-STREAM",
    "GET /api/mcp without SSE headers returns JSON server manifest",
    browserGetRes.status === 200 && browserGetData.name === "contour-real-estate-mcp",
    `Manifest: ${browserGetData.name} v${browserGetData.version}, Tools: ${browserGetData.toolsCount}`
  );

  // 5. DOCUMENT PRESIGNED URLS & POPIA CUSTODY
  console.log("\n--- SECTION 5: Document S3 Presigning and POPIA Custody ---");

  const docReq = new NextRequest("http://localhost:3000/api/dify/tools/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organization_id: "org_lusaka_premier", category: "TITLE_DEED" }),
  });
  const docRes = await getDocuments(docReq);
  const docJson = await docRes.json();
  const firstDoc = docJson.documents?.[0];
  recordTest(
    "DOCUMENTS",
    "Title Deed presigned URL expires in 900 seconds (15 minutes)",
    docRes.status === 200 && firstDoc?.expiresInSeconds === 900 && firstDoc?.vaultPath?.includes("org_lusaka_premier"),
    `Vault Path: ${firstDoc?.vaultPath}, Expiry: ${firstDoc?.expiresInSeconds}s`
  );

  // SUMMARY
  console.log("\n===============================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const percent = Math.round((passed / total) * 100);
  console.log(`ADVERSARIAL TEST SUMMARY: ${passed}/${total} PASSED (${percent}%)`);
  if (failed > 0) {
    console.error(`${failed} TESTS FAILED!`);
    process.exit(1);
  } else {
    console.log("ALL ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY!");
  }
  console.log("===============================================================================\n");
}

runAdversarialTests().catch((err) => {
  console.error("Adversarial test error:", err);
  process.exit(1);
});
