import { describe, expect, it } from "vitest";
import { canMovePipelineStage, getNextStage, getMissingRequirements, mapLegacyPipelineState, type PipelineRequirementContext } from "./deal-workflow";

const complete: PipelineRequirementContext = {
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

const emptyContext: PipelineRequirementContext = Object.fromEntries(
  Object.keys(complete).map((key) => [key, false]),
) as unknown as PipelineRequirementContext;

describe("simplified deal workflow", () => {
  it("exposes five active stages and a terminal outcome state", () => {
    expect(getNextStage("NEW_INQUIRY")).toBe("QUALIFIED");
    expect(getNextStage("VERIFICATION_CLOSING")).toBe("CLOSED");
  });

  it("allows any active stage move without requirements or a reason", () => {
    expect(canMovePipelineStage({ currentStage: "NEW_INQUIRY", targetStage: "NEGOTIATING", context: emptyContext })).toMatchObject({ allowed: true });
    expect(canMovePipelineStage({ currentStage: "NEGOTIATING", targetStage: "NEW_INQUIRY", context: emptyContext })).toMatchObject({ allowed: true, requiresReason: false });
  });

  it("keeps the terminal outcome and requirement helpers available", () => {
    expect(canMovePipelineStage({ currentStage: "VERIFICATION_CLOSING", targetStage: "CLOSED", context: complete })).toMatchObject({ allowed: true });
    expect(getMissingRequirements("VERIFICATION_CLOSING", { ...complete, hasRequiredDocuments: false })).toEqual(["required closing documents"]);
  });

  it("maps legacy statuses without losing closed outcomes", () => {
    expect(mapLegacyPipelineState("CONTACTED")).toEqual({ status: "QUALIFIED", outcome: null });
    expect(mapLegacyPipelineState("OFFER_MADE")).toEqual({ status: "VIEWING_OR_OFFER", outcome: null });
    expect(mapLegacyPipelineState("CLOSED_LOST")).toEqual({ status: "CLOSED", outcome: "LOST" });
  });

  it.each([
    ["NEW_INQUIRY", "QUALIFIED"],
    ["NEW_INQUIRY", "NEGOTIATING"],
    ["QUALIFIED", "NEW_INQUIRY"],
    ["VERIFICATION_CLOSING", "VIEWING_OR_OFFER"],
  ] as const)("allows %s to %s without stage requirements", (currentStage, targetStage) => {
    expect(canMovePipelineStage({ currentStage, targetStage, context: emptyContext })).toMatchObject({
      allowed: true,
      requiresReason: false,
      missingRequirements: [],
    });
  });
});
