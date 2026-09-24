import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateMany } = vi.hoisted(() => ({ updateMany: vi.fn() }));
vi.mock("./db", () => ({ db: { subscription: { updateMany } } }));

import { cancelSubscription, markPastDueSubscriptions } from "./subscription-lifecycle";

describe("subscription lifecycle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks only active subscriptions past their period as past due", async () => {
    updateMany.mockResolvedValue({ count: 2 });
    const now = new Date("2027-01-01T00:00:00.000Z");
    await expect(markPastDueSubscriptions(now)).resolves.toBe(2);
    expect(updateMany).toHaveBeenCalledWith({ where: { status: "active", currentPeriodEnd: { lt: now } }, data: { status: "past_due" } });
  });

  it("cancels active or past-due subscriptions but not already-canceled ones", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    const canceledAt = new Date("2027-01-01T00:00:00.000Z");
    await expect(cancelSubscription("sub-1", canceledAt)).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "sub-1", status: { in: ["active", "past_due"] } }, data: { status: "canceled", canceledAt } });
  });
});
