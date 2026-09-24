import { describe, expect, it } from "vitest";
import { calculatePipelineStageValues } from "./pipeline-values";

describe("pipeline value aggregation", () => {
  it("sums actual deal values with property-value fallback by stage", () => {
    expect(calculatePipelineStageValues([
      { status: "NEW_INQUIRY", outcome: null, dealValue: 100000, propertyValue: 900000 },
      { status: "NEW_INQUIRY", outcome: null, dealValue: null, propertyValue: 500000 },
      { status: "CLOSED", outcome: "WON", dealValue: 750000, propertyValue: 800000 },
    ])).toEqual({ NEW_INQUIRY: 600000, COMPLETED: 750000 });
  });
});
