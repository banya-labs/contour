import { describe, expect, it } from "vitest";
import { supportAccessDuration } from "./support-access";

describe("support access duration", () => {
  it("caps act-as sessions at fifteen minutes", () => {
    expect(supportAccessDuration("ACT_AS", 60)).toBe(15);
  });

  it("caps view-only sessions at one hour", () => {
    expect(supportAccessDuration("VIEW_ONLY", 120)).toBe(60);
  });
});
