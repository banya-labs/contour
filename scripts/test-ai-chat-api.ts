process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { POST as chatPost } from "../src/app/api/ai/chat/route";

async function testAiChatRoute() {
  console.log("===============================================================================");
  console.log("💬 CONTOUR REAL ESTATE OS: /api/ai/chat ROUTE NORMALIZATION TEST");
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

  // 1. Test payload using { query: "..." } format (from GenUI modal)
  console.log("--- 1. Testing { query } payload format ---");
  const queryReq = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "What is our total earned 5% agency commission revenue?",
      context: { organizationId: "org_demo_contour" },
    }),
  });
  const queryRes = await chatPost(queryReq);
  const queryData = await queryRes.json();
  assert(
    queryRes.status === 200 && queryData.answer?.includes("Agency Revenue & Commission Intelligence"),
    "Accepts { query } payload format and returns grounded commission intelligence",
    `Status: ${queryRes.status}, Answer length: ${queryData.answer?.length} chars`
  );

  // 2. Test payload using { message: "..." } format
  console.log("\n--- 2. Testing { message } payload format ---");
  const messageReq = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Find 4-bed houses in Kabulonga",
    }),
  });
  const messageRes = await chatPost(messageReq);
  const messageData = await messageRes.json();
  assert(
    messageRes.status === 200 && (messageData.matchedProperties?.length > 0 || messageData.answer?.includes("Kabulonga")),
    "Accepts { message } payload format and returns property search intelligence",
    `Status: ${messageRes.status}, Matched properties: ${messageData.matchedProperties?.length || 0}`
  );

  // 3. Test rental arrears query
  console.log("\n--- 3. Testing rental arrears query ---");
  const arrearsReq = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Check rent arrears across Woodlands",
    }),
  });
  const arrearsRes = await chatPost(arrearsReq);
  const arrearsData = await arrearsRes.json();
  assert(
    arrearsRes.status === 200 && arrearsData.answer?.includes("Rental Arrears Status"),
    "Processes rental arrears query successfully",
    `Status: ${arrearsRes.status}`
  );

  // 4. Test document custody query
  console.log("\n--- 4. Testing document custody query ---");
  const docReq = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Fetch Title Deeds from MinIO S3 Vault",
    }),
  });
  const docRes = await chatPost(docReq);
  const docData = await docRes.json();
  assert(
    docRes.status === 200 && docData.answer?.includes("MinIO S3 Document Custody Status"),
    "Processes document vault query successfully",
    `Status: ${docRes.status}`
  );

  // 5. Test validation failure on empty payload
  console.log("\n--- 5. Testing validation error on missing/empty payload ---");
  const emptyReq = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const emptyRes = await chatPost(emptyReq);
  const emptyData = await emptyRes.json();
  assert(
    emptyRes.status === 400 && emptyData.error === "Message or query is required.",
    "Rejects empty body with HTTP 400 and clear error message",
    `Status: ${emptyRes.status}, Error: ${emptyData.error}`
  );

  // 6. Test validation failure on whitespace-only payload
  console.log("\n--- 6. Testing validation error on whitespace payload ---");
  const whitespaceReq = new NextRequest("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "   " }),
  });
  const whitespaceRes = await chatPost(whitespaceReq);
  const whitespaceData = await whitespaceRes.json();
  assert(
    whitespaceRes.status === 400 && whitespaceData.error === "Message or query is required.",
    "Rejects whitespace query with HTTP 400 and clear error message",
    `Status: ${whitespaceRes.status}, Error: ${whitespaceData.error}`
  );

  console.log("\n===============================================================================");
  console.log(`🎯 /api/ai/chat TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passed === total) {
    console.log("🚀 ALL /api/ai/chat ROUTE NORMALIZATION TESTS PASSED PERFECTLY!");
  } else {
    process.exit(1);
  }
}

testAiChatRoute().catch((e) => {
  console.error("Fatal chat route test error:", e);
  process.exit(1);
});
