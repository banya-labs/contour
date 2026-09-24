import { describe, expect, it } from "vitest";
import { evaluatePropertyAgainstAlerts } from "./matchmaker";

describe("property match notifications", () => {
  it("does not notify buyers about sold properties", () => {
    expect(evaluatePropertyAgainstAlerts({
      organizationId: "org_demo_contour",
      title: "Sold Villa",
      slug: "sold-villa",
      suburb: "Kabulonga",
      listingType: "FOR_SALE",
      askingPrice: 1000000,
      currency: "ZMW",
      bedrooms: 4,
      status: "SOLD",
    })).toEqual([]);
  });
});
