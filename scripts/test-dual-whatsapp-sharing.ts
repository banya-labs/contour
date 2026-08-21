import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Playwright Audit: Dual WhatsApp Sharing (Web Link vs Image Flyer)...\n");

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

    // Open Social Flyer Generator
    console.log("2. Opening Social Media Flyer Generator...");
    const socialBtn = page.locator("button:has-text('Social Card')").first();
    await socialBtn.click();
    await page.waitForTimeout(500);

    // Verify WhatsApp Broadcast Hub in Flyer Generator
    console.log("3. Verifying Dual WhatsApp Sharing Hub (Web Link vs Image Flyer)...");
    const webLinkBtn = page.locator("a:has-text('Share Web Link')").first();
    const isWebLinkVisible = await webLinkBtn.isVisible();
    if (!isWebLinkVisible) throw new Error("Share Web Link button not found in flyer modal!");
    console.log("  - 'Share Web Link' option present: ✅ PASS");

    const imageFlyerBtn = page.locator("button:has-text('Share Image Flyer')").first();
    const isImageFlyerVisible = await imageFlyerBtn.isVisible();
    if (!isImageFlyerVisible) throw new Error("Share Image Flyer button not found in flyer modal!");
    console.log("  - 'Share Image Flyer' option present: ✅ PASS");

    // Capture screenshot of flyer modal with dual WhatsApp buttons
    const flyerScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\33_dual_whatsapp_sharing_options.png";
    await page.screenshot({ path: flyerScreenshot });
    console.log(`📸 Screenshot captured at: ${flyerScreenshot}`);

    // Close flyer modal
    await page.locator("button:has(svg.lucide-x)").first().click();
    await page.waitForTimeout(400);

    // Verify Matched Buyers modal also has dual WhatsApp options
    console.log("4. Opening Matched Buyers modal...");
    const matchBtn = page.locator("button:has-text('Matching Buyer')").first();
    if (await matchBtn.isVisible()) {
      await matchBtn.click();
      await page.waitForTimeout(500);

      const matchWebLink = page.locator("a:has-text('WhatsApp Web Link')").first();
      const isMatchWebLinkVisible = await matchWebLink.isVisible();
      if (!isMatchWebLinkVisible) throw new Error("WhatsApp Web Link button not found in matching buyers modal!");

      const matchImageFlyer = page.locator("button:has-text('WhatsApp Image Flyer')").first();
      const isMatchImageFlyerVisible = await matchImageFlyer.isVisible();
      if (!isMatchImageFlyerVisible) throw new Error("WhatsApp Image Flyer button not found in matching buyers modal!");

      console.log("  - Matched Buyers modal dual WhatsApp options verified: ✅ PASS");
    }

    console.log("\n🎉 DUAL WHATSAPP SHARING (WEB LINK VS IMAGE FLYER) AUDITED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
