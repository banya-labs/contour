import { describe, expect, it } from "vitest";
import { getAdminOfflinePolicy } from "./admin-scope";

describe("admin offline policy", () => {
  it("allows operational review but keeps sensitive actions online-only", () => {
    const policy = getAdminOfflinePolicy("BROKER_MANAGER");
    expect(policy.allowedActions).toEqual(expect.arrayContaining(["VIEW_QUEUE", "VIEW_PROPERTIES", "VIEW_CLIENTS", "ADD_NOTE"]));
    expect(policy.onlineOnlyActions).toEqual(expect.arrayContaining(["BILLING", "PERMISSIONS", "VAULT", "DELETE", "PAYMENTS"]));
  });

  it("does not grant broad offline admin access to field agents", () => {
    const policy = getAdminOfflinePolicy("FIELD_AGENT");
    expect(policy.mode).toBe("FIELD");
    expect(policy.allowedActions).not.toContain("VIEW_ORGANIZATION_PIPELINE");
  });
});
