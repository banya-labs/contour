import type { InquiryMatchingProfile, MatchingCandidate, MatchResult } from "./types";

const normalise = (value: string) => value.trim().toLowerCase();

export function scorePropertyForInquiry(
  inquiry: InquiryMatchingProfile,
  property: MatchingCandidate,
): MatchResult {
  const failures: string[] = [];
  const reasons: string[] = [];
  const metadata = property.matchingMetadata;
  const price = property.listingType === "FOR_RENT" ? property.rentalPrice : property.askingPrice;
  const areas = [property.suburb, ...(metadata?.nearbyAreas || [])].map(normalise);
  const requestedAreas = (inquiry.preferredAreas || []).map(normalise);

  if (inquiry.lookingFor && property.listingType !== "BOTH" && property.listingType !== inquiry.lookingFor) failures.push("listing type");
  if (inquiry.propertyType && property.propertyType !== inquiry.propertyType) failures.push("property type");
  if (inquiry.currency && property.currency !== inquiry.currency) failures.push("currency");
  if (requestedAreas.length && !requestedAreas.some((area) => areas.includes(area))) failures.push("location");
  if (price != null && inquiry.budgetMax != null && price > inquiry.budgetMax * 1.1) failures.push("budget");
  if (price != null && inquiry.budgetMin != null && price < inquiry.budgetMin * 0.9) failures.push("budget minimum");
  if (inquiry.bedroomsMin != null && (property.bedrooms == null || property.bedrooms < inquiry.bedroomsMin)) failures.push("bedrooms");
  if (inquiry.bathroomsMin != null && (property.bathrooms == null || property.bathrooms < inquiry.bathroomsMin)) failures.push("bathrooms");

  if (failures.length) return { propertyId: property.id, score: 0, reasons, hardFailures: failures };

  let score = 40;
  if (requestedAreas.length && requestedAreas.some((area) => areas.includes(area))) { score += 25; reasons.push("preferred area"); }
  if (inquiry.budgetMax != null && price != null) { score += price <= inquiry.budgetMax ? 20 : 10; reasons.push("within budget"); }
  if (inquiry.bedroomsMin != null) { score += 10; reasons.push("bedroom requirement"); }
  if (inquiry.bathroomsMin != null) { score += 5; reasons.push("bathroom requirement"); }

  const text = [...(metadata?.features || []), ...(metadata?.keywords || [])].map(normalise);
  const preferences = [...(inquiry.mustHave || []), ...(inquiry.niceToHave || []), ...(inquiry.keywords || [])].map(normalise);
  const featureHits = preferences.filter((preference) => text.some((value) => value.includes(preference) || preference.includes(value)));
  if (featureHits.length) { score = Math.min(100, score + Math.min(10, featureHits.length * 2)); reasons.push(`${featureHits.length} preference(s)`); }

  return { propertyId: property.id, score: Math.min(100, score), reasons, hardFailures: [] };
}

export function rankPropertiesForInquiry(inquiry: InquiryMatchingProfile, properties: MatchingCandidate[], limit = 5): MatchResult[] {
  return properties.map((property) => scorePropertyForInquiry(inquiry, property)).filter((result) => result.hardFailures.length === 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
