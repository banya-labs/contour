import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ transaction: vi.fn(), grant: vi.fn(), claim: vi.fn(), reset: vi.fn(), count: vi.fn(), field: { _ref: "redeemedCount", _container: "PlatformOffer" } }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));
import { commitOrganizationOffer, releaseOrganizationOffer, reserveOrganizationOffer } from "./billing-offer-reservation";
beforeEach(() => { vi.clearAllMocks(); mocks.claim.mockResolvedValue({ count: 1 }); mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({ organizationOffer: { findFirst: mocks.grant, updateMany: mocks.claim, update: mocks.reset }, platformOffer: { fields: { redeemedCount: mocks.field }, updateMany: mocks.count } })); });
describe("offer reservation lifecycle", () => {
  it("uses current row count to stop two stale grant snapshots exceeding one redemption", async () => {
    let redeemedCount = 0;
    mocks.grant.mockResolvedValue({ id: "grant", offerId: "offer", offer: { status: "ACTIVE", startsAt: null, endsAt: null, redeemedCount: 0, kind: "PERCENTAGE", value: 10, currency: "ZMW" } });
    mocks.count.mockImplementation(async ({ where }) => {
      const comparison = where.OR[1].maxRedemptions.gt;
      const observed = comparison === mocks.field ? redeemedCount : comparison;
      if (1 <= observed) return { count: 0 };
      redeemedCount += 1;
      return { count: 1 };
    });
    const outcomes = await Promise.all([reserveOrganizationOffer({ organizationId: "org-a", offerId: "offer", paymentId: "a" }), reserveOrganizationOffer({ organizationId: "org-b", offerId: "offer", paymentId: "b" })]);
    expect(outcomes.filter(Boolean)).toHaveLength(1);
    expect(redeemedCount).toBe(1);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });
  it("does not decrement a global counter when another delivery already released the grant", async () => {
    mocks.grant.mockResolvedValue({ id: "grant", offerId: "offer" }); mocks.claim.mockResolvedValue({ count: 0 });
    expect(await releaseOrganizationOffer("payment")).toEqual({ count: 0 });
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.claim.mock.calls[0][0].where).toEqual({ id: "grant", status: "RESERVED", reservedPaymentId: "payment" });
  });
  it("does not recommit a grant claimed by another settlement", async () => {
    mocks.grant.mockResolvedValue({ id: "grant", offerId: "offer" }); mocks.claim.mockResolvedValue({ count: 0 });
    expect(await commitOrganizationOffer("payment")).toBeNull();
  });
});
