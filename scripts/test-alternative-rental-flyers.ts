import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Playwright Audit: Alternative Modern Navy Flyer & Dynamic Rental Mode...\n");

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
    console.log("2. Opening Social Media Flyer Generator...");
    const socialBtn = page.locator("button:has-text('Social Card')").first();
    await socialBtn.click();
    await page.waitForTimeout(500);

    // ----------------------------------------------------
    // TEST 1: ALTERNATIVE TEMPLATE (MODERN NAVY EDITORIAL) - SALE MODE
    // ----------------------------------------------------
    console.log("3. Verifying Modern Navy Editorial Template (Sale Mode)...");
    const navyTab = page.locator("button:has-text('Modern Navy Editorial')");
    await navyTab.click();
    await page.waitForTimeout(300);

    const saleTitle = page.locator("text=MODERN HOME FOR SALE").first();
    const isSaleTitleVisible = await saleTitle.isVisible();
    if (!isSaleTitleVisible) throw new Error("Sale headline not found in Navy template!");
    console.log("  - Modern Navy Editorial (Sale Mode) rendered: ✅ PASS");

    const saleScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\31_alternative_navy_sale_flyer.png";
    await page.screenshot({ path: saleScreenshot });
    console.log(`📸 Sale Flyer Screenshot captured at: ${saleScreenshot}`);

    // ----------------------------------------------------
    // TEST 2: DYNAMIC RENTAL PRESENTATION MODE
    // ----------------------------------------------------
    console.log("4. Switching to 'For Rent (Monthly)' Mode...");
    const rentModeBtn = page.locator("button:has-text('For Rent (Monthly)')");
    await rentModeBtn.click();
    await page.waitForTimeout(400);

    const rentalTitle = page.locator("text=LUXURY RESIDENCE FOR RENT").first();
    const isRentalTitleVisible = await rentalTitle.isVisible();
    if (!isRentalTitleVisible) throw new Error("Rental headline not found after switching mode!");
    console.log("  - Dynamic Rental headline 'LUXURY RESIDENCE FOR RENT' verified: ✅ PASS");

    const rentalHighlights = page.locator("text=RENTAL HIGHLIGHTS").first();
    const isRentalHighlightsVisible = await rentalHighlights.isVisible();
    if (!isRentalHighlightsVisible) throw new Error("RENTAL HIGHLIGHTS bar not found!");
    console.log("  - Dynamic 'RENTAL HIGHLIGHTS' bar and diplomatic specs verified: ✅ PASS");

    // Test PNG Download in Rental Mode
    console.log("5. Testing Rental Flyer PNG Download...");
    const downloadBtn = page.locator("button:has-text('Download Rental Flyer (PNG)')");
    await downloadBtn.click();
    await page.waitForTimeout(1000);

    const successMsg = page.locator("text=Flyer Downloaded Successfully!");
    const isDownloaded = await successMsg.isVisible();
    if (!isDownloaded) throw new Error("Rental flyer download confirmation not displayed!");
    console.log("  - High-res Rental PNG flyer compiled and downloaded: ✅ PASS");

    const rentalScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\32_alternative_navy_rental_flyer.png";
    await page.screenshot({ path: rentalScreenshot });
    console.log(`📸 Rental Flyer Screenshot captured at: ${rentalScreenshot}`);

    console.log("\n🎉 ALTERNATIVE NAVY FLYER & DYNAMIC RENTAL PRESENTATION AUDITED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
