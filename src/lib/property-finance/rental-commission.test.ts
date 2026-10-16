import { describe, expect, it } from "vitest";
import {
  rentalPropertyCommissionSchema,
  previewRentalPropertyCommission,
} from "./rental-commission";

describe("rental property agency commission", () => {
  it("accepts an upfront commission based on one month's rent", () => {
    const result = rentalPropertyCommissionSchema.parse({
      mode: "UPFRONT",
      calculation: "MONTHS_OF_RENT",
      monthsOfRent: "1",
      currency: "ZMW",
      effectiveFrom: "2026-11-01",
    });

    expect(result.mode).toBe("UPFRONT");
    expect(result.monthsOfRent).toBe("1");
  });

  it("accepts a percentage commission for a fixed rental period", () => {
    const result = rentalPropertyCommissionSchema.parse({
      mode: "PERCENTAGE",
      percentage: "10",
      durationMonths: 12,
      currency: "ZMW",
      effectiveFrom: "2026-11-01",
    });

    expect(result.percentage).toBe("10");
    expect(result.durationMonths).toBe(12);
  });

  it("rejects an upfront configuration without a valid fee basis", () => {
    expect(() =>
      rentalPropertyCommissionSchema.parse({
        mode: "UPFRONT",
        currency: "ZMW",
        effectiveFrom: "2026-11-01",
      }),
    ).toThrow();
  });

  it("rejects a percentage period with both duration and lease-end options", () => {
    expect(() =>
      rentalPropertyCommissionSchema.parse({
        mode: "PERCENTAGE",
        percentage: "10",
        durationMonths: 12,
        untilLeaseEnd: true,
        currency: "ZMW",
        effectiveFrom: "2026-11-01",
      }),
    ).toThrow();
  });

  it("previews the agency amount and landlord remainder from agreed rent", () => {
    const preview = previewRentalPropertyCommission({
      commission: {
        mode: "PERCENTAGE",
        percentage: "10",
        durationMonths: 12,
        currency: "ZMW",
        effectiveFrom: "2026-11-01",
      },
      monthlyRent: "5000",
      collectedRent: "3000",
    });

    expect(preview.agencyCommission).toBe("300.00");
    expect(preview.landlordRemainder).toBe("2700.00");
    expect(preview.currency).toBe("ZMW");
  });
});
