import type { InquiryMatchingProfile } from "./types";

type InquiryProfileSource = {
  lookingFor?: InquiryMatchingProfile["lookingFor"];
  currency?: InquiryMatchingProfile["currency"];
  budgetMin?: number | string | { toString(): string } | null;
  budgetMax?: number | string | { toString(): string } | null;
  preferredSuburbs?: string[] | null;
  propertyType?: InquiryMatchingProfile["propertyType"] | null;
  bedroomsMin?: number | null;
  bathroomsMin?: number | string | { toString(): string } | null;
  areaMinSqm?: number | string | { toString(): string } | null;
  matchingProfile?: unknown;
};

export function buildInquiryMatchingProfile(source: InquiryProfileSource): InquiryMatchingProfile {
  const stored = source.matchingProfile && typeof source.matchingProfile === "object"
    ? source.matchingProfile as Record<string, unknown>
    : {};

  return {
    mustHave: strings(stored.mustHave),
    niceToHave: strings(stored.niceToHave),
    keywords: strings(stored.keywords),
    strictRequirements: strictRequirements(stored.strictRequirements),
    lookingFor: source.lookingFor,
    currency: source.currency,
    budgetMin: source.budgetMin == null ? undefined : Number(source.budgetMin),
    budgetMax: source.budgetMax == null ? undefined : Number(source.budgetMax),
    preferredAreas: source.preferredSuburbs || [],
    propertyType: source.propertyType || undefined,
    bedroomsMin: source.bedroomsMin ?? undefined,
    bathroomsMin: source.bathroomsMin == null ? undefined : Number(source.bathroomsMin),
    areaMinSqm: source.areaMinSqm == null ? undefined : Number(source.areaMinSqm),
  };
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function strictRequirements(value: unknown): InquiryMatchingProfile["strictRequirements"] {
  if (!value || typeof value !== "object") return {};
  const flags = value as Record<string, unknown>;
  return { budgetMax: flags.budgetMax === true, preferredAreas: flags.preferredAreas === true, bedroomsMin: flags.bedroomsMin === true, bathroomsMin: flags.bathroomsMin === true, areaMinSqm: flags.areaMinSqm === true };
}
