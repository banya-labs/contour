import { describe, expect, it } from "vitest";
import { canMovePipelineStage, getNextStage, getMissingRequirements, mapLegacyPipelineState } from "./deal-workflow";

const complete = {
  hasClient: true,
  hasProperty: true,
  hasAssignedAgent: true,
  hasQualificationNote: true,
  hasBudget: true,
  hasNextAction: true,
  hasViewingOutcome: true,
  hasOfferValue: true,
  hasCurrentValue: true,
  hasRecentContact: true,
  hasFollowUpDate: true,
  hasFinalValue: true,
  hasRequiredDocuments: true,
};

describe("simplified deal workflow", () => {
  it("exposes five active stages and a terminal outcome state", () => {
    expect(getNextStage("NEW_INQUIRY")).toBe("QUALIFIED");
    expect(getNextStage("VERIFICATION_CLOSING")).toBe("CLOSED");
  });

  it("requires a one-stage move and blocks missing requirements", () => {
    expect(canMovePipelineStage({ currentStage: "NEW_INQUIRY", targetStage: "NEGOTIATING", context: complete })).toMatchObject({ allowed: false });
    expect(canMovePipelineStage({ currentStage: "NEW_INQUIRY", targetStage: "QUALIFIED", context: { ...complete, hasBudget: false } })).toMatchObject({ allowed: false, missingRequirements: ["qualification and budget"] });
  });

  it("allows a complete forward move and requires a reason backward", () => {
    expect(canMovePipelineStage({ currentStage: "NEW_INQUIRY", targetStage: "QUALIFIED", context: complete })).toMatchObject({ allowed: true });
    expect(canMovePipelineStage({ currentStage: "NEGOTIATING", targetStage: "QUALIFIED", context: complete })).toMatchObject({ allowed: false, requiresReason: true });
    expect(canMovePipelineStage({ currentStage: "NEGOTIATING", targetStage: "QUALIFIED", context: complete, reason: "Buyer requirements changed." })).toMatchObject({ allowed: true });
  });

  it("maps legacy statuses without losing closed outcomes", () => {
    expect(mapLegacyPipelineState("CONTACTED")).toEqual({ status: "QUALIFIED", outcome: null });
    expect(mapLegacyPipelineState("OFFER_MADE")).toEqual({ status: "VIEWING_OR_OFFER", outcome: null });
    expect(mapLegacyPipelineState("CLOSED_LOST")).toEqual({ status: "CLOSED", outcome: "LOST" });
  });

  it("lists the blocking requirements for verification", () => {
    expect(getMissingRequirements("VERIFICATION_CLOSING", { ...complete, hasRequiredDocuments: false })).toEqual(["required closing documents"]);
  });
});
