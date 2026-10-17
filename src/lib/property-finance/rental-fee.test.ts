import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { calculateRentalAgencyFee } from "./rental-fee";

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const base = { leaseStartDate: date("2026-01-15"), leaseEndDate: date("2026-12-31"), periodYear: 2026, periodMonth: 1 };

describe("rental agency fee calculation", () => {
  it("deducts upfront commission only in the lease start month", () => {
    const agreement = { mode: "UPFRONT" as const, basis: "MONTHS_OF_RENT" as const, fixedAmount: null, monthsOfRent: new Prisma.Decimal("1"), percentage: null, durationMonths: null, untilLeaseEnd: false, frozenMonthlyRent: new Prisma.Decimal("5000"), targetAmount: new Prisma.Decimal("5000"), effectiveFrom: date("2026-01-15") };
    expect(calculateRentalAgencyFee({ ...base, agreement, collectedRent: new Prisma.Decimal("3000") }).toFixed(2)).toBe("3000.00");
    expect(calculateRentalAgencyFee({ ...base, periodMonth: 2, agreement, collectedRent: new Prisma.Decimal("3000") }).toFixed(2)).toBe("0.00");
  });

  it("applies percentage commission only for the configured period", () => {
    const agreement = { mode: "PERCENTAGE" as const, basis: null, fixedAmount: null, monthsOfRent: null, percentage: new Prisma.Decimal("10"), durationMonths: 3, untilLeaseEnd: false, frozenMonthlyRent: new Prisma.Decimal("5000"), targetAmount: null, effectiveFrom: date("2026-01-01") };
    expect(calculateRentalAgencyFee({ ...base, agreement, collectedRent: new Prisma.Decimal("5000") }).toFixed(2)).toBe("500.00");
    expect(calculateRentalAgencyFee({ ...base, periodMonth: 4, agreement, collectedRent: new Prisma.Decimal("5000") }).toFixed(2)).toBe("0.00");
  });
});
