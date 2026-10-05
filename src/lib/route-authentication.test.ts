import { describe, expect, it } from "vitest";
import { usesRouteAuthentication } from "./route-authentication";
describe("route-owned authentication", () => {
  it("allows provider and capability transports to reach their own security guards", () => {
    for (const path of ["/api/webhooks/lenco", "/api/mcp", "/api/mcp/sse", "/api/dify/tools/documents", "/api/upload/secret"]) expect(usesRouteAuthentication(path)).toBe(true);
  });
  it("does not bypass session authentication for sibling or privileged endpoints", () => {
    for (const path of ["/api/webhooks/lenco-admin", "/api/mcp-admin", "/api/admin/overview", "/api/vault/documents", "/api/upload-admin"]) expect(usesRouteAuthentication(path)).toBe(false);
  });
});
