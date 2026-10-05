import { describe, expect, it } from "vitest";
import { getBillingAccessState } from "./billing-access";

describe("billing access state", () => {
  const trialEndsAt = new Date("2026-10-15T00:00:00.000Z");

  it("allows a trialing organization before the trial boundary", () => {
    expect(getBillingAccessState({ subscriptionStatus: "trialing", trialEndsAt, hasSuccessfulPayment: false }, new Date("2026-10-14T23:59:59.000Z"))).toBe("TRIAL_ACTIVE");
  });

  it("denies access at the exact trial boundary", () => {
    expect(getBillingAccessState({ subscriptionStatus: "trialing", trialEndsAt, hasSuccessfulPayment: false }, trialEndsAt)).toBe("TRIAL_EXPIRED");
  });

  it("does not grant permanent access from historical payment presence", () => {
    expect(getBillingAccessState({ subscriptionStatus: "active", trialEndsAt, hasSuccessfulPayment: true }, new Date("2026-10-20T00:00:00.000Z"))).toBe("TRIAL_EXPIRED");
  });

  it("allows a funded period and rejects its exact boundary", () => {
    const input = { subscriptionStatus: "active", trialEndsAt: null, currentPeriodEnd: trialEndsAt };
    expect(getBillingAccessState(input, new Date("2026-10-14T23:59:59Z"))).toBe("PAID");
    expect(getBillingAccessState(input, trialEndsAt)).toBe("TRIAL_EXPIRED");
  });

  it("allows canceled subscriptions only through their funded period", () => {
    expect(getBillingAccessState({ subscriptionStatus: "canceled", trialEndsAt: null, currentPeriodEnd: trialEndsAt }, new Date("2026-10-14T00:00:00Z"))).toBe("PAID");
  });

  it("fails closed for past_due even with a future period and trial", () => {
    expect(getBillingAccessState({ subscriptionStatus: "past_due", trialEndsAt, currentPeriodEnd: trialEndsAt }, new Date("2026-10-14T00:00:00Z"))).toBe("TRIAL_EXPIRED");
  });

  it("denies an uninitialized trial with no expiry evidence", () => {
    expect(getBillingAccessState({ subscriptionStatus: "trialing", trialEndsAt: null, hasSuccessfulPayment: false }, new Date("2026-10-20T00:00:00.000Z"))).toBe("TRIAL_EXPIRED");
  });
});
