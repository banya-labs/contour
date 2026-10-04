import { db } from "../db";
import { candidateSelect, inquirySelect, invalidateMatchingSummaries } from "./service";
import { buildInquiryMatchingProfile } from "./inquiry-profile";
import { buildPropertyMatchingCandidate } from "./property-profile";
import { scorePropertyForInquiry } from "./score";
import { isQualifyingMatch, TERMINAL_INQUIRY_STATUSES } from "./policy";
export async function reconcileMatchNotifications(organizationId: string, changed: { inquiryId?: string; propertyId?: string }) {
  invalidateMatchingSummaries(organizationId);
  const [inquiries, properties] = await Promise.all([
    db.inquiry.findMany({ where: { organizationId, ...(changed.inquiryId ? { id: changed.inquiryId } : {}), propertyId: null, status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } }, select: inquirySelect }),
    db.property.findMany({ where: { organizationId, ...(changed.propertyId ? { id: changed.propertyId } : {}), status: "AVAILABLE" }, select: { ...candidateSelect, assignedAgentId: true } }),
  ]);
  const candidates = properties.map((property) => ({ property, candidate: buildPropertyMatchingCandidate(property) }));
  let count = 0;
  for (const inquiry of inquiries) {
    const profile = buildInquiryMatchingProfile(inquiry);
    for (const { property, candidate } of candidates) {
      if (!isQualifyingMatch(scorePropertyForInquiry(profile, candidate))) continue;
      const agentId = inquiry.assignedAgentId || property.assignedAgentId || null;
      await db.propertyMatchNotification.upsert({ where: { propertyId_inquiryId: { propertyId: property.id, inquiryId: inquiry.id } }, create: { organizationId, propertyId: property.id, inquiryId: inquiry.id, agentId, title: `New property match for ${inquiry.clientName}`, message: `${property.title} in ${property.suburb} fits this inquiry.` }, update: { agentId } });
      count++;
    }
  }
  return count;
}
export function createInquiryMatchNotifications(organizationId: string, inquiryId: string) { return reconcileMatchNotifications(organizationId, { inquiryId }); }
