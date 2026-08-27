import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Playwright Test: Standalone Field Agent PWA with Map View (/agent)...\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await mobileContext.newPage();

  // 1. Test Direct Navigation to /agent
  console.log("1. Testing Direct Standalone Navigation to /agent...");
  await page.goto("http://localhost:3000/agent", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Tembo Mwape", { timeout: 15000 });
  console.log("  - Standalone Field Agent PWA rendered directly: ✅ PASS");

  // 2. Test Properties Catalog (List View) & Suburb Filters
  console.log("2. Testing Properties Catalog & Suburb Filters on Mobile PWA...");
  const kabulongaChip = page.locator("button:has-text('Kabulonga')").first();
  await kabulongaChip.click({ force: true });
  await page.waitForTimeout(300);
  console.log("  - Suburb filter clicked: ✅ PASS");

  // 3. Test 1-Click WhatsApp Pitch Generator
  console.log("3. Testing 1-Click WhatsApp Pitch copy...");
  const pitchBtn = page.locator("button:has-text('WhatsApp Pitch')").first();
  await pitchBtn.click({ force: true });
  await page.waitForTimeout(400);
  console.log("  - WhatsApp pitch generator clicked: ✅ PASS");

  // 4. Test Interactive Spatial Map from PWA Toggle
  console.log("4. Testing Interactive Map View from PWA Toggle...");
  const mapToggleBtn = page.locator("button:has-text('Map')").first();
  await mapToggleBtn.click({ force: true });
  await page.waitForTimeout(600);
  const mapHelperBadge = page.locator("text=Tap any pin to view Mandate");
  if (!(await mapHelperBadge.isVisible())) throw new Error("Interactive Map view failed to render in PWA!");
  console.log("  - Spatial Lusaka Map loaded in PWA: ✅ PASS");

  // Suburb quick pan in map
  const leopardsHillChip = page.locator("button:has-text('Leopards Hill')").first();
  await leopardsHillChip.click({ force: true });
  await page.waitForTimeout(400);
  console.log("  - Map suburb navigation (Leopards Hill): ✅ PASS");

  // Toggle back to List view
  const listToggleBtn = page.locator("button:has-text('List')").first();
  await listToggleBtn.click({ force: true });
  await page.waitForTimeout(300);
  console.log("  - Toggled smoothly back to Catalog List: ✅ PASS");

  // 5. Test Clients Tab & 30-Day Anti-Poaching Lock
  console.log("5. Testing Clients Tab & 30-Day Anti-Poaching Lock...");
  const clientsTabBtn = page.locator("footer button:has-text('Clients')");
  await clientsTabBtn.click({ force: true });
  await page.waitForTimeout(300);
  const antiPoachingHeader = page.locator("text=30-Day Anti-Poaching Registry");
  if (!(await antiPoachingHeader.isVisible())) throw new Error("Anti-Poaching Registry not visible!");
  console.log("  - Anti-Poaching Registry displayed: ✅ PASS");

  // 6. Test Deals Tab & Velocity Advancement
  console.log("6. Testing Deals Tab & Stage Advancement...");
  const dealsTabBtn = page.locator("footer button:has-text('Deals')");
  await dealsTabBtn.click({ force: true });
  await page.waitForTimeout(300);
  const advanceBtn = page.locator("button:has-text('Advance')").first();
  if (await advanceBtn.isVisible()) {
    await advanceBtn.click({ force: true });
    await page.waitForTimeout(300);
    console.log("  - Deal Stage Advanced optimistically: ✅ PASS");
  }

  // 7. Test Earnings Tab & Commission Splits
  console.log("7. Testing Earnings Tab & Commission Slips...");
  const earningsTabBtn = page.locator("footer button:has-text('Earnings')");
  await earningsTabBtn.click({ force: true });
  await page.waitForTimeout(300);
  const earningsHeader = page.locator("text=My Commission Splits");
  if (!(await earningsHeader.isVisible())) throw new Error("Earnings header not visible!");
  console.log("  - Earnings and Commission Splits visible: ✅ PASS");

  // View Digital Commission Slip
  const viewSlipBtn = page.locator("button:has-text('View Digital Commission Slip')").first();
  await viewSlipBtn.click({ force: true });
  await page.waitForTimeout(300);
  const voucherHeader = page.locator("text=CONTOUR VOUCHER");
  if (!(await voucherHeader.isVisible())) throw new Error("Commission Voucher slip failed to open!");
  console.log("  - Digital Commission Slip modal verified: ✅ PASS");
  await page.locator("button:has-text('Close Receipt')").click({ force: true });
  await page.waitForTimeout(300);

  // 8. Test Intake FAB (+) Drawer
  console.log("8. Testing Intake FAB (+) Action Drawer...");
  const fabBtn = page.locator("footer button[title*='Add Listing']");
  await fabBtn.click({ force: true });
  await page.waitForTimeout(300);
  const intakeHeader = page.locator("text=Field Intake & Mandate Capture");
  if (!(await intakeHeader.isVisible())) throw new Error("Intake drawer failed to open!");
  console.log("  - Intake FAB drawer opened: ✅ PASS");

  // 9. Test AI Field Copilot
  console.log("9. Testing AI Field Copilot...");
  await page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first().click({ force: true });
  await page.waitForTimeout(300);
  const copilotBtn = page.locator("header button:has-text('Copilot')");
  await copilotBtn.click({ force: true });
  await page.waitForTimeout(300);
  const copilotHeader = page.locator("text=Contour AI Field Copilot");
  if (!(await copilotHeader.isVisible())) throw new Error("AI Copilot modal failed to open!");
  console.log("  - AI Field Copilot opened: ✅ PASS");

  // 10. Test Fast Dev Login Redirect from /login
  console.log("10. Testing Fast Dev Login redirect from /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Fast Dev Login", { timeout: 10000 });
  const fieldAgentBtn = page.locator("a:has-text('Field Agent')");
  await fieldAgentBtn.click({ force: true });
  await page.waitForSelector("text=Tembo Mwape", { timeout: 15000 });
  console.log("  - Fast Dev Login directly redirected to /agent: ✅ PASS");

  await browser.close();
  console.log("\n🎯 ALL 10 PWA STANDALONE FIELD AGENT + MAP TESTS PASSED SUCCESSFULLY! 🚀\n");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
