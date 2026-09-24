import { db } from "@/lib/db";
import { inquiryMatchesProperty } from "./inquiry-property-match";

export async function createInquiryMatchNotifications(organizationId: string, inquiryId: string) {
  const inquiry = await db.inquiry.findFirst({ where: { id: inquiryId, organizationId, status: { not: "CLOSED" } } });
  if (!inquiry) return 0;
  const properties = await db.property.findMany({ where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } }, select: { id: true, title: true, suburb: true, listingType: true, currency: true, askingPrice: true, rentalPrice: true, propertyType: true, assignedAgentId: true } });
  const matches = properties.filter((property) => inquiryMatchesProperty({ lookingFor: inquiry.lookingFor, currency: inquiry.currency, budgetMax: inquiry.budgetMax ? Number(inquiry.budgetMax) : null, preferredSuburbs: inquiry.preferredSuburbs, propertyType: inquiry.propertyType }, { listingType: property.listingType, currency: property.currency, askingPrice: property.askingPrice ? Number(property.askingPrice) : null, rentalPrice: property.rentalPrice ? Number(property.rentalPrice) : null, suburb: property.suburb, propertyType: property.propertyType }));
  if (!matches.length) return 0;
  await db.propertyMatchNotification.createMany({ data: matches.map((property) => ({ organizationId, propertyId: property.id, inquiryId, agentId: inquiry.assignedAgentId || property.assignedAgentId, title: `New property match for ${inquiry.clientName}`, message: `${property.title} in ${property.suburb} matches this client’s requirements.` })), skipDuplicates: true });
  return matches.length;
}
