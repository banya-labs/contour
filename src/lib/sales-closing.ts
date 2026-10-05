import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ensureClosingWorkflow } from "./closing-workflow-persistence";
import { MatchingError } from "./matching/errors";
export const saleClosingSchema = z.object({ propertyId: z.string().min(1).max(128), contactId: z.string().min(1).max(128), inquiryId: z.string().min(1).max(128).optional(), agreedValue: z.number().finite().positive().max(999999999999), currency: z.enum(["ZMW", "USD", "ZAR"]), closingAgentId: z.string().min(1).max(128), idempotencyKey: z.string().uuid() });
type Input = z.infer<typeof saleClosingSchema> & { organizationId: string; actorId: string; canManage: boolean };
export async function startSaleClosing(tx: Prisma.TransactionClient, input: Input): Promise<{ inquiryId: string }> {
  const requestInput = { propertyId: input.propertyId, contactId: input.contactId, agreedValue: input.agreedValue, currency: input.currency, closingAgentId: input.closingAgentId, inquiryId: input.inquiryId || null };
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${input.organizationId}:sale-request:${input.idempotencyKey}`}, 0))`;
  const request = await tx.saleClosingRequest.findUnique({ where: { organizationId_idempotencyKey: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey } } });
  if (request) {
    const saved = request.input as typeof requestInput;
    if (request.actorId !== input.actorId || Object.entries(requestInput).some(([key, value]) => saved[key as keyof typeof saved] !== value)) throw new MatchingError("This request key belongs to another closing request.", 409);
    if (!await tx.inquiry.findFirst({ where: { id: request.inquiryId, organizationId: input.organizationId, ...(input.canManage ? {} : { assignedAgentId: input.actorId }) }, select: { id: true } })) throw new MatchingError("Inquiry not found.", 404);
    return { inquiryId: request.inquiryId };
  }
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${input.organizationId}:sale-closing:${input.propertyId}`}, 0))`;
  const key = `sale-closing:${input.idempotencyKey}`;
  const repeated = await tx.inquiry.findFirst({ where: { organizationId: input.organizationId, idempotencyKey: key } });
  if (repeated) {
    if (repeated.propertyId !== input.propertyId || repeated.contactId !== input.contactId || repeated.assignedAgentId !== input.closingAgentId || Number(repeated.dealValue) !== input.agreedValue || repeated.currency !== input.currency) throw new MatchingError("This request key belongs to another closing request.", 409);
    if (!input.canManage && repeated.assignedAgentId !== input.actorId) throw new MatchingError("Inquiry not found.", 404);
    return { inquiryId: repeated.id };
  }
  const property = await tx.property.findFirst({ where: { id: input.propertyId, organizationId: input.organizationId }, select: { id: true, status: true, listingType: true, currency: true, assignedAgentId: true } });
  if (!property || !["AVAILABLE", "UNDER_OFFER"].includes(property.status) || !["FOR_SALE", "BOTH"].includes(property.listingType)) throw new MatchingError("Select an available sale property.", 409);
  if (property.currency !== input.currency) throw new MatchingError("Agreed value must use the property's currency.", 400);
  if (!input.canManage && (input.closingAgentId !== input.actorId || property.assignedAgentId !== input.actorId)) throw new MatchingError("Only management can start closing for another agent.", 403);
  const agent = await tx.member.findFirst({ where: { organizationId: input.organizationId, userId: input.closingAgentId, status: "active" }, select: { id: true } });
  if (!agent) throw new MatchingError("Select an active agent in this agency.", 400);
  const contact = await tx.contact.findFirst({ where: { id: input.contactId, organizationId: input.organizationId }, select: { id: true, name: true, phone: true, email: true } });
  if (!contact) throw new MatchingError("Contact not found in this agency.", 404);
  const existing = await tx.inquiry.findFirst({ where: { organizationId: input.organizationId, contactId: contact.id, propertyId: property.id, lookingFor: "FOR_SALE", status: { notIn: ["CLOSED", "CLOSED_WON", "CLOSED_LOST"] }, ...(input.inquiryId ? { id: input.inquiryId } : {}) }, orderBy: { updatedAt: "desc" } });
  if (input.inquiryId && !existing) throw new MatchingError("The selected opportunity does not belong to this contact and property, or is closed.", 409);
  if (existing && !input.canManage && existing.assignedAgentId !== input.actorId) throw new MatchingError("Only management can reassign another agent's opportunity.", 403);
  let inquiryId: string;
  if (existing) {
    if (existing.status === "VERIFICATION_CLOSING" && (Number(existing.dealValue) !== input.agreedValue || existing.currency !== input.currency || existing.assignedAgentId !== input.closingAgentId)) throw new MatchingError("Closing is already in progress with different terms. Review that inquiry before changing its value or agent.", 409);
    inquiryId = existing.id;
    if (existing.status !== "VERIFICATION_CLOSING") await tx.inquiry.update({ where: { id: existing.id, organizationId: input.organizationId, status: existing.status }, data: { status: "VERIFICATION_CLOSING", assignedAgentId: input.closingAgentId, dealValue: new Prisma.Decimal(input.agreedValue), currency: input.currency, managementCloseRequestedAt: new Date(), managementCloseRequestedById: input.actorId } });
  } else {
    const inquiry = await tx.inquiry.create({ data: { organizationId: input.organizationId, contactId: contact.id, clientName: contact.name, clientPhone: contact.phone, clientEmail: contact.email, propertyId: property.id, lookingFor: "FOR_SALE", status: "VERIFICATION_CLOSING", assignedAgentId: input.closingAgentId, dealValue: new Prisma.Decimal(input.agreedValue), currency: input.currency, idempotencyKey: key, managementCloseRequestedAt: new Date(), managementCloseRequestedById: input.actorId, notes: "Sale closing initiated from the property sales registry.", exclusiveLockExpiresAt: new Date(Date.now() + 30 * 86400000) }, select: { id: true } });
    inquiryId = inquiry.id;
  }
  await ensureClosingWorkflow(tx, { organizationId: input.organizationId, inquiryId, actorId: input.actorId });
  await tx.saleClosingRequest.create({ data: { organizationId: input.organizationId, actorId: input.actorId, idempotencyKey: input.idempotencyKey, inquiryId, input: requestInput } });
  await tx.auditLog.create({ data: { organizationId: input.organizationId, userId: input.actorId, action: "SALE_CLOSING_STARTED", entityType: "Inquiry", entityId: inquiryId, details: { propertyId: property.id, contactId: contact.id, resumed: Boolean(existing), previousStatus: existing?.status || null, status: "VERIFICATION_CLOSING" } } });
  return { inquiryId };
}
