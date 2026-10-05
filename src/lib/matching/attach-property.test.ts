import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ inquiry: { findFirst: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() }, property: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } }));
vi.mock("../db", () => ({ db: { $transaction: (run: (tx: typeof mocks) => unknown) => run(mocks) } }));
import { attachPropertyInTransaction, attachPropertyToInquiry } from "./attach-property";
import type { Prisma } from "@prisma/client";
const scope = { organizationId: "org", userId: "agent", permissions: [] };
describe("explicit property attachment", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.inquiry.findFirst.mockResolvedValue({ id: "i", propertyId: null, assignedAgentId: "agent", status: "NEW_INQUIRY", lookingFor: "FOR_SALE", currency: "ZMW" }); mocks.property.findFirst.mockResolvedValue({ id: "p", suburb: "Roma", title: "House", bedrooms: 3, bathrooms: 2, propertyType: "STANDALONE_HOUSE", status: "AVAILABLE", listingType: "FOR_SALE", currency: "ZMW" }); mocks.inquiry.updateMany.mockResolvedValue({ count: 1 }); mocks.inquiry.findUnique.mockResolvedValue({ id: "i", propertyId: "p", status: "NEW_INQUIRY" }); });
  it("attaches without stage advancement and keeps match status synchronized", async () => {
    await attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: "p", expectedPropertyId: null });
    expect(mocks.inquiry.updateMany.mock.calls[0][0].data).toMatchObject({ propertyId: "p", matchStatus: "MATCHED" });
    expect(mocks.inquiry.updateMany.mock.calls[0][0].data.status).toBeUndefined();
    expect(mocks.property.findFirst.mock.calls[0][0].where).toEqual({ id: "p", organizationId: "org" });
    expect(mocks.auditLog.create).toHaveBeenCalled();
  });
  it.each(["SOLD", "RENTED", "UNDER_OFFER"])("rejects unavailable %s inventory", async (status) => { mocks.property.findFirst.mockResolvedValue({ id: "p", suburb: "Roma", title: "House", bedrooms: 3, bathrooms: 2, propertyType: "STANDALONE_HOUSE", status }); await expect(attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: "p", expectedPropertyId: null })).rejects.toThrow("no longer available"); expect(mocks.inquiry.updateMany).not.toHaveBeenCalled(); });
  it("rejects stale and concurrent changes", async () => { mocks.inquiry.updateMany.mockResolvedValue({ count: 0 }); await expect(attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: "p", expectedPropertyId: null })).rejects.toThrow("changed"); });
  it("enforces persisted strict requirements during attachment", async () => {
    mocks.inquiry.findFirst.mockResolvedValue({ id: "i", propertyId: null, assignedAgentId: "agent", status: "NEW_INQUIRY", lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 100, matchingProfile: { strictRequirements: { budgetMax: true } } });
    mocks.property.findFirst.mockResolvedValue({ id: "p", suburb: "Roma", title: "House", bedrooms: 3, bathrooms: 2, propertyType: "STANDALONE_HOUSE", status: "AVAILABLE", listingType: "FOR_SALE", currency: "ZMW", askingPrice: 200 });
    await expect(attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: "p" })).rejects.toThrow("maximum budget");
    expect(mocks.inquiry.updateMany).not.toHaveBeenCalled();
  });
  it("rejects another agent and terminal inquiries", async () => { mocks.inquiry.findFirst.mockResolvedValue({ id: "i", status: "CLOSED_WON", assignedAgentId: "other", propertyId: null }); await expect(attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: "p", expectedPropertyId: null })).rejects.toThrow(); expect(mocks.inquiry.updateMany).not.toHaveBeenCalled(); });
  it("replaces an existing mandate without changing the inquiry stage", async () => {
    mocks.inquiry.findFirst.mockResolvedValue({ id: "i", propertyId: "old", assignedAgentId: "agent", status: "QUALIFIED", lookingFor: "FOR_SALE", currency: "ZMW" });
    await attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: "p", expectedPropertyId: "old" });
    expect(mocks.inquiry.updateMany.mock.calls[0][0]).toMatchObject({ where: { propertyId: "old", status: "QUALIFIED" }, data: { propertyId: "p", matchStatus: "MATCHED" } });
    expect(mocks.inquiry.updateMany.mock.calls[0][0].data.status).toBeUndefined();
  });
  it("unassigns with an audit trail and no property lookup", async () => {
    mocks.inquiry.findFirst.mockResolvedValue({ id: "i", propertyId: "old", assignedAgentId: "agent", status: "QUALIFIED" });
    await attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: null, expectedPropertyId: "old" });
    expect(mocks.property.findFirst).not.toHaveBeenCalled();
    expect(mocks.inquiry.updateMany.mock.calls[0][0].data).toEqual({ propertyId: null, matchStatus: "UNMATCHED" });
    expect(mocks.auditLog.create.mock.calls[0][0].data.details).toEqual({ previousPropertyId: "old", propertyId: null });
  });
  it("rejects replacement based on a stale original assignment", async () => {
    mocks.inquiry.findFirst.mockResolvedValue({ id: "i", propertyId: "someone-elses-change", assignedAgentId: "agent", status: "QUALIFIED" });
    await expect(attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: "p", expectedPropertyId: "old" })).rejects.toThrow("Attachment changed");
    expect(mocks.inquiry.updateMany).not.toHaveBeenCalled();
  });
  it("does not let an agent unassign another agent's active inquiry", async () => {
    mocks.inquiry.findFirst.mockResolvedValue({ id: "i", propertyId: "old", assignedAgentId: "other-agent", status: "QUALIFIED" });
    await expect(attachPropertyToInquiry(scope, { inquiryId: "i", propertyId: null, expectedPropertyId: "old" })).rejects.toThrow("another agent");
    expect(mocks.inquiry.updateMany).not.toHaveBeenCalled();
  });
  it("validates the replacement against requirements saved in the same edit", async () => {
    mocks.inquiry.findFirst.mockResolvedValue({ id: "i", propertyId: "old", assignedAgentId: "agent", status: "QUALIFIED", lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 100, matchingProfile: { strictRequirements: { budgetMax: true } } });
    mocks.property.findFirst.mockResolvedValue({ id: "p", title: "Replacement", suburb: "Roma", status: "AVAILABLE", listingType: "FOR_SALE", currency: "USD", askingPrice: 200, propertyType: "STANDALONE_HOUSE" });
    await attachPropertyInTransaction(mocks as unknown as Prisma.TransactionClient, scope, { inquiryId: "i", propertyId: "p", expectedPropertyId: "old" }, { currency: "USD", budgetMax: 250 });
    expect(mocks.inquiry.updateMany).toHaveBeenCalled();
  });
});
