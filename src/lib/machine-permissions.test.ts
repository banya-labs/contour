import { describe, expect, it } from "vitest";
import { canUseMachineOperation, summarizeMachineCommission } from "./machine-permissions";
describe("machine capabilities", () => {
  it("does not turn default listing and inquiry scopes into finance or vault access", () => {
    const scopes = ["read:properties", "write:inquiries"];
    expect(canUseMachineOperation("get_property_documents", scopes, ["vault.read"])).toBe(false);
    expect(canUseMachineOperation("get_revenue_commission", scopes, ["finance.read"])).toBe(false);
    expect(canUseMachineOperation("search_properties", scopes, ["pwa.listings.share"])).toBe(true);
  });
  it("requires current member permissions as well as the key scope", () => {
    expect(canUseMachineOperation("get_revenue_commission", ["read:commission"], [])).toBe(false);
    expect(canUseMachineOperation("get_revenue_commission", ["read:commission"], ["finance.read"])).toBe(true);
  });
  it("requires both read and download before exporting document URLs", () => {
    expect(canUseMachineOperation("get_property_documents", ["read:documents"], ["vault.read"])).toBe(false);
    expect(canUseMachineOperation("get_property_documents", ["read:documents"], ["vault.download"])).toBe(false);
    expect(canUseMachineOperation("get_property_documents", ["read:documents"], ["vault.read", "vault.download"])).toBe(true);
  });
  it("retains complete aggregate counts and keeps currencies separate", () => {
    const groups = [
      { currency: "ZMW", status: "EARNED", _sum: { grossValue: 100000, agencyCommissionAmount: 5000, agentSplitAmount: 2500 }, _count: { _all: 250 } },
      { currency: "USD", status: "EXPECTED", _sum: { grossValue: 2000, agencyCommissionAmount: 100, agentSplitAmount: 50 }, _count: { _all: 3 } },
      { currency: "ZAR", status: "RECEIVED", _sum: { grossValue: 30000, agencyCommissionAmount: 1500, agentSplitAmount: 750 }, _count: { _all: 5 } },
    ];
    const summary = summarizeMachineCommission(groups);
    expect(summary.closedDealsCount).toBe(255);
    expect(summary.pipelineDealsCount).toBe(3);
    expect(summary.totalsByCurrency.ZMW).toEqual({ grossVolume: 100000, agencyCommission: 5000, agentSplits: 2500, expectedCommission: 0 });
    expect(summary.totalsByCurrency.USD.expectedCommission).toBe(100);
    expect(summary.totalsByCurrency.ZAR.agencyCommission).toBe(1500);
    expect(summary.pipelineExpectedCommission).toContain("USD 100");
  });
});
