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

  it("treats a successful payment as paid even if the trial is expired", () => {
    expect(getBillingAccessState({ subscriptionStatus: "trialing", trialEndsAt, hasSuccessfulPayment: true }, new Date("2026-10-20T00:00:00.000Z"))).toBe("PAID");
  });

  it("denies an uninitialized trial with no expiry evidence", () => {
    expect(getBillingAccessState({ subscriptionStatus: "trialing", trialEndsAt: null, hasSuccessfulPayment: false }, new Date("2026-10-20T00:00:00.000Z"))).toBe("TRIAL_EXPIRED");
  });
});
