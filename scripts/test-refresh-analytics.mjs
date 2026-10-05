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
  "@/lib/auth-client": `export const useSession=()=>({data:{user:{id:'operator',name:'Test operator',role:'OWNER'},session:{activeOrganizationId:'fixture-org'}},isPending:false}); export const authClient={useSession};`,
};
const surfaces = ["properties", "clients", "contacts", "leases", "sales", "statements", "analytics", "print"];
const imports = surfaces.map((surface, i) => `import P${i} from './src/app/(dashboard)/dashboard/${surface === "print" ? "analytics/print" : surface}/page';`).join("\n");
const bundle = await build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';${imports}
const pages={${surfaces.map((surface, i) => `${surface}:P${i}`).join(",")}};const Page=pages[new URLSearchParams(location.search).get('surface')];createRoot(document.getElementById('root')).render(<Page/>);`, loader: "tsx", resolveDir: process.cwd() },
  bundle: true, write: false, jsx: "automatic", platform: "browser", define: { "process.env.NODE_ENV": '"development"' }, alias: { "@": `${process.cwd()}/src` },
  plugins: [{ name: "fixture-adapters", setup(builder) {
    builder.onResolve({ filter: /^(next\/(navigation|link|image|dynamic)|@\/lib\/auth-client)$/ }, (args) => ({ path: args.path, namespace: "fixture" }));
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
const property = { id: "p1", title: "Fixture Property", suburb: "Roma", city: "Lusaka", propertyType: "HOUSE", listingType: "FOR_RENT", currency: "ZMW", askingPrice: 5000, status: "AVAILABLE", ownershipType: "MANAGED", photos: [], imageUrls: [], assignedAgentId: "operator" };
const client = { id: "c1", name: "Fixture Client", phone: "+260971234567", status: "NEW_INQUIRY", propertyType: "HOUSE", preferredSuburbs: ["Roma"], lookingFor: "FOR_RENT", currency: "ZMW", budgetMax: 5000, assignedAgentId: "operator", createdAt: "2026-10-01" };
const lease = { id: "l1", propertyId: "p1", property, tenantName: "Fixture Tenant", monthlyRent: 5000, currency: "ZMW", status: "ACTIVE", leaseStartDate: "2026-09-01", leaseEndDate: "2027-09-01" };
const sale = { id: "s1", property, propertyId: "p1", inquiry: { clientName: "Fixture Buyer" }, grossValue: 100000, currency: "ZMW", transactionType: "PROPERTY_SALE", transferStatus: "SALE_AGREED", createdAt: "2026-09-30" };
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let aiFailure = false;
  let missingSnapshot = false;
  const requests = [];
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(url.pathname + url.search);
    let body = { success: true, properties: [property], clients: [client], contacts: [], leases: [lease], transactions: [sale], statements: [], members: [], agents: [], matches: [], pagination: { page: 1, totalPages: 1, total: 1 } };
    let status = 200;
    if (url.pathname === "/api/analytics/report") body = { success: true, report: { ...report, aiNarrative: missingSnapshot ? null : narrative } };
    else if (url.pathname === "/api/analytics/ai-insights") { body = aiFailure ? { success: false, error: "Fixture AI unavailable" } : { success: true, insights: narrative }; status = aiFailure ? 503 : 200; }
    else assert.equal(request.method(), "GET", "Refresh checks must not write tenant data");
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // All six creation shortcuts are consumed, and a refresh cannot replay them.
  const creationHeading = { properties: /Add New Property Mandate/, clients: /Register Client Inquiry/, contacts: /Add contact/i, leases: /Create New Lease Agreement/, sales: /Record Property Sale/, statements: /Generate Landlord Remittance Statement/ };
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
  assert.deepEqual(errors, [], "No browser runtime errors");
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
