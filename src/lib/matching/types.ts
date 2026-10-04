import type { Currency, ListingType, PropertyType } from "@prisma/client";

export type MatchingMetadata = {
  propertyType?: PropertyType;
  listingType?: ListingType;
  currency?: Currency;
  suburb?: string;
  nearbyAreas?: string[];
  bedroomsMin?: number;
  bathroomsMin?: number;
  areaMinSqm?: number;
  price?: number;
  features?: string[];
  keywords?: string[];
};

export type StrictRequirements = Partial<Record<"budgetMax" | "preferredAreas" | "bedroomsMin" | "bathroomsMin" | "areaMinSqm", boolean>>;
export type InquiryMatchingProfile = {
  lookingFor?: ListingType;
  propertyType?: PropertyType;
  currency?: Currency;
  budgetMin?: number;
  budgetMax?: number;
  preferredAreas?: string[];
  bedroomsMin?: number;
  bathroomsMin?: number;
  areaMinSqm?: number;
  mustHave?: string[];
  strictRequirements?: StrictRequirements;
  niceToHave?: string[];
  keywords?: string[];
};

export type MatchingCandidate = {
  id: string;
  title: string;
  suburb: string;
  listingType: ListingType;
  propertyType: PropertyType;
  currency: Currency;
  askingPrice: number | null;
  rentalPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  plotSizeSqm?: number | null;
  matchingMetadata: MatchingMetadata | null;
};

export type MatchResult = {
  propertyId: string;
  score: number;
  reasons: string[];
  hardFailures: string[];
  effectivePrice: number | null;
  unmetPreferences: string[];
  missingData: string[];
};
