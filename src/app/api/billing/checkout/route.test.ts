import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { ApiRouteContext } from "@/lib/api-handler";
const mocks = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), update: vi.fn(), reserve: vi.fn(), collection: vi.fn() }));
vi.mock("@/lib/api-handler", () => ({ createApiHandler: (options: { handler: unknown }) => options.handler }));
vi.mock("@/lib/db", () => ({ db: { payment: { findUnique: mocks.find, create: mocks.create, update: mocks.update } } }));
vi.mock("@/lib/lenco", () => ({ CONTOUR_PLANS: { growth: {} }, initiateLencoCollection: mocks.collection }));
vi.mock("@/lib/subscriptions/tier-catalog", () => ({ getCatalogPlanPrice: vi.fn().mockResolvedValue({ amount: 1000 }), getCatalogPlanName: vi.fn().mockResolvedValue("Growth") }));
vi.mock("@/lib/billing-offer-reservation", () => ({ reserveOrganizationOffer: mocks.reserve, releaseOrganizationOffer: vi.fn(), commitOrganizationOffer: vi.fn() }));
vi.mock("@/lib/billing-ledger", () => ({ recordSettledSubscription: vi.fn() }));
import { POST } from "./route";
beforeEach(() => { vi.clearAllMocks(); mocks.find.mockResolvedValue(null); mocks.create.mockResolvedValue({ id: "payment", amount: 1000, status: "PENDING" }); mocks.reserve.mockResolvedValue({ grantId: "trusted-grant", kind: "PERCENTAGE", value: 10, currency: "ZMW" }); mocks.collection.mockResolvedValue({ success: true, status: "PENDING_AUTHORIZATION", data: { id: "provider", offerReservationId: "untrusted-provider-field" } }); mocks.update.mockImplementation(async ({ data }) => ({ id: "payment", ...data })); });
describe("checkout reservation metadata", () => {
  it("retains trusted offer routing while nesting untrusted provider response", async () => {
    const context = { organizationId: "org", userId: "actor", body: { planId: "growth", billingCycle: "MONTHLY", currency: "ZMW", channel: "mobile_money", phone: "0970000000", offerId: "offer" }, session: { user: { name: "Actor", email: "actor@example.com" } } } as unknown as ApiRouteContext;
    const response = await POST(new NextRequest("http://localhost/api/billing/checkout", { method: "POST", headers: { "idempotency-key": "test-key-sixteen-characters" } }), context);
    expect(response.status).toBe(200);
    expect(mocks.update.mock.calls[1][0].data.metadata).toMatchObject({ offerId: "offer", offerReservationId: "trusted-grant", providerResponse: { offerReservationId: "untrusted-provider-field" } });
    expect(mocks.collection.mock.calls[0][0].amount).toBe(900);
  });
});
