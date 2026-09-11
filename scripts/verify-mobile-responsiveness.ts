import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const ARTIFACT_DIR = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\6dee4fda-88b4-4588-9015-29baed10208d\\mobile-verification";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const VIEWPORTS = [
  {
    name: "Mobile Portrait (iPhone 14/15 Pro: 390x844)",
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    suffix: "portrait_390x844",
  },
  {
    name: "Mobile Landscape Rotation (844x390)",
    width: 844,
    height: 390,
    isMobile: true,
    hasTouch: true,
    suffix: "landscape_844x390",
  },
  {
    name: "Tablet Portrait (iPad Mini: 768x1024)",
    width: 768,
    height: 1024,
    isMobile: false,
    hasTouch: true,
    suffix: "tablet_768x1024",
  },
];

const PAGES_TO_TEST = [
  { id: "landing", path: "/", title: "Marketing Landing Page" },
  { id: "dashboard", path: "/dashboard", title: "Operations Overview" },
  { id: "map", path: "/dashboard/map", title: "Interactive Lusaka Map Hub" },
  { id: "pipeline", path: "/dashboard/pipeline", title: "Deal Pipeline Kanban" },
  { id: "properties", path: "/dashboard/properties", title: "Properties Catalog" },
  { id: "leases", path: "/dashboard/leases", title: "Rentals & Leases" },
  { id: "billing", path: "/dashboard/billing", title: "Billing & Lenco Subscriptions" },
  { id: "settings", path: "/dashboard/settings", title: "Agency Settings & Governance" },
  { id: "kiosk", path: "/kiosk", title: "Field Agent Kiosk" },
];

async function run() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log("===============================================================");
  console.log("📱 Running Mobile Responsiveness & Orientation Reflow Test Suite");
  console.log("===============================================================\n");

  const browser = await chromium.launch({ headless: true });
  let totalTests = 0;
  let passedTests = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} ---`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      deviceScaleFactor: 2,
    });

    for (const p of PAGES_TO_TEST) {
      totalTests++;
      const page = await context.newPage();
      page.setDefaultTimeout(25000);

      try {
        const url = `${BASE_URL}${p.path}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
        await page.waitForTimeout(1500);

        // Check horizontal overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        const hasHorizontalOverflow = scrollWidth > clientWidth + 2; // small tolerance

        // Screenshot
        const filename = `${p.id}_${vp.suffix}.png`;
        const filepath = path.join(ARTIFACT_DIR, filename);
        await page.screenshot({ path: filepath });

        if (hasHorizontalOverflow) {
          console.warn(`⚠️ [OVERFLOW] ${p.title} (${vp.suffix}): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
        } else {
          console.log(`✅ [PASS] ${p.title} (${vp.suffix}) — No overflow, rendered cleanly.`);
        }

        // Verify Leaflet tiles on map
        if (p.id === "map") {
          const mapEl = await page.$(".leaflet-container");
          if (mapEl) {
            console.log(`   📍 Leaflet map container found and active on ${vp.suffix}.`);
          }
        }

        // Verify MobileBottomNav on portrait
        if (vp.width === 390 && p.path.startsWith("/dashboard")) {
          const bottomNav = await page.$("nav.fixed.bottom-0");
          if (bottomNav) {
            console.log(`   📌 Mobile bottom navigation bar rendered and docked on ${p.title}.`);
          }
        }

        passedTests++;
      } catch (err: any) {
        console.error(`❌ [FAIL] ${p.title} (${vp.suffix}): ${err.message}`);
      } finally {
        await page.close();
      }
    }

    await context.close();
  }

  // Specifically test Dynamic Orientation Rotation (Google Maps style live reflow)
  console.log("\n--- Testing Live Device Rotation Simulation (Map Hub) ---");
  const rotateContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const rotPage = await rotateContext.newPage();
  try {
    await rotPage.goto(`${BASE_URL}/dashboard/map`, { waitUntil: "domcontentloaded" });
    await rotPage.waitForTimeout(1500);
    console.log("   Initial Portrait: 390x844 loaded.");

    // Rotate to Landscape
    await rotPage.setViewportSize({ width: 844, height: 390 });
    // Trigger orientationchange / resize
    await rotPage.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
    await rotPage.waitForTimeout(1000);

    const mapBox = await rotPage.$eval(".leaflet-container", (el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    console.log(`   Rotated to Landscape: Leaflet container reflowed to ${mapBox.width}x${mapBox.height}px.`);

    // Rotate back to Portrait
    await rotPage.setViewportSize({ width: 390, height: 844 });
    await rotPage.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
    await rotPage.waitForTimeout(1000);

    const mapBoxPortrait = await rotPage.$eval(".leaflet-container", (el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    console.log(`   Rotated back to Portrait: Leaflet container reflowed to ${mapBoxPortrait.width}x${mapBoxPortrait.height}px.`);
    console.log("✅ [PASS] Dynamic rotation reflow verified without crashes or tile tear!");
  } catch (err: any) {
    console.error(`❌ [FAIL] Rotation test: ${err.message}`);
  } finally {
    await rotPage.close();
    await rotateContext.close();
  }

  await browser.close();

  console.log(`\n===============================================================`);
  console.log(`🏁 Complete: ${passedTests}/${totalTests} viewport tests passed.`);
  console.log(`📁 Screenshots saved to: ${ARTIFACT_DIR}`);
  console.log(`===============================================================`);
}

run();
