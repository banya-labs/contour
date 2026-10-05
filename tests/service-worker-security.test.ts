import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
describe("service worker account boundary", () => {
  it("never caches signed-in navigation HTML and uses the neutral offline page on network failure", async () => {
    const handlers: Record<string, (event: unknown) => void> = {};
    const put = vi.fn(), match = vi.fn().mockResolvedValue("neutral offline"), network = vi.fn().mockResolvedValue("signed-in HTML");
    runInNewContext(readFileSync("public/service-worker.js", "utf8"), { URL, fetch: network, caches: { match, open: vi.fn().mockResolvedValue({ put }) }, self: { location: { origin: "https://example.test" }, addEventListener: (name: string, fn: (event: unknown) => void) => { handlers[name] = fn; } } });
    let response: Promise<string> | undefined;
    const event = { request: { url: "https://example.test/dashboard", mode: "navigate" }, respondWith: (promise: Promise<string>) => { response = promise; } };
    handlers.fetch(event); expect(await response).toBe("signed-in HTML"); expect(put).not.toHaveBeenCalled();
    network.mockRejectedValue(new Error("offline")); handlers.fetch(event); expect(await response).toBe("neutral offline"); expect(match).toHaveBeenCalledWith("/offline.html"); expect(put).not.toHaveBeenCalled();
  });
});
