import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getTenantContext: vi.fn(),
  findOrganization: vi.fn(),
  findPayment: vi.fn(),
}));

vi.mock("./auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("./tenant-context", () => ({
  getTenantContext: mocks.getTenantContext,
}));

vi.mock("./db", () => ({
  db: {
    organization: { findUnique: mocks.findOrganization },
    payment: { findFirst: mocks.findPayment },
  },
}));

vi.mock("./billing-entitlement", () => ({ getOrganizationBillingEntitlement: vi.fn().mockResolvedValue({ accessState: "PAID" }) }));

vi.mock("./logger", () => ({
  logger: { error: vi.fn() },
}));

import { createApiHandler } from "./api-handler";

describe("createApiHandler", () => {
  it("does not disclose internal failure details", async () => {
    const handler = createApiHandler({ handler: async () => { throw new Error("private database connection detail"); } });
    const response = await handler(new NextRequest("http://localhost/api/onboarding/profile"), { params: Promise.resolve({}) });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("private database connection detail");
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findOrganization.mockResolvedValue({ subscriptionStatus: "active", accountStatus: "ACTIVE" });
    mocks.findPayment.mockResolvedValue({ id: "paid" });
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
  it("admits scoped PWA read access without granting desktop CRM access", async () => {
    mocks.getTenantContext.mockResolvedValue({ session: { user: { id: "user-1", role: "FIELD_AGENT" } }, userId: "user-1", organizationId: "org-1", contourRole: "FIELD_AGENT", permissions: ["pwa.inquiries.read"] });
    const scoped = createApiHandler({ requirePermissions: ["pwa.inquiries.read"], handler: async () => NextResponse.json({ success: true }) });
    const desktop = createApiHandler({ requirePermissions: ["leads.read"], handler: async () => NextResponse.json({ success: true }) });
    const request = new NextRequest("http://localhost/api/agent/inquiries");
    const scopedResponse = await scoped(request, { params: Promise.resolve({}) });
    expect(await scopedResponse.json()).toEqual({ success: true });
    expect(scopedResponse.status).toBe(200);
    expect((await desktop(request, { params: Promise.resolve({}) })).status).toBe(403);
  });
});
