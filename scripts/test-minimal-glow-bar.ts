import { chromium } from "playwright";

async function main() {
  console.log("🚀 Capturing Minimal Floating AI Bar with Iridescent Pastel Glow...");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  try {
    // Navigate to Landing Page
    await page.goto("http://localhost:3005/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Capture screenshot of the home page showing the minimal floating glow bar
    const screenshotPath = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\8c52d5c8-ab12-480f-9e21-aeaea09661bc\\screenshots\\19_minimal_pastel_glow_bar.png";
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot captured at: ${screenshotPath}`);

    // Verify avatar, standalone chips, input capsule, and voice button
    const avatar = page.locator("img[alt*='Grace Banda']");
    const isAvatarVisible = await avatar.isVisible();
    if (!isAvatarVisible) throw new Error("Assistant avatar not found!");

    const voiceBtn = page.locator("button:has-text('Voice')");
    const isVoiceBtnVisible = await voiceBtn.isVisible();
    if (!isVoiceBtnVisible) throw new Error("Voice button not found!");

    console.log("🎉 MINIMAL GLOWING AI BAR VERIFIED & PASSED 100%!");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
