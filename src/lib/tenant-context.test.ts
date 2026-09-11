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
    expect(findUnique).toHaveBeenCalledWith({
      where: { organizationId_userId: { organizationId: "org-a", userId: "user-a" } },
      select: { id: true, role: true },
    });
  });

  it("returns only the authenticated active tenant", async () => {
    getSession.mockResolvedValueOnce({
      user: { id: "user-a", role: "FIELD_AGENT" },
      session: { activeOrganizationId: "org-a" },
    });
    findUnique.mockResolvedValueOnce({ id: "member-a", role: "owner" });

    await expect(getTenantContext(new Request("http://localhost") as never)).resolves.toMatchObject({
      userId: "user-a",
      organizationId: "org-a",
      userRole: "SUPER_ADMIN",
    });
  });
});
