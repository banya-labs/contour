import { describe, expect, it } from "vitest";
import { hasRequiredRole, resolveApplicationRole, resolveContourRole, roleHasPermission } from "./authorization";

describe("organization authorization", () => {
  it("allows a user whose role is explicitly required", () => {
    expect(hasRequiredRole("BROKER_MANAGER", ["SUPER_ADMIN", "BROKER_MANAGER"])).toBe(true);
  });

  it("rejects missing or unrelated roles", () => {
    expect(hasRequiredRole(undefined, ["SUPER_ADMIN"])).toBe(false);
    expect(hasRequiredRole("FIELD_AGENT", ["SUPER_ADMIN", "BROKER_MANAGER"])).toBe(false);
  });

  it("does not treat a role from another organization as a wildcard", () => {
    expect(hasRequiredRole("TENANT", ["SUPER_ADMIN", "BROKER_MANAGER"])).toBe(false);
  });

  it("maps the active organization's Better Auth owner to a Contour super admin", () => {
    expect(resolveApplicationRole("FIELD_AGENT", "owner")).toBe("SUPER_ADMIN");
    expect(resolveApplicationRole("FIELD_AGENT", "admin")).toBe("BROKER_MANAGER");
  });

  it("uses organization assignment before the legacy global role", () => {
    expect(resolveContourRole("FIELD_AGENT", "member", "FINANCE_OFFICER")).toBe("FINANCE_OFFICER");
    expect(resolveContourRole("SUPER_ADMIN", "member", "FIELD_AGENT")).toBe("FIELD_AGENT");
  });

  it("keeps field agents PWA-first and excludes dashboard access", () => {
    expect(roleHasPermission("FIELD_AGENT", "pwa.access")).toBe(true);
    expect(roleHasPermission("FIELD_AGENT", "dashboard.read")).toBe(false);
    expect(roleHasPermission("FIELD_AGENT", "org.members.invite")).toBe(false);
    expect(roleHasPermission("FINANCE_OFFICER", "vault.download")).toBe(false);
  });

  it("grants owner and broker manager full operational and dashboard permissions", () => {
    expect(roleHasPermission("OWNER", "dashboard.read")).toBe(true);
    expect(roleHasPermission("OWNER", "org.members.invite")).toBe(true);
    expect(roleHasPermission("BROKER_MANAGER", "dashboard.read")).toBe(true);
    expect(roleHasPermission("BROKER_MANAGER", "org.members.invite")).toBe(true);
    expect(roleHasPermission("ADMIN_STAFF", "dashboard.read")).toBe(true);
    expect(roleHasPermission("ADMIN_STAFF", "org.members.invite")).toBe(false);
  });

  it("authorizes all agency staff to manage property photos while blocking external roles", async () => {
    const { canManagePropertyPhotos } = await import("./authorization");
    const property = { assignedAgentId: "agent_456", createdById: "creator_789" };

    // Agency staff can manage photos regardless of assignment
    expect(canManagePropertyPhotos({ id: "agent_123", contourRole: "FIELD_AGENT" }, property)).toBe(true);
    expect(canManagePropertyPhotos({ id: "agent_123", role: "FIELD_AGENT" }, property)).toBe(true);
    expect(canManagePropertyPhotos({ id: "agent_123", contourRole: "BROKER_MANAGER" }, property)).toBe(true);
    expect(canManagePropertyPhotos({ id: "agent_123", contourRole: "OWNER" }, property)).toBe(true);
    expect(canManagePropertyPhotos({ id: "agent_123", role: "SUPER_ADMIN" }, property)).toBe(true);

    // External portal roles are blocked
    expect(canManagePropertyPhotos({ id: "client_1", contourRole: "LANDLORD" }, property)).toBe(false);
    expect(canManagePropertyPhotos({ id: "client_2", contourRole: "TENANT" }, property)).toBe(false);

    // Unassigned properties can be managed by agency staff
    expect(canManagePropertyPhotos({ id: "agent_123", contourRole: "FIELD_AGENT" }, { assignedAgentId: null })).toBe(true);
  });
});
