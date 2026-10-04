/** Local browser contract smoke test. APIs are fixtures; this is not live tenant/database proof. */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
async function main() {
const base = process.env.PWA_TEST_URL || "http://localhost:3101";
const evidence = ".superpowers/sdd/2026-10-04-matching-pwa-parity/browser";
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
const contact = { id: "contact1", name: "Test Buyer", phone: "+260971111111", email: "buyer@example.test", _count: { inquiries: 1 } };
const property = { id: "property1", title: "Roma House", suburb: "Roma", listingType: "FOR_SALE", status: "AVAILABLE", currency: "ZMW", propertyType: "STANDALONE_HOUSE", askingPrice: 900000, rentalPrice: null, bedrooms: 3, bathrooms: 2, plotSizeSqm: 300, photos: [], assignedAgentId: "agent1", agencyCommissionPct: 5, slug: "roma-house" };
const inquiry = { id: "inquiry1", clientName: contact.name, clientPhone: contact.phone, contactId: contact.id, contact, lookingFor: "FOR_SALE", propertyType: "STANDALONE_HOUSE", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: ["Roma"], bedroomsMin: 3, propertyId: null, status: "NEW_INQUIRY", assignedAgentId: "agent1" };
let submitted: Record<string, unknown> | null = null;
let reverseRequests = 0;
let denyMatching = false;
await page.route("**/api/**", async (route) => {
  const url = new URL(route.request().url()), path = url.pathname;
  let data: unknown = { success: true };
  let status = 200;
  if (path.includes("/auth/get-session")) data = { user: { id: "agent1", name: "Test Agent", email: "agent@example.test", role: "FIELD_AGENT" }, session: { id: "session1", activeOrganizationId: "org1", expiresAt: new Date(Date.now()+3600000).toISOString() } };
  else if (path === "/api/powersync/token") { data = { success: false }; status = 503; }
  else if (path === "/api/properties") data = { success: true, properties: [property], pagination: { page: 1, totalPages: 1 } };
  else if (path === "/api/agent/inquiries") data = { success: true, clients: [inquiry], hasMore: false };
  else if (path === "/api/agent/contacts") data = { success: true, contacts: [contact], hasMore: false };
  else if (path.startsWith("/api/agent/contacts/")) data = { success: true, contact: { ...contact, inquiries: [inquiry] } };
  else if (path === "/api/agent/matching/summaries") data = { success: true, propertySummaries: [{ id: property.id, qualifyingCount: 1, topMatches: [{ id: inquiry.id, name: contact.name, score: 95 }] }], inquirySummaries: [{ id: inquiry.id, qualifyingCount: 1, topMatches: [{ id: property.id, title: property.title, suburb: property.suburb, score: 95 }] }] };
  else if (/\/api\/agent\/matching\/(properties|inquiries)\//.test(path)) {
    reverseRequests++;
    data = { success: true, results: [{ propertyId: property.id, score: 95, reasons: ["preferred area", "within budget"], hardFailures: [], unmetPreferences: [], missingData: [], effectivePrice: 900000, isMatch: true, property, inquiry }], total: 1, page: 1, pageSize: 20, hasMore: false, calculatedAt: new Date().toISOString(), policyVersion: "2026-10-04", matchingEnabled: true, inquiry };
    if (denyMatching) { data = { success: false, error: "Forbidden: Insufficient permissions" }; status = 403; }
  }
  else if (path === "/api/notifications/matches") data = { success: true, notifications: [], unreadCount: 0 };
  else if (path === "/api/clients" && route.request().method() === "POST") { submitted = route.request().postDataJSON(); data = { success: true, client: inquiry }; }
  else if (path === "/api/leases") data = { success: true, leases: [] };
  else if (path === "/api/sales") data = { success: true, transactions: [] };
  else if (path === "/api/organization/agents") data = { success: true, agents: [{ id: "agent1", name: "Test Agent" }] };
  else if (path === "/api/dashboard/access") data = { success: true, allowed: false };
  else if (path === "/api/agent/summary") data = { success: true, agent: { id: "agent1", name: "Test Agent", role: "FIELD_AGENT", organizationName: "Fixture Agency" }, deals: [], queue: [] };
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
});
try {
  await page.goto(`${base}/agent`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("button", { name: /essential only/i }).click();
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.getByRole("button", { name: "Properties", exact: true }).click({ timeout: 120000 });
  await page.getByRole("button", { name: "1 matching buyers", exact: true }).click();
  await page.getByRole("dialog", { name: "Matching results" }).waitFor();
  await page.getByText("95% fit", { exact: true }).waitFor();
  assert(reverseRequests > 0);
  await page.screenshot({ path: `${evidence}/matching-results.png`, fullPage: false });
  await page.getByRole("button", { name: "Close matching results" }).click();
  await page.getByRole("button", { name: "Open full mandate record", exact: true }).click();
  await page.getByRole("button", { name: "View all matches" }).waitFor();
  await page.getByText("95% fit", { exact: true }).waitFor();
  await page.screenshot({ path: `${evidence}/property-preview.png`, fullPage: false });
  await page.getByRole("button", { name: "View all matches" }).click();
  denyMatching = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Forbidden" }).waitFor();
  assert.equal(await page.getByText("95% fit", { exact: true }).count(), 1, "Underlying property preview may remain but denied modal must clear its results");
  await page.getByRole("button", { name: "Close matching results" }).click();
  denyMatching = false;
  await page.getByRole("button", { name: "View all matches" }).click();
  await page.getByRole("dialog", { name: "Matching results" }).getByText("95% fit", { exact: true }).waitFor();
  await context.setOffline(true);
  await page.getByRole("dialog", { name: "Matching results" }).getByText(/Cached matches/).waitFor();
  await page.screenshot({ path: `${evidence}/offline-cached.png`, fullPage: false });
  await page.getByRole("button", { name: "Close matching results" }).click();
  await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith("contour_matches_")) localStorage.removeItem(key); });
  await page.getByRole("button", { name: "View all matches" }).click();
  await page.getByRole("dialog", { name: "Matching results" }).getByText("Connect to check matches.", { exact: true }).waitFor();
  await context.setOffline(false);
  await page.getByRole("dialog", { name: "Matching results" }).getByText("95% fit", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Close matching results" }).click();
  await page.keyboard.press("Escape");
  // Reload to close the underlying property record and test inquiry/contact capture.
  denyMatching = false;
  await page.goto(`${base}/agent`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.getByRole("button", { name: "Inquiries", exact: true }).last().click();
  await page.getByRole("button", { name: "Add inquiry", exact: true }).click();
  await page.locator("select").filter({ has: page.locator('option[value="contact1"]') }).selectOption("contact1");
  await page.getByPlaceholder("e.g. 3").fill("3");
  await page.screenshot({ path: `${evidence}/contact-inquiry.png`, fullPage: false });
  const form = page.locator("form").filter({ has: page.locator('option[value="contact1"]') });
  await form.locator("select").filter({ has: page.locator('option[value="STANDALONE_HOUSE"]') }).selectOption("STANDALONE_HOUSE");
  await form.locator('button[type="submit"]').click();
  await page.waitForFunction(() => !document.body.innerText.includes("Select an existing contact…"));
  assert(submitted, "Inquiry must reach outbox upload");
  assert.equal(submitted.contactId, "contact1");
  assert.equal(submitted.bedroomsMin, 3);
  assert.equal(submitted.status, "NEW_INQUIRY");
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("PASS: card matching, automatic detail preview, denied results, contact-linked typed capture; API fixture smoke only.");
} catch (error) {
  await page.screenshot({ path: `${evidence}/failure.png`, fullPage: false }).catch(() => {});
  console.error((await page.locator("body").innerText()).slice(-1800));
  throw error;
} finally { await browser.close(); }
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
