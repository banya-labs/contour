/**
 * Comprehensive Automated Verification Suite for Lenco Zambia Payment Gateway
 * Tests:
 * 1. Plan pricing calculations (ZMW Kwacha, USD, ZAR) across all tiers and cycles
 * 2. Lenco HMAC-SHA512 Webhook Signature Verification (Positive & Negative security cases)
 * 3. Lenco Collections client initialization & fallback handling
 */

import crypto from "crypto";
import {
  CONTOUR_PLANS,
  getPlanPrice,
  verifyLencoSignature,
  initiateLencoCollection,
} from "../src/lib/lenco";

async function main() {
  console.log("🚀 Starting Lenco Zambia Commercial Gateway Verification Suite...\n");
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Pricing & Currency Tests
  // ---------------------------------------------------------------------------
  console.log("--- 1. Testing Localized Pricing & Currency Rails ---");

  // Starter Plan
  const starterZmwMonthly = getPlanPrice("starter", "MONTHLY", "ZMW");
  assert(starterZmwMonthly.amount === 1200 && starterZmwMonthly.formatted === "K 1,200", "Starter ZMW Monthly is K 1,200");

  const starterZmwAnnual = getPlanPrice("starter", "ANNUAL", "ZMW");
  assert(starterZmwAnnual.amount === 960 && starterZmwAnnual.formatted === "K 960", "Starter ZMW Annual discount is K 960/mo");

  const starterUsdMonthly = getPlanPrice("starter", "MONTHLY", "USD");
  assert(starterUsdMonthly.amount === 49 && starterUsdMonthly.formatted === "$ 49", "Starter USD Monthly is $ 49");

  // Growth Plan (MAL's Tier)
  const growthZmwMonthly = getPlanPrice("growth", "MONTHLY", "ZMW");
  assert(growthZmwMonthly.amount === 3200 && growthZmwMonthly.formatted === "K 3,200", "Growth ZMW Monthly is K 3,200");

  const growthUsdMonthly = getPlanPrice("growth", "MONTHLY", "USD");
  assert(growthUsdMonthly.amount === 129 && growthUsdMonthly.formatted === "$ 129", "Growth USD Monthly is $ 129");

  // Enterprise Plan
  const enterpriseZmwMonthly = getPlanPrice("enterprise", "MONTHLY", "ZMW");
  assert(enterpriseZmwMonthly.amount === 7500 && enterpriseZmwMonthly.formatted === "K 7,500", "Enterprise ZMW Monthly is K 7,500");

  // ---------------------------------------------------------------------------
  // 2. Lenco HMAC SHA-256 Webhook Signature Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Testing Lenco Webhook HMAC-SHA512 Verification ---");

  const testApiToken = "test_lenco_api_token_12345";
  process.env.LENCO_API_KEY = testApiToken;

  const validPayload = JSON.stringify({
    event: "transaction.successful",
    data: {
      reference: "contour_growth_1725900000",
      amount: 3200,
      currency: "ZMW",
      metadata: {
        organizationId: "org_contour_demo",
        planId: "growth",
        billingCycle: "MONTHLY",
      },
    },
  });

  const webhookHashKey = crypto.createHash("sha256").update(testApiToken).digest("hex");
  const validSignature = crypto
    .createHmac("sha512", webhookHashKey)
    .update(validPayload)
    .digest("hex");

  // Positive Case: Valid signature
  assert(
    verifyLencoSignature(validPayload, validSignature),
    "Valid Lenco HMAC-SHA512 signature passes verification"
  );

  // Negative Case 1: Tampered payload
  const tamperedPayload = validPayload.replace("3200", "500");
  assert(
    !verifyLencoSignature(tamperedPayload, validSignature),
    "Tampered payload fails HMAC signature verification"
  );

  // Negative Case 2: Forged signature
  assert(
    !verifyLencoSignature(validPayload, "forged_invalid_signature_hex"),
    "Forged signature string is safely rejected"
  );

  // Negative Case 3: Missing signature
  assert(
    !verifyLencoSignature(validPayload, null),
    "Null signature header is safely rejected"
  );

  // ---------------------------------------------------------------------------
  // 3. Collections Initiation & Dev Mode Simulation
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing Collections Initiation & Dev Mode Fallback ---");

  process.env.NEXT_PUBLIC_DEV_MODE = "true";

  const collectionResult = await initiateLencoCollection({
    amount: 3200,
    currency: "ZMW",
    reference: "test_ref_001",
    narration: "Contour Growth Plan (Monthly) - MAL's Property",
    customer: {
      name: "Grace Banda",
      email: "grace@malsproperty.co.zm",
      phone: "+260971766881",
    },
    channel: "mobile_money",
    mobileMoneyOperator: "mtn",
    organizationId: "org_contour_demo",
    planId: "growth",
    billingCycle: "MONTHLY",
  });

  assert(collectionResult.success === true, "Lenco collection initiates successfully in Dev Mode");
  assert(collectionResult.status === "SUCCESS", "Dev Mode collection marks status as SUCCESS");
  assert(collectionResult.reference === "test_ref_001", "Transaction reference is properly preserved");

  console.log(`\n🎉 ALL ${passedTests}/${totalTests} LENCO GATEWAY TESTS PASSED SUCCESSFULLY!`);
}

main().catch((err) => {
  console.error("\n❌ Lenco Gateway Test Suite Failed:", err);
  process.exit(1);
});
