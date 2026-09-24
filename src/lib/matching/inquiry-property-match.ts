type InquiryProfile = { lookingFor: string; currency: string; budgetMax: number | null; preferredSuburbs: string[]; propertyType: string | null };
type PropertyProfile = { listingType: string; currency: string; askingPrice: number | null; rentalPrice: number | null; suburb: string; propertyType: string };

export function inquiryMatchesProperty(inquiry: InquiryProfile, property: PropertyProfile): boolean {
  const listingMatches = property.listingType === "BOTH" || property.listingType === inquiry.lookingFor || (inquiry.lookingFor === "FOR_SALE" && property.listingType === "FOR_SALE") || (inquiry.lookingFor === "FOR_RENT" && property.listingType === "FOR_RENT");
  const price = inquiry.lookingFor === "FOR_RENT" ? property.rentalPrice : property.askingPrice;
  const normalizeArea = (area: string) => area.trim().toLowerCase().replace(/\s+/g, " ");
  const areaMatches = inquiry.preferredSuburbs.length === 0 || inquiry.preferredSuburbs.some((area) => normalizeArea(area) === normalizeArea(property.suburb));
  const typeMatches = !inquiry.propertyType || inquiry.propertyType === property.propertyType;
  const budgetMatches = inquiry.budgetMax == null || price == null || price <= inquiry.budgetMax * 1.1;
  return listingMatches && inquiry.currency === property.currency && areaMatches && typeMatches && budgetMatches;
}
