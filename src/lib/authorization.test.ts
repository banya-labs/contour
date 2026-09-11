import { describe, expect, it } from "vitest";
import { hasRequiredRole, resolveApplicationRole } from "./authorization";

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
});
