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
    expect(roleHasPermission("FINANCE_OFFICER", "vault.download")).toBe(false);
  });
});
