import { describe, expect, it } from "vitest";
import {
  CommissionOverrideForbiddenError,
  defaultCommissionPct,
  resolveCommissionPct,
} from "./commission-policy";

describe("commission policy", () => {
  it("defaults sales properties to 5% and rental properties to 10%", () => {
    expect(defaultCommissionPct("FOR_SALE")).toBe(5);
    expect(defaultCommissionPct("FOR_RENT")).toBe(10);
    expect(defaultCommissionPct("BOTH")).toBe(5);
  });

  it("lets management override a property's commission percentage", () => {
    expect(resolveCommissionPct({
      listingType: "FOR_SALE",
      requestedPct: 7.5,
      canOverride: true,
    })).toBe(7.5);
  });

  it("rejects a property commission override from an agent", () => {
    expect(() => resolveCommissionPct({
      listingType: "FOR_SALE",
      requestedPct: 7.5,
      canOverride: false,
    })).toThrow(CommissionOverrideForbiddenError);
  });

  it("inherits the property's percentage when a final sale has no override", () => {
    expect(resolveCommissionPct({
      listingType: "FOR_SALE",
      propertyPct: 6.25,
      canOverride: false,
    })).toBe(6.25);
  });

  it("lets management override the inherited percentage on a final sale", () => {
    expect(resolveCommissionPct({
      listingType: "FOR_SALE",
      propertyPct: 6.25,
      requestedPct: 7,
      canOverride: true,
    })).toBe(7);
  });
});
