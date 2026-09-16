import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runTest() {
  console.log("🧪 Testing Subscription & Billing Navigation...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("console", msg => console.log(`  [BROWSER] ${msg.type()}: ${msg.text()}`));
  page.on("pageerror", err => console.log(`  [PAGE ERROR] ${err.message}`));

  try {
    // 1. Visit /dashboard and check sidebar Finance section
    console.log("1. Visiting /dashboard to inspect workspace sidebar...");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    // Verify Subscription & Billing link exists and remains visible
    const billingLink = page.locator('aside a[href="/dashboard/billing"]');
    const isVisible = await billingLink.isVisible();
    console.log(`- Sidebar "Subscription & Billing" link visible: ${isVisible}`);
    if (!isVisible) {
      throw new Error('Sidebar "Subscription & Billing" link is not visible!');
    }

    // 2. Click the link to ensure direct navigation
    console.log("2. Clicking Subscription & Billing link in sidebar...");
    await billingLink.click();
    await page.waitForURL("**/dashboard/billing", { timeout: 10000 });
    console.log(`- Current URL after click: ${page.url()}`);

    // Verify billing page content
    const heading = await page.locator("h1").first().textContent();
    console.log(`- Billing page heading: "${heading?.trim()}"`);

    // 3. Visit /dashboard/settings and verify tabs
    console.log("3. Visiting /dashboard/settings to verify tabs...");
    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);

    // Ensure Plans & Subscription is NOT in the tabs
    const tabTexts = await page.locator("button, [role='tab']").allInnerTexts();
    const hasBillingTab = tabTexts.some(t => t.includes("Plans & Subscription") || t.includes("Billing"));
    console.log(`- "Plans & Subscription" tab present in settings: ${hasBillingTab} (expected false)`);
    if (hasBillingTab) {
      throw new Error('Unexpected "Plans & Subscription" tab found in settings!');
    }

    // 4. Test redirect from /dashboard/settings?tab=billing
    console.log("4. Testing redirect from /dashboard/settings?tab=billing...");
    await page.goto(`${BASE_URL}/dashboard/settings?tab=billing`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForURL("**/dashboard/billing", { timeout: 10000 });
    console.log(`- Successfully redirected to: ${page.url()}`);

    console.log("\n✅ ALL BILLING NAVIGATION TESTS PASSED!");
  } catch (error: any) {
    console.error("\n❌ TEST FAILED:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
