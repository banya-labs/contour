import { describe, expect, it } from "vitest";
import { isPropertyAvailableForNewOpportunity } from "./property-lifecycle";

describe("property lifecycle", () => {
  it("does not allow sold properties to enter a new opportunity", () => {
    expect(isPropertyAvailableForNewOpportunity("SOLD")).toBe(false);
    expect(isPropertyAvailableForNewOpportunity("AVAILABLE")).toBe(true);
    expect(isPropertyAvailableForNewOpportunity("UNDER_OFFER")).toBe(true);
  });
});
