import { describe, expect, it, vi } from "vitest";
import type { Prisma, PrismaClient } from "@prisma/client";
import { rentalClosingInputSchema, resolveRentalClosingContext, startRentalLease } from "./rental-closing";

describe("rental closing handoff", () => {
  const input = { inquiryId: "inquiry", organizationId: "org", actorId: "agent", lease: rentalClosingInputSchema.parse({ monthlyRent: 5000, depositAmount: 5000, leaseStartDate: "2026-10-01", leaseEndDate: "2027-09-30", paymentDayOfMonth: 1 }) };
  it("uses an existing transaction rather than opening a nested transaction", async () => {
    const tx = { inquiry: { findFirst: vi.fn().mockResolvedValue(null) } } as unknown as Prisma.TransactionClient;
    await expect(startRentalLease(tx, input)).rejects.toThrow("INQUIRY_NOT_FOUND");
  });
  it("opens a transaction when given the root database client", async () => {
    const tx = { inquiry: { findFirst: vi.fn().mockResolvedValue(null) } } as unknown as Prisma.TransactionClient;
    const client = { $transaction: (run: (tx: Prisma.TransactionClient) => Promise<unknown>) => run(tx) } as unknown as PrismaClient;
    await expect(startRentalLease(client, input)).rejects.toThrow("INQUIRY_NOT_FOUND");
  });
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
