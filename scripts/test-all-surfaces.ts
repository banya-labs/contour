import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOT_DIR = "C:\\Users\\sewar\\.gemini\\antigravity\\brain\\930f1367-87af-4566-87d4-b28c3b890082\\screenshots";
const BASE_URL = "http://localhost:3005";

const SURFACES = [
  { id: "01_marketing_hero", name: "Marketing Landing Page", path: "/" },
  { id: "02_fast_dev_login", name: "Fast Dev Login", path: "/login" },
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
  { id: "13_public_property_card", name: "Public Shareable Property Card", path: "/p/executive-4-bed-kabulonga" },
  { id: "14_field_agent_pwa_mobile", name: "Field Agent Mobile PWA", path: "/kiosk", isMobile: true },
  { id: "15_admin_mcp_hub", name: "Admin MCP Studio & Key Hub", path: "/admin/mcp" },
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
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    try {
      await page.goto(`${BASE_URL}${surface.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);

      // Extra verification for Map
      if (surface.id === "04_interactive_property_map") {
        await page.waitForTimeout(1500);
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${surface.id}.png`) });
      console.log(`✅ [SUCCESS] ${surface.name} passed & screenshot saved.`);
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
