import { db } from "../db";
import { Prisma } from "@prisma/client";
import { isActiveInquiry } from "./policy";
import { canManageMatching, inquiryVisibility, type MatchingScope } from "./visibility";
import { MatchingError, invalidateMatchingSummaries } from "./service";
import { buildInquiryMatchingProfile } from "./inquiry-profile";
import { buildPropertyMatchingCandidate } from "./property-profile";
import { scorePropertyForInquiry } from "./score";
type Attachment = { inquiryId: string; propertyId: string | null; expectedPropertyId?: string | null };
export async function attachPropertyInTransaction(tx: Prisma.TransactionClient, scope: MatchingScope, input: Attachment) {
  const inquiry = await tx.inquiry.findFirst({ where: { ...inquiryVisibility(scope), id: input.inquiryId } });
  if (!inquiry) throw new MatchingError("Inquiry not found");
  if (!isActiveInquiry(inquiry.status)) throw new MatchingError("Terminal inquiries cannot be attached", 409);
  if (!canManageMatching(scope) && inquiry.assignedAgentId && inquiry.assignedAgentId !== scope.userId) throw new MatchingError("Inquiry belongs to another agent", 403);
  const expected = input.expectedPropertyId === undefined ? null : input.expectedPropertyId;
  if (inquiry.propertyId !== expected && inquiry.propertyId !== input.propertyId) throw new MatchingError("Attachment changed; refresh before choosing another property", 409);
  if (input.propertyId) {
    const property = await tx.property.findFirst({ where: { id: input.propertyId, organizationId: scope.organizationId } });
    if (!property || property.status !== "AVAILABLE") throw new MatchingError("Property is no longer available", 409);
    if (property.listingType !== "BOTH" && property.listingType !== inquiry.lookingFor) throw new MatchingError("Property listing type does not fit inquiry", 409);
    if (property.currency !== inquiry.currency) throw new MatchingError("Property currency does not fit inquiry", 409);
    const result = scorePropertyForInquiry(buildInquiryMatchingProfile(inquiry), buildPropertyMatchingCandidate(property));
    if (result.hardFailures.length) throw new MatchingError(`Property does not meet required criteria: ${result.hardFailures.join(", ")}`, 409);
  }
  const changed = await tx.inquiry.updateMany({ where: { id: inquiry.id, organizationId: scope.organizationId, propertyId: inquiry.propertyId, status: inquiry.status, assignedAgentId: inquiry.assignedAgentId }, data: { propertyId: input.propertyId, matchStatus: input.propertyId ? "MATCHED" : "UNMATCHED" } });
  if (changed.count !== 1) throw new MatchingError("Inquiry changed; refresh and retry", 409);
  await tx.auditLog.create({ data: { organizationId: scope.organizationId, userId: scope.userId, action: "INQUIRY_PROPERTY_ATTACHED", entityType: "Inquiry", entityId: inquiry.id, details: { previousPropertyId: inquiry.propertyId, propertyId: input.propertyId } } });
  return tx.inquiry.findUnique({ where: { id: inquiry.id }, include: { contact: true, property: { select: { id: true, title: true, suburb: true } } } });
}
export async function attachPropertyToInquiry(scope: MatchingScope, input: Attachment) {
  try { const result = await db.$transaction((tx) => attachPropertyInTransaction(tx, scope, input), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); invalidateMatchingSummaries(scope.organizationId); return result; }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new MatchingError("Inquiry changed; refresh and retry", 409); throw error; }
}
