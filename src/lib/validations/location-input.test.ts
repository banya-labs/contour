import { describe, expect, it } from "vitest";
import { createInquirySchema, updateInquirySchema, createPropertySchema } from "./index";

describe("inquiry location input", () => {
  it("cleans create locations and removes case-insensitive duplicates", () => {
    const result = createInquirySchema.safeParse({
      clientName: "Test Client",
      clientPhone: "0977000000",
      preferredSuburbs: [" roma   park ", "ROMA PARK", ""],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.preferredSuburbs).toEqual(["roma park"]);
  });

  it("cleans update locations and preserves legacy suburb values", () => {
    const result = updateInquirySchema.safeParse({ preferredSuburbs: [" Kabulonga ", "Kabulonga", "Ndola"] });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.preferredSuburbs).toEqual(["Kabulonga", "Ndola"]);
  });

  it("rejects location values longer than the property suburb limit", () => {
    const result = createInquirySchema.safeParse({
      clientName: "Test Client",
      clientPhone: "0977000000",
      preferredSuburbs: ["a".repeat(81)],
    });

    expect(result.success).toBe(false);
  });
});

describe("property city input", () => {
  const property = { title: "Recorded property", propertyType: "APARTMENT", suburb: "Riverside" };

  it("does not assign a city when legacy callers omit one", () => {
    expect(createPropertySchema.parse(property).city).toBe("");
  });

  it("accepts and trims any recorded city", () => {
    expect(createPropertySchema.parse({ ...property, city: " Harare " }).city).toBe("Harare");
    expect(createPropertySchema.safeParse({ ...property, city: "a".repeat(121) }).success).toBe(false);
  });
});
