process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { POST as mcpPost, GET as mcpGet } from "../src/app/api/mcp/route";

async function testMcpServer() {
  console.log("===============================================================================");
  console.log("🔌 CONTOUR REAL ESTATE OS: DIFY MCP SERVER PROTOCOL TEST");
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

  // 1. Test SSE GET Endpoint
  console.log("--- 1. Testing SSE Endpoint (GET /api/mcp) ---");
  const sseReq = new NextRequest("http://localhost:3000/api/mcp?transport=sse", {
    method: "GET",
    headers: { Accept: "text/event-stream" },
  });
  const sseRes = await mcpGet(sseReq);
  assert(
    sseRes.status === 200 && Boolean(sseRes.headers.get("Content-Type")?.includes("text/event-stream")),
    "SSE Stream establishes connection and returns text/event-stream",
    `Content-Type: ${sseRes.headers.get("Content-Type")}`
  );

  // 2. Test MCP Initialize
  console.log("\n--- 2. Testing MCP Initialize Handshake ---");
  const initReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "initialize",
      params: { clientInfo: { name: "dify-mcp-client", version: "1.0.0" } },
      id: 1,
    }),
  });
  const initRes = await mcpPost(initReq);
  const initData = await initRes.json();
  assert(
    initRes.status === 200 && initData.result?.serverInfo?.name === "contour-real-estate-mcp",
    "MCP initialize handshake returns server capabilities and info",
    `Server: ${initData.result?.serverInfo?.name} v${initData.result?.serverInfo?.version}`
  );

  // 3. Test MCP Tools Discovery
  console.log("\n--- 3. Testing MCP tools/list ---");
  const listReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/list",
      params: {},
      id: 2,
    }),
  });
  const listRes = await mcpPost(listReq);
  const listData = await listRes.json();
  assert(
    listRes.status === 200 && listData.result?.tools?.length === 5,
    "MCP tools/list returns all 5 production tools",
    `Tools: ${listData.result?.tools?.map((t: any) => t.name).join(", ")}`
  );

  // 4. Test MCP tools/call for Property Search
  console.log("\n--- 4. Testing MCP tools/call (search_properties) ---");
  const callReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "search_properties",
        arguments: {
          organization_id: "org_lusaka_premier",
          suburb: "Kabulonga",
        },
      },
      id: 3,
    }),
  });
  const callRes = await mcpPost(callReq);
  const callData = await callRes.json();
  const content = JSON.parse(callData.result?.content?.[0]?.text || "{}");
  assert(
    callRes.status === 200 && content.tenant === "org_lusaka_premier",
    "MCP tool execution returns scoped Neon PostgreSQL data",
    `Found ${content.count} listings for tenant: ${content.tenant}`
  );

  // 5. Test MCP tools/call for MinIO S3 Documents
  console.log("\n--- 5. Testing MCP tools/call (get_property_documents) ---");
  const docCallReq = new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "get_property_documents",
        arguments: {
          organization_id: "org_lusaka_premier",
        },
      },
      id: 4,
    }),
  });
  const docCallRes = await mcpPost(docCallReq);
  const docCallData = await docCallRes.json();
  const docContent = JSON.parse(docCallData.result?.content?.[0]?.text || "{}");
  assert(
    docCallRes.status === 200 && docContent.documents?.[0]?.vaultPath?.includes("org_lusaka_premier"),
    "MCP tool execution generates tenant-isolated MinIO S3 presigned URLs",
    `Vault: ${docContent.documents?.[0]?.vaultPath}`
  );

  console.log("\n===============================================================================");
  console.log(`🎯 MCP TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passed === total) {
    console.log("🚀 CONTOUR MCP SERVER READY FOR DIFY CONNECTION!");
  } else {
    process.exit(1);
  }
}

testMcpServer().catch((e) => {
  console.error("Fatal MCP test error:", e);
  process.exit(1);
});
