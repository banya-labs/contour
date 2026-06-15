import { describe, expect, it } from "vitest";
import { extractReverseGeocodedAddress } from "./location-reverse";

describe("location reverse helpers", () => {
  it("extracts the canonical address string from reverse geocode payloads", () => {
    expect(
      extractReverseGeocodedAddress({
        display_name: "Kabulonga, Lusaka, Lusaka Province, Zambia",
      }),
    ).toBe("Kabulonga, Lusaka, Lusaka Province, Zambia");
    expect(extractReverseGeocodedAddress({ error: "not found" })).toBeNull();
  });
});
