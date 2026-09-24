import { describe, expect, it } from "vitest";
import { inquiryMatchesProperty } from "./inquiry-property-match";

describe("inquiry property matching", () => {
  it("matches an active buyer inquiry to suitable inventory", () => {
    expect(inquiryMatchesProperty({ lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: ["Kabulonga"], propertyType: null }, { listingType: "FOR_SALE", currency: "ZMW", askingPrice: 900000, rentalPrice: null, suburb: "Kabulonga", propertyType: "STANDALONE_HOUSE" })).toBe(true);
  });

  it("rejects mismatched inventory", () => {
    expect(inquiryMatchesProperty({ lookingFor: "FOR_RENT", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: ["Kabulonga"], propertyType: null }, { listingType: "FOR_SALE", currency: "ZMW", askingPrice: 900000, rentalPrice: null, suburb: "Kabulonga", propertyType: "STANDALONE_HOUSE" })).toBe(false);
  });
});
