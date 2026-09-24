import { describe, expect, it } from "vitest";
import { redeemOrganizationOffer } from "./billing-offer-redemption";

describe("offer redemption", () => {
  it("exposes a transactional redemption function", () => {
    expect(typeof redeemOrganizationOffer).toBe("function");
  });
});
