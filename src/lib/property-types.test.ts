import { describe, expect, it } from "vitest";
import { PROPERTY_TYPE_OPTIONS, propertyTypeLabel } from "./property-types";

describe("property type options", () => {
  it("contains every supported property type exactly once", () => {
    expect(PROPERTY_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      "STANDALONE_HOUSE",
      "APARTMENT",
      "COMMERCIAL_OFFICE",
      "WAREHOUSE",
      "VACANT_LAND_PLOT",
      "FARM_AGRICULTURAL",
    ]);
  });

  it("provides stable human-readable labels", () => {
    expect(propertyTypeLabel("STANDALONE_HOUSE")).toBe("Standalone House");
    expect(propertyTypeLabel("VACANT_LAND_PLOT")).toBe("Vacant Land Plot");
    expect(propertyTypeLabel("FARM_AGRICULTURAL")).toBe("Farm / Agricultural");
  });
});
