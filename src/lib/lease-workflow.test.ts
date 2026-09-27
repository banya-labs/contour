import { describe, expect, it } from "vitest";
import { nextActionAfterClose, requiresLeaseSetup } from "./lease-workflow";

describe("rental lease setup", () => {
  it("requires setup after a rental inquiry is won without a lease", () => {
    expect(requiresLeaseSetup({ lookingFor: "FOR_RENT", outcome: "WON", hasLease: false })).toBe(true);
  });

  it("does not require setup for a sale or an existing lease", () => {
    expect(requiresLeaseSetup({ lookingFor: "FOR_SALE", outcome: "WON", hasLease: false })).toBe(false);
    expect(requiresLeaseSetup({ lookingFor: "FOR_RENT", outcome: "WON", hasLease: true })).toBe(false);
  });

  it("returns lease setup as the next explicit step after rental Won", () => {
    expect(nextActionAfterClose({ lookingFor: "FOR_RENT", outcome: "WON", inquiryId: "inq-1", propertyId: "prop-1" }))
      .toEqual({ type: "LEASE_SETUP_REQUIRED", inquiryId: "inq-1", propertyId: "prop-1" });
    expect(nextActionAfterClose({ lookingFor: "FOR_SALE", outcome: "WON", inquiryId: "inq-1" })).toBeNull();
  });
});
