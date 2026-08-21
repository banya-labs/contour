import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Playwright Audit: Authentic Property Description & Zero-Fabrication Flyer Copy...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  page.on("dialog", async (dialog) => {
    console.log(`  [Dialog]: "${dialog.message().split("\n")[0]}"`);
    await dialog.accept();
  });

  try {
    console.log("1. Navigating to Properties Catalog...");
    await page.goto("http://localhost:3005/dashboard/properties", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Open Social Card Generator
    console.log("2. Opening Social Media Flyer Generator for Kabulonga 4-Bed Residence...");
    const socialBtn = page.locator("button:has-text('Social Card')").first();
    await socialBtn.click();
    await page.waitForTimeout(500);

    // ----------------------------------------------------
    // TEST 1: VERIFY AUTHENTIC DESCRIPTION ON FLYER
    // ----------------------------------------------------
    console.log("3. Verifying Flyer Copy matches verified property description...");
    const authenticExcerpt = page.locator("text=Immaculate standalone family residence set on a lush 2,400 m² plot").first();
    const isAuthenticVisible = await authenticExcerpt.isVisible();
    if (!isAuthenticVisible) throw new Error("Authentic property description not found on flyer!");
    console.log("  - Authentic property description rendered on flyer preview: ✅ PASS");

    // ----------------------------------------------------
    // TEST 2: VERIFY AUTHENTIC PROPERTY FEATURES BULLETS
    // ----------------------------------------------------
    console.log("4. Verifying authentic property feature bullets...");
    const solarBullet = page.locator("text=Solar Inverter 10kVA").first();
    const isSolarVisible = await solarBullet.isVisible();
    if (!isSolarVisible) throw new Error("Solar Inverter 10kVA bullet not found!");
    console.log("  - Real property feature bullet 'Solar Inverter 10kVA' verified: ✅ PASS");

    // ----------------------------------------------------
    // TEST 3: TEST LIVE EDITING OF FLYER COPY TEXTAREA
    // ----------------------------------------------------
    console.log("5. Testing live editing of flyer copy in textarea...");
    const copyTextarea = page.locator("textarea[placeholder='Listing narrative...']");
    await copyTextarea.fill("Exclusive Kabulonga residence with sparkling swimming pool, lush 2,400 m² gardens, and full solar borehole off-grid independence.");
    await page.waitForTimeout(400);

    const editedPreview = page.locator("text=Exclusive Kabulonga residence with sparkling swimming pool").first();
    const isEditedVisible = await editedPreview.isVisible();
    if (!isEditedVisible) throw new Error("Live edited flyer copy not reflected on flyer preview!");
    console.log("  - Live edited copy synced directly to flyer preview: ✅ PASS");

    // Capture screenshot of flyer modal with authentic description
    const flyerScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\34_authentic_property_description_flyer.png";
    await page.screenshot({ path: flyerScreenshot });
    console.log(`📸 Screenshot captured at: ${flyerScreenshot}`);

    console.log("\n🎉 AUTHENTIC PROPERTY DESCRIPTION & ZERO-FABRICATION FLYER COPY AUDITED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
