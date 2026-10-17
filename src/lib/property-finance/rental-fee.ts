import { Prisma } from "@prisma/client";

type Agreement = {
  mode: "NONE" | "UPFRONT" | "PERCENTAGE";
  basis: "FIXED_AMOUNT" | "MONTHS_OF_RENT" | null;
  fixedAmount: Prisma.Decimal | null;
  monthsOfRent: Prisma.Decimal | null;
  percentage: Prisma.Decimal | null;
  durationMonths: number | null;
  untilLeaseEnd: boolean;
  frozenMonthlyRent: Prisma.Decimal;
  targetAmount: Prisma.Decimal | null;
  effectiveFrom: Date;
};

export function calculateRentalAgencyFee(input: {
  agreement: Agreement | null;
  collectedRent: Prisma.Decimal;
  periodYear: number;
  periodMonth: number;
  leaseStartDate: Date;
  leaseEndDate: Date;
}) {
  if (!input.agreement || input.collectedRent.isNegative()) return new Prisma.Decimal(0);
  const periodStart = new Date(Date.UTC(input.periodYear, input.periodMonth - 1, 1));
  const startMonth = input.leaseStartDate.getUTCFullYear() * 12 + input.leaseStartDate.getUTCMonth();
  const periodIndex = periodStart.getUTCFullYear() * 12 + periodStart.getUTCMonth() - startMonth;
  if (periodIndex < 0) return new Prisma.Decimal(0);

  if (input.agreement.mode === "UPFRONT") {
    if (periodIndex !== 0) return new Prisma.Decimal(0);
    const target = input.agreement.targetAmount
      ?? (input.agreement.basis === "FIXED_AMOUNT"
        ? input.agreement.fixedAmount
        : input.agreement.frozenMonthlyRent.mul(input.agreement.monthsOfRent ?? 0));
    return Prisma.Decimal.min(input.collectedRent, target ?? 0).toDecimalPlaces(2);
  }

  if (input.agreement.mode !== "PERCENTAGE") return new Prisma.Decimal(0);
  const leaseEndMonth = input.leaseEndDate.getUTCFullYear() * 12 + input.leaseEndDate.getUTCMonth();
  if (periodStart.getUTCFullYear() * 12 + periodStart.getUTCMonth() > leaseEndMonth) return new Prisma.Decimal(0);
  if (!input.agreement.untilLeaseEnd && (input.agreement.durationMonths === null || periodIndex >= input.agreement.durationMonths)) return new Prisma.Decimal(0);
  return input.collectedRent.mul(input.agreement.percentage ?? 0).div(100).toDecimalPlaces(2);
}
