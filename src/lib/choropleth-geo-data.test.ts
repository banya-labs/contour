import { describe, expect, it } from "vitest";
import { computeRegionStats, type RegionGeoFeature } from "./choropleth-geo-data";
import type { PropertyMapItem } from "@/types/property-map";

const region: RegionGeoFeature = { id: "country-zambia", name: "Example overlay", level: "COUNTRY", center: [0, 0], zoom: 6, coordinates: [[[-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]] };
const property = (latitude: number | null, longitude: number | null): PropertyMapItem => ({ id: "fixture", title: "Recorded property", slug: "fixture", listingType: "FOR_SALE", status: "AVAILABLE", ownershipType: "MANAGED_ON_BEHALF", currency: "USD", suburb: "", city: "", photos: [], latitude, longitude });

describe("region overlay inventory", () => {
  it("counts properties by recorded coordinates rather than treating every property as Zambia", () => {
    expect(computeRegionStats(region, [property(0, 0), property(51.5, 0), property(null, null)]).totalCount).toBe(1);
  });
  it("includes boundary points without matching records with no location", () => {
    expect(computeRegionStats(region, [property(1, 1), property(null, null)]).totalCount).toBe(1);
  });
});
