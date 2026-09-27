import { describe, expect, it } from "vitest";
import { rentalClosingInputSchema, resolveRentalClosingContext } from "./rental-closing";

describe("rental closing handoff", () => {
  it("requires contractual lease fields", () => {
    expect(rentalClosingInputSchema.safeParse({}).success).toBe(false);
    expect(rentalClosingInputSchema.safeParse({ monthlyRent: 5000, depositAmount: 5000, leaseStartDate: "2026-10-01", leaseEndDate: "2027-09-30", paymentDayOfMonth: 1 }).success).toBe(true);
  });

  it("only resolves rental inquiries with a property and contact", () => {
    expect(resolveRentalClosingContext({ lookingFor: "FOR_RENT", propertyId: "property-1", contactId: "contact-1" })).toEqual({ valid: true });
    expect(resolveRentalClosingContext({ lookingFor: "FOR_SALE", propertyId: "property-1", contactId: "contact-1" })).toEqual({ valid: false, reason: "This closing flow is only available for rental placement deals." });
    expect(resolveRentalClosingContext({ lookingFor: "FOR_RENT", propertyId: null, contactId: "contact-1" })).toEqual({ valid: false, reason: "A property is required before starting a lease." });
    expect(resolveRentalClosingContext({ lookingFor: "FOR_RENT", propertyId: "property-1", contactId: null })).toEqual({ valid: false, reason: "A client is required before starting a lease." });
  });
});
