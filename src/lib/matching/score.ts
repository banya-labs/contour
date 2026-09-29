import type { InquiryMatchingProfile, MatchingCandidate, MatchResult } from "./types";

export const PROPERTY_MATCH_THRESHOLD = 70;

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
  if (inquiry.currency && property.currency !== inquiry.currency) failures.push("currency");
  if (inquiry.propertyType && property.propertyType !== inquiry.propertyType) failures.push("property type");

  if (failures.length) return { propertyId: property.id, score: 0, reasons, hardFailures: failures };

  let score = 25;
  if (requestedAreas.length) {
    if (requestedAreas.some((area) => areas.includes(area))) { score += 30; reasons.push("preferred area"); }
    else if (requestedAreas.some((area) => areas.some((candidate) => candidate.includes(area) || area.includes(candidate)))) { score += 15; reasons.push("nearby area"); }
    else reasons.push("different area");
  } else score += 15;
  if (price != null && inquiry.budgetMax != null) {
    const ratio = price / inquiry.budgetMax;
    const budgetScore = ratio <= 1 ? 25 : ratio <= 1.1 ? 18 : ratio <= 1.25 ? 10 : 0;
    score += budgetScore;
    reasons.push(budgetScore >= 18 ? "within budget" : budgetScore > 0 ? "near budget" : "over budget");
  } else score += 12;
  if (inquiry.budgetMin != null && price != null && price < inquiry.budgetMin) { score = Math.max(0, score - 8); reasons.push("below budget range"); }
  if (inquiry.bedroomsMin != null) {
    const bedroomDelta = (property.bedrooms ?? 0) - inquiry.bedroomsMin;
    score += bedroomDelta >= 0 ? 10 : bedroomDelta === -1 ? 5 : 0;
    reasons.push(bedroomDelta >= 0 ? "bedroom requirement" : bedroomDelta === -1 ? "near bedroom requirement" : "bedrooms below requirement");
  } else score += 5;
  if (inquiry.bathroomsMin != null) {
    const bathroomDelta = (property.bathrooms ?? 0) - inquiry.bathroomsMin;
    score += bathroomDelta >= 0 ? 5 : bathroomDelta === -1 ? 2 : 0;
    reasons.push(bathroomDelta >= 0 ? "bathroom requirement" : bathroomDelta === -1 ? "near bathroom requirement" : "bathrooms below requirement");
  } else score += 3;
  if (inquiry.areaMinSqm != null) {
    const areaDelta = (property.plotSizeSqm ?? 0) - inquiry.areaMinSqm;
    score += areaDelta >= 0 ? 8 : areaDelta >= -20 ? 4 : 0;
    reasons.push(areaDelta >= 0 ? "area requirement" : areaDelta >= -20 ? "near area requirement" : "area below requirement");
  } else score += 2;

  const text = [...(metadata?.features || []), ...(metadata?.keywords || [])].map(normalise);
  const preferences = [...(inquiry.mustHave || []), ...(inquiry.niceToHave || []), ...(inquiry.keywords || [])].map(normalise);
  const featureHits = preferences.filter((preference) => text.some((value) => value.includes(preference) || preference.includes(value)));
  if (featureHits.length) { score = Math.min(100, score + Math.min(10, featureHits.length * 2)); reasons.push(`${featureHits.length} preference(s)`); }

  return { propertyId: property.id, score: Math.min(100, Math.max(0, Math.round(score))), reasons, hardFailures: [] };
}

export function rankPropertiesForInquiry(inquiry: InquiryMatchingProfile, properties: MatchingCandidate[], limit = 5): MatchResult[] {
  return scoreAllPropertiesForInquiry(inquiry, properties).filter((result) => result.hardFailures.length === 0).slice(0, limit);
}

export function scoreAllPropertiesForInquiry(inquiry: InquiryMatchingProfile, properties: MatchingCandidate[]): MatchResult[] {
  return properties.map((property) => scorePropertyForInquiry(inquiry, property)).sort((a, b) => b.score - a.score);
}
