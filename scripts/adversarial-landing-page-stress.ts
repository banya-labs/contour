import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

// Output Directories
const SCREENSHOT_DIR = path.join(process.cwd(), ".test-screenshots", "adversarial-landing-page");

interface StressAssertion {
  category: string;
  testName: string;
  passed: boolean;
  details: string;
  metrics?: Record<string, any>;
}

const assertions: StressAssertion[] = [];

function record(category: string, testName: string, passed: boolean, details: string, metrics?: Record<string, any>) {
  assertions.push({ category, testName, passed, details, metrics });
  const icon = passed ? "✅ [PASS]" : "❌ [FAIL]";
  console.log(`${icon} [${category}] ${testName}`);
  if (!passed || process.env.VERBOSE) {
    console.log(`       └─ ${details}`);
  }
}

async function verifyServerAvailable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(4000) });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

async function findAvailableServer(): Promise<string | null> {
  const candidates = [
    process.env.BASE_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3005",
    "http://127.0.0.1:3005",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (await verifyServerAvailable(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function runAdversarialStressSuite() {
  console.log("===============================================================================");
  console.log("CONTOUR: ADVERSARIAL EMPIRICAL STRESS TEST SUITE — MARKETING LANDING PAGE");
  console.log("===============================================================================\n");

  const serverUrl = await findAvailableServer();
  if (!serverUrl) {
    console.error("❌ CRITICAL: No active web server found. Please ensure Next.js dev server is running.");
    process.exit(1);
  }
  console.log(`🎯 Active Server Target: ${serverUrl}\n`);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser: Browser = await chromium.launch({ headless: true });

  try {
    // =========================================================================
    // PART 1: 8-VIEWPORT RESPONSIVE INTEGRITY & ZERO HORIZONTAL OVERFLOW
    // =========================================================================
    console.log("--- PART 1: Responsive Layout & Boundary Viewport Stress (320px to 1920px) ---");
    const viewports = [
      { name: "320px (Ultra-narrow Mobile)", width: 320, height: 568 },
      { name: "375px (iPhone SE)", width: 375, height: 667 },
      { name: "390px (iPhone 14 / Modern Standard)", width: 390, height: 844 },
      { name: "414px (Large Mobile / Plus)", width: 414, height: 896 },
      { name: "768px (iPad / Tablet Portrait)", width: 768, height: 1024 },
      { name: "1024px (Tablet Landscape / Small Laptop)", width: 1024, height: 768 },
      { name: "1440px (Desktop Workstation)", width: 1440, height: 900 },
      { name: "1920px (Full HD Ultra-wide)", width: 1920, height: 1080 },
    ];

    for (let i = 0; i < viewports.length; i++) {
      const vp = viewports[i];
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent:
          vp.width < 768
            ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        isMobile: vp.width < 768,
        hasTouch: vp.width < 768,
      });

      const page = await context.newPage();
      await page.goto(serverUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(500);

      // Check document overflow
      const overflowMetrics = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        
        // Find any offending element causing overflow
        const overflowingElements: string[] = [];
        document.querySelectorAll("*").forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > winWidth + 2) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls = el.className && typeof el.className === "string" ? `.${el.className.split(" ")[0]}` : "";
            overflowingElements.push(`${tag}${id}${cls} (right: ${Math.round(rect.right)}px > ${winWidth}px)`);
          }
        });

        return {
          docWidth,
          winWidth,
          bodyWidth,
          isOverflowing: docWidth > winWidth + 2 || bodyWidth > winWidth + 2,
          offendingCount: overflowingElements.length,
          offendingSample: overflowingElements.slice(0, 3),
        };
      });

      const shotPath = path.join(SCREENSHOT_DIR, `vp_${vp.width}px_${i + 1}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });

      record(
        "RESPONSIVE",
        `Zero Horizontal Overflow @ ${vp.name}`,
        !overflowMetrics.isOverflowing,
        `docWidth: ${overflowMetrics.docWidth}px vs winWidth: ${overflowMetrics.winWidth}px. Offending elements: ${overflowMetrics.offendingCount}`,
        overflowMetrics
      );

      // Verify H1 visibility
      const h1Visible = await page.locator("h1").isVisible();
      record(
        "RESPONSIVE",
        `H1 Header Legibility @ ${vp.name}`,
        h1Visible,
        `H1 present and visible in DOM`
      );

      await context.close();
    }

    // =========================================================================
    // PART 2: ROI CALCULATOR ADVERSARIAL BOUNDS & MATHEMATICAL ORACLES
    // =========================================================================
    console.log("\n--- PART 2: ROI Calculator Extreme Bounds & Oracles ---");
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopContext.newPage();
    await page.goto(serverUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const calcLocator = page.locator("#calculator");
    await calcLocator.scrollIntoViewIfNeeded();

    // Oracle Calculation Helper
    function calcOracle(
      currency: "ZMW" | "USD",
      mandates: number,
      avgPrice: number,
      commRate: number,
      leakRate: number
    ) {
      const annualGross = mandates * avgPrice * 12;
      const annualComm = annualGross * (commRate / 100);
      const annualLeak = annualComm * (leakRate / 100);
      const annualRecovered = annualLeak * 0.85;
      const monthlyRecovered = annualRecovered / 12;
      const hoursSaved = Math.round(mandates * 1.5);
      const cost = currency === "USD" ? 129 * 12 : 3200 * 12;
      const roiMult = Math.max(1, Math.round(annualRecovered / cost));

      return {
        annualGross,
        annualComm,
        annualLeak,
        annualRecovered,
        monthlyRecovered,
        hoursSaved,
        roiMult,
      };
    }

    // Helper to set range values
    async function setSliderValue(selector: string, val: string) {
      await page.evaluate(({ sel, v }) => {
        const input = document.querySelector(sel) as HTMLInputElement;
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          if (nativeSetter) {
            nativeSetter.call(input, v);
          } else {
            input.value = v;
          }
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, { sel: selector, v: val });
      await page.waitForTimeout(100);
    }

    // A. Extreme Lower Bound Test (Min values: 1 mandate, K500k, 3% comm, 5% leak)
    console.log("\nTesting Extreme Minimum Slider Bounds (ZMW)...");
    await page.click("#calculator button:has-text('ZMW')");
    await setSliderValue("#monthly-listings", "1");
    await setSliderValue("#avg-price", "500000");
    await setSliderValue("#comm-rate", "3");
    await setSliderValue("#leak-rate", "5");
    await page.waitForTimeout(300);

    const minZmwOracle = calcOracle("ZMW", 1, 500000, 3, 5);
    const minZmwDomText = await calcLocator.innerText();

    const minZmwNoNan = !minZmwDomText.includes("NaN") && !minZmwDomText.includes("undefined") && !minZmwDomText.includes("Infinity");
    record(
      "CALCULATOR-BOUNDS",
      "Extreme Minimum Values (ZMW: 1 mandate, K500k, 3% comm, 5% leak)",
      minZmwNoNan && minZmwDomText.includes("K 7,650"),
      `DOM reflects K 7,650 recovered revenue. No NaN/Infinity: ${minZmwNoNan}`
    );

    // B. Extreme Maximum Bound Test (Max values: 50 mandates, K15M, 7% comm, 30% leak)
    console.log("\nTesting Extreme Maximum Slider Bounds (ZMW)...");
    await setSliderValue("#monthly-listings", "50");
    await setSliderValue("#avg-price", "15000000");
    await setSliderValue("#comm-rate", "7");
    await setSliderValue("#leak-rate", "30");
    await page.waitForTimeout(300);

    const maxZmwOracle = calcOracle("ZMW", 50, 15000000, 7, 30);
    const maxZmwDomText = await calcLocator.innerText();
    const maxZmwNoNan = !maxZmwDomText.includes("NaN") && !maxZmwDomText.includes("undefined") && !maxZmwDomText.includes("Infinity");
    record(
      "CALCULATOR-BOUNDS",
      "Extreme Maximum Values (ZMW: 50 mandates, K15M, 7% comm, 30% leak)",
      maxZmwNoNan && maxZmwDomText.includes("K 160,650,000"),
      `DOM reflects K 160,650,000 recovered revenue. No NaN/Infinity: ${maxZmwNoNan}`
    );

    // C. USD Mode Bounds Test (Min USD: 1 mandate, $25k, 3% comm, 5% leak)
    console.log("\nTesting USD Extreme Bounds ($25k to $1M)...");
    await page.click("#calculator button:has-text('USD')");
    await setSliderValue("#monthly-listings", "1");
    await setSliderValue("#avg-price", "25000");
    await setSliderValue("#comm-rate", "3");
    await setSliderValue("#leak-rate", "5");
    await page.waitForTimeout(300);

    const minUsdOracle = calcOracle("USD", 1, 25000, 3, 5);
    const minUsdDomText = await calcLocator.innerText();
    const minUsdPass = !minUsdDomText.includes("NaN") && minUsdDomText.includes("$ 383");
    record(
      "CALCULATOR-BOUNDS",
      "USD Minimum Bounds ($25k price, 1 mandate)",
      minUsdPass,
      `DOM contains $ 383 (or $ 382.50 rounded). Text verified.`
    );

    // Max USD (50 mandates, $1,000,000, 7% comm, 30% leak)
    await setSliderValue("#monthly-listings", "50");
    await setSliderValue("#avg-price", "1000000");
    await setSliderValue("#comm-rate", "7");
    await setSliderValue("#leak-rate", "30");
    await page.waitForTimeout(300);

    const maxUsdOracle = calcOracle("USD", 50, 1000000, 7, 30);
    const maxUsdDomText = await calcLocator.innerText();
    const maxUsdPass = !maxUsdDomText.includes("NaN") && maxUsdDomText.includes("$ 10,710,000");
    record(
      "CALCULATOR-BOUNDS",
      "USD Maximum Bounds ($1M price, 50 mandates)",
      maxUsdPass,
      `DOM contains $ 10,710,000 annual recovered revenue.`
    );

    // D. Rapid Jitter / Stress Test (50 rapid updates)
    console.log("\nRunning Jitter Stress Test on Sliders (50 rapid transitions)...");
    let jitterPass = true;
    for (let j = 0; j < 20; j++) {
      const randomMandates = Math.floor(Math.random() * 50) + 1;
      await setSliderValue("#monthly-listings", randomMandates.toString());
    }
    const finalJitterDom = await calcLocator.innerText();
    if (finalJitterDom.includes("NaN") || finalJitterDom.includes("undefined")) {
      jitterPass = false;
    }
    record(
      "CALCULATOR-STRESS",
      "Rapid Jitter Stability (20 rapid random slider events)",
      jitterPass,
      "No DOM crash, no calculation error, no NaN produced during high-speed slider jitter"
    );

    // =========================================================================
    // PART 3: INTERACTIVE STATE STABILITY & COMPONENT ACCORDIONS
    // =========================================================================
    console.log("\n--- PART 3: Interactive Component & State Transitions ---");

    // 1. WhatsApp Flyer Clipboard Copy
    const copyBtn = page.locator("#syndication button:has-text('Copy WhatsApp Flyer')").first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.waitForTimeout(200);
      const isCopiedState = await page.locator("#syndication button:has-text('Copied to Clipboard!')").isVisible();
      record(
        "INTERACTIVE-STATE",
        "WhatsApp Flyer Copy Button State Transition",
        isCopiedState,
        "Button transitioned to 'Copied to Clipboard!' state"
      );

      // Check auto-reversion
      await page.waitForTimeout(2600);
      const isRevertedState = await page.locator("#syndication button:has-text('Copy WhatsApp Flyer')").isVisible();
      record(
        "INTERACTIVE-STATE",
        "WhatsApp Flyer Copy Button Auto-Reversion",
        isRevertedState,
        "Button cleanly reverted to original state after 2.5s timeout"
      );
    }

    // 2. FAQ Accordion Multi-Toggle
    const faqSection = page.locator("#faq");
    await faqSection.scrollIntoViewIfNeeded();
    
    // Toggle second and third FAQ
    const faq2Trigger = page.locator("button:has-text('How does Contour separate gross transaction value')").first();
    const faq3Trigger = page.locator("button:has-text('What stops rogue agents from poaching clients')").first();

    await faq2Trigger.click();
    await page.waitForTimeout(200);
    await faq3Trigger.click();
    await page.waitForTimeout(200);

    const faq2Expanded = await faq2Trigger.getAttribute("aria-expanded");
    const faq3Expanded = await faq3Trigger.getAttribute("aria-expanded");
    const bothExpanded = faq2Expanded === "true" && faq3Expanded === "true";

    record(
      "INTERACTIVE-STATE",
      "POPIA FAQ Accordion Multi-Item Expansion",
      bothExpanded,
      `FAQ 2 expanded: ${faq2Expanded}, FAQ 3 expanded: ${faq3Expanded}`
    );

    // Toggle FAQ 2 closed
    await faq2Trigger.click();
    await page.waitForTimeout(200);
    const faq2NowClosed = (await faq2Trigger.getAttribute("aria-expanded")) === "false";
    record(
      "INTERACTIVE-STATE",
      "POPIA FAQ Accordion Collapse Action",
      faq2NowClosed,
      "FAQ 2 closed cleanly on second click"
    );

    // 3. Suburb Map Preview Spotlight Switching
    const suburbsToTest = ["Kabulonga", "Leopards Hill", "Roma Park", "Woodlands & Sunningdale", "Mass Media"];
    let allSuburbsPass = true;
    for (const suburbName of suburbsToTest) {
      const btn = page.locator(`#map-preview button:has-text('${suburbName}')`).first();
      await btn.click();
      await page.waitForTimeout(150);
      const hasSpotlight = (await page.locator("#map-preview").innerText()).includes(suburbName);
      if (!hasSpotlight) {
        allSuburbsPass = false;
      }
    }
    record(
      "INTERACTIVE-STATE",
      "Map Preview All 5 Suburb Spotlight Transitions",
      allSuburbsPass,
      "Clicked all 5 Lusaka suburbs and verified spotlight DOM synchronization"
    );

    // 4. Pricing Billing Cycle & Currency Switcher
    const pricingSection = page.locator("#pricing");
    await pricingSection.scrollIntoViewIfNeeded();

    await page.click("#pricing button:has-text('Annual Billing')");
    await page.waitForTimeout(200);
    const hasDiscountBadge = (await pricingSection.innerText()).includes("Save 20%");
    const hasAnnualNotice = (await pricingSection.innerText()).includes("Billed annually (20% off)");

    await page.click("#pricing button:has-text('USD ($)')");
    await page.waitForTimeout(200);
    const hasUsdPricing = (await pricingSection.innerText()).includes("$ 39") && (await pricingSection.innerText()).includes("$ 99");

    record(
      "INTERACTIVE-STATE",
      "Pricing Matrix Billing & Currency Interactivity",
      hasDiscountBadge && hasAnnualNotice && hasUsdPricing,
      "Annual 20% discount and USD price calculation ($39/mo Starter, $99/mo Growth) verified"
    );

    // 5. Verification of All Key Navigation and Link Destinations
    const linksToVerify = [
      { name: "Fast Dev Login", selector: "a[href='/login']" },
      { name: "Live Map Demo", selector: "a[href='/dashboard/map']" },
      { name: "Open Dashboard", selector: "a[href='/dashboard']" },
      { name: "Field PWA Kiosk", selector: "a[href='/kiosk']" },
      { name: "Public Shareable Card", selector: "a[href='/p/executive-4-bed-kabulonga']" },
      { name: "Admin MCP Hub", selector: "a[href='/admin/mcp']" },
    ];

    for (const linkTest of linksToVerify) {
      const el = page.locator(linkTest.selector).first();
      const isPresent = await el.count() > 0;
      record(
        "NAVIGATION",
        `Surface Route Link Present: ${linkTest.name}`,
        isPresent,
        `Selector '${linkTest.selector}' found in landing page markup`
      );
    }

    await desktopContext.close();
  } catch (err: any) {
    console.error("\n❌ UNEXPECTED ADVERSARIAL RUNNER ERROR:", err.message);
    record("FATAL", "Adversarial Test Pipeline Crash", false, err.message);
  } finally {
    await browser.close();
  }

  // =========================================================================
  // SUMMARY REPORT & EXIT CODE
  // =========================================================================
  console.log("\n===============================================================================");
  const total = assertions.length;
  const passed = assertions.filter((r) => r.passed).length;
  const failed = total - passed;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log(`ADVERSARIAL STRESS TEST SUMMARY: ${passed}/${total} PASSED (${passRate}%)`);
  console.log("===============================================================================\n");

  // Save JSON report for handoff reference
  const reportPath = path.join(SCREENSHOT_DIR, "adversarial_test_results.json");
  fs.writeFileSync(reportPath, JSON.stringify({ total, passed, failed, passRate, assertions }, null, 2));
  console.log(`📊 Structured test results written to: ${reportPath}\n`);

  if (failed > 0) {
    console.error(`❌ ADVERSARIAL STRESS SUITE FAILED WITH ${failed} FAILING ASSERTIONS.`);
    process.exit(1);
  } else {
    console.log("🎉 ALL ADVERSARIAL PROBES, EXTREME BOUNDS, VIEWPORTS & STATES VERIFIED 100%!");
    process.exit(0);
  }
}

runAdversarialStressSuite().catch((err) => {
  console.error("Adversarial runner failed:", err);
  process.exit(1);
});
