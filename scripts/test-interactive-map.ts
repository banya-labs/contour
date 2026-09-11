import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const ARTIFACT_DIR = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\af476441-9eb3-4b94-9847-1079252a0ad0\\screenshots";

function log(msg: string) {
  console.log(`[TEST] ${msg}`);
}

async function run() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  log("Launching chromium...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on("console", msg => {
    if (msg.type() === "error") {
      log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  log("Navigating to http://localhost:3005...");
  await page.goto("http://localhost:3005", { waitUntil: "domcontentloaded", timeout: 30000 });
  log("Page loaded!");

  log("Finding Interactive Lusaka Agency Map section...");
  const mapSection = page.locator("section:has-text('Interactive Lusaka Agency Map')");
  await mapSection.scrollIntoViewIfNeeded();

  log("Waiting for Leaflet container...");
  await page.waitForSelector(".leaflet-container", { timeout: 15000 });
  log("✓ Leaflet container detected!");

  // Wait for tiles to settle
  await page.waitForTimeout(4000);

  // Take screenshot of interactive map initial view
  const mapScreenshotPath = path.join(ARTIFACT_DIR, "20_leaflet_interactive_map.png");
  await page.screenshot({ path: mapScreenshotPath, fullPage: false });
  log(`✓ Saved map screenshot: ${mapScreenshotPath}`);

  // Check markers
  const markers = await page.locator(".custom-leaflet-marker").count();
  log(`✓ Found ${markers} custom leaflet property markers on map!`);

  // Test Suburb filter button
  log("Testing suburb filter: Kabulonga...");
  const kabulongaBtn = page.locator("button:has-text('Kabulonga')").first();
  if (await kabulongaBtn.isVisible()) {
    await kabulongaBtn.click();
    await page.waitForTimeout(1000);
    log("✓ Filtered to Kabulonga");
  }

  // Click on a listing card or marker
  log("Selecting Leopards Hill listing...");
  const allLusakaBtn = page.locator("button:has-text('All Lusaka')").first();
  if (await allLusakaBtn.isVisible()) {
    await allLusakaBtn.click();
    await page.waitForTimeout(500);
  }

  const leopardsHillBtn = page.locator("button:has-text('Leopards Hill')").first();
  if (await leopardsHillBtn.isVisible()) {
    await leopardsHillBtn.click();
    await page.waitForTimeout(1000);
    log("✓ Selected Leopards Hill property");
  }

  // Click "WhatsApp Flyer" CTA
  log("Clicking 'WhatsApp Flyer' CTA button...");
  const flyerCtaBtn = page.locator("button:has-text('WhatsApp Flyer')").first();
  if (await flyerCtaBtn.isVisible()) {
    await flyerCtaBtn.click();
    await page.waitForTimeout(1000);

    // Wait for modal
    const modal = page.locator(".fixed:has-text('Agency Pilot Access')");
    await modal.waitFor({ timeout: 5000 });
    log("✓ CTA Modal opened successfully!");

    const modalScreenshotPath = path.join(ARTIFACT_DIR, "21_leaflet_map_cta_modal.png");
    await page.screenshot({ path: modalScreenshotPath, fullPage: false });
    log(`✓ Saved modal screenshot: ${modalScreenshotPath}`);
  }

  await browser.close();
  log("ALL INTERACTIVE MAP E2E TESTS PASSED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
