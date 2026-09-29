import { describe, expect, it } from "vitest";
import { inquiryMatchesProperty } from "./inquiry-property-match";

describe("inquiry property matching", () => {
  it("matches an active buyer inquiry to suitable inventory", () => {
    expect(inquiryMatchesProperty({ lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: ["Kabulonga"], propertyType: null }, { listingType: "FOR_SALE", currency: "ZMW", askingPrice: 900000, rentalPrice: null, suburb: "Kabulonga", propertyType: "STANDALONE_HOUSE" })).toBe(true);
  });

  it("rejects mismatched inventory", () => {
    expect(inquiryMatchesProperty({ lookingFor: "FOR_RENT", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: ["Kabulonga"], propertyType: null }, { listingType: "FOR_SALE", currency: "ZMW", askingPrice: 900000, rentalPrice: null, suburb: "Kabulonga", propertyType: "STANDALONE_HOUSE" })).toBe(false);
  });

  it("matches custom locations regardless of case and repeated spaces", () => {
    expect(inquiryMatchesProperty(
      { lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: [" Roma   Park "], propertyType: null },
      { listingType: "FOR_SALE", currency: "ZMW", askingPrice: 900000, rentalPrice: null, suburb: "ROMA PARK", propertyType: "STANDALONE_HOUSE" },
    )).toBe(true);
  });

  it("keeps exact location matching and does not use substrings", () => {
    expect(inquiryMatchesProperty(
      { lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: ["Roma"], propertyType: null },
      { listingType: "FOR_SALE", currency: "ZMW", askingPrice: 900000, rentalPrice: null, suburb: "Roma Park", propertyType: "STANDALONE_HOUSE" },
    )).toBe(false);
  });

  it("treats blank preferred locations as any location", () => {
    expect(inquiryMatchesProperty(
      { lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 1000000, preferredSuburbs: [""], propertyType: null },
      { listingType: "FOR_SALE", currency: "ZMW", askingPrice: 900000, rentalPrice: null, suburb: "Woodlands", propertyType: "STANDALONE_HOUSE" },
    )).toBe(true);
  });
});
