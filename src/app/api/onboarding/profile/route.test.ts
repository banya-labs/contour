import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  profileUpsert: vi.fn(),
  organizationUpdate: vi.fn(),
  auditCreate: vi.fn(),
  handler: undefined as ((request: NextRequest, context: { body: Record<string, unknown>; organizationId: string; userId: string }) => Promise<Response>) | undefined,
}));

vi.mock("@/lib/api-handler", () => ({
  createApiHandler: (options: { handler: typeof mocks.handler }) => {
    mocks.handler = options.handler;
    return async (request: NextRequest) => options.handler(request, {
      body: {
        name: "MAL Property",
        slug: "mal-property",
        country: "ZM",
        timezone: "Africa/Lusaka",
        agencyType: "BROKERAGE",
        regulatoryDeclarationAgreed: true,
      },
      organizationId: "org-1",
      userId: "user-1",
    });
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    organization: { findUnique: mocks.findUnique, update: mocks.organizationUpdate },
    organizationProfile: { upsert: mocks.profileUpsert },
    auditLog: { create: mocks.auditCreate },
  },
}));

import { POST } from "./route";

const request = new NextRequest("http://localhost/api/onboarding/profile", { method: "POST", body: "{}" });

describe("onboarding trial initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profileUpsert.mockResolvedValue({ id: "profile-1" });
    mocks.organizationUpdate.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
  });

  it("starts one trial when the first profile is completed", async () => {
    const createdAt = new Date("2026-09-25T00:00:00.000Z");
    mocks.findUnique.mockResolvedValue({ createdAt, profile: null, lencoSubscriptionId: null, trialEndsAt: null, payments: [] });

    const response = await POST(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ subscriptionStatus: "trialing", trialEndsAt: new Date("2026-10-09T00:00:00.000Z") }),
    }));
  });

  it("does not restart a trial when the profile is completed again", async () => {
    const trialEndsAt = new Date("2026-10-01T00:00:00.000Z");
    mocks.findUnique.mockResolvedValue({ createdAt: new Date("2026-09-01T00:00:00.000Z"), profile: { id: "profile-1" }, lencoSubscriptionId: null, trialEndsAt, payments: [] });

    const response = await POST(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.not.objectContaining({ trialEndsAt: expect.anything() }) }));
  });

  it("does not overwrite a paid organization when onboarding details change", async () => {
    mocks.findUnique.mockResolvedValue({ createdAt: new Date("2026-09-01T00:00:00.000Z"), profile: { id: "profile-1" }, lencoSubscriptionId: "lenco-ref", trialEndsAt: null, payments: [{ id: "payment-1" }] });

    const response = await POST(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.not.objectContaining({ subscriptionStatus: "trialing" }) }));
  });
});
