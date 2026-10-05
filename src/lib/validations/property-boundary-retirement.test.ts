import { describe, expect, it } from "vitest";
import { createPropertySchema, updatePropertySchema } from "./index";

const property = {
  title: "Demo listing",
  suburb: "Roma",
  propertyType: "STANDALONE_HOUSE",
  latitude: -15.38,
  longitude: 28.31,
  plotSizeSqm: 600,
};

describe("property boundary workflow retirement", () => {
  it("allows creating and editing listings with location pins and manual plot sizes", () => {
    expect(createPropertySchema.safeParse(property).success).toBe(true);
    expect(updatePropertySchema.safeParse({ id: "property-1", ...property }).success).toBe(true);
  });

  it.each([
    { standBoundary: [[-15.38, 28.31], [-15.39, 28.31], [-15.39, 28.32]] },
    { standBoundary: [] },
    { standBoundary: null },
    { titleDeedDocumentId: "document-1" },
    { titleDeedDocumentId: null },
  ])("rejects legacy extraction fields on creation and update: %j", (fields) => {
    expect(createPropertySchema.safeParse({ ...property, ...fields }).success).toBe(false);
    expect(updatePropertySchema.safeParse({ id: "property-1", ...fields }).success).toBe(false);
  });

  it("still accepts ordinary title references for Vault and conveyancing workflows", () => {
    expect(updatePropertySchema.safeParse({ id: "property-1", titleDeedNumber: "DEMO-REF" }).success).toBe(true);
  });
});
