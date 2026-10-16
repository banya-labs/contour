import { describe, expect, it } from "vitest";
import { snapshotLeaseCommissionAgreement } from "./lease-commission";

const config = {
  id: "config-1",
  revision: 2,
  status: "APPROVED" as const,
  mode: "UPFRONT" as const,
  calculation: "MONTHS_OF_RENT" as const,
  monthsOfRent: "1",
  currency: "ZMW" as const,
  effectiveFrom: "2026-11-01",
};

describe("lease rental commission snapshots", () => {
  it("freezes one month's rent as the upfront target", () => {
    const agreement = snapshotLeaseCommissionAgreement({ config, monthlyRent: "5000", leaseCurrency: "ZMW", leaseStartDate: new Date("2026-11-15T00:00:00.000Z") });
    expect(agreement.sourceConfigRevision).toBe(2);
    expect(agreement.frozenMonthlyRent).toBe("5000.00");
    expect(agreement.targetAmount).toBe("5000.00");
    expect(agreement.effectiveFrom).toEqual(new Date("2026-11-15T00:00:00.000Z"));
  });

  it("preserves percentage duration and does not invent a target amount", () => {
    const agreement = snapshotLeaseCommissionAgreement({
      config: { ...config, mode: "PERCENTAGE", calculation: undefined, monthsOfRent: undefined, percentage: "10", durationMonths: 12 },
      monthlyRent: "5000",
      leaseCurrency: "ZMW",
      leaseStartDate: new Date("2026-11-15T00:00:00.000Z"),
    });
    expect(agreement.percentage).toBe("10");
    expect(agreement.durationMonths).toBe(12);
    expect(agreement.targetAmount).toBeUndefined();
  });

  it("rejects a configuration that starts after the lease", () => {
    expect(() => snapshotLeaseCommissionAgreement({ config: { ...config, effectiveFrom: "2026-12-01" }, monthlyRent: "5000", leaseCurrency: "ZMW", leaseStartDate: new Date("2026-11-15T00:00:00.000Z") })).toThrow("not effective");
  });

  it("rejects a lease currency that differs from the property configuration", () => {
    expect(() => snapshotLeaseCommissionAgreement({ config, monthlyRent: "5000", leaseCurrency: "ZMW", leaseStartDate: new Date("2026-11-15T00:00:00.000Z") })).not.toThrow();
    expect(() => snapshotLeaseCommissionAgreement({ config, monthlyRent: "5000", leaseCurrency: "USD", leaseStartDate: new Date("2026-11-15T00:00:00.000Z") })).toThrow("currency");
  });
});
