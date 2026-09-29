import { describe, expect, it } from "vitest";
import { createInquirySchema, createInquirySurfaceSchema, createPropertySchema } from "./index";

describe("property type creation requirements", () => {
  it("rejects a new inquiry without a property type", () => {
    const result = createInquirySurfaceSchema.safeParse({ clientName: "Test Client", clientPhone: "0977000000", creationSurface: "DESKTOP" });
    expect(result.success).toBe(false);
  });

  it("accepts a new inquiry with a supported property type", () => {
    const result = createInquirySurfaceSchema.safeParse({ clientName: "Test Client", clientPhone: "0977000000", propertyType: "APARTMENT", creationSurface: "DESKTOP" });
    expect(result.success).toBe(true);
  });

  it("preserves legacy machine ingestion without a property type", () => {
    const result = createInquirySchema.safeParse({ clientName: "Legacy Client", clientPhone: "0977000000" });
    expect(result.success).toBe(true);
  });

  it("rejects a new property without a property type", () => {
    const result = createPropertySchema.safeParse({ title: "Test Property", suburb: "Roma" });
    expect(result.success).toBe(false);
  });
});
