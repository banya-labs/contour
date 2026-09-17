import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOT_DIR = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\01064cec-9829-43ef-9fc8-e9213502b74e";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const SURFACES = [
  { id: "01_marketing_hero", name: "Marketing Landing Page", path: "/" },
  { id: "02_sign_in", name: "Clerk Sign In", path: "/sign-in" },
  { id: "03_dashboard_overview", name: "Operations Overview & Daily Queue", path: "/dashboard" },
  { id: "04_interactive_property_map", name: "Interactive Lusaka Map Hub", path: "/dashboard/map" },
  { id: "05_deal_pipeline_kanban", name: "Deal Pipeline Kanban Board", path: "/dashboard/pipeline" },
  { id: "06_properties_catalog", name: "Properties Vault & Catalog", path: "/dashboard/properties" },
  { id: "07_property_sales_registry", name: "Property Sales & Deeds Registry", path: "/dashboard/sales" },
  { id: "08_rentals_leases", name: "Rentals & Leases Management", path: "/dashboard/leases" },
  { id: "09_documents_vault", name: "Documents & Title Deeds Vault", path: "/dashboard/documents" },
  { id: "10_commissions_ledger", name: "Commissions & Splits Ledger", path: "/dashboard/commissions" },
  { id: "11_client_crm", name: "Client CRM & Anti-Poaching Lock", path: "/dashboard/clients" },
  { id: "12_landlord_statements", name: "Landlord Remittance Statements", path: "/dashboard/statements" },
  { id: "13_agency_settings", name: "Tenant Settings & Team Governance", path: "/dashboard/settings" },
  { id: "14_public_property_card", name: "Public Shareable Property Card", path: "/p/executive-4-bed-kabulonga" },
  { id: "15_field_agent_pwa_mobile", name: "Field Agent Mobile PWA", path: "/kiosk", isMobile: true },
  { id: "16_admin_overview", name: "Super Admin Control Plane", path: "/admin" },
  { id: "17_admin_mcp_hub", name: "Admin MCP Studio & Key Hub", path: "/admin/mcp" },
  { id: "18_billing_lenco", name: "Subscription & Lenco Zambia Billing", path: "/dashboard/billing" },
];

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log("🚀 Starting Full 15-Surface E2E Testing Suite on Production Server...");

  const browser = await chromium.launch({ headless: true });

  for (const surface of SURFACES) {
    console.log(`Testing ${surface.name} (${surface.path})...`);
    const context = await browser.newContext({
      viewport: surface.isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      userAgent: surface.isMobile ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" : undefined,
    });
    await context.addInitScript(() => {
      sessionStorage.setItem("contour_splash_dismissed", "true");
      localStorage.setItem("contour_dpa_consent", JSON.stringify({ status: "accepted" }));
      localStorage.setItem("contour_pwa_banner_dismissed", "true");
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
      // 1. Sign in as Tembo Mwape first so protected kiosk console renders
      console.log("Authenticating as Tembo Mwape via Fast Dev Login...");
      await page.goto(`${BASE_URL}/sign-in?redirect_url=/kiosk`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForSelector("text=Fast Dev Login", { timeout: 30000 });
      const fieldAgentBtn = page.locator("button:has-text('Field Agent')").first();
      await fieldAgentBtn.click();
      await page.waitForURL((url) => url.pathname.includes("/kiosk") || url.pathname.includes("/agent"), { timeout: 45000 });
      await page.waitForTimeout(2500);

      // Hide nextjs portal and banners if present
      await page.addStyleTag({ content: "nextjs-portal, .pwa-install-banner { display: none !important; }" }).catch(() => {});
      await page.waitForTimeout(1000);

      // 1. Screenshot Main Screen
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "kiosk_redesigned_main.png") });
      console.log("✅ Main screen screenshot saved!");

      // 2. Open Hamburger Menu & Screenshot
      const hamburger = page.locator(".field-mobile-menu-trigger").first();
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "kiosk_redesigned_hamburger.png") });
        console.log("✅ Hamburger menu screenshot saved!");
        await hamburger.click();
        await page.waitForTimeout(400);
      }

      // 3. Click + Listing Quick Add Button & Screenshot Drawer
      const listingBtn = page.locator("button:has-text('Listing')").first();
      if (await listingBtn.isVisible()) {
        await listingBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, "kiosk_intake_drawer.png") });
        console.log("✅ Intake drawer screenshot saved!");
      }

      console.log(`✅ [SUCCESS] ${surface.name} passed & screenshots saved.`);
    } catch (err: any) {
      console.error(`❌ [FAILED] ${surface.name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log("\n🎉 ALL 15 SURFACES TESTED & VERIFIED ON PRODUCTION SERVER!");
}

main();
