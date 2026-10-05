import { describe, expect, it } from "vitest";
import { createClosedDealResult } from "./closed-deal-result";

const inquiry = {
  id: "deal-1", status: "CLOSED", outcome: "WON", closedAt: new Date("2026-10-05T09:30:00Z"),
  clientName: "Buyer", clientPhone: "+260970000000", clientEmail: null,
  lookingFor: "FOR_SALE", dealValue: { toString: () => "1500000.50" }, currency: "ZMW",
  lostReason: null, notes: "Agreed sale", assignedAgent: { name: "Agent" },
  property: { id: "property-1", title: "House", propertyType: "STANDALONE_HOUSE", suburb: "Kabulonga", city: "Lusaka", bedrooms: 0, bathrooms: { toString: () => "2.5" }, plotSizeSqm: null, askingPrice: { toString: () => "1600000" }, currency: "ZMW" },
};

describe("closed deal receipt", () => {
  it("serializes the persisted winning outcome and decimal values without inventing missing details", () => {
    const result = createClosedDealResult(inquiry, 2);
    expect(result).toMatchObject({ outcome: "WON", closedAt: "2026-10-05T09:30:00.000Z", dealValue: "1500000.50", buyer: { name: "Buyer", email: null }, agentName: "Agent", competingInquiriesClosed: 2, property: { bedrooms: 0, bathrooms: "2.5", plotSizeSqm: null, askingPrice: "1600000" } });
  });

  it("preserves the loss reason even when no property or sale value is linked", () => {
    expect(createClosedDealResult({ ...inquiry, outcome: "LOST", lostReason: "Buyer financing declined", property: null, dealValue: null, assignedAgent: null })).toMatchObject({ outcome: "LOST", lostReason: "Buyer financing declined", property: null, dealValue: null, agentName: null });
  });

  it("never produces a winning receipt for an open, cancelled, or undated inquiry", () => {
    expect(createClosedDealResult({ ...inquiry, status: "VERIFICATION_CLOSING" })).toBeNull();
    expect(createClosedDealResult({ ...inquiry, outcome: "CANCELLED" })).toBeNull();
    expect(createClosedDealResult({ ...inquiry, closedAt: null })).toBeNull();
  });
});
