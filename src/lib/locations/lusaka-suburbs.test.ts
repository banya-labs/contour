import { describe, expect, it } from "vitest";
import { LUSAKA_SUBURBS } from "./lusaka-suburbs";
import { normalizeLocation } from "./normalize-location";

describe("Lusaka suburb options", () => {
  it("contains a unique curated list of common Lusaka areas", () => {
    const normalized = LUSAKA_SUBURBS.map(normalizeLocation);

    expect(LUSAKA_SUBURBS.length).toBeGreaterThan(0);
    expect(new Set(normalized).size).toBe(LUSAKA_SUBURBS.length);
    expect(normalized).toEqual([...normalized].sort());
    expect(LUSAKA_SUBURBS).toEqual(expect.arrayContaining(["Kabulonga", "Leopard's Hill", "Roma Park", "Woodlands", "Chalala"]));
  });
});
