import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ property: vi.fn(), contact: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { organization: { findFirst: vi.fn().mockResolvedValue({ id: "org" }) }, inquiry: { findFirst: vi.fn().mockResolvedValue(null), create: mocks.create }, property: { findFirst: mocks.property } } }));
vi.mock("@/lib/rate-limiter", () => ({ checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }) }));
vi.mock("@/lib/crm/contact-service", () => ({ getOrCreateContact: mocks.contact }));
vi.mock("@/lib/cache", () => ({ smartCache: { invalidateTag: vi.fn() } }));
vi.mock("@/lib/matching/inquiry-match-notifications", () => ({ createInquiryMatchNotifications: vi.fn() }));
import { POST } from "./route";
describe("public inquiry property isolation", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects a foreign property before any contact or inquiry write", async () => {
    mocks.property.mockResolvedValue(null);
    const response = await POST(new NextRequest("http://localhost/api/inquiries", { method: "POST", body: JSON.stringify({ org: "agency", propertyId: "foreign-property", clientName: "Test client", clientPhone: "+260971234567" }) }));
    expect(response.status).toBe(404);
    expect(mocks.property).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foreign-property", organizationId: "org" } }));
    expect(mocks.contact).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled();
  });
});
