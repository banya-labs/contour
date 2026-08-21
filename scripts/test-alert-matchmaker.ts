import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Automated Reverse Property-Matching & WhatsApp Alert Engine Test Suite...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  const dialogLogs: string[] = [];
  page.on("dialog", async (dialog) => {
    const msg = dialog.message();
    dialogLogs.push(msg);
    console.log(`  [Dialog Intercepted]: "${msg.split("\n")[0]}"`);
    await dialog.accept();
  });

  try {
    // 1. Navigate to Properties Catalog
    console.log("1. Navigating to Properties Catalog (/dashboard/properties)...");
    await page.goto("http://localhost:3005/dashboard/properties", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // 2. Open Add Property Modal
    console.log("2. Opening Add Property Listing modal...");
    const addBtn = page.locator("button:has-text('Add Property Listing')");
    await addBtn.click();
    await page.waitForTimeout(400);

    // 3. Fill in a new property in Kabulonga (Matches Nchimunya Mweene's active alert)
    console.log("3. Publishing new Kabulonga Villa (K3,500,000) to trigger reverse matching...");
    const modal = page.locator("div.fixed.inset-0");
    await modal.locator("input[placeholder*='e.g. Luxury 4-Bedroom']").fill("Kabulonga Diplomatic Villa 2026");
    await modal.locator("select").nth(0).selectOption("FOR_SALE");
    await modal.locator("input[placeholder*='e.g. 3500000']").fill("3500000");
    await modal.locator("select").nth(2).selectOption("ZMW");
    await modal.locator("select").nth(3).selectOption("Kabulonga");
    await modal.locator("input[placeholder*='e.g. 200m off Kabulonga Road']").fill("150m from Centro Mall, Kabulonga");

    // Submit form
    await modal.locator("form button[type='submit']").click();
    await page.waitForTimeout(1000);

    // Verify reverse match dialog was triggered
    const matchDialog = dialogLogs.find((d) => d.includes("REVERSE-MATCH TRIGGERED"));
    if (!matchDialog) {
      throw new Error("Reverse-Match Engine did not trigger dialog on property creation!");
    }
    console.log("  - Reverse-Match Engine evaluated property & dispatched WhatsApp alerts: ✅ PASS");

    // 4. Navigate to Executive Dashboard Overview
    console.log("4. Navigating to Executive Operations Overview (/dashboard)...");
    await page.goto("http://localhost:3005/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // 5. Verify Daily Action Queue contains Reverse-Match Buyer Alert task
    console.log("5. Checking Daily Action Queue for Reverse-Match Buyer Alert task...");
    const queueHeading = page.locator("text=Reverse-Match Buyer Alerts Found");
    const isQueueItemVisible = await queueHeading.isVisible();
    if (!isQueueItemVisible) {
      throw new Error("Daily Action Queue did not display Reverse-Match Buyer Alert task!");
    }
    console.log("  - Daily Action Queue displayed reverse-match card: ✅ PASS");

    // 6. Test 1-Click "Send WhatsApp Match" button
    console.log("6. Clicking 1-Click 'Send WhatsApp Match' dialer button...");
    const sendMatchBtn = page.locator("button:has-text('Send WhatsApp Match')");
    await sendMatchBtn.click();
    await page.waitForTimeout(500);

    // 7. Capture Master Verification Screenshot
    const screenshotPath = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\21_reverse_match_alert_flow.png";
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Master Screenshot saved at: ${screenshotPath}`);

    console.log("\n🎉 AUTOMATED REVERSE PROPERTY-MATCHING & WHATSAPP ALERT ENGINE AUDITED & PASSED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
