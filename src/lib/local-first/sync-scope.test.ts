import { describe, expect, it } from "vitest";
import { getSyncScope } from "./sync-scope";

describe("PowerSync scope", () => {
  it("requires an organization and never accepts a client-selected organization", () => {
    expect(() => getSyncScope({ organizationId: "", userId: "u1", role: "FIELD_AGENT" })).toThrow("Organization context is required");
    expect(getSyncScope({ organizationId: "org_a", userId: "u1", role: "FIELD_AGENT", requestedOrganizationId: "org_b" })).toEqual(
      expect.objectContaining({ organizationId: "org_a" }),
    );
  });

  it("limits agents to assigned operational records", () => {
    const scope = getSyncScope({ organizationId: "org_a", userId: "u1", role: "FIELD_AGENT" });
    expect(scope.tables).toEqual(expect.arrayContaining(["properties", "clients", "visits", "inquiries", "deals", "follow_ups"]));
    expect(scope.assignmentFilter).toEqual({ agentId: "u1" });
  });

  it("gives managers and owners organization scope without sensitive tables", () => {
    for (const role of ["BROKER_MANAGER", "SUPER_ADMIN", "OWNER"]) {
      const scope = getSyncScope({ organizationId: "org_a", userId: "u1", role });
      expect(scope.assignmentFilter).toBeUndefined();
      expect(scope.tables).not.toContain("vault_documents");
      expect(scope.tables).not.toContain("payment_transactions");
    }
  });
});
