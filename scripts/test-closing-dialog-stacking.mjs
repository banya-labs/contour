import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import postcss from "postcss";
import tailwind from "tailwindcss";

// Compile the actual UI components without a tenant, database, or live mutations.
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("tsx/package.json"))("esbuild");
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClosingWorkflowPanel } from './src/components/closing/closing-workflow-panel';
function App() {
  const [open, setOpen] = useState(false);
  return <div style={location.search ? {transform: 'translateZ(0)', height: 300, overflow: 'hidden'} : {}}>
    <button onClick={() => setOpen(true)}>Open closing</button>
    {open && <ClosingWorkflowPanel inquiryId="test" onClose={() => setOpen(false)} onCompleted={() => setOpen(false)} />}
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);`;
const bundle = await build({ stdin: { contents: fixture, loader: "tsx", resolveDir: process.cwd() }, bundle: true, write: false, jsx: "automatic", platform: "browser", define: { "process.env.NODE_ENV": '"development"' }, alias: { "@": `${process.cwd()}/src` } });
const sources = await Promise.all([
  "src/components/ui/dialog.tsx", "src/components/closing/closing-workflow-panel.tsx",
  "src/components/closing/start-lease-dialog.tsx", "src/components/vault/upload-document-modal.tsx",
  "src/components/vault/request-document-modal.tsx",
].map((file) => readFile(file, "utf8")));
const css = await postcss([tailwind({ content: sources.map((raw) => ({ raw, extension: "tsx" })), theme: { extend: {} }, plugins: [] })]).process("@tailwind base; @tailwind utilities;", { from: undefined });
const server = createServer((_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(`<html><head><style>${css.css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    for (const clipped of [false, true]) {
    const page = await browser.newPage({ viewport });
    page.setDefaultTimeout(8000);
    let rental = false;
    await page.route("**/api/clients/test/closing-workflow", (route) => route.fulfill({ json: {
      workflow: { id: "workflow", status: "OPEN", items: [{ id: "item", key: "title", label: "Title evidence", required: true, status: "PENDING", assigneeType: "AGENT", evidenceType: "DOCUMENT" }] },
      readiness: { ready: false, pending: 1, blocked: 0 },
      deal: { inquiryId: "test", transactionType: rental ? "RENTAL_PLACEMENT" : "PROPERTY_SALE", client: { name: "Test client", phone: "" }, property: { id: "property", title: "Test property", suburb: "Test suburb", currency: "ZMW" }, documentRequests: [] },
    } }));
    await page.goto(`http://127.0.0.1:${server.address().port}${clipped ? "?clipped=1" : ""}`);
    await page.getByRole("button", { name: "Open closing", exact: true }).click();
    await page.getByRole("button", { name: "Upload file", exact: true }).waitFor();
    assert(await page.getByText("Closing requirements", { exact: true }).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    }), "Closing header must remain inside the viewport, even in a clipped layout");
    await page.getByRole("button", { name: "Upload file", exact: true }).click();
    const upload = page.getByRole("dialog");
    await upload.waitFor();
    assert.equal(await upload.evaluate((element) => getComputedStyle(element).zIndex), "90", "Nested upload must use the closing workflow's next layer");
    await upload.getByPlaceholder("e.g. Certificate of Title").fill("Regression evidence");
    // Visibility alone does not detect a dialog covered by another overlay.
    assert(await upload.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }), "Upload dialog must be above the closing panel");
    await upload.getByRole("button", { name: "Close", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('[role="dialog"][data-state="closed"]'));
    await page.getByRole("button", { name: "Request documents", exact: true }).click();
    const request = page.getByRole("dialog");
    await page.waitForFunction((element) => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }, await request.elementHandle(), { timeout: 3000 });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Upload file", exact: true }).waitFor();
    await page.getByRole("dialog", { name: "Closing requirements", exact: true }).getByRole("button", { name: "Close", exact: true }).first().click();
    rental = true;
    await page.getByRole("button", { name: "Open closing", exact: true }).click();
    await page.getByRole("button", { name: "Start lease for Test client" }).click();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("dialog", { name: "Closing requirements", exact: true }).getByRole("button", { name: "Close", exact: true }).first().click();
    console.log(`PASS closing upload, request, lease and return flow at ${viewport.width}px (${clipped ? "clipped layout" : "normal layout"})`);
    await page.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
