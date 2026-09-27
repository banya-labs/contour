import { describe, expect, it } from "vitest";
import { canSelfAssignInquiry } from "./assign-inquiry";

describe("inquiry assignment action", () => {
  it("allows assignment only for an open unassigned inquiry", () => {
    expect(canSelfAssignInquiry({ status: "NEW_INQUIRY", assignedAgentId: null })).toBe(true);
    expect(canSelfAssignInquiry({ status: "CONTACTED", assignedAgentId: null })).toBe(false);
    expect(canSelfAssignInquiry({ status: "NEW_INQUIRY", assignedAgentId: "agent-1" })).toBe(false);
  });
});
