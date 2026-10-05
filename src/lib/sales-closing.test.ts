import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
vi.mock("./closing-workflow-persistence", () => ({ ensureClosingWorkflow: vi.fn() }));
import { startSaleClosing } from "./sales-closing";
const input = { organizationId: "org", actorId: "actor", propertyId: "property", contactId: "contact", agreedValue: 100000, currency: "ZMW" as const, closingAgentId: "agent", idempotencyKey: "request", canManage: true };
function fixture() {
  const tx = { $executeRaw: vi.fn(), property: { findFirst: vi.fn().mockResolvedValue({ id: "property", status: "AVAILABLE", listingType: "FOR_SALE", currency: "ZMW" }), update: vi.fn() }, contact: { findFirst: vi.fn().mockResolvedValue({ id: "contact", name: "Buyer", phone: "+260971234567", email: null }) }, member: { findFirst: vi.fn().mockResolvedValue({ id: "membership" }) }, inquiry: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: "inquiry" }), update: vi.fn() }, transaction: { create: vi.fn() }, auditLog: { create: vi.fn() } };
  let request: unknown = null;
  return { ...tx, saleClosingRequest: { findUnique: vi.fn(async () => request), create: vi.fn(async ({ data }) => { request = data; return data; }) } };
}
describe("sale closing initiation", () => {
  it("creates a linked closing inquiry without completing a sale or recording commission", async () => {
    const tx = fixture(); expect(await startSaleClosing(tx as unknown as Prisma.TransactionClient, input)).toEqual({ inquiryId: "inquiry" });
    expect(tx.inquiry.create.mock.calls[0][0].data).toMatchObject({ contactId: "contact", propertyId: "property", status: "VERIFICATION_CLOSING", clientName: "Buyer" });
    expect(tx.transaction.create).not.toHaveBeenCalled(); expect(tx.property.update).not.toHaveBeenCalled();
  });
  it("rejects unavailable properties and foreign agents/contacts", async () => {
    const tx = fixture(); tx.property.findFirst.mockResolvedValue({ id: "property", status: "SOLD", listingType: "FOR_SALE", currency: "ZMW" });
    await expect(startSaleClosing(tx as unknown as Prisma.TransactionClient, input)).rejects.toThrow(/available/i);
    tx.property.findFirst.mockResolvedValue({ id: "property", status: "AVAILABLE", listingType: "FOR_SALE", currency: "ZMW" }); tx.member.findFirst.mockResolvedValue(null);
    await expect(startSaleClosing(tx as unknown as Prisma.TransactionClient, input)).rejects.toThrow(/agent/i);
  });
  it("resumes the same contact/property inquiry rather than duplicating it", async () => {
    const tx = fixture(); tx.inquiry.findFirst.mockResolvedValueOnce(null).mockResolvedValue({ id: "existing", propertyId: "property", contactId: "contact", lookingFor: "FOR_SALE", assignedAgentId: "agent", status: "VERIFICATION_CLOSING", dealValue: 100000, currency: "ZMW" });
    expect(await startSaleClosing(tx as unknown as Prisma.TransactionClient, input)).toEqual({ inquiryId: "existing" }); expect(tx.inquiry.create).not.toHaveBeenCalled(); expect(tx.$executeRaw).toHaveBeenCalled();
  });
  it("replays a resumed request after terminal closure without creating another opportunity or audit", async () => {
    const tx = fixture(); tx.inquiry.findFirst.mockResolvedValueOnce(null).mockResolvedValue({ id: "existing", propertyId: "property", contactId: "contact", lookingFor: "FOR_SALE", assignedAgentId: "agent", status: "VERIFICATION_CLOSING", dealValue: 100000, currency: "ZMW" });
    expect(await startSaleClosing(tx as unknown as Prisma.TransactionClient, input)).toEqual({ inquiryId: "existing" });
    tx.inquiry.findFirst.mockResolvedValue({ id: "existing", assignedAgentId: "agent", status: "CLOSED_LOST" });
    expect(await startSaleClosing(tx as unknown as Prisma.TransactionClient, input)).toEqual({ inquiryId: "existing" });
    expect(tx.inquiry.create).not.toHaveBeenCalled(); expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
});
