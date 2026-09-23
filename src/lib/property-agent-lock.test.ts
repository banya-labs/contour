import { describe, expect, it } from "vitest";
import { canChangePropertyAgent, getPropertyAgentLockExpiry } from "./property-agent-lock";

describe("property agent lock", () => {
  it("keeps an assignment locked for 30 days", () => {
    const assignedAt = new Date("2026-09-01T00:00:00.000Z");
    expect(getPropertyAgentLockExpiry(assignedAt).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(canChangePropertyAgent(getPropertyAgentLockExpiry(assignedAt), new Date("2026-09-30T23:59:59.000Z"))).toBe(false);
    expect(canChangePropertyAgent(getPropertyAgentLockExpiry(assignedAt), new Date("2026-10-01T00:00:00.000Z"))).toBe(true);
  });
});
