import { describe, expect, it } from "vitest";
import { canTransitionStatement } from "./statement-workflow";

describe("statement workflow", () => {
  it("allows only the next financial transition", () => {
    expect(canTransitionStatement("DRAFT", "APPROVED_BY_MANAGER")).toBe(true);
    expect(canTransitionStatement("APPROVED_BY_MANAGER", "SENT_TO_LANDLORD")).toBe(true);
    expect(canTransitionStatement("SENT_TO_LANDLORD", "PAID_OUT")).toBe(true);
  });

  it("rejects skipping approval or repeating payout", () => {
    expect(canTransitionStatement("DRAFT", "PAID_OUT")).toBe(false);
    expect(canTransitionStatement("PAID_OUT", "PAID_OUT")).toBe(false);
  });
});
