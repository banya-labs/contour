process.env.NEXT_PUBLIC_DEV_MODE = "false";

import { NextRequest } from "next/server";
import { POST as mcpPost } from "../src/app/api/mcp/route";
import { POST as searchProperties } from "../src/app/api/dify/tools/properties/route";
import { POST as getDocuments } from "../src/app/api/dify/tools/documents/route";

async function runAuthAdversarialTests() {
  console.log("===============================================================================");
  console.log("🔒 RUNNING PRODUCTION AUTH ADVERSARIAL TESTS (DEV_MODE=false)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string, detail: string) {
    total++;
    if (cond) {
      console.log(`[PASS] ${name}`);
      console.log(`       └─ ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      console.error(`       └─ ${detail}`);
    }
  }

  // 1. MCP tool execution without Authorization header when DEV_MODE=false
  const unauthReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "search_properties",
        arguments: { organization_id: "org_unauthorized" },
      },
      id: 201,
    }),
  });
  const unauthRes = await mcpPost(unauthReq);
  const unauthData = await unauthRes.json();
  assert(
    unauthRes.status === 401 && unauthData.error?.code === -32001,
    "MCP tools/call without Bearer token is rejected with HTTP 401 & JSON-RPC code -32001 in production",
    `Status: ${unauthRes.status}, Error Code: ${unauthData.error?.code}, Message: "${unauthData.error?.message}"`
  );

  // 2. Dify endpoint without Authorization header when DEV_MODE=false
  const difyUnauthReq = new NextRequest("http://localhost:3000/api/dify/tools/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organization_id: "org_unauthorized" }),
  });
  const difyUnauthRes = await searchProperties(difyUnauthReq);
  const difyUnauthData = await difyUnauthRes.json();
  assert(
    difyUnauthRes.status === 401,
    "Dify tool endpoint without Bearer token is rejected with HTTP 401 in production",
    `Status: ${difyUnauthRes.status}, Error: "${difyUnauthData.error}"`
  );

  // 3. Master Secret Auth with explicit X-Organization-Id
  process.env.DIFY_TOOL_SECRET = "contour-test-master-secret-123";
  const masterAuthReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer contour-test-master-secret-123",
      "X-Organization-Id": "org_authenticated_master",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "search_properties",
        arguments: {},
      },
      id: 202,
    }),
  });
  const masterAuthRes = await mcpPost(masterAuthReq);
  const masterAuthData = await masterAuthRes.json();
  const content = JSON.parse(masterAuthData.result?.content?.[0]?.text || "{}");
  assert(
    masterAuthRes.status === 200 && content.tenant === "org_authenticated_master",
    "Master Token with X-Organization-Id authenticates and scopes tenant context correctly",
    `Tenant: ${content.tenant}, Count: ${content.count}`
  );

  // 4. Master Secret without Organization ID is rejected
  const badMasterReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer contour-test-master-secret-123",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "search_properties",
        arguments: {},
      },
      id: 203,
    }),
  });
  const badMasterRes = await mcpPost(badMasterReq);
  const badMasterData = await badMasterRes.json();
  assert(
    badMasterRes.status === 401 && badMasterData.error?.code === -32001,
    "Master Token without Organization ID is rejected with 401 / -32001",
    `Status: ${badMasterRes.status}, Error Message: "${badMasterData.error?.message}"`
  );

  console.log("\n===============================================================================");
  console.log(`AUTH TEST SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runAuthAdversarialTests().catch((err) => {
  console.error("Auth test error:", err);
  process.exit(1);
});
