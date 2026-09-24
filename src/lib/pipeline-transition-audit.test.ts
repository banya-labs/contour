import { describe, expect, it } from "vitest";
import { createPipelineTransitionAuditDetails } from "./pipeline-transition-audit";

describe("pipeline transition audit details", () => {
  it("preserves the decision evidence needed to review a transition", () => {
    expect(createPipelineTransitionAuditDetails({
      previousStatus: "NEGOTIATING",
      status: "VERIFICATION_CLOSING",
      outcome: null,
      reason: "Final terms agreed.",
      override: false,
      missingRequirements: [],
      competingInquiriesClosed: 0,
    })).toEqual({
      previousStatus: "NEGOTIATING",
      status: "VERIFICATION_CLOSING",
      outcome: null,
      reason: "Final terms agreed.",
      override: false,
      missingRequirements: [],
      competingInquiriesClosed: 0,
    });
  });
});
