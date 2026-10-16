import { z } from "zod";
import { Prisma, type PrismaClient } from "@prisma/client";
import { resolveClosingTransactionType } from "./closing-workflow";
import { snapshotLeaseCommissionAgreement } from "./property-finance/lease-commission";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const rentalClosingInputSchema = z.object({
  monthlyRent: z.coerce.number().positive(),
  depositAmount: z.coerce.number().nonnegative(),
  managementFeePercent: z.coerce.number().min(0).max(100).default(10),
  leaseStartDate: z.coerce.date(),
  leaseEndDate: z.coerce.date(),
  paymentDayOfMonth: z.coerce.number().int().min(1).max(28),
  tenantName: z.string().trim().min(2).max(160).optional(),
  tenantPhone: z.string().trim().min(7).max(40).optional(),
  tenantEmail: z.string().email().optional().or(z.literal("")),
  tenantIdNumber: z.string().trim().max(80).optional(),
}).superRefine((value, context) => {
  if (value.leaseEndDate <= value.leaseStartDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ["leaseEndDate"], message: "Lease end date must be after the start date." });
});

export type RentalClosingInput = z.infer<typeof rentalClosingInputSchema>;

export function resolveRentalClosingContext(input: { lookingFor: string; propertyId?: string | null; contactId?: string | null }) {
  if (resolveClosingTransactionType(input.lookingFor) !== "RENTAL_PLACEMENT") return { valid: false as const, reason: "This closing flow is only available for rental placement deals." };
  if (!input.propertyId) return { valid: false as const, reason: "A property is required before starting a lease." };
  if (!input.contactId) return { valid: false as const, reason: "A client is required before starting a lease." };
  return { valid: true as const };
}

export async function startRentalLease(client: DbClient, input: { inquiryId: string; organizationId: string; actorId: string; lease: RentalClosingInput }) {
  const parsed = rentalClosingInputSchema.parse(input.lease);
  const run = async (tx: Prisma.TransactionClient) => {
    const inquiry = await tx.inquiry.findFirst({
      where: { id: input.inquiryId, organizationId: input.organizationId },
      select: { id: true, status: true, outcome: true, lookingFor: true, contactId: true, clientName: true, clientPhone: true, clientEmail: true, propertyId: true, currency: true, assignedAgentId: true, dealValue: true, property: { select: { id: true, listingType: true, status: true, agencyCommissionPct: true, rentalPrice: true, rentalCommissionConfigs: { where: { organizationId: input.organizationId, status: "APPROVED", effectiveFrom: { lte: parsed.leaseStartDate } }, orderBy: { revision: "desc" }, take: 1 } } } },
    });
    if (!inquiry) throw new Error("INQUIRY_NOT_FOUND");
    const context = resolveRentalClosingContext(inquiry);
    if (!context.valid) throw new Error(context.reason);
    if (inquiry.status !== "VERIFICATION_CLOSING") throw new Error("RENTAL_DEAL_NOT_READY");
    if (!inquiry.property || (inquiry.property.listingType !== "FOR_RENT" && inquiry.property.listingType !== "BOTH")) throw new Error("PROPERTY_NOT_RENTAL");
    const commissionConfig = inquiry.property.rentalCommissionConfigs[0];
    if (!commissionConfig) throw new Error("RENTAL_COMMISSION_NOT_CONFIGURED");
    const commissionAgreement = snapshotLeaseCommissionAgreement({
      config: {
        ...commissionConfig,
        status: "APPROVED" as const,
        calculation: commissionConfig.basis ?? undefined,
        fixedAmount: commissionConfig.fixedAmount?.toFixed(2),
        monthsOfRent: commissionConfig.monthsOfRent?.toFixed(2),
        percentage: commissionConfig.percentage?.toFixed(2),
        durationMonths: commissionConfig.durationMonths ?? undefined,
        effectiveFrom: commissionConfig.effectiveFrom.toISOString().slice(0, 10),
        evidenceReference: commissionConfig.evidenceReference ?? undefined,
      },
      monthlyRent: String(parsed.monthlyRent),
      leaseCurrency: inquiry.currency,
      leaseStartDate: parsed.leaseStartDate,
    });

    const activeLease = await tx.lease.findFirst({ where: { organizationId: input.organizationId, propertyId: inquiry.propertyId!, status: { in: ["ACTIVE", "EXPIRING_SOON", "IN_ARREARS"] } }, select: { id: true } });
    if (activeLease) throw new Error("ACTIVE_LEASE_EXISTS");
    const now = new Date();

    const lease = await tx.lease.create({
      data: {
        organizationId: input.organizationId,
        propertyId: inquiry.propertyId!,
        inquiryId: inquiry.id,
        tenantName: parsed.tenantName || inquiry.clientName,
        tenantPhone: parsed.tenantPhone || inquiry.clientPhone,
        tenantEmail: parsed.tenantEmail || inquiry.clientEmail || undefined,
        tenantIdNumber: parsed.tenantIdNumber || undefined,
        monthlyRent: new Prisma.Decimal(parsed.monthlyRent), currency: inquiry.currency, depositAmount: new Prisma.Decimal(parsed.depositAmount), managementFeePercent: new Prisma.Decimal(parsed.managementFeePercent), leaseStartDate: parsed.leaseStartDate, leaseEndDate: parsed.leaseEndDate, paymentDayOfMonth: parsed.paymentDayOfMonth, status: "ACTIVE",
        rentalCommissionAgreement: { create: { organizationId: input.organizationId, sourceConfigId: commissionAgreement.sourceConfigId, sourceConfigRevision: commissionAgreement.sourceConfigRevision, mode: commissionAgreement.mode, basis: commissionAgreement.basis, fixedAmount: commissionAgreement.fixedAmount, monthsOfRent: commissionAgreement.monthsOfRent, percentage: commissionAgreement.percentage, durationMonths: commissionAgreement.durationMonths, untilLeaseEnd: commissionAgreement.untilLeaseEnd, currency: commissionAgreement.currency, frozenMonthlyRent: commissionAgreement.frozenMonthlyRent, targetAmount: commissionAgreement.targetAmount, effectiveFrom: parsed.leaseStartDate, approvedById: input.actorId, approvedAt: now } },
      },
      select: { id: true, inquiryId: true, propertyId: true },
    });
    await tx.inquiry.update({ where: { id: inquiry.id }, data: { status: "CLOSED", outcome: "WON", closedAt: now, closedById: input.actorId } });
    await tx.property.update({ where: { id: inquiry.propertyId! }, data: { status: "UNDER_OFFER" } });
    const grossValue = parsed.monthlyRent;
    const commissionPct = commissionConfig.mode === "PERCENTAGE" ? Number(commissionConfig.percentage || 0) : 0;
    const commissionAmount = commissionAgreement.targetAmount ? Number(commissionAgreement.targetAmount) : grossValue * commissionPct / 100;
    await tx.transaction.create({ data: { organizationId: input.organizationId, propertyId: inquiry.propertyId!, inquiryId: inquiry.id, transactionType: "RENTAL_PLACEMENT", grossValue: new Prisma.Decimal(grossValue), currency: inquiry.currency, agencyCommissionPct: new Prisma.Decimal(commissionPct), agencyCommissionAmount: new Prisma.Decimal(commissionAmount), agentSplitPct: new Prisma.Decimal(50), agentSplitAmount: new Prisma.Decimal(commissionAmount / 2), status: "EARNED", closingAgentId: inquiry.assignedAgentId || input.actorId, closedAt: now } });
    return lease;
  };
  return "$transaction" in client ? client.$transaction(run) : run(client);
}
