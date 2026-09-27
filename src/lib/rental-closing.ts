import { z } from "zod";
import { Prisma, type PrismaClient } from "@prisma/client";
import { resolveClosingTransactionType } from "./closing-workflow";

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
  return client.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findFirst({
      where: { id: input.inquiryId, organizationId: input.organizationId },
      select: { id: true, status: true, outcome: true, lookingFor: true, contactId: true, clientName: true, clientPhone: true, clientEmail: true, propertyId: true, currency: true, assignedAgentId: true, dealValue: true, property: { select: { id: true, listingType: true, status: true, agencyCommissionPct: true, rentalPrice: true } } },
    });
    if (!inquiry) throw new Error("INQUIRY_NOT_FOUND");
    const context = resolveRentalClosingContext(inquiry);
    if (!context.valid) throw new Error(context.reason);
    if (inquiry.status !== "VERIFICATION_CLOSING") throw new Error("RENTAL_DEAL_NOT_READY");
    if (!inquiry.property || (inquiry.property.listingType !== "FOR_RENT" && inquiry.property.listingType !== "BOTH")) throw new Error("PROPERTY_NOT_RENTAL");

    const activeLease = await tx.lease.findFirst({ where: { organizationId: input.organizationId, propertyId: inquiry.propertyId!, status: { in: ["ACTIVE", "EXPIRING_SOON", "IN_ARREARS"] } }, select: { id: true } });
    if (activeLease) throw new Error("ACTIVE_LEASE_EXISTS");

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
      },
      select: { id: true, inquiryId: true, propertyId: true },
    });
    const now = new Date();
    await tx.inquiry.update({ where: { id: inquiry.id }, data: { status: "CLOSED", outcome: "WON", closedAt: now, closedById: input.actorId } });
    await tx.property.update({ where: { id: inquiry.propertyId! }, data: { status: "UNDER_OFFER" } });
    const grossValue = parsed.monthlyRent;
    const commissionPct = Number(inquiry.property.agencyCommissionPct || 10);
    const commissionAmount = grossValue * commissionPct / 100;
    await tx.transaction.create({ data: { organizationId: input.organizationId, propertyId: inquiry.propertyId!, inquiryId: inquiry.id, transactionType: "RENTAL_PLACEMENT", grossValue: new Prisma.Decimal(grossValue), currency: inquiry.currency, agencyCommissionPct: new Prisma.Decimal(commissionPct), agencyCommissionAmount: new Prisma.Decimal(commissionAmount), agentSplitPct: new Prisma.Decimal(50), agentSplitAmount: new Prisma.Decimal(commissionAmount / 2), status: "EARNED", closingAgentId: inquiry.assignedAgentId || input.actorId, closedAt: now } });
    return lease;
  });
}
