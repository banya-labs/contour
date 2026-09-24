import { describe, expect, it } from "vitest";
import { rankPropertiesForInquiry } from "./score";

describe("property matching score", () => {
  it("ranks a suitable property and rejects hard mismatches", () => {
    const results = rankPropertiesForInquiry({ lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 4_000_000, preferredAreas: ["Kabulonga"], bedroomsMin: 3 }, [
      { id: "good", title: "Villa", suburb: "Kabulonga", listingType: "FOR_SALE", propertyType: "STANDALONE_HOUSE", currency: "ZMW", askingPrice: 3_500_000, rentalPrice: null, bedrooms: 4, bathrooms: 3, matchingMetadata: null },
      { id: "bad", title: "Flat", suburb: "Roma", listingType: "FOR_RENT", propertyType: "APARTMENT", currency: "USD", askingPrice: null, rentalPrice: 5_000, bedrooms: 2, bathrooms: 1, matchingMetadata: null },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ propertyId: "good", score: 95 });
  });
});
