import { describe, expect, it } from "vitest";
import { inquiryAssignmentPatch } from "./inquiry-assignment";

describe("inquiry edit assignment payload", () => {
  it("leaves an unchanged assignment out of the edit payload", () => {
    expect(inquiryAssignmentPatch("current", "current")).toEqual({});
    expect(inquiryAssignmentPatch(null, "")).toEqual({});
  });
  it("uses the original assignment when replacing a mandate", () => {
    expect(inquiryAssignmentPatch("current", "replacement")).toEqual({ propertyId: "replacement", expectedPropertyId: "current" });
  });
  it("sends an explicit null when unassigning", () => {
    expect(inquiryAssignmentPatch("current", "")).toEqual({ propertyId: null, expectedPropertyId: "current" });
  });
  it("assigns an unassigned inquiry with a null expected property", () => {
    expect(inquiryAssignmentPatch(null, "replacement")).toEqual({ propertyId: "replacement", expectedPropertyId: null });
  });
});
