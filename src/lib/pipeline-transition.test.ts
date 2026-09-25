import { describe, expect, it } from "vitest";
import { canAdvancePipelineStage } from "./pipeline-transition";

describe("pipeline stage transitions", () => {
  it("allows an agent to progress through the intermediate stages", () => {
    expect(canAdvancePipelineStage("NEW_INQUIRY", "CONTACTED")).toBe(true);
    expect(canAdvancePipelineStage("CONTACTED", "VIEWING_SCHEDULED")).toBe(true);
    expect(canAdvancePipelineStage("VIEWING_SCHEDULED", "NEGOTIATING")).toBe(true);
  });

  it("does not require an offer value to move between active stages", () => {
    expect(canAdvancePipelineStage("NEGOTIATING", "OFFER_MADE", null)).toBe(true);
    expect(canAdvancePipelineStage("NEGOTIATING", "OFFER_MADE", 250000)).toBe(true);
  });

  it("allows active inquiries to skip, move backward, and move freely", () => {
    expect(canAdvancePipelineStage("NEW_INQUIRY", "OFFER_MADE", 0)).toBe(true);
    expect(canAdvancePipelineStage("NEGOTIATING", "NEW_INQUIRY")).toBe(true);
    expect(canAdvancePipelineStage("VIEWING_SCHEDULED", "CONTACTED")).toBe(true);
  });
});
