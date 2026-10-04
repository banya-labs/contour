import { describe, expect, it } from "vitest";
import { inquiryVisibility, canManageMatching, contactVisibility } from "./visibility";
import { permissionsForRole } from "../authorization";
const scope = { organizationId: "org", userId: "agent", permissions: permissionsForRole("FIELD_AGENT") };
describe("matching visibility", () => {
  it("permits field reads without broad leads access", () => {
    expect(scope.permissions).toContain("pwa.inquiries.read");
    expect(scope.permissions).not.toContain("leads.read");
    expect(canManageMatching(scope)).toBe(false);
  });
  it("scopes inquiries to tenant and own/unassigned work", () => {
    expect(inquiryVisibility(scope)).toEqual({ organizationId: "org", OR: [{ assignedAgentId: "agent" }, { assignedAgentId: null }] });
  });
  it("allows explicit management access", () => {
    expect(inquiryVisibility({ ...scope, permissions: permissionsForRole("OWNER") })).toEqual({ organizationId: "org" });
  });
  it("contact lookup only uses creator provenance or visible inquiries", () => {
    expect(contactVisibility(scope, ["created-contact"])).toMatchObject({ organizationId: "org", OR: [{ id: { in: ["created-contact"] } }, { inquiries: { some: inquiryVisibility(scope) } }] });
  });
});
