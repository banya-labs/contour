import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({ default: () => () => React.createElement("div", { "data-map": true }) }));
import { PropertyLocationMap } from "./property-location-map";

describe("property location map", () => {
  const property = { title: "Apartment", suburb: "", city: "Cape Town", priceText: "R1,000" };

  it("shows an honest unknown location and no fabricated directions when GPS is missing", () => {
    const html = renderToStaticMarkup(React.createElement(PropertyLocationMap, property));
    expect(html).toContain("GPS location not recorded");
    expect(html).toContain("Exact location not recorded");
    expect(html).not.toContain("google.com/maps/dir");
    expect(html).not.toContain("data-map");
    expect(html).not.toContain(", Cape Town");
  });

  it("uses actual zero longitude and renders directions only for a valid pair", () => {
    const html = renderToStaticMarkup(React.createElement(PropertyLocationMap, { ...property, latitude: 51.5, longitude: 0 }));
    expect(html).toContain("destination=51.5,0");
    expect(html).toContain("data-map");
    expect(html).not.toContain("GPS location not recorded");
  });

  it("does not display out of range coordinates as a GPS pin", () => {
    const html = renderToStaticMarkup(React.createElement(PropertyLocationMap, { ...property, latitude: 100, longitude: 18 }));
    expect(html).not.toContain("google.com/maps/dir");
  });
});
