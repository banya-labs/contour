import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting GenUI Split-Pane Modal Playwright Test Suite...");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  try {
    // 1. Navigate to Home Landing Page
    console.log("1. Navigating to Landing Page (/)...");
    await page.goto("http://localhost:3005/", { waitUntil: "networkidle" });

    // 2. Click on the floating bottom bar
    console.log("2. Clicking floating AI search bar...");
    const aiCapsule = page.locator("button[title*='Open Contour AI Copilot']");
    await aiCapsule.click();
    await page.waitForTimeout(600);

    // Verify split pane modal opened
    const modalHeading = page.locator("h3:has-text('CONTOUR AI')");
    const isVisible = await modalHeading.isVisible();
    if (!isVisible) throw new Error("GenUI Split-Pane Modal did not open!");
    console.log("  - Split-Pane GenUI Modal opened: ✅ PASS");

    // 3. Test sending prompt to trigger GenUI component
    console.log("3. Sending query: 'What is our total earned 5% agency commission revenue?'...");
    const input = page.locator("input[placeholder*='Type your question']");
    await input.fill("What is our total earned 5% agency commission revenue?");
    await page.locator("form button[type='submit']").click();

    // Wait for GenUI component (Commission Breakdown) to render on the right pane
    await page.waitForSelector("text=Agency Revenue & Commission Breakdown", { timeout: 8000 });
    console.log("  - Right Pane GenUI Component rendered live: ✅ PASS");

    // 4. Capture screenshot matching reference image layout
    const screenshotPath = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\17_genui_split_pane_modal.png";
    await page.screenshot({ path: screenshotPath });
    console.log(`  - Screenshot captured at: ${screenshotPath}`);

    console.log("\n🎉 GENUI SPLIT-PANE MODAL TESTED & PASSED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
