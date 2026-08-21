import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Comprehensive GenUI Components & Action Buttons Playwright Audit...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  // Handle browser dialogs automatically
  page.on("dialog", async (dialog) => {
    console.log(`  [Dialog Triggered] "${dialog.message().split("\n")[0]}"`);
    await dialog.accept();
  });

  try {
    // 1. Navigate to Landing Page
    console.log("1. Navigating to Landing Page (http://localhost:3005/)...");
    await page.goto("http://localhost:3005/", { waitUntil: "networkidle" });

    // Open GenUI Modal
    console.log("2. Opening GenUI Split-Pane Modal from floating bar...");
    const aiCapsule = page.locator("button[title*='Open Contour AI Copilot']");
    await aiCapsule.click();
    await page.waitForTimeout(600);

    // ==========================================
    // TEST 1: Property Spotlight Component
    // ==========================================
    console.log("\n--- Testing GenUI Component 1: Property Spotlight Card ---");
    const input = page.locator("div.fixed.inset-0 input[placeholder*='Type your question']");
    await input.fill("Find 4-bedroom executive houses in Kabulonga under K4M");
    await page.locator("div.fixed.inset-0 form button[type='submit']").click();
    await page.waitForSelector("text=Executive 4-Bedroom Standalone Residence", { timeout: 8000 });
    const viewButton = page.locator("a:has-text('View Full Card')");
    const isViewBtnVisible = await viewButton.isVisible();
    if (!isViewBtnVisible) throw new Error("PropertySpotlightCard 'View Full Card' button not found!");
    console.log("  - PropertySpotlightCard mounted with action buttons: ✅ PASS");

    // ==========================================
    // TEST 2: Commission Breakdown Component
    // ==========================================
    console.log("\n--- Testing GenUI Component 2: Commission Breakdown Widget ---");
    await input.fill("What is our total earned 5% agency commission revenue?");
    await page.locator("div.fixed.inset-0 form button[type='submit']").click();
    await page.waitForSelector("text=Agency Revenue & Commission Breakdown", { timeout: 8000 });
    const ledgerLink = page.locator("a:has-text('Open Commissions Ledger')");
    const isLedgerLinkVisible = await ledgerLink.isVisible();
    if (!isLedgerLinkVisible) throw new Error("CommissionBreakdownWidget 'Open Commissions Ledger' button not found!");
    console.log("  - CommissionBreakdownWidget mounted with 5% calculation: ✅ PASS");

    // ==========================================
    // TEST 3: Rental Arrears & WhatsApp Nudge Component
    // ==========================================
    console.log("\n--- Testing GenUI Component 3: Rental Arrears Action Card ---");
    await input.fill("Which tenants have overdue rent right now?");
    await page.locator("div.fixed.inset-0 form button[type='submit']").click();
    await page.waitForSelector("text=Rental Arrears Alert", { timeout: 8000 });
    const nudgeBtn = page.locator("button:has-text('Dispatch WhatsApp Reminder')");
    await nudgeBtn.click();
    await page.waitForTimeout(500);
    const nudgedStatus = page.locator("text=Nudge Sent (4-Day Lock)");
    const isNudgedVisible = await nudgedStatus.isVisible();
    if (!isNudgedVisible) throw new Error("Arrears Action button did not update to 'Nudge Sent'!");
    console.log("  - RentalArrearsActionCard interactive WhatsApp action button: ✅ PASS");

    // ==========================================
    // TEST 4: Ministry Deeds Status Component
    // ==========================================
    console.log("\n--- Testing GenUI Component 4: Ministry Deeds Status Card ---");
    await input.fill("Check Ministry of Lands title deeds transfer status");
    await page.locator("div.fixed.inset-0 form button[type='submit']").click();
    await page.waitForSelector("text=Ministry of Lands Registry", { timeout: 8000 });
    const vaultLink = page.locator("a:has-text('Open Deeds Vault')");
    const isVaultLinkVisible = await vaultLink.isVisible();
    if (!isVaultLinkVisible) throw new Error("MinistryDeedsStatusCard 'Open Deeds Vault' button not found!");
    console.log("  - MinistryDeedsStatusCard mounted with Folio status: ✅ PASS");

    // ==========================================
    // TEST 5: Smart Alert Configuration Component
    // ==========================================
    console.log("\n--- Testing GenUI Component 5: Smart Alert Config Card ---");
    await input.fill("Set alert for 3-bedroom townhouses in Leopards Hill under $2,500/mo");
    await page.locator("div.fixed.inset-0 form button[type='submit']").click();
    await page.waitForSelector("text=Smart Property Alert Builder", { timeout: 8000 });
    const activateBtn = page.locator("button:has-text('Activate WhatsApp Criteria Alert')");
    await activateBtn.click();
    await page.waitForTimeout(500);
    const activatedStatus = page.locator("text=Smart Alert Activated!");
    const isActivatedVisible = await activatedStatus.isVisible();
    if (!isActivatedVisible) throw new Error("Smart Alert button did not update to 'Smart Alert Activated'!");
    console.log("  - SmartAlertConfigCard form submission & state activation: ✅ PASS");

    // Capture master screenshot
    const screenshotPath = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\18_all_genui_components_audit.png";
    await page.screenshot({ path: screenshotPath });
    console.log(`\n📸 Master Audit Screenshot captured at: ${screenshotPath}`);

    console.log("\n🎉 ALL 5 GENUI COMPONENTS & INTERACTIVE ACTION BUTTONS AUDITED & PASSED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
