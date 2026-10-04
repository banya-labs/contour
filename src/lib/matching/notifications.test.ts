import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ inquiry: { findMany: vi.fn() }, property: { findMany: vi.fn() }, propertyMatchNotification: { upsert: vi.fn() } }));
vi.mock("../db", () => ({ db: mocks }));
import { reconcileMatchNotifications } from "./inquiry-match-notifications";
describe("canonical match notifications", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.inquiry.findMany.mockResolvedValue([{ id: "i", clientName: "Buyer", lookingFor: "FOR_RENT", currency: "ZMW", budgetMax: 6000, preferredSuburbs: ["Roma"], assignedAgentId: "a" }]); mocks.property.findMany.mockResolvedValue([{ id: "p", title: "House", suburb: "Roma", listingType: "BOTH", currency: "ZMW", propertyType: "STANDALONE_HOUSE", askingPrice: 900000, rentalPrice: 5000, bedrooms: 3, bathrooms: 2, plotSizeSqm: 100 }]); });
  it("property-first and inquiry-first generate the same pair and preserve read state", async () => {
    await reconcileMatchNotifications("org", { inquiryId: "i" });
    const first = mocks.propertyMatchNotification.upsert.mock.calls[0][0];
    vi.clearAllMocks();
    await reconcileMatchNotifications("org", { propertyId: "p" });
    expect(mocks.propertyMatchNotification.upsert.mock.calls[0][0]).toEqual(first);
    expect(first.update).toEqual({ agentId: "a" });
    expect(first.where).toEqual({ propertyId_inquiryId: { propertyId: "p", inquiryId: "i" } });
  });
});
