import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import postcss from "postcss";
import tailwind from "tailwindcss";

// Render the real dashboard and PWA pages. Only Next routing, authenticated
// session, offline provider and unrelated media widgets are fixture adapters.
// API requests are intercepted: this test cannot mutate live tenant data.
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("tsx/package.json"))("esbuild");
const stubs = {
  "next/link": `import React from 'react'; export default function Link({children,...props}) { return <a {...props}>{children}</a>; }`,
  "next/image": `import React from 'react'; export default function Image({fill,unoptimized,priority,...props}) { return <img {...props}/>; }`,
  "next/navigation": `export const useRouter = () => ({push(){},replace(){},refresh(){}}); export const useSearchParams = () => new URLSearchParams(location.search);`,
  "next/dynamic": `export default () => () => null;`,
  "@/lib/auth-client": `const session = {user:{id:'agent',name:'Test operator',role:new URLSearchParams(location.search).get('role') || 'OWNER'},session:{activeOrganizationId:'org'}}; export const authClient = {useSession:()=>({data:session,isPending:false}),signOut:async()=>{}}; export const signOut = async()=>{};`,
  "@/lib/powersync": `import React from 'react'; const syncData=async()=>{}; const noop=()=>{}; const state={isOnline:!location.search.includes('offline=1'),loading:false,properties:[],clients:[],outboxCount:0,toggleNetwork:noop,syncData,addToOutbox:noop,playNeutralTone:noop,playSuccessTone:noop}; export const usePowerSync=()=>state; export const PowerSyncProvider=({children})=><>{children}</>;`,
};
const bundle = await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Pipeline from './src/app/(dashboard)/dashboard/pipeline/page'; import Agent from './src/app/(kiosk)/agent/page'; createRoot(document.getElementById('root')).render(location.search.includes('surface=pwa') ? <Agent/> : <Pipeline/>);`, loader: "tsx", resolveDir: process.cwd() },
  bundle: true, write: false, jsx: "automatic", platform: "browser", define: { "process.env.NODE_ENV": '"development"', "process.env.NEXT_PUBLIC_DEV_MODE": '"false"' }, alias: { "@": `${process.cwd()}/src` },
  plugins: [{ name: "fixture-adapters", setup(builder) {
    builder.onResolve({ filter: /^(next\/(link|image|navigation|dynamic)|@\/lib\/(auth-client|powersync))$/ }, (args) => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({ contents: stubs[args.path], loader: "tsx", resolveDir: process.cwd() }));
    builder.onLoad({ filter: /(?:social-media-card-generator-modal|property-image-uploader)\.tsx$/ }, () => ({ contents: "export default () => null;", loader: "tsx" }));
  } }],
});
const css = await postcss([tailwind("./tailwind.config.ts")]).process(await readFile("src/app/globals.css", "utf8"), { from: "src/app/globals.css" });
const server = createServer((_req, res) => { res.setHeader("Content-Type", "text/html"); res.end(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css.css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`); });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const property = { id: "best", title: "Best property", suburb: "Roma", listingType: "FOR_SALE", currency: "ZMW", status: "AVAILABLE" };
const row = (id, score, hardFailures = []) => ({ propertyId: id, score, isMatch: score > 70, reasons: ["Property type"], hardFailures, unmetPreferences: [], missingData: [], effectivePrice: 100000, property: { ...property, id, title: id === "best" ? "Best property" : id === "low" ? "Low match property" : "Rejected property" } });
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const surface of ["dashboard", "pwa"]) for (const width of [1280, 390]) for (const role of surface === "pwa" ? ["OWNER", "FIELD_AGENT"] : ["OWNER"]) {
    for (const scenario of ["assign", "linked", "dismiss", "empty", "assignment-error", "load-error", "lost", "cancelled", ...(surface === "pwa" ? ["offline"] : [])]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      page.setDefaultTimeout(10000);
      const errors = []; page.on("pageerror", (error) => { errors.push(error.message); console.error("Browser runtime:", error.message); });
      const writes = []; let attached = scenario === "linked" ? property : null, stage = "NEW_INQUIRY", outcome = null;
      const inquiry = () => ({ id: "inquiry", clientName: "Test client", clientPhone: "260000000000", assignedAgentId: "agent", assignedAgent: { id: "agent", name: "Test operator" }, propertyId: attached?.id || null, property: attached, status: stage, outcome, lookingFor: "FOR_SALE", currency: "ZMW", updatedAt: new Date().toISOString() });
      await page.route("**/api/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        const json = (payload, status = 200) => route.fulfill({ status, json: payload });
        if (path.endsWith("/available-properties")) return scenario === "load-error" ? json({ error: "Inventory service unavailable" }, 503) : json({ success: true, results: scenario === "empty" ? [] : [row("best", 96), row("low", 40), row("rejected", 0, ["Currency mismatch"])], total: scenario === "empty" ? 0 : 3, page: 1, pageSize: 20, hasMore: false, inquiry: { id: "inquiry", propertyId: null } });
        if (path === "/api/agent/matching/attach") {
          writes.push({ kind: "attach", body: route.request().postDataJSON() });
          if (scenario === "assignment-error") return json({ success: false, error: "Property is no longer available" }, 409);
          attached = property; return json({ success: true, inquiry: inquiry() });
        }
        if (path.endsWith("/transition")) {
          const body = route.request().postDataJSON(); writes.push({ kind: "transition", body });
          if (!attached && !["LOST", "CANCELLED"].includes(body.outcome)) return json({ error: "Assign a property", code: "PROPERTY_REQUIRED" }, 409);
          stage = body.targetStage; outcome = body.outcome || null; return json({ success: true, inquiry: inquiry() });
        }
        if (path === "/api/clients") return json({ success: true, clients: [inquiry()] });
        if (path === "/api/agent/summary") return json({ success: true, agent: { id: "agent", name: "Test operator", role }, metrics: {}, queue: [], earnings: {}, slips: [], deals: stage === "CLOSED" ? [] : [{ id: "inquiry", clientName: "Test client", propertyId: attached?.id || null, propertyTitle: attached?.title || "Unassigned property", suburb: "Roma", stage, stageLabel: "New enquiry", assignedAgentId: "agent", value: "K 100,000", updatedAt: "Just now" }] });
        if (path === "/api/organization/agents") return json({ success: true, agents: [{ id: "agent", name: "Test operator" }] });
        if (path === "/api/properties") return json({ success: true, properties: [] });
        if (path === "/api/matching/unassigned") return json({ success: true, matches: [], hasMore: false });
        if (path === "/api/notifications/matches") return json({ success: true, notifications: [], unreadCount: 0 });
        return json({ success: true, permissions: role === "OWNER" ? ["dashboard.read"] : [], contacts: [], hasMore: false });
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/?surface=${surface}&role=${role}${scenario === "offline" ? "&offline=1" : ""}`);
      if (surface === "pwa") {
        await page.getByRole("button", { name: "Deals", exact: true }).click();
        await page.getByRole("button", { name: /^Change status/ }).click();
        if (scenario === "lost" || scenario === "cancelled") {
          await page.getByRole("button", { name: scenario === "lost" ? "Mark lost" : "Cancel inquiry", exact: true }).click();
          await page.getByRole("textbox", { name: scenario === "lost" ? "Lost reason" : "Cancellation reason" }).fill("The client withdrew this inquiry.");
          await page.getByRole("button", { name: scenario === "lost" ? "Confirm lost" : "Confirm cancellation", exact: true }).click();
        } else await page.getByRole("button", { name: "Qualified", exact: false }).click();
      } else if (scenario === "lost" || scenario === "cancelled") {
        await page.getByRole("button", { name: scenario === "lost" ? "Mark lost" : "Cancel inquiry", exact: true }).filter({ visible: true }).first().click();
        if (scenario === "lost") {
          await page.getByPlaceholder("Explain what prevented the deal from closing...").fill("The client withdrew this inquiry.");
          await page.getByRole("button", { name: "Save outcome", exact: true }).click();
        } else {
          await page.getByRole("textbox", { name: "Cancellation reason" }).fill("The client withdrew this inquiry.");
          await page.getByRole("button", { name: "Cancel inquiry", exact: true }).filter({ visible: true }).last().click();
        }
      } else if (width < 768) await page.locator('select').filter({ visible: true }).filter({ has: page.locator('option[value="QUALIFIED"]') }).selectOption("QUALIFIED");
      else {
        const card = page.locator('[draggable="true"]').filter({ hasText: "Test client" });
        const target = page.getByRole("region", { name: "Qualified deals", exact: true });
        await card.dragTo(target);
      }
      if (scenario === "linked") {
        if (surface === "dashboard") await page.getByRole("button", { name: "Confirm move", exact: true }).click();
        assert.deepEqual(writes.map((item) => item.kind), ["transition"]); assert.equal(stage, "QUALIFIED");
      } else if (["lost", "cancelled"].includes(scenario)) {
        await page.waitForFunction(() => !document.querySelector('[aria-label="Assign property to continue"]'));
        assert.equal(writes.at(-1)?.body.outcome, scenario === "lost" ? "LOST" : "CANCELLED"); assert.equal(writes.filter((item) => item.kind === "attach").length, 0);
      } else {
        const dialog = page.getByRole("dialog", { name: "Assign property to continue" }); await dialog.waitFor();
        if (scenario === "dismiss") { await dialog.getByRole("button", { name: "Cancel", exact: true }).click(); await dialog.waitFor({ state: "hidden" }); assert.equal(writes.length, 0); assert.equal(stage, "NEW_INQUIRY"); }
        else if (scenario === "empty") { await dialog.getByText("No available properties", { exact: true }).waitFor(); assert.equal(writes.length, 0); }
        else if (scenario === "load-error") { await dialog.getByRole("alert").filter({ hasText: "Inventory service unavailable" }).waitFor(); assert.equal(writes.length, 0); }
        else if (scenario === "offline") { await dialog.getByRole("alert").filter({ hasText: "Reconnect" }).waitFor(); assert.equal(writes.length, 0); }
        else {
          await dialog.getByRole("article", { name: "Best property, 96% match" }).waitFor();
          assert.deepEqual(await dialog.getByRole("article").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label"))), ["Best property, 96% match", "Low match property, 40% match", "Rejected property, 0% match"]);
          assert(await dialog.getByRole("article", { name: "Rejected property, 0% match" }).getByRole("button", { name: "Assign and continue" }).isDisabled());
          await dialog.getByRole("article", { name: "Best property, 96% match" }).getByRole("button", { name: "Assign and continue" }).click();
          if (scenario === "assignment-error") { await dialog.getByRole("alert").filter({ hasText: "no longer available" }).waitFor(); assert.equal(writes.filter((item) => item.kind === "transition").length, 0); }
          else { await dialog.waitFor({ state: "hidden" }); assert.deepEqual(writes.map((item) => item.kind), ["attach", "transition"]); assert.equal(stage, "QUALIFIED"); }
        }
      }
      assert.deepEqual(errors, [], "No browser runtime errors");
      console.log(`PASS ${surface} ${role} ${width}px: ${scenario}`);
      await page.close();
    }
  }
} finally { await browser?.close(); await new Promise((resolve) => server.close(resolve)); }
