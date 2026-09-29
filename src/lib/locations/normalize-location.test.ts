import { describe, expect, it } from "vitest";
import { cleanLocationValues, locationsEqual, normalizeLocation } from "./normalize-location";

describe("location normalization", () => {
  it("trims, folds whitespace, and lowercases locations", () => {
    expect(normalizeLocation("  Roma   Park ")).toBe("roma park");
  });

  it("removes blank values and keeps the first display label for duplicates", () => {
    expect(cleanLocationValues(["", " Roma Park ", "ROMA   PARK", "  ", "Kabulonga"])).toEqual(["Roma Park", "Kabulonga"]);
  });

  it("compares locations case-insensitively without substring matching", () => {
    expect(locationsEqual("Roma park", "ROMA   PARK")).toBe(true);
    expect(locationsEqual("Roma", "Roma Park")).toBe(false);
  });
});
