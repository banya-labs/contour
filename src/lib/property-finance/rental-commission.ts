import { Prisma } from "@prisma/client";
import { z } from "zod";

const money = z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "Enter a non-negative amount with at most two decimals.");
const effectiveDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for the effective date.");

export const rentalPropertyCommissionSchema = z
  .object({
    mode: z.enum(["NONE", "UPFRONT", "PERCENTAGE"]),
    calculation: z.enum(["FIXED_AMOUNT", "MONTHS_OF_RENT"]).optional(),
    fixedAmount: money.optional(),
    monthsOfRent: money.optional(),
    percentage: money.optional(),
    durationMonths: z.number().int().min(1).max(360).optional(),
    untilLeaseEnd: z.boolean().optional(),
    currency: z.enum(["ZMW", "USD", "ZAR"]),
    effectiveFrom: effectiveDate,
    evidenceReference: z.string().trim().max(120).optional(),
  })
  .superRefine((value, context) => {
    if (value.mode === "NONE") {
      if (value.calculation || value.fixedAmount || value.monthsOfRent || value.percentage || value.durationMonths || value.untilLeaseEnd) {
        context.addIssue({ code: "custom", path: ["mode"], message: "No-commission configuration cannot include fee terms." });
      }
      return;
    }

    if (value.mode === "UPFRONT") {
      if (value.calculation === "FIXED_AMOUNT" && !value.fixedAmount) {
        context.addIssue({ code: "custom", path: ["fixedAmount"], message: "A fixed upfront amount is required." });
      }
      if (value.calculation === "MONTHS_OF_RENT" && !value.monthsOfRent) {
        context.addIssue({ code: "custom", path: ["monthsOfRent"], message: "The number of rent months is required." });
      }
      if (!value.calculation || (value.calculation === "FIXED_AMOUNT" && value.monthsOfRent) || (value.calculation === "MONTHS_OF_RENT" && value.fixedAmount)) {
        context.addIssue({ code: "custom", path: ["calculation"], message: "Choose exactly one upfront commission basis." });
      }
      if (value.percentage || value.durationMonths || value.untilLeaseEnd) {
        context.addIssue({ code: "custom", path: ["mode"], message: "Upfront commission cannot include percentage-period terms." });
      }
      return;
    }

    const percentage = value.percentage ? new Prisma.Decimal(value.percentage) : null;
    if (!percentage || percentage.isZero() || percentage.greaterThan(100)) {
      context.addIssue({ code: "custom", path: ["percentage"], message: "Percentage commission must be greater than 0 and no more than 100." });
    }
    if (value.calculation || value.fixedAmount || value.monthsOfRent) {
      context.addIssue({ code: "custom", path: ["mode"], message: "Percentage commission cannot include upfront terms." });
    }
    if (value.durationMonths === undefined && value.untilLeaseEnd !== true) {
      context.addIssue({ code: "custom", path: ["durationMonths"], message: "Choose a duration or until-lease-end commission period." });
    }
    if (value.durationMonths !== undefined && value.untilLeaseEnd === true) {
      context.addIssue({ code: "custom", path: ["durationMonths"], message: "Choose either a fixed duration or until lease end." });
    }
  });

export type RentalPropertyCommission = z.infer<typeof rentalPropertyCommissionSchema>;

export type RentalCommissionPreview = {
  agencyCommission: string;
  landlordRemainder: string;
  currency: RentalPropertyCommission["currency"];
};

export function previewRentalPropertyCommission(input: {
  commission: RentalPropertyCommission;
  monthlyRent: string;
  collectedRent: string;
}): RentalCommissionPreview {
  const commission = rentalPropertyCommissionSchema.parse(input.commission);
  const rent = new Prisma.Decimal(input.monthlyRent);
  const collected = new Prisma.Decimal(input.collectedRent);
  if (rent.isNegative() || collected.isNegative()) throw new Error("Rent amounts cannot be negative.");

  let agency = new Prisma.Decimal(0);
  if (commission.mode === "UPFRONT") {
    const target = commission.calculation === "FIXED_AMOUNT"
      ? new Prisma.Decimal(commission.fixedAmount!)
      : rent.mul(new Prisma.Decimal(commission.monthsOfRent!));
    agency = Prisma.Decimal.min(collected, target);
  } else if (commission.mode === "PERCENTAGE") {
    agency = collected.mul(new Prisma.Decimal(commission.percentage!)).div(100);
  }

  return {
    agencyCommission: agency.toDecimalPlaces(2).toFixed(2),
    landlordRemainder: collected.minus(agency).toDecimalPlaces(2).toFixed(2),
    currency: commission.currency,
  };
}
