import { describe, expect, it } from "vitest";
import { getConveyanceState } from "./conveyance-state";

describe("getConveyanceState", () => {
  it("requires a deed when none exists", () => {
    expect(getConveyanceState([])).toBe("MISSING");
  });

  it("keeps conveyance pending until a deed is verified", () => {
    expect(getConveyanceState([{ isVerified: false }])).toBe("PENDING");
  });

  it("completes conveyance when any deed is verified", () => {
    expect(getConveyanceState([{ isVerified: false }, { isVerified: true }])).toBe("VERIFIED");
  });
});
