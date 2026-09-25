import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getTenantContext: vi.fn(),
}));

vi.mock("./auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("./tenant-context", () => ({
  getTenantContext: mocks.getTenantContext,
}));

vi.mock("./db", () => ({
  db: {
    organization: { findUnique: vi.fn() },
    payment: { findFirst: vi.fn() },
  },
}));

vi.mock("./logger", () => ({
  logger: { error: vi.fn() },
}));

import { createApiHandler } from "./api-handler";

describe("createApiHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user-1", role: "FIELD_AGENT" } });
    mocks.getTenantContext.mockResolvedValue({
      session: { user: { id: "user-1", role: "FIELD_AGENT" } },
      userId: "user-1",
      organizationId: "org-1",
      userRole: "FIELD_AGENT",
      contourRole: "BROKER_MANAGER",
      permissions: [],
    });
  });

  it("passes the active organization role to route handlers", async () => {
    const handler = createApiHandler({
      handler: async (_request, context) => NextResponse.json({ contourRole: context.contourRole }),
    });

    const response = await handler(new NextRequest("http://localhost/api/onboarding/profile"), { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ contourRole: "BROKER_MANAGER" });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.getTenantContext).toHaveBeenCalledWith(expect.any(NextRequest), expect.objectContaining({ user: { id: "user-1", role: "FIELD_AGENT" } }));
  });
});
