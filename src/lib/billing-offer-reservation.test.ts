import { describe, expect, it } from "vitest";
import { commitOrganizationOffer, releaseOrganizationOffer, reserveOrganizationOffer } from "./billing-offer-reservation";
describe("offer reservation lifecycle", () => { it("exports reserve, release, and commit operations", () => { expect(typeof reserveOrganizationOffer).toBe("function"); expect(typeof releaseOrganizationOffer).toBe("function"); expect(typeof commitOrganizationOffer).toBe("function"); }); });
