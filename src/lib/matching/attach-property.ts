import { db } from "../db";
import { Prisma } from "@prisma/client";
import { isActiveInquiry } from "./policy";
import { canManageMatching, inquiryVisibility, type MatchingScope } from "./visibility";
import { MatchingError, invalidateMatchingSummaries } from "./service";
type Attachment = { inquiryId: string; propertyId: string | null; expectedPropertyId?: string | null };
export async function attachPropertyInTransaction(tx: Prisma.TransactionClient, scope: MatchingScope, input: Attachment) {
  const inquiry = await tx.inquiry.findFirst({ where: { ...inquiryVisibility(scope), id: input.inquiryId } });
  if (!inquiry) throw new MatchingError("Inquiry not found");
  if (!isActiveInquiry(inquiry.status)) throw new MatchingError("Terminal inquiries cannot be attached", 409);
  if (!canManageMatching(scope) && inquiry.assignedAgentId && inquiry.assignedAgentId !== scope.userId) throw new MatchingError("Inquiry belongs to another agent", 403);
  const expected = input.expectedPropertyId === undefined ? null : input.expectedPropertyId;
  if (inquiry.propertyId !== expected && inquiry.propertyId !== input.propertyId) throw new MatchingError("Attachment changed; refresh before choosing another property", 409);
  let selectedProperty: { askingPrice: Prisma.Decimal | null; rentalPrice: Prisma.Decimal | null } | null = null;
  if (input.propertyId) {
    const property = await tx.property.findFirst({ where: { id: input.propertyId, organizationId: scope.organizationId } });
    if (!property || property.status !== "AVAILABLE") throw new MatchingError("Property is no longer available", 409);
    selectedProperty = { askingPrice: property.askingPrice, rentalPrice: property.rentalPrice };
    // Matching is a ranking and review aid. Staff may deliberately associate
    // any available property with an inquiry when the business context calls
    // for it, even when the saved preferences do not match.
    const closingInquiry = inquiry.status === "VERIFICATION_CLOSING" ? await tx.inquiry.findFirst({
      where: { organizationId: scope.organizationId, propertyId: input.propertyId, status: "VERIFICATION_CLOSING", id: { not: inquiry.id } },
      select: { id: true },
    }) : null;
    if (closingInquiry) throw new MatchingError("This property is already assigned to another Verification & Closing inquiry.", 409);
  }
  const automaticDealValue = selectedProperty
    ? inquiry.lookingFor === "FOR_RENT"
      ? selectedProperty.rentalPrice ?? selectedProperty.askingPrice
      : selectedProperty.askingPrice ?? selectedProperty.rentalPrice
    : null;
  const changed = await tx.inquiry.updateMany({ where: { id: inquiry.id, organizationId: scope.organizationId, propertyId: inquiry.propertyId, status: inquiry.status, assignedAgentId: inquiry.assignedAgentId }, data: { propertyId: input.propertyId, matchStatus: input.propertyId ? "MATCHED" : "UNMATCHED", ...(automaticDealValue != null ? { dealValue: automaticDealValue } : {}) } });
  if (changed.count !== 1) throw new MatchingError("Inquiry changed; refresh and retry", 409);
  await tx.auditLog.create({ data: { organizationId: scope.organizationId, userId: scope.userId, action: "INQUIRY_PROPERTY_ATTACHED", entityType: "Inquiry", entityId: inquiry.id, details: { previousPropertyId: inquiry.propertyId, propertyId: input.propertyId } } });
  return tx.inquiry.findUnique({ where: { id: inquiry.id }, include: { contact: true, property: { select: { id: true, title: true, suburb: true } } } });
}
export async function attachPropertyToInquiry(scope: MatchingScope, input: Attachment) {
  try { const result = await db.$transaction((tx) => attachPropertyInTransaction(tx, scope, input), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); invalidateMatchingSummaries(scope.organizationId); return result; }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new MatchingError("Inquiry changed; refresh and retry", 409); throw error; }
}
