import type { InquiryMatchingProfile } from "./types";

type InquiryProfileSource = {
  lookingFor?: InquiryMatchingProfile["lookingFor"];
  currency?: InquiryMatchingProfile["currency"];
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  preferredSuburbs?: string[] | null;
  propertyType?: InquiryMatchingProfile["propertyType"] | null;
  bedroomsMin?: number | null;
  bathroomsMin?: number | string | null;
  areaMinSqm?: number | string | null;
  matchingProfile?: unknown;
};

export function buildInquiryMatchingProfile(source: InquiryProfileSource): InquiryMatchingProfile {
  const stored = source.matchingProfile && typeof source.matchingProfile === "object"
    ? source.matchingProfile as Record<string, unknown>
    : {};

  return {
    lookingFor: source.lookingFor,
    currency: source.currency,
    budgetMin: source.budgetMin == null ? undefined : Number(source.budgetMin),
    budgetMax: source.budgetMax == null ? undefined : Number(source.budgetMax),
    preferredAreas: source.preferredSuburbs || [],
    propertyType: source.propertyType || undefined,
    bedroomsMin: source.bedroomsMin ?? undefined,
    bathroomsMin: source.bathroomsMin == null ? undefined : Number(source.bathroomsMin),
    areaMinSqm: source.areaMinSqm == null ? undefined : Number(source.areaMinSqm),
    ...stored,
  };
}
