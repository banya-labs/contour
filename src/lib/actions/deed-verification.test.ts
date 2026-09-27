import { describe, expect, it } from "vitest";
import { isConveyanceDeed, resolveDeedVerificationResult } from "./deed-verification";

describe("deed verification", () => {
  it("recognizes title deeds as conveyance evidence", () => {
    expect(isConveyanceDeed("TITLE_DEED")).toBe(true);
    expect(isConveyanceDeed("LEASE_AGREEMENT")).toBe(false);
  });

  it("does not create a second verification mutation", () => {
    expect(resolveDeedVerificationResult(false)).toBe("VERIFIED");
    expect(resolveDeedVerificationResult(true)).toBe("ALREADY_VERIFIED");
  });
});
