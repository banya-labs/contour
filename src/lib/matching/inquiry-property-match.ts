import { locationsEqual } from "@/lib/locations/normalize-location";

type InquiryProfile = { lookingFor: string; currency: string; budgetMax: number | null; preferredSuburbs: string[]; propertyType: string | null };
type PropertyProfile = { listingType: string; currency: string; askingPrice: number | null; rentalPrice: number | null; suburb: string; propertyType: string };

export function inquiryMatchesProperty(inquiry: InquiryProfile, property: PropertyProfile): boolean {
  const listingMatches = property.listingType === "BOTH" || property.listingType === inquiry.lookingFor || (inquiry.lookingFor === "FOR_SALE" && property.listingType === "FOR_SALE") || (inquiry.lookingFor === "FOR_RENT" && property.listingType === "FOR_RENT");
  const price = inquiry.lookingFor === "FOR_RENT" ? property.rentalPrice : property.askingPrice;
  const preferredLocations = inquiry.preferredSuburbs.filter((area) => area.trim());
  const areaMatches = preferredLocations.length === 0 || preferredLocations.some((area) => locationsEqual(area, property.suburb));
  const typeMatches = !inquiry.propertyType || inquiry.propertyType === property.propertyType;
  const budgetMatches = inquiry.budgetMax == null || price == null || price <= inquiry.budgetMax * 1.1;
  return listingMatches && inquiry.currency === property.currency && areaMatches && typeMatches && budgetMatches;
}
