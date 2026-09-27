import { describe, expect, it } from "vitest";
import { requiresLeaseSetup } from "./lease-workflow";

describe("rental lease setup", () => {
  it("requires setup after a rental inquiry is won without a lease", () => {
    expect(requiresLeaseSetup({ lookingFor: "FOR_RENT", outcome: "WON", hasLease: false })).toBe(true);
  });

  it("does not require setup for a sale or an existing lease", () => {
    expect(requiresLeaseSetup({ lookingFor: "FOR_SALE", outcome: "WON", hasLease: false })).toBe(false);
    expect(requiresLeaseSetup({ lookingFor: "FOR_RENT", outcome: "WON", hasLease: true })).toBe(false);
  });
});
