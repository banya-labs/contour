import { describe, expect, it } from "vitest";
import { calculateTenantLedger, landlordClosingArrears } from "./ledger";

const input = { monthlyRent: "1000", currency: "ZMW", leaseStartDate: new Date("2026-01-15"), leaseEndDate: new Date("2026-12-20"), paymentDayOfMonth: 5, status: "ACTIVE", baseline: { amount: "500", month: 2, year: 2026 }, month: 3, year: 2026, now: new Date("2026-03-03T12:00:00Z"), payments: [{ amountPaid: "600", currency: "ZMW", periodMonth: 2, periodYear: 2026, status: "CONFIRMED", receiptNumber: "r1", paymentDate: new Date("2026-02-10") }] };
describe("tenant statement ledger", () => {
  it("does not double count the baseline month; excludes future due charges from arrears", () => {
    const result = calculateTenantLedger(input);
    expect(result.openingBalance).toBe("900.00");
    expect(result.rentCharged).toBe("1000.00");
    expect(result.closingBalance).toBe("1900.00");
    expect(result.arrears).toBe("900.00");
    expect(landlordClosingArrears([result]).toFixed(2)).toBe("900.00");
  });
  it("ignores pending and bounced receipts and preserves credits", () => {
    const result = calculateTenantLedger({ ...input, payments: [...input.payments, { ...input.payments[0], periodMonth: 3, amountPaid: "3000", status: "CONFIRMED" }, { ...input.payments[0], periodMonth: 3, amountPaid: "500", status: "PENDING_VERIFICATION" }] });
    expect(result.closingBalance).toBe("-1100.00");
    expect(result.arrears).toBe("0.00");
    expect(result.receipts).toHaveLength(1);
    expect(result.unconfirmed).toHaveLength(1);
  });
  it("requires a verified balance, refuses foreign currency and unknown termination cutoff", () => {
    expect(() => calculateTenantLedger({ ...input, baseline: null })).toThrow(/opening balance/i);
    expect(() => calculateTenantLedger({ ...input, payments: [{ ...input.payments[0], currency: "USD" }] })).toThrow(/currency/i);
    expect(() => calculateTenantLedger({ ...input, status: "TERMINATED" })).toThrow(/termination/i);
  });
  it("charges full first/last months and stops at termination", () => {
    const first = calculateTenantLedger({ ...input, baseline: { amount: "0", month: 1, year: 2026 }, month: 1, now: new Date("2026-01-10") });
    expect(first.rentCharged).toBe("1000.00"); expect(first.arrears).toBe("0.00");
    const ended = calculateTenantLedger({ ...input, status: "TERMINATED", terminatedAt: new Date("2026-02-18") });
    expect(ended.rentCharged).toBe("0.00"); expect(ended.closingBalance).toBe("900.00");
  });
});
