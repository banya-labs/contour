process.env.NEXT_PUBLIC_DEV_MODE = "true";

import { NextRequest } from "next/server";
import { POST as mcpPost, GET as mcpGet } from "../src/app/api/mcp/route";
import { checkRateLimit } from "../src/lib/rate-limiter";

async function testRateLimiter() {
  console.log("===============================================================================");
  console.log("🛡️ CONTOUR REAL ESTATE OS: MCP REDIS/IN-MEMORY RATE LIMITER TEST");
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

  // 1. Direct rate limiter core unit test
  console.log("--- 1. Testing Core Rate Limiter Module (rate-limiter.ts) ---");
  const testKey = `test_limit_${Date.now()}`;
  const res1 = await checkRateLimit(testKey, 2, 60);
  assert(res1.allowed === true && res1.remaining === 1, "First request allowed with remaining = 1");

  const res2 = await checkRateLimit(testKey, 2, 60);
  assert(res2.allowed === true && res2.remaining === 0, "Second request allowed with remaining = 0");

  const res3 = await checkRateLimit(testKey, 2, 60);
  assert(res3.allowed === false && res3.remaining === 0 && res3.resetSeconds > 0, "Third request blocked (429 condition)");

  // 2. Test GET Rate Limiting via Route (IP level)
  console.log("\n--- 2. Testing Route GET IP Rate Limiter ---");
  const getIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
  let getBlocked = false;
  for (let i = 0; i < 35; i++) {
    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "GET",
      headers: { "x-forwarded-for": getIp },
    });
    const res = await mcpGet(req);
    if (res.status === 429) {
      getBlocked = true;
      const data = await res.json();
      assert(
        res.headers.get("Retry-After") !== null && data.error.includes("rate limit exceeded"),
        `GET IP Rate Limit enforced on request #${i + 1}`,
        `Status: ${res.status}, Retry-After: ${res.headers.get("Retry-After")}s`
      );
      break;
    }
  }
  if (!getBlocked) {
    assert(false, "GET IP Rate Limiter did not trigger after 35 requests");
  }

  // 3. Test POST Tool Call API Key Rate Limiting (Varying IP per request so IP limit isn't hit first)
  console.log("\n--- 3. Testing POST Tool Call API Key Rate Limiter ---");
  const testApiKey = `Bearer test_key_secret_${Date.now()}`;
  let postKeyBlocked = false;

  for (let i = 0; i < 65; i++) {
    // Vary IP so IP limit (60) is not reached before Key limit (60)
    const varIp = `10.0.1.${i + 1}`;
    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": testApiKey,
        "x-forwarded-for": varIp,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "search_properties",
          arguments: { organization_id: `org_test_rate_${i}` },
        },
        id: i,
      }),
    });

    const res = await mcpPost(req);
    if (res.status === 429) {
      postKeyBlocked = true;
      const data = await res.json();
      assert(
        data.error?.code === -32029 && data.error?.message.includes("API Key"),
        `POST API Key Rate Limit enforced on request #${i + 1}`,
        `JSON-RPC Error Code: ${data.error?.code}, Message: ${data.error?.message}`
      );
      break;
    }
  }

  if (!postKeyBlocked) {
    assert(false, "POST API Key Rate Limiter did not trigger after 65 requests");
  }

  // 4. Test POST Tool Call Org Rate Limiting (Varying IP and Key per request to test Org aggregate limit)
  console.log("\n--- 4. Testing POST Tool Call Tenant Org Rate Limiter ---");
  const testOrgId = `org_rate_limit_test_${Date.now()}`;
  let postOrgBlocked = false;

  for (let i = 0; i < 125; i++) {
    const varIp = `172.16.${Math.floor(i / 50)}.${(i % 50) + 1}`;
    const varKey = `Bearer test_key_${Math.floor(i / 40)}_${Date.now()}`;
    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": varKey,
        "x-forwarded-for": varIp,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_revenue_commission",
          arguments: { organization_id: testOrgId },
        },
        id: i,
      }),
    });

    const res = await mcpPost(req);
    if (res.status === 429) {
      postOrgBlocked = true;
      const data = await res.json();
      assert(
        data.error?.code === -32029 && data.error?.message.includes("Tenant Organization"),
        `POST Org Rate Limit enforced on request #${i + 1}`,
        `JSON-RPC Error Code: ${data.error?.code}, Message: ${data.error?.message}`
      );
      break;
    }
  }

  if (!postOrgBlocked) {
    assert(false, "POST Org Rate Limiter did not trigger after 125 requests");
  }

  console.log("\n===============================================================================");
  console.log(`🎯 RATE LIMITER TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passed === total) {
    console.log("🚀 CONTOUR MCP RATE LIMITER IS FULLY FUNCTIONAL AND SECURED!");
  } else {
    process.exit(1);
  }
}

testRateLimiter().catch((e) => {
  console.error("Fatal Rate Limiter test error:", e);
  process.exit(1);
});
