import { describe, expect, it } from "vitest";
import { rankPropertiesForInquiry, scoreAllPropertiesForInquiry } from "./score";

describe("property matching score", () => {
  it("ranks a suitable property and rejects hard mismatches", () => {
    const results = rankPropertiesForInquiry({ lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 4_000_000, preferredAreas: ["Kabulonga"], bedroomsMin: 3 }, [
      { id: "good", title: "Villa", suburb: "Kabulonga", listingType: "FOR_SALE", propertyType: "STANDALONE_HOUSE", currency: "ZMW", askingPrice: 3_500_000, rentalPrice: null, bedrooms: 4, bathrooms: 3, matchingMetadata: null },
      { id: "bad", title: "Flat", suburb: "Roma", listingType: "FOR_RENT", propertyType: "APARTMENT", currency: "USD", askingPrice: null, rentalPrice: 5_000, bedrooms: 2, bathrooms: 1, matchingMetadata: null },
    ]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ propertyId: "good", score: 95 });
  });

  it("rewards optional area requirements when the property satisfies them", () => {
    const results = rankPropertiesForInquiry({ lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 4_000_000, areaMinSqm: 200 }, [
      { id: "large", title: "Large house", suburb: "Kabulonga", listingType: "FOR_SALE", propertyType: "STANDALONE_HOUSE", currency: "ZMW", askingPrice: 3_500_000, rentalPrice: null, bedrooms: 4, bathrooms: 3, plotSizeSqm: 250, matchingMetadata: null },
      { id: "small", title: "Small house", suburb: "Kabulonga", listingType: "FOR_SALE", propertyType: "STANDALONE_HOUSE", currency: "ZMW", askingPrice: 3_500_000, rentalPrice: null, bedrooms: 4, bathrooms: 3, plotSizeSqm: 100, matchingMetadata: null },
    ]);
    expect(results[0].propertyId).toBe("large");
    expect(results[0].reasons).toContain("area requirement");
  });

  it("returns a scored result for every property, including below-threshold properties", () => {
    const results = scoreAllPropertiesForInquiry({ lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 1_000_000 }, [
      { id: "good", title: "House", suburb: "Kabulonga", listingType: "FOR_SALE", propertyType: "STANDALONE_HOUSE", currency: "ZMW", askingPrice: 900_000, rentalPrice: null, bedrooms: null, bathrooms: null, matchingMetadata: null },
      { id: "bad", title: "Flat", suburb: "Roma", listingType: "FOR_RENT", propertyType: "APARTMENT", currency: "USD", askingPrice: null, rentalPrice: 5_000, bedrooms: null, bathrooms: null, matchingMetadata: null },
    ]);
    expect(results).toHaveLength(2);
    expect(results.find((result) => result.propertyId === "bad")).toMatchObject({ score: 0, hardFailures: expect.arrayContaining(["listing type", "currency"]) });
  });
});
