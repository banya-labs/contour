import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ invoice: vi.fn(), subscription: vi.fn(), upsertInvoice: vi.fn() }));
vi.mock("./db", () => ({ db: { invoice: { findUnique: mocks.invoice, upsert: mocks.upsertInvoice }, subscription: { upsert: mocks.subscription } } }));
import { recordSettledSubscription } from "./billing-ledger";
const input = { organizationId: "org", paymentId: "payment", reference: "reference", planId: "growth", billingCycle: "MONTHLY" as const, amount: 100, currency: "ZMW" as const, settledAt: new Date("2026-10-01T00:00:00Z") };
beforeEach(() => { vi.clearAllMocks(); mocks.invoice.mockResolvedValue(null); mocks.subscription.mockResolvedValue({ id: "subscription" }); mocks.upsertInvoice.mockResolvedValue({}); });
describe("settlement ledger replay", () => {
  it("does not revive canceled or replace newer subscription when this payment invoice is already paid", async () => { mocks.invoice.mockResolvedValue({ status: "PAID", paymentId: "payment" }); await recordSettledSubscription(input); expect(mocks.subscription).not.toHaveBeenCalled(); expect(mocks.upsertInvoice).not.toHaveBeenCalled(); });
  it("records original settlement period and invoice exactly once per payment reference", async () => { await recordSettledSubscription(input); expect(mocks.subscription.mock.calls[0][0].create.currentPeriodStart).toEqual(input.settledAt); expect(mocks.upsertInvoice.mock.calls[0][0]).toMatchObject({ where: { number: "INV-reference" }, create: { paymentId: "payment", paidAt: input.settledAt, amount: 100 } }); });
});
