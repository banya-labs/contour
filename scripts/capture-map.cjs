const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\af476441-9eb3-4b94-9847-1079252a0ad0\\screenshots";

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log("Launching headless browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  console.log("Navigating to http://127.0.0.1:3005...");
  await page.goto("http://127.0.0.1:3005", { waitUntil: "domcontentloaded", timeout: 120000 });

  console.log("Scrolling to interactive map...");
  const mapSection = page.locator("section:has-text('Interactive Lusaka Agency Map')");
  await mapSection.scrollIntoViewIfNeeded();

  console.log("Waiting for Leaflet canvas and tiles...");
  await page.waitForSelector(".leaflet-container", { timeout: 20000 });
  await page.waitForTimeout(4000);

  const mapPath = path.join(ARTIFACT_DIR, "20_leaflet_interactive_map.png");
  await page.screenshot({ path: mapPath });
  console.log("Map screenshot saved to: " + mapPath);

  // Click on Kabulonga filter to show suburb reactivity
  const kabulongaBtn = page.locator("button:has-text('Kabulonga')").first();
  if (await kabulongaBtn.isVisible()) {
    await kabulongaBtn.click();
    await page.waitForTimeout(1500);
    const kabulongaPath = path.join(ARTIFACT_DIR, "22_leaflet_kabulonga_filtered.png");
    await page.screenshot({ path: kabulongaPath });
    console.log("Kabulonga filtered screenshot saved to: " + kabulongaPath);
  }

  // Click WhatsApp Flyer CTA
  const flyerBtn = page.locator("button:has-text('WhatsApp Flyer')").first();
  if (await flyerBtn.isVisible()) {
    await flyerBtn.click();
    await page.waitForTimeout(1000);
    const modalPath = path.join(ARTIFACT_DIR, "21_leaflet_map_cta_modal.png");
    await page.screenshot({ path: modalPath });
    console.log("CTA modal screenshot saved to: " + modalPath);
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
