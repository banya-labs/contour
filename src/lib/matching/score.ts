import type { InquiryMatchingProfile, MatchingCandidate, MatchResult } from "./types";
import { normalizeLocation } from "@/lib/locations/normalize-location";
export { PROPERTY_MATCH_THRESHOLD } from "./policy";

export function scorePropertyForInquiry(inquiry: InquiryMatchingProfile, property: MatchingCandidate): MatchResult {
  const failures: string[] = [], reasons: string[] = [], unmetPreferences: string[] = [], missingData: string[] = [];
  const strict = inquiry.strictRequirements || {};
  const rental = inquiry.lookingFor === "FOR_RENT" || (!inquiry.lookingFor && property.listingType === "FOR_RENT");
  const price = property.listingType === "BOTH" && (!inquiry.lookingFor || inquiry.lookingFor === "BOTH") ? null : rental ? property.rentalPrice : property.askingPrice;
  if (property.listingType === "BOTH" && (!inquiry.lookingFor || inquiry.lookingFor === "BOTH")) failures.push("select sale or rental intent");
  if (inquiry.lookingFor && inquiry.lookingFor !== "BOTH" && property.listingType !== "BOTH" && property.listingType !== inquiry.lookingFor) failures.push("listing type");
  if (inquiry.currency && property.currency !== inquiry.currency) failures.push("currency");
  if (inquiry.propertyType && property.propertyType !== inquiry.propertyType) failures.push("property type");
  const areas = [property.suburb, ...(property.matchingMetadata?.nearbyAreas || [])].map(normalizeLocation).filter(Boolean);
  const requested = (inquiry.preferredAreas || []).map(normalizeLocation).filter(Boolean);
  const exactArea = requested.some((area) => areas.includes(area));
  const partialArea = requested.some((area) => areas.some((candidate) => candidate.includes(area) || area.includes(candidate)));
  if (strict.preferredAreas && requested.length && !exactArea) failures.push("preferred area");
  if (price == null) missingData.push("property price");
  if (strict.budgetMax && inquiry.budgetMax != null && (price == null || price > inquiry.budgetMax)) failures.push("maximum budget");
  const features = [...(property.matchingMetadata?.features || []), ...(property.matchingMetadata?.keywords || [])].map(normalizeLocation).filter(Boolean);
  const hasFeature = (feature: string) => features.includes(feature);
  for (const feature of new Set((inquiry.mustHave || []).map(normalizeLocation).filter(Boolean))) {
    if (!hasFeature(feature)) failures.push(`required feature: ${feature}`);
  }
  let score = 25;
  if (!requested.length) score += 15;
  else if (exactArea) { score += 30; reasons.push("preferred area"); }
  else if (partialArea) { score += 15; reasons.push("partial area name"); unmetPreferences.push("exact preferred area"); }
  else unmetPreferences.push("different area");
  if (price != null && inquiry.budgetMax != null) {
    const ratio = price / inquiry.budgetMax;
    score += ratio <= 1 ? 25 : ratio <= 1.1 ? 18 : ratio <= 1.25 ? 10 : 0;
    if (ratio <= 1) reasons.push("within budget");
    else unmetPreferences.push(ratio <= 1.1 ? "within 10% above budget" : ratio <= 1.25 ? "within 25% above budget" : "over budget");
  } else { score += 12; if (inquiry.budgetMax == null) missingData.push("maximum budget"); }
  if (inquiry.budgetMin != null && price != null && price < inquiry.budgetMin) { score -= 8; unmetPreferences.push("below budget range"); }
  const dimensions = [
    { key: "bedroomsMin" as const, required: inquiry.bedroomsMin, actual: property.bedrooms, full: 10, partial: 5, tolerance: 1, fallback: 5, label: "bedroom requirement" },
    { key: "bathroomsMin" as const, required: inquiry.bathroomsMin, actual: property.bathrooms, full: 5, partial: 2, tolerance: 1, fallback: 3, label: "bathroom requirement" },
    { key: "areaMinSqm" as const, required: inquiry.areaMinSqm, actual: property.plotSizeSqm, full: 8, partial: 4, tolerance: 20, fallback: 2, label: "area requirement" },
  ];
  for (const d of dimensions) {
    if (d.required == null) { score += d.fallback; continue; }
    if (d.actual == null) missingData.push(d.label);
    const delta = d.actual == null ? -Infinity : d.actual - d.required;
    if (delta >= 0) { score += d.full; reasons.push(d.label); }
    else { if (delta >= -d.tolerance) score += d.partial; unmetPreferences.push(d.label); if (strict[d.key]) failures.push(d.label); }
  }
  const preferences = [...new Set([...(inquiry.mustHave || []), ...(inquiry.niceToHave || []), ...(inquiry.keywords || [])].map(normalizeLocation).filter(Boolean))];
  const hits = preferences.filter(hasFeature);
  if (hits.length) { score += Math.min(10, hits.length * 2); reasons.push(`${hits.length} preference(s)`); }
  return { propertyId: property.id, score: failures.length ? 0 : Math.min(100, Math.max(0, Math.round(score))), reasons, hardFailures: failures, effectivePrice: price, unmetPreferences, missingData };
}
export function scoreAllPropertiesForInquiry(inquiry: InquiryMatchingProfile, properties: MatchingCandidate[]): MatchResult[] {
  return properties.map((property) => scorePropertyForInquiry(inquiry, property)).sort((a, b) => b.score - a.score || a.propertyId.localeCompare(b.propertyId));
}
export function rankPropertiesForInquiry(inquiry: InquiryMatchingProfile, properties: MatchingCandidate[], limit = 5): MatchResult[] {
  return scoreAllPropertiesForInquiry(inquiry, properties).filter((result) => result.hardFailures.length === 0).slice(0, limit);
}
