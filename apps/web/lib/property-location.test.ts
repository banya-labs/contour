import { describe, expect, it } from "vitest";
import { buildLocationParts, parseBoundingBox } from "./property-location";

describe("property location helpers", () => {
  it("parses Nominatim bounding boxes", () => {
    expect(parseBoundingBox(["-15.5", "-15.4", "28.1", "28.2"])).toEqual({
      south: -15.5,
      north: -15.4,
      west: 28.1,
      east: 28.2,
    });
    expect(parseBoundingBox(null)).toBeNull();
  });

  it("builds location parts from address fragments", () => {
    const parts = buildLocationParts(
      {
        state: "Lusaka Province",
        city: "Lusaka",
        suburb: "Kabulonga",
        country: "Zambia",
      },
      "Fallback label",
    );

    expect(parts).toEqual({
      province: "Lusaka Province",
      cityTown: "Lusaka",
      locationArea: "Kabulonga",
      displayName: "Lusaka",
    });
  });
});
