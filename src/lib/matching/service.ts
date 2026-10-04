import { db } from "../db";
import { z } from "zod";
import { buildInquiryMatchingProfile } from "./inquiry-profile";
import { buildPropertyMatchingCandidate } from "./property-profile";
import { scorePropertyForInquiry } from "./score";
import { isQualifyingMatch, MATCH_POLICY_VERSION, PROPERTY_MATCH_THRESHOLD, TERMINAL_INQUIRY_STATUSES } from "./policy";
import { inquiryVisibility, type MatchingScope } from "./visibility";
import type { Prisma } from "@prisma/client";

export const matchingQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), view: z.enum(["qualifying", "near", "all"]).default("qualifying") });
export type MatchingQuery = z.infer<typeof matchingQuerySchema>;
export const candidateSelect = { id: true, title: true, suburb: true, listingType: true, propertyType: true, currency: true, askingPrice: true, rentalPrice: true, bedrooms: true, bathrooms: true, plotSizeSqm: true, matchingMetadata: true, status: true } satisfies Prisma.PropertySelect;
export const inquirySelect = { id: true, clientName: true, clientPhone: true, contactId: true, assignedAgentId: true, propertyId: true, status: true, lookingFor: true, currency: true, budgetMin: true, budgetMax: true, preferredSuburbs: true, propertyType: true, bedroomsMin: true, bathroomsMin: true, areaMinSqm: true, matchingProfile: true, contact: { select: { id: true, name: true, phone: true } } } satisfies Prisma.InquirySelect;
import { MatchingError } from "./errors";
export { MatchingError } from "./errors";
function envelope<T extends { score: number; isMatch: boolean; propertyId: string; inquiry?: { id: string } }>(rows: T[], query: MatchingQuery) {
  const sorted = rows.filter((row) => query.view === "all" || (query.view === "near" ? !row.isMatch : row.isMatch)).sort((a, b) => b.score - a.score || (a.inquiry?.id || a.propertyId).localeCompare(b.inquiry?.id || b.propertyId));
  return { results: sorted.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), total: sorted.length, page: query.page, pageSize: query.pageSize, hasMore: query.page * query.pageSize < sorted.length, threshold: PROPERTY_MATCH_THRESHOLD, policyVersion: MATCH_POLICY_VERSION, calculatedAt: new Date().toISOString() };
}
export async function getPropertyInquiryMatches(scope: MatchingScope, propertyId: string, query: MatchingQuery) {
  const property = await db.property.findFirst({ where: { id: propertyId, organizationId: scope.organizationId, status: "AVAILABLE" }, select: candidateSelect });
  if (!property) throw new MatchingError("Available property not found");
  const inquiries = await db.inquiry.findMany({ where: { ...inquiryVisibility(scope), propertyId: null, status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } }, select: inquirySelect });
  const candidate = buildPropertyMatchingCandidate(property);
  const rows = inquiries.map((inquiry) => { const result = scorePropertyForInquiry(buildInquiryMatchingProfile(inquiry), candidate); return { ...result, inquiry, property, isMatch: isQualifyingMatch(result) }; });
  return { ...envelope(rows, query), property };
}
export async function getInquiryPropertyMatches(scope: MatchingScope, inquiryId: string, query: MatchingQuery) {
  const inquiry = await db.inquiry.findFirst({ where: { ...inquiryVisibility(scope), id: inquiryId, status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } }, select: inquirySelect });
  if (!inquiry) throw new MatchingError("Inquiry not found");
  const properties = await db.property.findMany({ where: { organizationId: scope.organizationId, status: "AVAILABLE" }, select: candidateSelect });
  const profile = buildInquiryMatchingProfile(inquiry);
  const rows = properties.map((property) => { const result = scorePropertyForInquiry(profile, buildPropertyMatchingCandidate(property)); return { ...result, property, isMatch: isQualifyingMatch(result) }; });
  return { ...envelope(rows, query), inquiry, matchingEnabled: !inquiry.propertyId };
}
type PropertySummary = { id: string; qualifyingCount: number; topMatches: Array<{ id: string; name: string; score: number }> };
type InquirySummary = { id: string; qualifyingCount: number; topMatches: Array<{ id: string; title: string; suburb: string; score: number }> };
const summaryCache = new Map<string, { organizationId: string; expiresAt: number; calculatedAt: string; properties: Map<string, PropertySummary>; inquiries: Map<string, InquirySummary> }>();
let summaryRevision = 0;
export function invalidateMatchingSummaries(organizationId: string) {
  summaryRevision++;
  for (const [key, value] of summaryCache) if (value.organizationId === organizationId) summaryCache.delete(key);
}
export async function getMatchingSummaries(scope: MatchingScope, propertyIds: string[], inquiryIds: string[]) {
  const startedRevision = summaryRevision;
  const cacheKey = JSON.stringify([scope.organizationId, scope.userId, [...scope.permissions].sort(), MATCH_POLICY_VERSION]);
  const cached = summaryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return { propertySummaries: propertyIds.flatMap((id) => cached.properties.has(id) ? [cached.properties.get(id)!] : []), inquirySummaries: inquiryIds.flatMap((id) => cached.inquiries.has(id) ? [cached.inquiries.get(id)!] : []), calculatedAt: cached.calculatedAt, policyVersion: MATCH_POLICY_VERSION };
  const [properties, inquiries] = await Promise.all([
    db.property.findMany({ where: { organizationId: scope.organizationId, status: "AVAILABLE" }, select: candidateSelect }),
    db.inquiry.findMany({ where: { ...inquiryVisibility(scope), propertyId: null, status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } }, select: inquirySelect }),
  ]);
  const propertySummaries = new Map(properties.map(({ id }) => [id, { id, qualifyingCount: 0, topMatches: [] as PropertySummary["topMatches"] }]));
  const inquirySummaries = new Map(inquiries.map(({ id }) => [id, { id, qualifyingCount: 0, topMatches: [] as InquirySummary["topMatches"] }]));
  const candidates = properties.map(buildPropertyMatchingCandidate);
  for (const inquiry of inquiries) {
    const profile = buildInquiryMatchingProfile(inquiry);
    for (const property of candidates) {
      const result = scorePropertyForInquiry(profile, property);
      if (!isQualifyingMatch(result)) continue;
      const ps = propertySummaries.get(property.id), ins = inquirySummaries.get(inquiry.id);
      if (ps) { ps.qualifyingCount++; ps.topMatches.push({ id: inquiry.id, name: inquiry.clientName, score: result.score }); ps.topMatches.sort((a,b) => b.score-a.score || a.id.localeCompare(b.id)).splice(2); }
      if (ins) { ins.qualifyingCount++; ins.topMatches.push({ id: property.id, title: property.title, suburb: property.suburb, score: result.score }); ins.topMatches.sort((a,b) => b.score-a.score || a.id.localeCompare(b.id)).splice(2); }
    }
  }
  for (const summary of [...propertySummaries.values(), ...inquirySummaries.values()]) summary.topMatches.sort((a,b) => b.score - a.score || a.id.localeCompare(b.id)).splice(2);
  const calculatedAt = new Date().toISOString();
  if (summaryCache.size >= 100) summaryCache.delete(summaryCache.keys().next().value!);
  if (startedRevision === summaryRevision) summaryCache.set(cacheKey, { organizationId: scope.organizationId, expiresAt: Date.now()+30_000, calculatedAt, properties: propertySummaries, inquiries: inquirySummaries });
  return { propertySummaries: propertyIds.flatMap((id) => propertySummaries.has(id) ? [propertySummaries.get(id)!] : []), inquirySummaries: inquiryIds.flatMap((id) => inquirySummaries.has(id) ? [inquirySummaries.get(id)!] : []), calculatedAt, policyVersion: MATCH_POLICY_VERSION };
}

export async function getUnassignedBestMatches(scope: MatchingScope, query: MatchingQuery) {
  const [properties, inquiries] = await Promise.all([
    db.property.findMany({ where: { organizationId: scope.organizationId, status: "AVAILABLE" }, select: candidateSelect }),
    db.inquiry.findMany({ where: { ...inquiryVisibility(scope), propertyId: null, status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } }, select: inquirySelect }),
  ]);
  const candidates = properties.map((property) => ({ property, candidate: buildPropertyMatchingCandidate(property) }));
  const best = inquiries.flatMap((inquiry) => {
    const profile = buildInquiryMatchingProfile(inquiry);
    const matches = candidates.map(({ property, candidate }) => { const result = scorePropertyForInquiry(profile, candidate); return { ...result, property, inquiry, isMatch: isQualifyingMatch(result) }; }).filter((row) => row.isMatch).sort((a,b) => b.score-a.score || a.propertyId.localeCompare(b.propertyId));
    return matches.slice(0,1);
  });
  return envelope(best, query);
}
