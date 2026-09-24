import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateMany } = vi.hoisted(() => ({ updateMany: vi.fn() }));

vi.mock("./db", () => ({ db: { organization: { updateMany } } }));

import { expireDueTrial, expireDueTrials } from "./billing-lifecycle";

describe("billing lifecycle transitions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks only due trialing organizations as expired", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    const now = new Date("2026-10-09T00:00:00.000Z");

    await expect(expireDueTrial("org-1", now)).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "org-1", subscriptionStatus: "trialing", trialEndsAt: { lte: now } },
      data: { subscriptionStatus: "trial_expired" },
    });
  });

  it("is replay-safe when another request already expired the trial", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(expireDueTrial("org-1", new Date())).resolves.toBe(false);
  });

  it("expires the due trial population in one conditional update", async () => {
    updateMany.mockResolvedValue({ count: 3 });
    const now = new Date("2026-10-09T00:00:00.000Z");

    await expect(expireDueTrials(now)).resolves.toBe(3);
    expect(updateMany).toHaveBeenCalledWith({
      where: { subscriptionStatus: "trialing", trialEndsAt: { lte: now } },
      data: { subscriptionStatus: "trial_expired" },
    });
  });
});
