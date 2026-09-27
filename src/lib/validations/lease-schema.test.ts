import { describe, expect, it } from "vitest";
import { createLeaseSchema } from "./index";

const validLease = {
  propertyId: "property-1",
  tenantName: "Tenant Example",
  tenantPhone: "+260971234567",
  monthlyRent: 5000,
  currency: "ZMW",
  depositAmount: 5000,
  managementFeePercent: 10,
  leaseStartDate: "2026-10-01",
  leaseEndDate: "2027-09-30",
  paymentDayOfMonth: 1,
};

describe("createLeaseSchema", () => {
  it("requires explicit contractual amounts and payment day", () => {
    expect(createLeaseSchema.safeParse(validLease).success).toBe(true);
    expect(createLeaseSchema.safeParse({ ...validLease, depositAmount: undefined }).success).toBe(false);
    expect(createLeaseSchema.safeParse({ ...validLease, managementFeePercent: undefined }).success).toBe(false);
    expect(createLeaseSchema.safeParse({ ...validLease, paymentDayOfMonth: undefined }).success).toBe(false);
  });

  it("rejects payment days outside the safe calendar range", () => {
    expect(createLeaseSchema.safeParse({ ...validLease, paymentDayOfMonth: 29 }).success).toBe(false);
  });
});
