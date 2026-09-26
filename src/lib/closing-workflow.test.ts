import { describe, expect, it } from "vitest";
import { canCloseDeal, getClosingReadiness, getDefaultClosingRequirementTemplates, validateClosingRequirementTemplate, type ClosingChecklistItemSnapshot } from "./closing-workflow";

describe("configurable closing workflow", () => {
  it("provides editable agency defaults without hardcoding the deal workflow", () => {
    const defaults = getDefaultClosingRequirementTemplates();
    expect(defaults.map((item) => item.key)).toEqual([
      "BUYER_IDENTITY", "SELLER_AUTHORITY", "TITLE_DOCUMENTS", "AGREEMENT_SIGNED", "PAYMENT_CONFIRMED", "COMMISSION_CONFIRMED", "FINAL_HANDOVER",
    ]);
    expect(defaults.filter((item) => item.required)).toHaveLength(6);
  });

  it("accepts a custom agency requirement", () => {
    expect(validateClosingRequirementTemplate({ key: "NRC_CERTIFIED", label: "NRC certified", description: "Confirm the NRC copy.", category: "Identity", required: true, assigneeType: "AGENT", evidenceType: "DOCUMENT", sortOrder: 80 })).toMatchObject({ key: "NRC_CERTIFIED", evidenceType: "DOCUMENT", active: true });
  });

  it("blocks Won until every required item is approved", () => {
    const templates: ClosingChecklistItemSnapshot[] = getDefaultClosingRequirementTemplates().map((item) => ({ ...item, status: item.required ? "APPROVED" : "PENDING" }));
    templates[0].status = "REJECTED";
    const readiness = getClosingReadiness(templates);
    expect(readiness.ready).toBe(false);
    expect(canCloseDeal({ role: "MANAGER", outcome: "WON", readiness })).toEqual({ allowed: false, reason: "Complete all required closing requirements before marking the deal won." });
  });

  it("requires a reason for Lost and permits a ready Won close for managers", () => {
    const items: ClosingChecklistItemSnapshot[] = getDefaultClosingRequirementTemplates().map((item) => ({ ...item, status: item.required ? "APPROVED" : "PENDING" }));
    const readiness = getClosingReadiness(items);
    expect(canCloseDeal({ role: "MANAGER", outcome: "WON", readiness })).toEqual({ allowed: true });
    expect(canCloseDeal({ role: "MANAGER", outcome: "LOST", readiness })).toEqual({ allowed: false, reason: "A lost reason is required." });
  });
});
