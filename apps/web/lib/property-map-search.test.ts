import { describe, expect, it } from "vitest";
import { buildPropertyMapSearchIndex, matchesPropertyMapSearch } from "./property-map-search";

describe("property map search", () => {
  it("matches address fragments in any order", () => {
    const index = buildPropertyMapSearchIndex({
      title: "East Park Residences",
      address: "Unit 104, East Park Mall, Thabo Mbeki Rd, Plot 5005, Lusaka 00000, Zambia",
      description: "3 bedrooms, swimming pool, double story",
      locationArea: "East Park",
      cityTown: "Lusaka",
      province: "Lusaka",
      ownerName: "M. Chanda",
      latitude: -15.4167,
      longitude: 28.2833,
    });

    expect(matchesPropertyMapSearch("Thabo Mbeki Zambia 5005", index)).toBe(true);
    expect(matchesPropertyMapSearch("East Park Mall Unit 104", index)).toBe(true);
    expect(matchesPropertyMapSearch("swimming pool double story", index)).toBe(true);
    expect(matchesPropertyMapSearch("Kitwe", index)).toBe(false);
  });
});
