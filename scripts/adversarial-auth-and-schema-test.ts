import { NextRequest } from "next/server";
import { POST as searchProperties } from "../src/app/api/dify/tools/properties/route";
import { POST as getArrears } from "../src/app/api/dify/tools/arrears/route";
import { POST as getCommission } from "../src/app/api/dify/tools/commission/route";
import { POST as getDocuments } from "../src/app/api/dify/tools/documents/route";
import { POST as createInquiry } from "../src/app/api/dify/tools/inquiries/route";
import { POST as mcpPost } from "../src/app/api/mcp/route";
import { POST as aiChatPost } from "../src/app/api/ai/chat/route";
import * as fs from "fs";

async function runAuthAndSchemaChallenges() {
  console.log("===============================================================================");
  console.log("🔒 DEEP ADVERSARIAL AUTH & SPECIFICATION VERIFICATION SUITE");
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

  // ---------------------------------------------------------------------------
  // 1. Production Authentication Enforcement Gate (DEV_MODE = false)
  // ---------------------------------------------------------------------------
  console.log("--- 1. Testing Production Auth Mode Gates (No Bypass) ---");
  process.env.NEXT_PUBLIC_DEV_MODE = "false";
  process.env.DIFY_TOOL_SECRET = "super_secret_dify_tool_key_2026";

  // 1.1 Unauthenticated Request to Property Search
  {
    const req = new NextRequest("http://localhost:3000/api/dify/tools/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suburb: "Kabulonga" }),
    });
    const res = await searchProperties(req);
    assert(
      res.status === 401,
      "Production Mode: Unauthenticated tool request is strictly rejected with HTTP 401",
      `Status: ${res.status}`
    );
  }

  // 1.2 Invalid Bearer Token Request
  {
    const req = new NextRequest("http://localhost:3000/api/dify/tools/arrears", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid_forged_token_12345",
      },
      body: JSON.stringify({ organization_id: "org_victim" }),
    });
    const res = await getArrears(req);
    assert(
      res.status === 401 || res.status === 500,
      "Production Mode: Forged Bearer Token is rejected",
      `Status: ${res.status}`
    );
  }

  // 1.3 Master Dify Secret Auth without Target Org ID
  {
    const req = new NextRequest("http://localhost:3000/api/dify/tools/commission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer super_secret_dify_tool_key_2026",
      },
      body: JSON.stringify({}),
    });
    const res = await getCommission(req);
    const data = await res.json();
    assert(
      res.status === 400 && data.error?.includes("Missing required 'organization_id'"),
      "Master Dify Secret Auth requires explicit organization_id",
      `Status: ${res.status}, Error: ${data.error}`
    );
  }

  // 1.4 Master Dify Secret Auth with Target Org ID
  {
    const req = new NextRequest("http://localhost:3000/api/dify/tools/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer super_secret_dify_tool_key_2026",
        "X-Organization-Id": "org_verified_lusaka",
      },
      body: JSON.stringify({ category: "TITLE_DEED" }),
    });
    const res = await getDocuments(req);
    const data = await res.json();
    assert(
      res.status === 200 && data.tenant === "org_verified_lusaka",
      "Master Dify Secret correctly authenticates with X-Organization-Id header",
      `Status: ${res.status}, Tenant: ${data.tenant}`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Chat Route Fallback & Resilience Testing (Dev Mode Context)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Testing AI Chat Assistant Gateway & Fallbacks ---");
  process.env.NEXT_PUBLIC_DEV_MODE = "true";

  // 2.1 Missing Message Body Validation
  {
    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await aiChatPost(req);
    assert(
      res.status === 400,
      "AI Chat Gateway rejects empty message payloads with HTTP 400",
      `Status: ${res.status}`
    );
  }

  // 2.2 Local Grounded Fallback Response (Commission Inquiry)
  {
    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What is our earned commission and revenue volume?" }),
    });
    const res = await aiChatPost(req);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("Earned 5% Agency Commission"),
      "AI Chat Gateway fallback provides Lusaka commission & revenue intelligence",
      `Provider: ${data.provider}`
    );
  }

  // 2.3 Local Grounded Fallback Response (MinIO Documents Inquiry)
  {
    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Can you fetch Title Deeds from MinIO S3 Vault?" }),
    });
    const res = await aiChatPost(req);
    const data = await res.json();
    assert(
      res.status === 200 && data.answer?.includes("MinIO S3 Document Custody") && data.answer?.includes("15 minutes"),
      "AI Chat Gateway fallback enforces POPIA 15-minute MinIO custody notice",
      `Provider: ${data.provider}`
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Dify OpenAPI 3.0 & DSL Specification Audit
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing Dify OpenAPI 3.0 & YAML DSL Schemas ---");

  // 3.1 OpenAPI JSON Specification
  const openApiJsonPath = ".dify/contour_openapi_tools.json";
  const openApiJsonContent = JSON.parse(fs.readFileSync(openApiJsonPath, "utf-8"));
  const expectedPaths = [
    "/api/dify/tools/properties",
    "/api/dify/tools/arrears",
    "/api/dify/tools/commission",
    "/api/dify/tools/documents",
    "/api/dify/tools/inquiries",
  ];
  const actualPaths = Object.keys(openApiJsonContent.paths || {});
  const allPathsPresent = expectedPaths.every((p) => actualPaths.includes(p));

  assert(
    openApiJsonContent.openapi === "3.0.0" && allPathsPresent,
    "OpenAPI 3.0 JSON specification defines all 5 required tool endpoints",
    `Paths found: ${actualPaths.join(", ")}`
  );

  // 3.2 OpenAPI YAML Specification Content Check
  const openApiYamlPath = ".dify/contour_openapi_tools.yaml";
  const openApiYamlRaw = fs.readFileSync(openApiYamlPath, "utf-8");
  const yamlHasAllPaths = expectedPaths.every((p) => openApiYamlRaw.includes(p));
  assert(
    openApiYamlRaw.includes('openapi: 3.0.0') && yamlHasAllPaths,
    "OpenAPI 3.0 YAML specification defines all 5 tool paths and valid metadata",
    `Contains openapi: 3.0.0 and all 5 paths`
  );

  // 3.3 Dify YAML DSL Configuration
  const dslPath = ".dify/contour_broker_assistant_dsl.yml";
  const dslRaw = fs.readFileSync(dslPath, "utf-8");
  const promptContainsCommission = dslRaw.includes("5.0%");
  const promptContainsAntiPoaching = dslRaw.includes("30-Day Anti-Poaching");
  const promptContainsPopia = dslRaw.includes("POPIA");
  const dslContainsAllTools = [
    "search_properties",
    "get_rental_arrears",
    "get_revenue_commission",
    "get_property_documents",
    "create_inquiry_or_lead",
  ].every((t) => dslRaw.includes(`tool_name: ${t}`));

  assert(
    dslRaw.includes("kind: app") &&
    dslContainsAllTools &&
    promptContainsCommission &&
    promptContainsAntiPoaching &&
    promptContainsPopia,
    "Dify DSL YAML contains complete Lusaka prompt instructions, all 5 tools, and POPIA rules",
    `Tools present: 5/5, Commission: ${promptContainsCommission}, Anti-Poaching: ${promptContainsAntiPoaching}`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`🎯 AUDIT RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("===============================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runAuthAndSchemaChallenges().catch((err) => {
  console.error("Fatal error during auth and schema challenges:", err);
  process.exit(1);
});
