import { describe, expect, it } from "vitest";
import { canAdvancePipelineStage } from "./pipeline-transition";

describe("pipeline stage transitions", () => {
  it("allows an agent to progress through the intermediate stages", () => {
    expect(canAdvancePipelineStage("NEW_INQUIRY", "CONTACTED")).toBe(true);
    expect(canAdvancePipelineStage("CONTACTED", "VIEWING_SCHEDULED")).toBe(true);
    expect(canAdvancePipelineStage("VIEWING_SCHEDULED", "NEGOTIATING")).toBe(true);
  });

  it("requires a positive offer value before entering the offer stage", () => {
    expect(canAdvancePipelineStage("NEGOTIATING", "OFFER_MADE", null)).toBe(false);
    expect(canAdvancePipelineStage("NEGOTIATING", "OFFER_MADE", 250000)).toBe(true);
  });

  it("does not allow skipping stages or reopening closed deals", () => {
    expect(canAdvancePipelineStage("NEW_INQUIRY", "OFFER_MADE", 250000)).toBe(false);
    expect(canAdvancePipelineStage("CLOSED", "CONTACTED")).toBe(false);
  });
});
