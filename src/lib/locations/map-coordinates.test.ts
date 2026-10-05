import { describe, expect, it } from "vitest";
import { getMapCoordinateKey, getMapViewport, hasValidCoordinates } from "./map-coordinates";

describe("property map coordinates", () => {
  it("keeps the viewport key stable across inventory refreshes and ordering", () => {
    const properties = [{ latitude: -33.9, longitude: 18.4 }, { latitude: 51.5, longitude: 0 }];
    expect(getMapCoordinateKey(properties)).toBe(getMapCoordinateKey([...properties].reverse().map((property) => ({ ...property }))));
    expect(getMapCoordinateKey(properties)).not.toBe(getMapCoordinateKey([{ latitude: -33.9, longitude: 18.5 }, properties[1]]));
    expect(getMapCoordinateKey([{ latitude: null, longitude: null }])).toBe("[]");
  });
  it("accepts equator and prime meridian coordinates", () => {
    expect(hasValidCoordinates(0, 18.4)).toBe(true);
    expect(hasValidCoordinates(51.5, 0)).toBe(true);
    expect(hasValidCoordinates(0, 0)).toBe(true);
  });

  it("rejects missing, nonfinite and out of range coordinates", () => {
    for (const [latitude, longitude] of [[null, 28], [18, undefined], [NaN, 28], [18, Infinity], [91, 18], [18, -181], ["0", 0]]) {
      expect(hasValidCoordinates(latitude, longitude)).toBe(false);
    }
  });

  it("centers on actual foreign inventory instead of a regional default", () => {
    expect(getMapViewport([{ latitude: null, longitude: null }, { latitude: -33.9249, longitude: 18.4241 }]))
      .toEqual({ center: [-33.9249, 18.4241], zoom: 13 });
    expect(getMapViewport([{ latitude: 51.5, longitude: 0 }])).toEqual({ center: [51.5, 0], zoom: 13 });
  });

  it("uses a world overview when inventory has no valid coordinates", () => {
    expect(getMapViewport([])).toEqual({ center: [0, 0], zoom: 2 });
    expect(getMapViewport([{ latitude: 900, longitude: 28 }])).toEqual({ center: [0, 0], zoom: 2 });
  });
});
