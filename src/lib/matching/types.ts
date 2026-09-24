import type { Currency, ListingType, PropertyType } from "@prisma/client";

export type MatchingMetadata = {
  propertyType?: PropertyType;
  listingType?: ListingType;
  currency?: Currency;
  suburb?: string;
  nearbyAreas?: string[];
  bedroomsMin?: number;
  bathroomsMin?: number;
  price?: number;
  features?: string[];
  keywords?: string[];
};

export type InquiryMatchingProfile = {
  lookingFor?: ListingType;
  propertyType?: PropertyType;
  currency?: Currency;
  budgetMin?: number;
  budgetMax?: number;
  preferredAreas?: string[];
  bedroomsMin?: number;
  bathroomsMin?: number;
  mustHave?: string[];
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
  matchingMetadata: MatchingMetadata | null;
};

export type MatchResult = {
  propertyId: string;
  score: number;
  reasons: string[];
  hardFailures: string[];
};
