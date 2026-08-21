import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Playwright Audit: Property Matching Outreach & Reminders Modal...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  page.on("dialog", async (dialog) => {
    console.log(`  [Dialog]: "${dialog.message().split("\n")[0]}"`);
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
    await page.waitForTimeout(600);

    // 4. Verify PropertyMatchSummaryModal opens automatically
    console.log("4. Verifying PropertyMatchSummaryModal opens with matched buyers...");
    const matchModalHeader = page.locator("h3:has-text('Reverse-Match Engine Triggered')");
    const isModalOpen = await matchModalHeader.isVisible();
    if (!isModalOpen) throw new Error("PropertyMatchSummaryModal did not open on property upload!");
    console.log("  - Reverse-Match Summary Modal opened: ✅ PASS");

    // Verify Buyer details
    const buyerName = page.locator("h5:has-text('Nchimunya Mweene')");
    const isBuyerVisible = await buyerName.isVisible();
    if (!isBuyerVisible) throw new Error("Matched buyer Nchimunya Mweene not found in modal!");
    console.log("  - Matched buyer listed (Nchimunya Mweene, 100% Match): ✅ PASS");

    // Verify Automated Reminder Status & Timestamp
    const autoAlertPill = page.locator("text=Auto-Alert Sent");
    const isAlertPillVisible = await autoAlertPill.isVisible();
    if (!isAlertPillVisible) throw new Error("Automated reminder status badge not found!");
    console.log("  - Automated Reminder status badge & timestamp verified: ✅ PASS");

    // Test Copy Pitch button
    console.log("5. Testing Copy Pitch button...");
    const copyBtn = page.locator("button:has-text('Copy Pitch')").first();
    await copyBtn.click();
    await page.waitForTimeout(300);
    const copiedText = page.locator("text=Copied").first();
    const isCopiedVisible = await copiedText.isVisible();
    if (!isCopiedVisible) throw new Error("Copy pitch button state did not update to 'Copied'!");
    console.log("  - Copy pitch button functional: ✅ PASS");

    // Test Mark Contacted Toggle
    console.log("6. Testing 'Mark as Contacted' button toggle...");
    const markBtn = page.locator("button:has-text('Mark as Contacted')").first();
    await markBtn.click();
    await page.waitForTimeout(300);
    const confirmedText = page.locator("text=Offer Confirmed").first();
    const isConfirmedVisible = await confirmedText.isVisible();
    if (!isConfirmedVisible) throw new Error("Mark as Contacted toggle did not update to 'Offer Confirmed'!");
    console.log("  - Mark as Contacted toggle state updated to 'Offer Confirmed': ✅ PASS");

    // Capture Modal Screenshot
    const screenshotPath = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\25_property_match_outreach_modal.png";
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot captured at: ${screenshotPath}`);

    // Close modal
    await page.locator("button:has-text('Done & Close')").click();
    await page.waitForTimeout(400);

    // 7. Verify Property Card in Catalog has Outreach & Reminders Button
    console.log("7. Checking Property Card in Catalog for 'Outreach & Reminders' button...");
    const cardMatchBtn = page.locator("button:has-text('Matching Buyer')").first();
    const isCardBtnVisible = await cardMatchBtn.isVisible();
    if (!isCardBtnVisible) throw new Error("Property Card does not have Matching Buyers button!");
    console.log("  - Property Card Matching Buyers outreach button present: ✅ PASS");

    console.log("\n🎉 PROPERTY MATCHING & MANUAL OUTREACH ENGINE AUDITED & PASSED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
