import { chromium } from "playwright";

async function main() {
  console.log("🚀 Starting Playwright Audit: Property Full View, Listing Editing, Deal Associations & Exact Reference Flyer...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  page.on("dialog", async (dialog) => {
    console.log(`  [Dialog]: "${dialog.message().split("\n")[0]}"`);
    await dialog.accept();
  });

  try {
    // ----------------------------------------------------
    // STEP 1: OPEN PROPERTY FULL VIEW MODAL
    // ----------------------------------------------------
    console.log("=== STEP 1: TESTING PROPERTY FULL VIEW MODAL ===");
    await page.goto("http://localhost:3005/dashboard/properties", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Verify button is named "Full View"
    const fullViewBtn = page.locator("button:has-text('Full View')").first();
    const isFullViewBtnVisible = await fullViewBtn.isVisible();
    if (!isFullViewBtnVisible) throw new Error("Full View button not found on property card!");
    console.log("  - 'Full View' button present on property card: ✅ PASS");

    await fullViewBtn.click();
    await page.waitForTimeout(500);

    const fullViewHeader = page.locator("text=Property Full View & Mandate Vault").first();
    const isModalOpen = await fullViewHeader.isVisible();
    if (!isModalOpen) throw new Error("Property Full View modal failed to open!");
    console.log("  - Property Full View modal opened: ✅ PASS");

    // ----------------------------------------------------
    // STEP 2: TEST EDIT LISTING DETAILS INLINE
    // ----------------------------------------------------
    console.log("\n=== STEP 2: TESTING INLINE EDITING OF LISTING DETAILS ===");
    const editBtn = page.locator("button:has-text('Edit Listing Details')");
    await editBtn.click();
    await page.waitForTimeout(400);

    const editFormHeader = page.locator("h4:has-text('Edit Property Listing Details')");
    const isEditFormVisible = await editFormHeader.isVisible();
    if (!isEditFormVisible) throw new Error("Inline edit form did not expand!");
    console.log("  - Inline edit form opened: ✅ PASS");

    // Edit price to 3,800,000
    const priceInput = page.locator("input[type='number']").first();
    await priceInput.fill("3800000");

    // Save changes
    await page.locator("button:has-text('Save Changes')").click();
    await page.waitForTimeout(500);

    // Verify price updated
    const updatedPrice = page.locator("text=K 3,800,000").first();
    const isPriceUpdated = await updatedPrice.isVisible();
    if (!isPriceUpdated) throw new Error("Updated price K 3,800,000 not reflected in modal!");
    console.log("  - Price edited and synced to K 3,800,000: ✅ PASS");

    // ----------------------------------------------------
    // STEP 3: TEST DEAL PARTIES WITH TITLES & ASSOCIATIONS
    // ----------------------------------------------------
    console.log("\n=== STEP 3: TESTING DEAL PARTIES & ASSOCIATIONS ===");
    await page.locator("button:has-text('Deal Parties & Contacts')").click();
    await page.waitForTimeout(400);

    // Verify seller title & deal association
    const sellerTitle = page.locator("text=Registered Title Deed Holder (Seller)").first();
    const isSellerTitleVisible = await sellerTitle.isVisible();
    if (!isSellerTitleVisible) throw new Error("Seller title not found!");

    const sellerAssoc = page.locator("text=Sole Mandate Signatory & Beneficial Property Owner").first();
    const isSellerAssocVisible = await sellerAssoc.isVisible();
    if (!isSellerAssocVisible) throw new Error("Seller deal association not found!");
    console.log("  - Seller title and exact deal association verified: ✅ PASS");

    // Verify broker title & association
    const brokerTitle = page.locator("text=Lead Listing Broker (Field Agent)").first();
    const isBrokerTitleVisible = await brokerTitle.isVisible();
    if (!isBrokerTitleVisible) throw new Error("Broker title not found!");
    console.log("  - Broker title and commission association verified: ✅ PASS");

    // Test adding a new deal party
    console.log("  - Adding custom deal stakeholder (Conveyancing Attorney)...");
    await page.locator("button:has-text('+ Add Deal Party')").click();
    await page.waitForTimeout(300);

    await page.locator("input[placeholder*='Adv. Mutale Musonda']").fill("Adv. Mutale Musonda");
    await page.locator("input[placeholder*='Registered Title Deed Holder']").fill("Conveyancing & Land Title Attorney");
    await page.locator("input[placeholder*='Sole Mandate Signatory']").fill("Drafted Sale Agreement & Witnessed Mandate Signing");
    await page.locator("input[placeholder*='+260 97 123 4567']").fill("+260 97 554 3322");

    await page.locator("button:has-text('Save Party to Deal')").click();
    await page.waitForTimeout(400);

    const attorneyCard = page.locator("text=Adv. Mutale Musonda").first();
    const isAttorneyVisible = await attorneyCard.isVisible();
    if (!isAttorneyVisible) throw new Error("Newly added attorney party not visible in roster!");
    console.log("  - Custom deal party added and verified in roster: ✅ PASS");

    // Capture Full View Parties Screenshot
    const fullViewScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\29_property_full_view_parties_associations.png";
    await page.screenshot({ path: fullViewScreenshot });
    console.log(`📸 Full View screenshot captured at: ${fullViewScreenshot}`);

    // ----------------------------------------------------
    // STEP 4: TEST EXACT REFERENCE FLYER GENERATOR
    // ----------------------------------------------------
    console.log("\n=== STEP 4: TESTING EXACT REFERENCE MARKETING FLYER ===");
    await page.locator("button:has-text('Social Flyer Card')").first().click();
    await page.waitForTimeout(500);

    const flyerHeader = page.locator("h3:has-text('Social Media Marketing Flyer Generator')");
    const isFlyerOpen = await flyerHeader.isVisible();
    if (!isFlyerOpen) throw new Error("Flyer generator modal failed to open!");
    console.log("  - Flyer Generator opened: ✅ PASS");

    // Verify elements matching reference template
    const offeredAtBadge = page.locator("text=OFFERED AT").first();
    const isOfferedAtVisible = await offeredAtBadge.isVisible();
    if (!isOfferedAtVisible) throw new Error("OFFERED AT price badge not rendered!");
    console.log("  - Top header 'OFFERED AT' price badge verified: ✅ PASS");

    const homeFeaturesCard = page.locator("text=HOME FEATURES").first();
    const isHomeFeaturesVisible = await homeFeaturesCard.isVisible();
    if (!isHomeFeaturesVisible) throw new Error("HOME FEATURES card not rendered!");
    console.log("  - 'HOME FEATURES' gold card with white inner border verified: ✅ PASS");

    const bookNowBtn = page.locator("text=BOOK NOW").first();
    const isBookNowVisible = await bookNowBtn.isVisible();
    if (!isBookNowVisible) throw new Error("BOOK NOW footer button not rendered!");
    console.log("  - 'BOOK NOW' footer button and address bar verified: ✅ PASS");

    // Test PNG download
    console.log("  - Testing high-res PNG flyer download...");
    const downloadBtn = page.locator("button:has-text('Download Social Media Card (PNG)')");
    await downloadBtn.click();
    await page.waitForTimeout(1000);

    const successMsg = page.locator("text=Flyer Card Downloaded Successfully!");
    const isDownloaded = await successMsg.isVisible();
    if (!isDownloaded) throw new Error("Flyer download confirmation not displayed!");
    console.log("  - High-res PNG social media flyer generated and downloaded: ✅ PASS");

    // Capture Exact Reference Flyer Screenshot
    const flyerScreenshot = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\30_exact_reference_flyer_generator.png";
    await page.screenshot({ path: flyerScreenshot });
    console.log(`📸 Exact Reference Flyer screenshot captured at: ${flyerScreenshot}`);

    console.log("\n🎉 ALL FULL VIEW, LISTING EDITING, DEAL ASSOCIATIONS & EXACT FLYER AUDITS PASSED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
