import { db } from "@/lib/db";
import { PROPERTY_MATCH_THRESHOLD, scoreAllPropertiesForInquiry } from "./score";
import { buildInquiryMatchingProfile } from "./inquiry-profile";

export async function createInquiryMatchNotifications(organizationId: string, inquiryId: string) {
  const inquiry = await db.inquiry.findFirst({ where: { id: inquiryId, organizationId, status: { not: "CLOSED" } } });
  if (!inquiry) return 0;
  const properties = await db.property.findMany({ where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } }, select: { id: true, title: true, suburb: true, listingType: true, currency: true, askingPrice: true, rentalPrice: true, propertyType: true, bedrooms: true, bathrooms: true, matchingMetadata: true, assignedAgentId: true } });
  const profile = buildInquiryMatchingProfile(inquiry);
  const scored = scoreAllPropertiesForInquiry(profile as never, properties as never);
  const matches = properties.filter((property) => scored.some((result) => result.propertyId === property.id && result.score > PROPERTY_MATCH_THRESHOLD));
  if (!matches.length) return 0;
  await db.propertyMatchNotification.createMany({ data: matches.map((property) => ({ organizationId, propertyId: property.id, inquiryId, agentId: inquiry.assignedAgentId || property.assignedAgentId, title: `New property match for ${inquiry.clientName}`, message: `${property.title} in ${property.suburb} matches this client’s requirements.` })), skipDuplicates: true });
  return matches.length;
}
