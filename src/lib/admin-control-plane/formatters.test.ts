import { describe, expect, it } from "vitest";
import {
  formatAdminCurrency,
  formatAgencyOwner,
  formatSubscriptionState,
  formatTrialOrPaymentDue,
} from "./formatters";

describe("admin control-plane formatters", () => {
  it("formats subscription states for operators", () => {
    expect(formatSubscriptionState("trialing")).toBe("Trial");
    expect(formatSubscriptionState("past_due")).toBe("Payment due");
    expect(formatSubscriptionState("unknown")).toBe("Unknown");
  });

  it("formats trial and payment due dates explicitly", () => {
    expect(formatTrialOrPaymentDue({ status: "trialing", trialEndsAt: "2026-10-01T00:00:00.000Z", nextPaymentAt: null })).toContain("Trial ends");
    expect(formatTrialOrPaymentDue({ status: "active", trialEndsAt: null, nextPaymentAt: "2026-10-15T00:00:00.000Z" })).toContain("Payment due");
    expect(formatTrialOrPaymentDue({ status: "active", trialEndsAt: null, nextPaymentAt: null })).toBe("No due date recorded");
  });

  it("formats known and unknown currencies without inventing values", () => {
    expect(formatAdminCurrency(1200, "ZMW")).toBe("ZMW 1,200.00");
    expect(formatAdminCurrency(null, "USD")).toBe("Not recorded");
  });

  it("makes owner gaps visible", () => {
    expect(formatAgencyOwner([])).toBe("Unassigned");
    expect(formatAgencyOwner([{ name: "A", email: "a@example.com" }, { name: "B", email: "b@example.com" }])).toBe("Multiple owners");
    expect(formatAgencyOwner([{ name: "A", email: "a@example.com" }])).toBe("A · a@example.com");
  });
});
