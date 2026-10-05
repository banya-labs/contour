import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import ts from "typescript";
import postcss from "postcss";
import tailwind from "tailwindcss";

// Real React pages, with fixture auth/routing and intercepted APIs. No tenant writes.
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("tsx/package.json"))("esbuild");
const navigation = `import {useSyncExternalStore} from 'react';
const listen=(fn)=>{addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)};
const replace=history.replaceState.bind(history);history.replaceState=(...args)=>{replace(...args);dispatchEvent(new PopStateEvent('popstate'))};
export function useSearchParams(){const search=useSyncExternalStore(listen,()=>location.search);return new URLSearchParams(search)};
export const useRouter=()=>({push(url){location.href=url},replace(url){history.replaceState(null,'',url)},refresh(){}});`;
const stubs = {
  "next/navigation": navigation,
  "next/link": `import React from 'react'; export default ({children,...props})=><a {...props}>{children}</a>;`,
  "next/image": `import React from 'react'; export default ({fill,unoptimized,priority,...props})=><img {...props}/>;`,
  "next/dynamic": `export default () => () => null;`,
  "@/lib/auth-client": `const session={data:{user:{id:'operator',name:'Test operator',role:'OWNER'},session:{activeOrganizationId:'fixture-org'}},isPending:false};export const useSession=()=>session; export const authClient={useSession};export const signOut=async()=>{};`,
  "@/lib/powersync": `import React from 'react';const syncData=async()=>{};export const PowerSyncProvider=({children})=><>{children}</>;const sync={isOnline:true,loading:false,properties:[],clients:[],outboxCount:0,toggleNetwork:()=>{},syncData,addToOutbox:async()=>{},playNeutralTone:()=>{},playSuccessTone:()=>{}};export const usePowerSync=()=>sync;`,
};
const surfaces = ["properties", "clients", "contacts", "leases", "sales", "statements", "analytics", "print", "statementPrint", "documentPrint", "agent"];
const imports = surfaces.map((surface, i) => surface === "agent" ? `import P${i} from './src/app/(kiosk)/agent/page';` : surface === "documentPrint" ? `import {StatementViewer as P${i}} from './src/components/statements/statement-viewer';` : surface === "statementPrint" ? `import {LandlordStatementViewer as P${i}} from './src/components/statements/landlord-statement-viewer';` : `import P${i} from './src/app/(dashboard)/dashboard/${surface === "print" ? "analytics/print" : surface}/page';`).join("\n");
const bundle = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';${imports}
const pages={${surfaces.map((surface, i) => `${surface}:P${i}`).join(",")}};const surface=new URLSearchParams(location.search).get('surface') || (location.pathname.startsWith('/statements/') ? 'documentPrint' : location.pathname.includes('/statements/') ? 'statementPrint' : 'print');const Page=pages[surface];createRoot(document.getElementById('root')).render(<Page statementId="stmt-1" documentId={location.pathname.startsWith('/statements/') ? location.pathname.split('/').pop() : 'doc-1'}/>);`, loader: "tsx", resolveDir: process.cwd() },
  bundle: true, write: false, jsx: "automatic", platform: "browser", define: { "process.env.NODE_ENV": '"development"', "process.env": '{}' }, alias: { "@": `${process.cwd()}/src` },
  plugins: [{ name: "fixture-adapters", setup(builder) {
    builder.onResolve({ filter: /^(next\/(navigation|link|image|dynamic)|@\/lib\/(auth-client|powersync))$/ }, (args) => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({ contents: stubs[args.path], loader: "tsx", resolveDir: process.cwd() }));
    builder.onLoad({ filter: /(?:social-media-card-generator-modal|property-image-uploader|location-coordinate-picker)\.tsx$/ }, () => ({ contents: "export default () => null;", loader: "tsx" }));
    // The catalog owns selection persistence; detailed map/media internals are outside this test.
    builder.onLoad({ filter: /property-360-detail-modal\.tsx$/ }, () => ({ contents: `import React from 'react'; export default ({property,onClose})=>property?<div role="dialog" aria-label="Property details"><h2>{property.title}</h2><button onClick={onClose}>Close details</button></div>:null;`, loader: "tsx" }));
  } }],
});
const css = await postcss([tailwind("./tailwind.config.ts")]).process(await readFile("src/app/globals.css", "utf8"), { from: "src/app/globals.css" });
const server = createServer((_req, res) => { res.setHeader("Content-Type", "text/html"); res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`); });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

// Create an empty typed analytics fixture; all financial metrics remain zero.
const source = ts.createSourceFile("types.ts", await readFile("src/lib/analytics/types.ts", "utf8"), ts.ScriptTarget.Latest);
const aliases = new Map(source.statements.filter(ts.isTypeAliasDeclaration).map((node) => [node.name.text, node.type]));
function empty(node) {
  if (!node) return {};
  if (ts.isTypeReferenceNode(node)) return empty(aliases.get(node.typeName.getText(source)));
  if (ts.isTypeLiteralNode(node)) return Object.fromEntries(node.members.filter(ts.isPropertySignature).map((member) => [member.name.getText(source), empty(member.type)]));
  if (ts.isArrayTypeNode(node)) return [];
  if (ts.isUnionTypeNode(node)) return empty(node.types[0]);
  if (ts.isLiteralTypeNode(node)) return ts.isStringLiteral(node.literal) ? node.literal.text : null;
  if (node.kind === ts.SyntaxKind.NumberKeyword) return 0;
  if (node.kind === ts.SyntaxKind.StringKeyword) return "";
  return {};
}
const narrative = { executiveSummaryText: "Fixture insights for September.", whatIsWorking: [], whatNeedsAttention: [], actionPlan: { immediatePriority1: ["Review pipeline"], thisWeekPriority2: [], nextMonthPriority3: [] }, conclusionText: "Fixture conclusion." };
const report = empty(aliases.get("ContourReportPayload"));
Object.assign(report.meta, { companyName: "Fixture Agency", currency: "ZMW", generatedAt: "2026-10-05T08:00:00Z", preparedBy: "Test operator" });
Object.assign(report.period, { from: "2026-09-01", to: "2026-09-30", label: "September 2026", days: 30 });
report.aiNarrative = narrative;
const property = { id: "p1", title: "Fixture Property", suburb: "Roma", city: "Lusaka", propertyType: "HOUSE", listingType: "BOTH", currency: "ZMW", askingPrice: 5000, status: "AVAILABLE", ownershipType: "MANAGED", photos: [], imageUrls: [], assignedAgentId: "operator" };
const client = { id: "c1", name: "Fixture Client", phone: "+260971234567", status: "NEW_INQUIRY", propertyType: "HOUSE", preferredSuburbs: ["Roma"], lookingFor: "FOR_RENT", currency: "ZMW", budgetMax: 5000, assignedAgentId: "operator", createdAt: "2026-10-01" };
const lease = { id: "l1", propertyId: "p1", property, tenantName: "Fixture Tenant", tenantPhone: "+260971234567", monthlyRent: 5000, currency: "ZMW", status: "ACTIVE", leaseStartDate: "2026-09-01", leaseEndDate: "2027-09-01", openingBalanceVerifiedAt: "2026-09-01", openingBalance: "0", openingBalanceMonth: 9, openingBalanceYear: 2026 };
const sale = { id: "s1", property, propertyId: "p1", inquiry: { clientName: "Fixture Buyer" }, grossValue: 100000, currency: "ZMW", transactionType: "PROPERTY_SALE", transferStatus: "SALE_AGREED", createdAt: "2026-09-30" };
const statement = { id: "stmt-1", property, landlordName: "Fixture Landlord", currency: "ZMW", statementMonth: 9, statementYear: 2026, status: "DRAFT", createdAt: "2026-10-05", approvedAt: null, rentDue: "6000.00", grossRentCollected: "5000.00", agencyFeeDeducted: "500.00", maintenanceDeducted: "250.00", netLandlordPayout: "4250.00", arrearsBroughtForward: "1000.00", arrearsClosing: "2000.00", organization: { name: "Fixture Agency", logo: null, profile: null } };
const documents = new Map();
const documentFixture = (input, id) => ({ id, revision: 1, generationInput: input, snapshot: { version: 1, kind: input.kind, title: input.kind === "TENANT" ? "Tenant rental statement" : input.kind === "SALE" ? "Property sale statement" : input.kind === "SALE_COMMISSION" ? "Internal sale commission statement" : "Agent commission statement", period: "September 2026", asOf: "2026-10-05T08:00:00Z", organization: { name: "Fixture Agency", logo: null, address: null, phone: null, email: null }, details: [["Prepared for", input.recipient?.name || "Test operator"], ["Property", "Fixture Property"], ...(input.kind === "TENANT" ? [["Recipient address", "A\n".repeat(150)], ["Email", "synthetic@example.test"], ["Phone", "+260971234567"], ["Lease reference", "l1"], ["Rent due day", "5"], ["Location", "Roma, Lusaka"]] : [])], notices: ["Fixture saved financial document.", ...(input.notes ? [input.notes] : [])], sourceTransactionIds: [], sections: [{ title: "Recorded ledger", columns: ["Reference", "Description", "Amount"], rows: Array.from({ length: 23 }, (_, i) => [`ROW-${i + 1}`, i === 0 ? "Opening balance" : "Confirmed recorded transaction", "K 1,000"]) }] } });
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let aiFailure = false;
  let missingSnapshot = false;
  let statementFailure = false;
  const requests = [], writes = [];
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(url.pathname + url.search); if (request.method() === "POST") writes.push(url.pathname);
    let body = { success: true, properties: [property], clients: [client], contacts: [{ id: "contact-1", name: "Fixture Buyer", phone: "+260971234567" }], leases: [lease], transactions: [sale], statements: [statement], notifications: [], unreadCount: 0, members: [], agents: [{ id: "operator", name: "Test operator" }], matches: [], pagination: { page: 1, totalPages: 1, total: 1 } };
    let status = 200;
    if (url.pathname === "/api/properties" && url.searchParams.has("status")) body = { success: true, properties: url.searchParams.get("page") === "1" ? [{ ...property, id: "rental-only", listingType: "FOR_RENT" }] : [{ ...property, status: "UNDER_OFFER" }], pagination: { totalPages: 2 } };
    else if (url.pathname === "/api/analytics/report") body = { success: true, report: { ...report, aiNarrative: missingSnapshot ? null : narrative } };
    else if (url.pathname === "/api/analytics/ai-insights") { body = aiFailure ? { success: false, error: "Fixture AI unavailable" } : { success: true, insights: narrative }; status = aiFailure ? 503 : 200; }
    else if (url.pathname === "/api/statements/stmt-1") { body = statementFailure ? { success: false, error: "Statement not found." } : { success: true, statement }; status = statementFailure ? 404 : 200; }
    else if (url.pathname === "/api/statements" && request.method() === "POST") { assert.equal(request.postDataJSON().propertyId, "p1"); body = { success: true, statement }; }
    else if (url.pathname === "/api/statement-payment-instructions") body = { success: true, canManage: true, instructions: [{ id: "bank-1", label: "Agency bank account", method: "BANK_TRANSFER", active: true, details: { accountHolder: "Fixture Agency", bank: "Fixture Bank", accountNumber: "123456", branch: "", reference: "Rent", recipientPhone: "", instructions: "" } }] };
    else if (url.pathname === "/api/statement-documents" && request.method() === "POST") { const input = request.postDataJSON(); const id = `doc-${documents.size + 1}`; documents.set(id, documentFixture(input, id)); body = { success: true, id }; }
    else if (url.pathname.startsWith("/api/statement-documents/")) { const doc = documents.get(url.pathname.split("/").pop()); body = doc ? { success: true, ...doc } : { error: "Statement not found." }; status = doc ? 200 : 404; }
    else if (url.pathname === "/api/contacts" && request.method() === "POST") { const input = request.postDataJSON(); assert.equal(input.name, "Synthetic New Buyer"); body = { success: true, contact: { id: "contact-1", name: input.name, phone: input.phone } }; }
    else if (url.pathname === "/api/sales/closing" && request.method() === "POST") { const input = request.postDataJSON(); assert.equal(input.contactId, "contact-1"); assert.equal(input.propertyId, "p1"); assert.equal(input.closingAgentId, "operator"); body = { success: true, inquiryId: "closing-1" }; }
    else if (url.pathname === "/api/clients/closing-1/closing-workflow") body = { success: true, workflow: { id: "wf", status: "OPEN", items: [] }, readiness: { ready: false, pending: 1, blocked: 0 }, deal: { inquiryId: "closing-1", transactionType: "PROPERTY_SALE", client: { name: "Fixture Buyer", phone: "+260971234567" }, property, documentRequests: [] } };
    else if (url.pathname === "/api/agent/summary") body = { success: true, agent: { id: "operator", name: "Test operator" }, metrics: {}, deals: [], queue: [], earnings: { period: url.searchParams.get("earningsPeriod"), asOf: "2026-10-05T08:00:00Z", periodLabel: "Selected fixture period", currencyTotals: { ZMW: { paid: 0, earned: 2000, pending: 0 } }, slips: [{ id: "s1", property: "Fixture Property", date: "30 Sep 2026", agentSplit: "K 2,000", splitPct: "40%", grossCommission: "K 5,000", status: "EARNED" }] } };
    else assert.equal(request.method(), "GET", "Refresh checks must not write tenant data");
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  // All six creation shortcuts are consumed, and a refresh cannot replay them.
  const creationHeading = { properties: /Add New Property Mandate/, clients: /Register Client Inquiry/, contacts: /Add contact/i, leases: /Create New Lease Agreement/, sales: /Start property sale closing/, statements: /Generate Landlord Remittance Statement/ };
  for (const surface of surfaces.slice(0, 6)) {
    await page.goto(`${base}/?surface=${surface}&new=1`);
    await page.getByRole("heading", { name: creationHeading[surface] }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("new"), null);
    await page.reload();
    await page.waitForTimeout(350);
    assert.equal(await page.getByRole("heading", { name: creationHeading[surface] }).count(), 0);
    console.log(`PASS ${surface}: creation consumed across refresh`);
  }
  await page.goto(`${base}/?surface=clients&tab=contacts&new=1`);
  await page.getByRole("heading", { name: /Add contact/i }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Register Client Inquiry" }).count(), 0);
  await page.reload();
  await page.waitForTimeout(350);
  assert.equal(await page.getByRole("heading", { name: /Add contact/i }).count(), 0);
  console.log("PASS clients contacts shortcut: opens only contact form and is consumed");
  const prefill = encodeURIComponent(JSON.stringify({ propertyId: "p1", tenantName: "Prefilled Tenant", monthlyRent: 5000, currency: "ZMW" }));
  await page.goto(`${base}/?surface=leases&new=1&prefill=${prefill}`);
  await page.getByPlaceholder("e.g. Michael Phiri").waitFor();
  assert.equal(await page.getByPlaceholder("e.g. Michael Phiri").inputValue(), "Prefilled Tenant");
  assert.equal(new URL(page.url()).searchParams.get("prefill"), null);
  console.log("PASS leases: prefill is captured before URL cleanup");
  // URL-selected records are restored from API rows and removed when closed.
  for (const [surface, field, id] of [["properties", "propertyId", "p1"], ["clients", "clientId", "c1"], ["leases", "leaseId", "l1"], ["sales", "saleId", "s1"]]) {
    await page.goto(`${base}/?surface=${surface}&${field}=${id}`);
    await page.getByRole("dialog").waitFor();
    await page.reload();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Close details", exact: true }).click();
    assert.equal(new URL(page.url()).searchParams.get(field), null);
    await page.reload();
    await page.waitForTimeout(350);
    assert.equal(await page.getByRole("dialog").count(), 0);
    console.log(`PASS ${surface}: selected record restored and closed across refresh`);
  }
  await page.goto(`${base}/?surface=contacts&search=Mary`);
  await page.getByPlaceholder(/Search/).waitFor();
  assert.equal(await page.getByPlaceholder(/Search/).inputValue(), "Mary");
  await page.getByPlaceholder(/Search/).fill("Grace");
  await page.reload();
  assert.equal(await page.getByPlaceholder(/Search/).inputValue(), "Grace");
  console.log("PASS contacts: search persists across refresh");

  // AI failure blocks the entire viewer and export controls; retry recovers.
  missingSnapshot = true; aiFailure = true;
  const viewer = `${base}/?surface=print&preset=custom&from=2026-09-01&to=2026-09-30&title=September%20Report`;
  await page.goto(viewer);
  await page.getByRole("alert").filter({ hasText: "Fixture AI unavailable" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Download PDF" }).count(), 0);
  aiFailure = false;
  await page.getByRole("button", { name: "Retry report generation" }).click();
  await page.getByRole("button", { name: "Download PDF" }).waitFor();
  await page.getByText("Fixture insights for September.", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Download PDF" }).waitFor();
  assert(requests.includes("/api/analytics/report?preset=custom&from=2026-09-01&to=2026-09-30"));
  const output = process.env.CONTOUR_QA_OUTPUT || ".artifacts/refresh-analytics";
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: `${output}/analytics-viewer.png` });
  console.log("PASS analytics viewer: selected period, AI failure gating, retry and reload");

  // Blocked popup errors remain visible, and the ready report can be opened again.
  missingSnapshot = false;
  await page.goto(`${base}/?surface=analytics`);
  await page.getByRole("button", { name: "Generate PDF Report", exact: true }).click();
  await page.getByRole("button", { name: /Custom/i }).click();
  const dates = page.locator('input[type="date"]');
  await dates.nth(0).fill("2026-09-01"); await dates.nth(1).fill("2026-09-30");
  await page.getByPlaceholder("Business Intelligence & Performance Report").fill("September Report");
  await page.getByRole("button", { name: "Generate & Open Multi-Page PDF Viewer", exact: true }).click();
  await page.getByRole("button", { name: "Open report viewer" }).waitFor();
  await page.evaluate(() => { window.originalOpen = window.open; window.open = () => null; });
  await page.getByRole("button", { name: "Open report viewer" }).click();
  await page.getByRole("alert").filter({ hasText: "blocked the report window" }).waitFor();
  await page.screenshot({ path: `${output}/analytics-popup-error.png` });
  await page.evaluate(() => { window.open = window.originalOpen; });
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "Open report viewer" }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  const popupUrl = new URL(popup.url());
  assert.equal(popupUrl.searchParams.get("preset"), "custom");
  assert.equal(popupUrl.searchParams.get("from"), "2026-09-01");
  assert.equal(popupUrl.searchParams.get("to"), "2026-09-30");
  assert.equal(popupUrl.searchParams.get("title"), "September Report");
  assert.equal(await page.getByRole("alert").count(), 0);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("contour-analytics-generated-report")), null);
  console.log("PASS analytics wizard: visible blocked-popup error, retry and complete period URL");

  // Landlord generation stays in the lease dialog until the user opens its saved viewer.
  await popup.close();
  await page.goto(`${base}/?surface=leases&leaseId=l1`);
  const leaseDialog = page.getByRole("dialog");
  await leaseDialog.waitFor();
  const pagesBefore = context.pages().length;
  await leaseDialog.getByRole("button", { name: "Generate statement", exact: true }).click();
  await leaseDialog.getByRole("link", { name: "Open statement viewer" }).waitFor();
  assert.equal(context.pages().length, pagesBefore, "Generation must not open an empty async popup");
  const statementPopupPromise = context.waitForEvent("page");
  await leaseDialog.getByRole("link", { name: "Open statement viewer" }).click();
  const statementPopup = await statementPopupPromise;
  await statementPopup.getByRole("button", { name: "Download PDF", exact: true }).waitFor();
  await statementPopup.getByRole("button", { name: "Print statement", exact: true }).waitFor();
  await statementPopup.getByText("Fixture Landlord", { exact: true }).waitFor();
  await statementPopup.getByText(/does not confirm a landlord payout/).waitFor();
  assert.match(statementPopup.url(), /\/dashboard\/statements\/stmt-1\/print$/);
  await statementPopup.screenshot({ path: `${output}/landlord-statement-viewer.png` });
  await statementPopup.reload();
  await statementPopup.getByRole("button", { name: "Download PDF", exact: true }).waitFor();
  const downloadPromise = statementPopup.waitForEvent("download");
  await statementPopup.getByRole("button", { name: "Download PDF", exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs(`${output}/landlord-statement.pdf`);
  const pdf = await readFile(`${output}/landlord-statement.pdf`);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.equal((pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length, 1);
  // Real Chromium print-to-PDF verifies the print stylesheet and hides workspace controls.
  await statementPopup.emulateMedia({ media: "print" });
  assert.equal(await statementPopup.getByRole("button", { name: "Download PDF", exact: true }).isVisible(), false);
  await statementPopup.pdf({ path: `${output}/landlord-statement-print.pdf`, preferCSSPageSize: true, printBackground: true });
  await statementPopup.emulateMedia({ media: "screen" });
  await statementPopup.evaluate(() => { window.printCalls = 0; window.print = () => { window.printCalls++; }; });
  await statementPopup.getByRole("button", { name: "Print statement", exact: true }).click();
  assert.equal(await statementPopup.evaluate(() => window.printCalls), 1);
  console.log("PASS landlord statement: lease generation, saved viewer, real one-page PDF download and print layout");
  await statementPopup.close();

  await page.goto(`${base}/?surface=statements`);
  const savedStatement = page.getByRole("link", { name: "View / download statement" });
  await savedStatement.waitFor();
  assert.equal(await savedStatement.getAttribute("href"), "/dashboard/statements/stmt-1/print");
  await page.goto(`${base}/?surface=statementPrint`);
  await page.getByRole("button", { name: "Download PDF", exact: true }).waitFor();
  statementFailure = true;
  await page.reload();
  await page.getByRole("alert").filter({ hasText: "Statement not found." }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Download PDF", exact: true }).count(), 0);
  statementFailure = false;
  await page.getByRole("button", { name: "Retry loading statement" }).click();
  await page.getByRole("button", { name: "Download PDF", exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole("button", { name: "Download PDF", exact: true }).waitFor();
  assert(await page.getByRole("button", { name: "Print statement", exact: true }).isVisible());
  await page.screenshot({ path: `${output}/landlord-statement-mobile.png` });
  console.log("PASS landlord statement: list viewer link, denied/missing error, retry and mobile controls");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}/?surface=leases&leaseId=l1`);
  await page.getByRole("button", { name: "Prepare tenant statement", exact: true }).click();
  const tenantDialog = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Prepare tenant statement", exact: true }) });
  await tenantDialog.getByLabel("Tenant / recipient name").fill("Edited tenant recipient");
  await tenantDialog.getByLabel("Recipient address").fill("12 Fixture Road, Lusaka");
  await tenantDialog.getByLabel("Statement notes (optional)").fill("N\n".repeat(250));
  await tenantDialog.getByLabel(/Agency bank account/).check();
  await tenantDialog.getByRole("button", { name: "Generate tenant statement", exact: true }).click();
  const tenantPopupPromise = context.waitForEvent("page");
  await tenantDialog.getByRole("link", { name: "Open tenant statement viewer" }).click();
  const tenantPopup = await tenantPopupPromise;
  await tenantPopup.getByRole("button", { name: "Download PDF", exact: true }).waitFor();
  await tenantPopup.getByText("Edited tenant recipient", { exact: true }).waitFor();
  await tenantPopup.getByText("ROW-23", { exact: true }).waitFor();
  await tenantPopup.waitForTimeout(500);
  assert(await tenantPopup.locator(".statement-paper").count() >= 3);
  assert.deepEqual(await tenantPopup.locator(".statement-paper").evaluateAll(pages => pages.map(p => p.scrollHeight <= p.clientHeight + 2)), Array(await tenantPopup.locator(".statement-paper").count()).fill(true));
  const tenantDownloadPromise = tenantPopup.waitForEvent("download");
  await tenantPopup.getByRole("button", { name: "Download PDF", exact: true }).click();
  await (await tenantDownloadPromise).saveAs(`${output}/tenant-statement.pdf`);
  const tenantPdf = await readFile(`${output}/tenant-statement.pdf`);
  const pagesInPdf = (tenantPdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length;
  assert.equal(pagesInPdf, await tenantPopup.locator(".statement-paper").count());
  await tenantPopup.pdf({ path: `${output}/tenant-statement-print.pdf`, preferCSSPageSize: true, printBackground: true });
  await tenantPopup.setViewportSize({ width: 390, height: 844 }); await tenantPopup.reload();
  await tenantPopup.getByRole("button", { name: "Print statement", exact: true }).waitFor();
  await tenantPopup.screenshot({ path: `${output}/tenant-statement-mobile.png` });
  await tenantPopup.close();
  console.log("PASS tenant statement: edited recipient, configured method, saved viewer, multi-page actual PDF/print, no clipped rows and mobile");

  async function checkStatementExport(link, title, filename) {
    const opened = context.waitForEvent("page"); await link.click(); const viewer = await opened;
    await viewer.getByRole("heading", { name: title, exact: true }).first().waitFor();
    const downloading = viewer.waitForEvent("download"); await viewer.getByRole("button", { name: "Download PDF", exact: true }).click();
    const artifact = await downloading; await artifact.saveAs(`${output}/${filename}.pdf`);
    const bytes = await readFile(`${output}/${filename}.pdf`);
    assert.equal((bytes.toString("latin1").match(/\/Type \/Page\b/g) || []).length, await viewer.locator(".statement-paper").count());
    await viewer.getByRole("button", { name: "Print statement", exact: true }).waitFor();
    await viewer.pdf({ path: `${output}/${filename}-print.pdf`, preferCSSPageSize: true, printBackground: true }); await viewer.close();
  }
  await page.goto(`${base}/?surface=sales&saleId=s1`);
  await page.getByRole("button", { name: "Generate sale statement", exact: true }).click();
  await page.getByRole("link", { name: "Open statement viewer" }).waitFor();
  await checkStatementExport(page.getByRole("link", { name: "Open statement viewer" }), "Property sale statement", "sale-statement");
  await page.getByRole("button", { name: "Generate internal commission statement", exact: true }).click();
  await page.getByRole("link", { name: "Open statement viewer" }).last().waitFor();
  await checkStatementExport(page.getByRole("link", { name: "Open statement viewer" }).last(), "Internal sale commission statement", "sale-commission-statement");
  await page.getByRole("button", { name: "Close details", exact: true }).click();
  await page.getByRole("button", { name: "Record Sale", exact: true }).click();
  await page.getByLabel("Property", { exact: true }).selectOption("p1");
  await page.getByRole("button", { name: "Add new client contact", exact: true }).click();
  const contactDialog = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Add Contact", exact: true }) });
  await contactDialog.getByLabel("Full name *", { exact: true }).fill("Synthetic New Buyer");
  await contactDialog.getByLabel("Phone number *", { exact: true }).fill("971234567");
  await contactDialog.getByRole("button", { name: "Save contact", exact: true }).click();
  await page.getByLabel("Client / buyer contact", { exact: true }).selectOption("contact-1");
  await page.getByLabel("Closing agent", { exact: true }).selectOption("operator");
  await page.getByRole("button", { name: "Start / resume closing workflow", exact: true }).click();
  await page.getByRole("heading", { name: "Closing requirements", exact: true }).waitFor();
  assert(!writes.includes("/api/sales"));
  console.log("PASS sales: separate statement actions, contact/property selection and existing closing workflow entry");

  await page.goto(`${base}/?surface=agent`);
  await page.waitForTimeout(1000); assert.deepEqual(errors, [], "Before PWA checks");
  await page.getByRole("button", { name: "Earnings", exact: true }).click();
  await page.getByLabel("Earnings duration").selectOption("month");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Generate commission statement", exact: true }).click();
  await page.getByRole("link", { name: "Open statement viewer" }).waitFor();
  await checkStatementExport(page.getByRole("link", { name: "Open statement viewer" }), "Agent commission statement", "agent-period-statement");
  await page.getByRole("button", { name: "View Digital Commission Slip", exact: true }).click();
  await page.getByText("Agent Split (40%):", { exact: true }).waitFor();
  assert.equal(await page.getByText("Settlement verified and cleared to agent bank account.", { exact: true }).count(), 0);
  await page.getByRole("button", { name: "Generate deal commission statement", exact: true }).click();
  const dealStatementLink = page.locator("div").filter({ has: page.getByRole("button", { name: "Generate deal commission statement", exact: true }) }).filter({ has: page.getByRole("button", { name: "Close statement", exact: true }) }).last().getByRole("link", { name: "Open statement viewer" });
  await dealStatementLink.waitFor();
  await checkStatementExport(dealStatementLink, "Agent commission statement", "agent-deal-statement");
  assert([...documents.values()].some(d => d.generationInput.kind === "AGENT_COMMISSION" && d.generationInput.period === "month"));
  console.log("PASS Agent PWA: selected earnings filter, own-deal generation, recorded split and truthful payout status");
  assert.deepEqual(errors, [], "No browser runtime errors");
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
