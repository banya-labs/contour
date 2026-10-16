import { Prisma } from "@prisma/client";
import type { RentalPropertyCommission } from "./rental-commission";

type ApprovedPropertyCommission = RentalPropertyCommission & {
  id: string;
  revision: number;
  status: "APPROVED";
  approvedById?: string | null;
  approvedAt?: Date | null;
};

export type LeaseCommissionAgreementDraft = {
  sourceConfigId: string;
  sourceConfigRevision: number;
  mode: ApprovedPropertyCommission["mode"];
  basis: ApprovedPropertyCommission["calculation"];
  fixedAmount?: string;
  monthsOfRent?: string;
  percentage?: string;
  durationMonths?: number;
  untilLeaseEnd: boolean;
  currency: ApprovedPropertyCommission["currency"];
  frozenMonthlyRent: string;
  targetAmount?: string;
  effectiveFrom: Date;
  approvedById?: string | null;
  approvedAt?: Date | null;
};

export function snapshotLeaseCommissionAgreement(input: {
  config: ApprovedPropertyCommission;
  monthlyRent: string;
  leaseCurrency: ApprovedPropertyCommission["currency"];
  leaseStartDate: Date;
}): LeaseCommissionAgreementDraft {
  const { config } = input;
  const rent = new Prisma.Decimal(input.monthlyRent);
  if (!rent.isPositive()) throw new Error("Monthly rent must be positive.");
  if (config.status !== "APPROVED") throw new Error("Rental commission configuration must be approved before lease activation.");
  if (config.mode !== "NONE" && new Date(`${config.effectiveFrom}T00:00:00.000Z`) > input.leaseStartDate) {
    throw new Error("Rental commission configuration is not effective for this lease start date.");
  }
  if (config.currency !== input.leaseCurrency) throw new Error("Rental commission currency must match the lease currency.");

  const targetAmount = config.mode === "UPFRONT"
    ? config.calculation === "FIXED_AMOUNT"
      ? new Prisma.Decimal(config.fixedAmount!).toDecimalPlaces(2).toFixed(2)
      : rent.mul(new Prisma.Decimal(config.monthsOfRent!)).toDecimalPlaces(2).toFixed(2)
    : undefined;

  return {
    sourceConfigId: config.id,
    sourceConfigRevision: config.revision,
    mode: config.mode,
    basis: config.calculation,
    fixedAmount: config.fixedAmount,
    monthsOfRent: config.monthsOfRent,
    percentage: config.percentage,
    durationMonths: config.durationMonths,
    untilLeaseEnd: config.untilLeaseEnd ?? false,
    currency: config.currency,
    frozenMonthlyRent: rent.toDecimalPlaces(2).toFixed(2),
    targetAmount,
    effectiveFrom: input.leaseStartDate,
    approvedById: config.approvedById,
    approvedAt: config.approvedAt,
  };
}
