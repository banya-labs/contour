import { describe, expect, it } from "vitest";
import { scorePropertyForInquiry } from "./score";
import { buildInquiryMatchingProfile } from "./inquiry-profile";
import { isQualifyingMatch } from "./policy";
import type { InquiryMatchingProfile, MatchingCandidate } from "./types";

const property: MatchingCandidate = { id: "p", title: "House", suburb: "Roma Park", listingType: "BOTH", propertyType: "STANDALONE_HOUSE", currency: "ZMW", askingPrice: 900000, rentalPrice: 5000, bedrooms: 3, bathrooms: 2, plotSizeSqm: 300, matchingMetadata: null };
const inquiry: InquiryMatchingProfile = { lookingFor: "FOR_RENT", currency: "ZMW", budgetMax: 6000, preferredAreas: ["Roma Park"] };
describe("canonical matching policy", () => {
  it("uses rent for BOTH listings and never falls back to sale price", () => {
    expect(scorePropertyForInquiry(inquiry, property).effectivePrice).toBe(5000);
    expect(scorePropertyForInquiry(inquiry, { ...property, rentalPrice: null }).effectivePrice).toBeNull();
  });
  it("applies strict constraints without changing soft defaults", () => {
    expect(scorePropertyForInquiry({ ...inquiry, budgetMax: 4000 }, property).hardFailures).toEqual([]);
    expect(scorePropertyForInquiry({ ...inquiry, budgetMax: 4000, strictRequirements: { budgetMax: true } }, property).hardFailures).toContain("maximum budget");
    expect(scorePropertyForInquiry({ ...inquiry, preferredAreas: ["Roma"], strictRequirements: { preferredAreas: true } }, property).hardFailures).toContain("preferred area");
  });
  it("requires confirmed must-haves and deduplicates bonuses", () => {
    expect(scorePropertyForInquiry({ ...inquiry, mustHave: ["pool"] }, property).hardFailures).toContain("required feature: pool");
    const p = { ...property, matchingMetadata: { features: ["pool"] } };
    expect(scorePropertyForInquiry({ ...inquiry, niceToHave: ["pool", "pool"], keywords: ["pool"] }, p).reasons).toContain("1 preference(s)");
  });
  it("normalizes whitespace and excludes blank area constraints", () => {
    expect(scorePropertyForInquiry({ ...inquiry, preferredAreas: [" ROMA   PARK "] }, property).reasons).toContain("preferred area");
    expect(scorePropertyForInquiry({ ...inquiry, preferredAreas: [""] }, property).reasons).not.toContain("preferred area");
  });
  it("does not allow stale JSON to overwrite structured fields", () => {
    expect(buildInquiryMatchingProfile({ budgetMax: 6000, matchingProfile: { budgetMax: 1, mustHave: ["pool"] } })).toMatchObject({ budgetMax: 6000, mustHave: ["pool"] });
  });
  it("uses strict threshold and rejects hard failures even above threshold", () => {
    const result = scorePropertyForInquiry(inquiry, property);
    expect(isQualifyingMatch({ ...result, score: 70 })).toBe(false);
    expect(isQualifyingMatch({ ...result, score: 71 })).toBe(true);
    expect(isQualifyingMatch({ ...result, score: 99, hardFailures: ["currency"] })).toBe(false);
  });
});
