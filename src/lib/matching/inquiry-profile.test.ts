import { describe, expect, it } from "vitest";
import { buildInquiryMatchingProfile } from "./inquiry-profile";

describe("buildInquiryMatchingProfile", () => {
  it("keeps persisted inquiry fields when stored metadata is partial", () => {
    expect(buildInquiryMatchingProfile({
      lookingFor: "FOR_SALE",
      currency: "ZMW",
      budgetMax: "1000000",
      preferredSuburbs: ["Kabulonga"],
      propertyType: null,
      matchingProfile: { mustHave: ["pool"] },
    })).toMatchObject({
      lookingFor: "FOR_SALE",
      currency: "ZMW",
      budgetMax: 1000000,
      preferredAreas: ["Kabulonga"],
      mustHave: ["pool"],
    });
  });
});
