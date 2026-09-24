import { describe, expect, it, vi } from "vitest";

const { getSession, findUnique } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("./auth", () => ({
  auth: { api: { getSession } },
}));

vi.mock("./db", () => ({
  db: { member: { findUnique } },
}));

import { getTenantContext } from "./tenant-context";

describe("tenant context", () => {
  it("returns no context without an authenticated session", async () => {
    getSession.mockResolvedValueOnce(null);

    await expect(getTenantContext(new Request("http://localhost") as never)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("requires membership in the active organization", async () => {
    getSession.mockResolvedValueOnce({
      user: { id: "user-a", role: "FIELD_AGENT" },
      session: { activeOrganizationId: "org-a" },
    });
    findUnique.mockResolvedValueOnce(null);

    await expect(getTenantContext(new Request("http://localhost") as never)).resolves.toBeNull();
    expect(findUnique).toHaveBeenCalled();
  });

  it("returns only the authenticated active tenant", async () => {
    getSession.mockResolvedValueOnce({
      user: { id: "user-a", role: "FIELD_AGENT" },
      session: { activeOrganizationId: "org-a" },
    });
    findUnique.mockResolvedValueOnce({ id: "member-a", role: "owner", status: "active", roleAssignments: [], permissionOverrides: [] });

    await expect(getTenantContext(new Request("http://localhost") as never)).resolves.toMatchObject({
      userId: "user-a",
      organizationId: "org-a",
      userRole: "SUPER_ADMIN",
    });
  });

  it("gives the organization owner full permissions despite a conflicting assignment", async () => {
    getSession.mockResolvedValueOnce({
      user: { id: "owner-a", role: "FIELD_AGENT" },
      session: { activeOrganizationId: "org-a" },
    });
    findUnique.mockResolvedValueOnce({
      id: "member-owner",
      role: "owner",
      status: "active",
      roleAssignments: [{ role: { key: "FIELD_AGENT", permissions: [{ permission: "pwa.access" }] } }],
      permissionOverrides: [],
    });

    await expect(getTenantContext(new Request("http://localhost") as never)).resolves.toMatchObject({
      contourRole: "OWNER",
      userRole: "SUPER_ADMIN",
      permissions: expect.arrayContaining(["dashboard.read", "org.members.invite", "finance.manage"]),
    });
  });
});
