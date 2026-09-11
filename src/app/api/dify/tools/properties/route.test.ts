import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { findMany, authenticateDifyRequest } = vi.hoisted(() => ({
  findMany: vi.fn(),
  authenticateDifyRequest: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { property: { findMany } },
}));

vi.mock("@/lib/dify-auth", () => ({
  authenticateDifyRequest,
}));

import { POST } from "./route";

describe("Dify property search tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateDifyRequest.mockResolvedValue({
      context: {
        organizationId: "org-authenticated",
        userId: "user-1",
        userRole: "FIELD_AGENT",
      },
      errorResponse: null,
    });
    findMany.mockResolvedValue([]);
  });

  it("always queries the authenticated organization", async () => {
    const request = new NextRequest("http://localhost/api/dify/tools/properties", {
      method: "POST",
      body: JSON.stringify({ organization_id: "org-attacker", suburb: "Kabulonga" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: "org-authenticated",
      }),
    }));
    expect(findMany.mock.calls[0][0].where.organizationId).not.toBe("org-attacker");
  });

  it("returns an empty result when the tenant has no records", async () => {
    const request = new NextRequest("http://localhost/api/dify/tools/properties", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.properties).toEqual([]);
    expect(payload.totalCount).toBe(0);
  });
});
