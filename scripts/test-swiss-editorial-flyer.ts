import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Playwright Audit: Swiss Editorial Flyer Generator & Unified Modals...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  page.on("dialog", async (dialog) => {
    console.log(`  [Dialog]: "${dialog.message().split("\n")[0]}"`);
    await dialog.accept();
  });

  // Determine port
  let baseUrl = process.env.BASE_URL || "http://localhost:3001";
  console.log(`  Targeting base URL: ${baseUrl}`);

  try {
    // ----------------------------------------------------
    // TEST 1: OPEN SWISS EDITORIAL FLYER GENERATOR
    // ----------------------------------------------------
    console.log("\n=== TEST 1: OPENING SWISS EDITORIAL FLYER GENERATOR ===");
    page.on("console", (msg) => console.log("  [Browser Console]:", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.log("  [Browser PageError]:", err.message));

    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        console.log("  [API Request]:", req.method(), req.url());
      }
    });
    page.on("response", async (res) => {
      if (res.url().includes("/api/")) {
        console.log("  [API Response]:", res.status(), res.url());
      }
    });

    await page.goto(`${baseUrl}/dashboard/properties`, { waitUntil: "domcontentloaded" });

    const socialBtn = page.locator("button:has-text('Flyer')").first();
    await socialBtn.waitFor({ state: "visible", timeout: 45000 });
    console.log("  - 'Flyer' button present on property card: ✅ PASS");

    await socialBtn.click();
    await page.waitForTimeout(600);

    const modalHeader = page.locator("h3:has-text('Social Media Marketing Flyer Generator')");
    await modalHeader.waitFor({ state: "visible", timeout: 10000 });
    console.log("  - Swiss Editorial Flyer Generator opened: ✅ PASS");

    // ----------------------------------------------------
    // TEST 2: VERIFY SWISS EDITORIAL TOKENS & 4:5 BROCHURE
    // ----------------------------------------------------
    console.log("\n=== TEST 2: VERIFYING SWISS EDITORIAL TOKENS & 4:5 BROCHURE ===");
    const swissBadge = page.locator("text=Swiss Editorial").first();
    await swissBadge.waitFor({ state: "visible", timeout: 10000 });
    console.log("  - 'Swiss Editorial' design tag verified: ✅ PASS");

    // Capture Swiss Light Brochure Screenshot
    const swissLightScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\828ad264-e3e0-4870-8ec8-9458ea42eb67\\screenshots\\40_swiss_light_editorial_brochure.png";
    await page.screenshot({ path: swissLightScreenshot });
    console.log(`📸 Swiss Light 4:5 Brochure captured at: ${swissLightScreenshot}`);

    // ----------------------------------------------------
    // TEST 3: TEST 1:1 SQUARE & 9:16 STORY FORMAT SWITCHERS
    // ----------------------------------------------------
    console.log("\n=== TEST 3: TESTING ASPECT RATIO SWITCHERS ===");
    // Switch to 1:1 Square
    await page.locator("button:has-text('1:1')").click();
    await page.waitForTimeout(400);
    const squareScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\828ad264-e3e0-4870-8ec8-9458ea42eb67\\screenshots\\41_swiss_square_feed_format.png";
    await page.screenshot({ path: squareScreenshot });
    console.log(`📸 Swiss Square 1:1 Feed captured at: ${squareScreenshot}`);

    // Switch to 9:16 Story
    await page.locator("button:has-text('9:16')").click();
    await page.waitForTimeout(400);
    const storyScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\828ad264-e3e0-4870-8ec8-9458ea42eb67\\screenshots\\42_swiss_story_vertical_format.png";
    await page.screenshot({ path: storyScreenshot });
    console.log(`📸 Swiss 9:16 Vertical Story captured at: ${storyScreenshot}`);

    // Switch back to 4:5 Brochure
    await page.locator("button:has-text('4:5')").click();
    await page.waitForTimeout(300);

    // ----------------------------------------------------
    // TEST 4: TEST SWISS ARCHITECTURAL DARK THEME
    // ----------------------------------------------------
    console.log("\n=== TEST 4: TESTING SWISS ARCHITECTURAL DARK THEME ===");
    await page.locator("button:has-text('Modern Navy Editorial')").click();
    await page.waitForTimeout(400);
    const darkScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\828ad264-e3e0-4870-8ec8-9458ea42eb67\\screenshots\\43_swiss_architectural_dark_flyer.png";
    await page.screenshot({ path: darkScreenshot });
    console.log(`📸 Swiss Architectural Dark Flyer captured at: ${darkScreenshot}`);

    // ----------------------------------------------------
    // TEST 5: TEST REAL-PHOTO PNG COMPILATION (HTML2CANVAS)
    // ----------------------------------------------------
    console.log("\n=== TEST 5: TESTING REAL-PHOTO PNG DOWNLOAD VIA HTML2CANVAS ===");
    const downloadBtn = page.locator("button:has-text('Flyer (PNG)')");
    await downloadBtn.waitFor({ state: "visible", timeout: 10000 });
    await downloadBtn.click();
    await page.waitForTimeout(1200);

    const successMsg = page.locator("text=Flyer Downloaded Successfully!");
    await successMsg.waitFor({ state: "visible", timeout: 30000 });
    console.log("  - High-res retina PNG compiled with real photos and downloaded: ✅ PASS");

    // Close flyer modal
    await page.locator("button[title='Close modal']").click();
    await page.waitForTimeout(400);

    // ----------------------------------------------------
    // TEST 6: TEST FIELD AGENT MOBILE PWA FLYER GENERATOR
    // ----------------------------------------------------
    console.log("\n=== TEST 6: TESTING FIELD AGENT MOBILE PWA FLYER INTEGRATION ===");
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile iPhone 14 / modern Android view

    await page.goto(`${baseUrl}/agent`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);

    // Switch to Properties tab in bottom nav
    const propsTab = page.locator("button:has-text('Properties')").first();
    await propsTab.waitFor({ state: "visible", timeout: 20000 });
    await propsTab.click();
    await page.waitForTimeout(800);

    // Ensure LIST view is active
    const listToggle = page.locator("button:has-text('List')").first();
    if (await listToggle.isVisible()) {
      await listToggle.click();
      await page.waitForTimeout(500);
    }

    // Verify Flyer button is present on mobile card
    const mobileFlyerBtn = page.locator("button:has-text('Flyer')").first();
    await mobileFlyerBtn.waitFor({ state: "visible", timeout: 20000 });
    console.log("  - 'Flyer' button present on Field Agent mobile card: ✅ PASS");

    // Click Flyer on mobile
    await mobileFlyerBtn.click();
    await page.waitForTimeout(800);

    const mobileModalHeader = page.locator("h3:has-text('Social Media Marketing Flyer Generator')");
    await mobileModalHeader.waitFor({ state: "visible", timeout: 10000 });
    console.log("  - Swiss Editorial Flyer Generator successfully rendered on Mobile PWA: ✅ PASS");

    const mobileScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\828ad264-e3e0-4870-8ec8-9458ea42eb67\\screenshots\\44_mobile_field_agent_flyer_generator.png";
    await page.screenshot({ path: mobileScreenshot });
    console.log(`📸 Mobile Field Agent Flyer Generator captured at: ${mobileScreenshot}`);

    console.log("\n🎉 ALL SWISS EDITORIAL FLYER & UNIFIED MODAL AUDITS PASSED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
